import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { LeadOpportunity } from '@/lib/types';

const fieldClass =
  'mt-2 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export default function MyLeads() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    category: '',
    city: '',
    region: '',
    budgetMax: '',
    currency: 'USD',
    requirements: '',
    urgency: 'normal' as 'low' | 'normal' | 'high',
    consent: false,
  });
  const leadsQuery = useQuery({
    queryKey: ['my-leads'],
    queryFn: () => api<{ leads: LeadOpportunity[] }>('/api/leads/me', { auth: true }),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-leads'] });
  const createMutation = useMutation({
    mutationFn: () =>
      api('/api/leads', {
        method: 'POST',
        auth: true,
        body: {
          consent: true,
          category: form.category.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
          budgetMaxCents: form.budgetMax ? Math.round(Number(form.budgetMax) * 100) : null,
          currency: form.currency,
          requirements: form.requirements.trim(),
          urgency: form.urgency,
          consentedFields: [
            'category', 'city', 'region', 'budgetMaxCents', 'currency',
            'requirements', 'urgency', 'requesterEmail',
          ],
        },
      }),
    onSuccess: async () => {
      setForm((value) => ({ ...value, category: '', city: '', region: '', budgetMax: '', requirements: '', consent: false }));
      await refresh();
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api(`/api/leads/${id}/cancel`, { method: 'POST', auth: true }),
    onSuccess: refresh,
  });
  const acceptMutation = useMutation({
    mutationFn: ({ leadId, proposalId }: { leadId: string; proposalId: string }) =>
      api(`/api/leads/${leadId}/proposals/${proposalId}/accept`, { method: 'POST', auth: true }),
    onSuccess: refresh,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.consent) createMutation.mutate();
  };
  const error = createMutation.error ?? cancelMutation.error ?? acceptMutation.error ?? leadsQuery.error;
  const leads = leadsQuery.data?.leads ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Consent-based quote pilot</p>
          <h1 className="mt-3 text-4xl font-bold font-display">My quote requests</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A request is separate from your private QUIPPY conversation. Suppliers first see an anonymized,
            purpose-limited brief.
          </p>
        </header>
        {error ? (
          <p className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {error instanceof ApiError ? error.message : 'The request could not be completed.'}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={submit} className="h-fit rounded-3xl bg-card p-6">
            <h2 className="text-xl font-bold">Request quotes</h2>
            <p className="mt-2 text-sm text-muted-foreground">Only the fields listed below are shared.</p>
            <TextField label="Category" value={form.category} onChange={(category) => setForm((v) => ({ ...v, category }))} required />
            <TextField label="City" value={form.city} onChange={(city) => setForm((v) => ({ ...v, city }))} required />
            <TextField label="Region" value={form.region} onChange={(region) => setForm((v) => ({ ...v, region }))} required />
            <TextField label="Maximum budget" value={form.budgetMax} onChange={(budgetMax) => setForm((v) => ({ ...v, budgetMax }))} type="number" />
            <label className="mt-4 block text-sm font-semibold">Requirements
              <textarea required minLength={5} maxLength={5000} rows={5} value={form.requirements} onChange={(e) => setForm((v) => ({ ...v, requirements: e.target.value }))} className={`${fieldClass} h-auto py-3`} />
            </label>
            <label className="mt-4 block text-sm font-semibold">Urgency
              <select value={form.urgency} onChange={(e) => setForm((v) => ({ ...v, urgency: e.target.value as typeof v.urgency }))} className={fieldClass}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
              </select>
            </label>
            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-border p-4 text-sm">
              <input type="checkbox" required checked={form.consent} onChange={(e) => setForm((v) => ({ ...v, consent: e.target.checked }))} className="mt-1 h-4 w-4" />
              <span>I consent to share category, city, region, budget, currency, requirements, and urgency with approved matching suppliers. My email is shared only with the supplier whose proposal I accept.</span>
            </label>
            <Button type="submit" disabled={!form.consent || createMutation.isPending} className="mt-5 w-full rounded-full">
              {createMutation.isPending ? 'Creating…' : 'Create quote request'}
            </Button>
          </form>

          <section aria-labelledby="active-leads">
            <h2 id="active-leads" className="text-2xl font-bold">Requests and proposals</h2>
            <div className="mt-5 space-y-5">
              {leads.map((lead) => (
                <article key={lead.id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="text-lg font-bold">{lead.category}</h3><p className="text-sm text-muted-foreground">{lead.city}, {lead.region}</p></div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">{lead.status}</span>
                  </div>
                  <p className="mt-4 text-sm">{lead.requirements}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Expires {new Date(lead.expiresAt).toLocaleDateString()}</p>
                  {lead.status === 'open' ? (
                    <Button type="button" variant="ghost" className="mt-3 text-destructive" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(lead.id)}>
                      <XCircle className="mr-2 h-4 w-4" />Cancel request
                    </Button>
                  ) : null}
                  <div className="mt-5 space-y-3">
                    {lead.proposals.map((proposal) => (
                      <div key={proposal.id} className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex justify-between gap-3"><h4 className="font-bold">{proposal.supplier.companyName}</h4><span className="text-xs capitalize text-muted-foreground">{proposal.status}</span></div>
                        <p className="mt-2 text-sm text-muted-foreground">{proposal.message}</p>
                        {proposal.priceEstimateMinCents !== null ? <p className="mt-2 text-sm font-bold">Estimate from {(proposal.priceEstimateMinCents / 100).toLocaleString()} {proposal.currency}</p> : null}
                        {proposal.status === 'submitted' && lead.status === 'open' ? (
                          <Button type="button" className="mt-3 rounded-full" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate({ leadId: lead.id, proposalId: proposal.id })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />Accept proposal
                          </Button>
                        ) : null}
                        {proposal.status === 'accepted' && proposal.supplier.contactEmail ? <p className="mt-3 text-sm">Supplier contact: {proposal.supplier.contactEmail}</p> : null}
                      </div>
                    ))}
                    {lead.proposals.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">No proposals yet.</p> : null}
                  </div>
                </article>
              ))}
              {!leadsQuery.isLoading && leads.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground"><FileText className="mx-auto h-8 w-8" /><p className="mt-3">No quote requests yet.</p></div> : null}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function TextField({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="mt-4 block text-sm font-semibold">{label}<input type={type} min={type === 'number' ? 0 : undefined} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} /></label>;
}
