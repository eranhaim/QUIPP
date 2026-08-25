import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { DeepSubmission } from '@/lib/types';

const AdminDeepSubmissions = () => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ['admin', 'deep-submissions'],
    queryFn: () =>
      api<{ submissions: DeepSubmission[] }>('/api/admin/deep-submissions', { auth: true }),
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: 'approve' | 'reject'; reviewNotes?: string }) =>
      api<{ submission: DeepSubmission }>(
        `/api/admin/deep-submissions/${input.id}/${input.decision}`,
        {
          method: 'POST',
          auth: true,
          body: input.reviewNotes ? { reviewNotes: input.reviewNotes } : {},
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'deep-submissions'] }),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold font-display text-foreground mb-6">DEEP submissions</h1>

      {q.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error instanceof ApiError ? q.error.message : 'Could not load submissions.'}
        </p>
      )}

      <div className="space-y-4">
        {q.data?.submissions.map((s) => (
          <div key={s.id} className="bg-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2 gap-4">
              <div>
                <p className="text-lg font-semibold text-card-foreground">{s.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {s.worker?.firstName || s.worker?.username || 'Worker'} · submitted{' '}
                  {new Date(s.submittedAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  s.status === 'pending'
                    ? 'bg-muted text-muted-foreground'
                    : s.status === 'approved'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {s.status}
              </span>
            </div>

            <div className="text-sm space-y-1 mb-3">
              <p><span className="text-muted-foreground">Supervisor:</span> {s.supervisorName} ({s.supervisorEmail})</p>
              <p className="whitespace-pre-line bg-background rounded-xl p-3 text-foreground">
                {s.supervisorText}
              </p>
            </div>

            {s.status === 'pending' && (
              <div className="space-y-2">
                <textarea
                  className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm"
                  rows={2}
                  placeholder="Optional review notes"
                  value={notes[s.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      decide.mutate({
                        id: s.id,
                        decision: 'approve',
                        reviewNotes: notes[s.id],
                      })
                    }
                    disabled={decide.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" aria-hidden /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() =>
                      decide.mutate({
                        id: s.id,
                        decision: 'reject',
                        reviewNotes: notes[s.id],
                      })
                    }
                    disabled={decide.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" aria-hidden /> Reject
                  </Button>
                </div>
              </div>
            )}

            {s.status !== 'pending' && s.reviewNotes && (
              <p className="text-xs text-muted-foreground">Notes: {s.reviewNotes}</p>
            )}
          </div>
        ))}
        {q.data && q.data.submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing to review yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDeepSubmissions;
