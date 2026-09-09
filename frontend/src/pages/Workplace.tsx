import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, MapPin } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { Course, Credential, Endorsement, WorkplaceLink } from '@/lib/types';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const fieldClass =
  'mt-2 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function statusLabel(status: WorkplaceLink['status']): string {
  if (status === 'pending') return 'Invitation pending';
  if (status === 'active') return 'Connected';
  if (status === 'declined') return 'Declined';
  return 'Unlinked';
}

const Workplace = () => {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [deepCredentialId, setDeepCredentialId] = useState('');
  const [thereCourseId, setThereCourseId] = useState('');
  const [statement, setStatement] = useState('');
  const linksQuery = useQuery({
    queryKey: ['workplace', 'me'],
    queryFn: () =>
      api<{ links: WorkplaceLink[] }>('/api/operator/workplace/me', { auth: true }),
  });
  const credentialsQuery = useQuery({
    queryKey: ['credentials', 'me'],
    queryFn: () => api<{ credentials: Credential[] }>('/api/credentials/me', { auth: true }),
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => api<{ courses: Course[] }>('/api/courses', { auth: true }),
  });
  const endorsementsQuery = useQuery({
    queryKey: ['endorsements', 'me'],
    queryFn: () =>
      api<{ endorsements: Endorsement[] }>('/api/endorsements/me', { auth: true }),
  });
  const updateLink = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'accept' | 'decline' | 'unlink';
    }) =>
      api(`/api/operator/workplace/${id}/${action}`, {
        method: 'POST',
        auth: true,
      }),
    onSuccess: async (_data, variables) => {
      setAnnouncement(
        variables.action === 'accept'
          ? 'Workplace invitation accepted.'
          : variables.action === 'decline'
            ? 'Workplace invitation declined.'
            : 'Workplace connection removed.',
      );
      await queryClient.invalidateQueries({ queryKey: ['workplace', 'me'] });
    },
  });
  const requestEndorsement = useMutation({
    mutationFn: (body: {
      operatorId: string;
      deepCredentialId: string;
      thereCourseId: string;
      statement: string;
    }) =>
      api('/api/endorsements', {
        method: 'POST',
        auth: true,
        body,
      }),
    onSuccess: async () => {
      setAnnouncement('Endorsement request sent to your workplace.');
      setThereCourseId('');
      setStatement('');
      await queryClient.invalidateQueries({ queryKey: ['endorsements', 'me'] });
    },
  });

  const links = linksQuery.data?.links ?? [];
  const activeLinks = links.filter((link) => link.status === 'active');
  const deepCredentials = (credentialsQuery.data?.credentials ?? []).filter(
    (credential) => credential.tier === 'DEEP' && credential.status === 'active',
  );
  const thereCourses = (coursesQuery.data?.courses ?? []).filter(
    (course) => course.tier === 'THERE' && course.status === 'published',
  );
  const selectedCredential = deepCredentials.find(
    (credential) => credential.id === deepCredentialId,
  );
  const relevantThereCourses = selectedCredential
    ? thereCourses.filter(
        (course) =>
          course.tagName === selectedCredential.tagName ||
          course.techFocus.trim().toLocaleLowerCase() ===
            selectedCredential.techFocus.trim().toLocaleLowerCase(),
      )
    : thereCourses;
  const endorsements = endorsementsQuery.data?.endorsements ?? [];
  const canRequest =
    activeLinks.length > 0 && deepCredentials.length > 0 && thereCourses.length > 0;

  const submitEndorsement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await requestEndorsement.mutateAsync({
        operatorId,
        deepCredentialId,
        thereCourseId,
        statement: statement.trim(),
      });
    } catch {
      // Mutation state renders the API error without clearing the request.
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
        <h1 className="mt-2 text-3xl font-bold font-display">Workplace</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Choose which organizations can connect training to your professional Passport. Declining
          or unlinking ends the organization’s access to your worker profile.
        </p>

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
        {linksQuery.error ? (
          <p role="alert" className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            {linksQuery.error instanceof ApiError
              ? linksQuery.error.message
              : 'Workplace connections could not be loaded.'}
          </p>
        ) : null}
        {updateLink.error ? (
          <p role="alert" className="mt-6 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            {updateLink.error instanceof ApiError
              ? updateLink.error.message
              : 'The workplace connection could not be updated.'}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {linksQuery.isLoading ? (
            <div className="rounded-3xl bg-card p-6 text-sm text-muted-foreground">
              Loading workplace connections…
            </div>
          ) : null}
          {!linksQuery.isLoading && links.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-bold">No workplace invitations</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Invitations from operators will appear here.
              </p>
            </div>
          ) : null}
          {links.map((link) => (
            <article key={link._id} className="rounded-3xl bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{link.operatorId.companyName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {link.operatorId.businessType} · {link.operatorId.hqLocation}
                  </p>
                  {link.locationId ? (
                    <p className="mt-3 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                      {link.locationId.name}, {link.locationId.city}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {statusLabel(link.status)}
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {dateFormatter.format(new Date(link.updatedAt))}
                  </p>
                </div>
              </div>

              {link.status === 'pending' ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={updateLink.isPending}
                    onClick={() => updateLink.mutate({ id: link._id, action: 'accept' })}
                  >
                    Accept invitation
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full"
                    disabled={updateLink.isPending}
                    onClick={() => updateLink.mutate({ id: link._id, action: 'decline' })}
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
              {link.status === 'active' ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-6 rounded-full"
                  disabled={updateLink.isPending}
                  onClick={() => updateLink.mutate({ id: link._id, action: 'unlink' })}
                >
                  Unlink workplace
                </Button>
              ) : null}
            </article>
          ))}
        </div>

        <section className="mt-12" aria-labelledby="endorsements-title">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            <div>
              <h2 id="endorsements-title" className="text-2xl font-bold font-display">
                THERE endorsements
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask a verified workplace to confirm your real-world capability.
              </p>
            </div>
          </div>

          {canRequest ? (
            <form
              onSubmit={submitEndorsement}
              className="mt-6 grid gap-4 rounded-3xl bg-card p-6 md:grid-cols-2"
            >
              <label className="block text-sm font-semibold">
                Workplace
                <select
                  required
                  value={operatorId}
                  onChange={(event) => setOperatorId(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Choose a workplace</option>
                  {activeLinks.map((link) => (
                    <option key={link._id} value={link.operatorId._id}>
                      {link.operatorId.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Active DEEP credential
                <select
                  required
                  value={deepCredentialId}
                  onChange={(event) => {
                    setDeepCredentialId(event.target.value);
                    setThereCourseId('');
                  }}
                  className={fieldClass}
                >
                  <option value="">Choose a credential</option>
                  {deepCredentials.map((credential) => (
                    <option key={credential.id} value={credential.id}>
                      {credential.courseName} · {credential.tagName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold md:col-span-2">
                Published THERE course
                <select
                  required
                  value={thereCourseId}
                  onChange={(event) => setThereCourseId(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Choose a matching THERE course</option>
                  {relevantThereCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} · {course.tagName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold md:col-span-2">
                What should your employer verify?
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  value={statement}
                  onChange={(event) => setStatement(event.target.value)}
                  placeholder="Briefly describe the equipment and real-world work you want verified."
                  className={`${fieldClass} h-auto min-h-28 py-3`}
                />
              </label>
              {requestEndorsement.error ? (
                <p role="alert" className="text-sm text-destructive md:col-span-2">
                  {requestEndorsement.error instanceof ApiError
                    ? requestEndorsement.error.message
                    : 'The endorsement request could not be sent.'}
                </p>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    requestEndorsement.isPending ||
                    !operatorId ||
                    !deepCredentialId ||
                    !thereCourseId
                  }
                  className="rounded-full"
                >
                  {requestEndorsement.isPending ? 'Sending…' : 'Request endorsement'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Connect an active workplace, earn an active DEEP credential, and choose a published
              THERE course to request endorsement.
            </p>
          )}

          <div className="mt-6 space-y-3">
            {endorsementsQuery.isLoading ? (
              <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground">
                Loading endorsement requests…
              </p>
            ) : null}
            {!endorsementsQuery.isLoading && endorsements.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No endorsement requests yet.
              </p>
            ) : null}
            {endorsements.map((endorsement) => (
              <article key={endorsement.id} className="rounded-2xl border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">
                      {endorsement.thereCourse?.title ?? 'THERE course'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {endorsement.operator?.companyName ?? 'Workplace'} · requested{' '}
                      {dateFormatter.format(new Date(endorsement.requestedAt))}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">
                    {endorsement.status}
                  </span>
                </div>
                <p className="mt-4 text-sm">{endorsement.statement}</p>
                {endorsement.reviewNotes ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Review note: {endorsement.reviewNotes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Workplace;
