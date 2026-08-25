import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthAwareShell from '@/components/AuthAwareShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { Credential, DeepSubmission } from '@/lib/types';

const DeepSubmit = () => {
  const { credentialId = '' } = useParams();
  const navigate = useNavigate();

  const credentialsQuery = useQuery({
    queryKey: ['credentials', 'me'],
    queryFn: () => api<{ credentials: Credential[] }>('/api/credentials/me', { auth: true }),
  });

  const cred = credentialsQuery.data?.credentials.find((c) => c.id === credentialId);

  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorText, setSupervisorText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      api<{ submission: DeepSubmission }>(`/api/deep-submissions`, {
        method: 'POST',
        auth: true,
        body: {
          inCredentialId: credentialId,
          supervisorName: supervisorName.trim(),
          supervisorEmail: supervisorEmail.trim(),
          supervisorText: supervisorText.trim(),
        },
      }),
    onSuccess: () => setDone(true),
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not submit.'),
  });

  return (
    <AuthAwareShell>
      <section className="py-10 md:py-16 max-w-[680px] mx-auto px-5">
        <Link
          to="/passport/me"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Passport
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold font-display text-foreground uppercase mb-2">
          Level up to DEEP
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          DEEP is confirmed field practice. Ask a supervisor who has watched you work to attest — an
          admin reviews and issues your DEEP credential.
        </p>

        {credentialsQuery.isPending && (
          <p className="text-sm text-muted-foreground">Loading credential…</p>
        )}
        {credentialsQuery.data && !cred && (
          <div className="bg-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">
              We could not find that IN credential on your Passport.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/passport/me">Back to Passport</Link>
            </Button>
          </div>
        )}

        {cred && cred.tier !== 'IN' && (
          <div className="bg-card rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">
              You can only submit an IN credential for DEEP. This credential is already {cred.tier}.
            </p>
          </div>
        )}

        {cred && cred.tier === 'IN' && !done && (
          <form
            className="bg-card rounded-2xl p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErr(null);
              submit.mutate();
            }}
          >
            <div className="rounded-xl bg-background p-4 text-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Referenced IN credential
              </p>
              <p className="font-semibold text-foreground">{cred.courseName}</p>
              <p className="text-xs text-muted-foreground font-mono">{cred.verificationId}</p>
            </div>

            <div>
              <label htmlFor="sup-name" className="text-xs font-medium text-card-foreground block mb-1.5">
                Supervisor name
              </label>
              <input
                id="sup-name"
                required
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="Chef Marina Perez"
              />
            </div>
            <div>
              <label
                htmlFor="sup-email"
                className="text-xs font-medium text-card-foreground block mb-1.5"
              >
                Supervisor email
              </label>
              <input
                id="sup-email"
                type="email"
                required
                value={supervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="marina@yourrestaurant.com"
              />
            </div>
            <div>
              <label
                htmlFor="sup-text"
                className="text-xs font-medium text-card-foreground block mb-1.5"
              >
                Supervisor confirmation (20+ chars)
              </label>
              <textarea
                id="sup-text"
                required
                minLength={20}
                rows={5}
                value={supervisorText}
                onChange={(e) => setSupervisorText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder={`Describe what your supervisor has observed you doing with this equipment.\n\nExample: "Eran has been running the combi oven solo for our lunch service for 3 months. He handles multi-step programmes and cleaning cycles unsupervised."`}
              />
            </div>
            {err && (
              <p className="text-sm text-destructive" role="alert">
                {err}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full" disabled={submit.isPending}>
                {submit.isPending ? 'Submitting…' : 'Submit for review'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full"
                onClick={() => navigate('/passport/me')}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {done && (
          <div className="bg-card rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary mb-3" aria-hidden />
            <h2 className="text-xl font-bold font-display uppercase text-card-foreground mb-2">
              Submitted for review
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              An admin will confirm with your supervisor and issue your DEEP credential.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/passport/me">Back to Passport</Link>
            </Button>
          </div>
        )}
      </section>
    </AuthAwareShell>
  );
};

export default DeepSubmit;
