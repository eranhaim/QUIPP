import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

type LeadStage = 'new' | 'qualifying' | 'qualified' | 'human_requested' | 'closed';

type WhatsAppLead = {
  id: string;
  phone: string | null;
  senderName: string | null;
  stage: LeadStage;
  qualificationStep: string;
  learningGoal: string | null;
  experience: string | null;
  contactName: string | null;
  email: string | null;
  escalationRequestedAt: string | null;
  lastInboundAt: string;
};

const STAGES: LeadStage[] = ['new', 'qualifying', 'qualified', 'human_requested', 'closed'];

const AdminWhatsAppLeads = () => {
  const queryClient = useQueryClient();
  const leads = useQuery({
    queryKey: ['admin', 'whatsapp-leads'],
    queryFn: () => api<{ leads: WhatsAppLead[] }>('/api/admin/whatsapp-leads', { auth: true }),
  });
  const update = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      api(`/api/admin/whatsapp-leads/${id}`, {
        method: 'PATCH',
        auth: true,
        body: { stage },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'whatsapp-leads'] }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-foreground">WhatsApp course leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leads are created only when QUIPP’s dedicated course bot is enabled.
        </p>
      </div>

      {leads.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {leads.error && <p className="text-sm text-destructive">Could not load WhatsApp leads.</p>}
      <div className="grid gap-3">
        {leads.data?.leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-card-foreground">
                  {lead.contactName ?? lead.senderName ?? 'Unnamed lead'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[lead.phone, lead.email].filter(Boolean).join(' · ') || 'No contact details yet'}
                </p>
              </div>
              <select
                aria-label="Lead stage"
                value={lead.stage}
                onChange={(event) =>
                  update.mutate({ id: lead.id, stage: event.target.value as LeadStage })
                }
                disabled={update.isPending}
                className="h-10 rounded-full border-2 border-border bg-background px-3 text-sm"
              >
                {STAGES.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </div>
            <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
              <div><dt className="text-muted-foreground">Learning goal</dt><dd>{lead.learningGoal ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">Experience</dt><dd>{lead.experience ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">Qualification</dt><dd>{lead.qualificationStep}</dd></div>
              <div><dt className="text-muted-foreground">Last message</dt><dd>{new Date(lead.lastInboundAt).toLocaleString()}</dd></div>
            </dl>
            {lead.stage !== 'closed' && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => update.mutate({ id: lead.id, stage: 'closed' })}
                disabled={update.isPending}
              >
                Mark closed
              </Button>
            )}
          </article>
        ))}
        {leads.data?.leads.length === 0 && (
          <p className="text-sm text-muted-foreground">No WhatsApp course leads yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminWhatsAppLeads;
