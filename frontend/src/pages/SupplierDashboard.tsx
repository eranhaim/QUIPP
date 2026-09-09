import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { SupplierLead } from '@/lib/types';

interface SupplierProposal {
  id: string;
  status: 'submitted' | 'accepted' | 'declined' | 'withdrawn';
  message: string;
  priceEstimateMinCents: number | null;
  currency: string;
  submittedAt: string;
  lead: SupplierLead;
  requesterDetails: { email: string | null } | null;
}

export default function SupplierDashboard() {
  const queryClient = useQueryClient();
  const leadsQuery = useQuery({
    queryKey: ['supplier-leads'],
    queryFn: () => api<{ leads: SupplierLead[] }>('/api/supplier/leads', { auth: true }),
  });
  const proposalsQuery = useQuery({
    queryKey: ['supplier-proposals'],
    queryFn: () => api<{ proposals: SupplierProposal[] }>('/api/supplier/proposals', { auth: true }),
  });
  const propose = useMutation({
    mutationFn: ({ leadId, message, price }: { leadId: string; message: string; price: string }) =>
      api(`/api/supplier/leads/${leadId}/proposals`, {
        method: 'POST',
        auth: true,
        body: {
          message,
          priceEstimateMinCents: price ? Math.round(Number(price) * 100) : null,
          currency: 'USD',
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['supplier-leads'] }),
        queryClient.invalidateQueries({ queryKey: ['supplier-proposals'] }),
      ]);
    },
  });
  const proposedLeadIds = new Set((proposalsQuery.data?.proposals ?? []).map((item) => item.lead.id));
  const error = leadsQuery.error ?? proposalsQuery.error ?? propose.error;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Supplier pilot</p>
          <h1 className="mt-3 text-4xl font-bold font-display">Anonymized opportunities</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Open requests match your approved categories and regions. Requester identity and contact stay hidden until they accept your proposal.
          </p>
        </header>
        {error ? <p className="mt-6 text-sm text-destructive" role="alert">{error instanceof ApiError ? error.message : 'Supplier data could not be loaded.'}</p> : null}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <h2 className="text-2xl font-bold">Matching open leads</h2>
            <div className="mt-5 space-y-4">
              {(leadsQuery.data?.leads ?? []).map((lead) => (
                <LeadCard key={lead.id} lead={lead} alreadyProposed={proposedLeadIds.has(lead.id)} busy={propose.isPending} onSubmit={(message, price) => propose.mutateAsync({ leadId: lead.id, message, price })} />
              ))}
              {!leadsQuery.isLoading && (leadsQuery.data?.leads.length ?? 0) === 0 ? <Empty>No matching open leads.</Empty> : null}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-bold">Your proposals</h2>
            <div className="mt-5 space-y-4">
              {(proposalsQuery.data?.proposals ?? []).map((proposal) => (
                <article key={proposal.id} className="rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold">{proposal.lead.anonymousRef}</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">{proposal.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{proposal.lead.category} · {proposal.lead.city}</p>
                  <p className="mt-3 text-sm">{proposal.message}</p>
                  {proposal.requesterDetails?.email ? (
                    <p className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success"><Mail className="h-4 w-4" />{proposal.requesterDetails.email}</p>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">Requester contact remains private.</p>
                  )}
                </article>
              ))}
              {!proposalsQuery.isLoading && (proposalsQuery.data?.proposals.length ?? 0) === 0 ? <Empty>No proposals submitted.</Empty> : null}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function LeadCard({ lead, alreadyProposed, busy, onSubmit }: { lead: SupplierLead; alreadyProposed: boolean; busy: boolean; onSubmit: (message: string, price: string) => Promise<unknown> }) {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(message.trim(), price);
    setMessage('');
    setPrice('');
  };
  return (
    <article className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{lead.anonymousRef}</h3><p className="mt-1 text-sm text-muted-foreground">{lead.category} · {lead.city}, {lead.region}</p></div><Building2 className="h-5 w-5 text-primary" /></div>
      <p className="mt-4 text-sm">{lead.requirements}</p>
      <p className="mt-3 text-xs text-muted-foreground">Urgency: {lead.urgency} · expires {new Date(lead.expiresAt).toLocaleDateString()}</p>
      {alreadyProposed ? <p className="mt-4 text-sm font-semibold text-primary">Proposal already submitted.</p> : (
        <form onSubmit={submit} className="mt-5 border-t border-border pt-5">
          <label className="text-sm font-semibold">Proposal message<textarea required minLength={10} maxLength={5000} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-2 w-full rounded-xl border-2 border-border bg-background p-3 text-sm" /></label>
          <label className="mt-3 block text-sm font-semibold">Estimate from (USD, optional)<input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm" /></label>
          <Button type="submit" disabled={busy} className="mt-4 rounded-full">{busy ? 'Submitting…' : 'Submit proposal'}</Button>
        </form>
      )}
    </article>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">{children}</div>;
}
