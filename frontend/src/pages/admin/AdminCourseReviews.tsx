import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { AdminCourse } from '@/lib/types';

export default function AdminCourseReviews() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const queue = useQuery({
    queryKey: ['admin', 'course-reviews'],
    queryFn: () =>
      api<{ courses: AdminCourse[] }>('/api/admin/course-reviews', { auth: true }),
  });
  const selected = queue.data?.courses.find((course) => course.id === selectedId) ?? null;
  const approve = useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/course-reviews/${id}/approve`, { method: 'POST', auth: true }),
    onSuccess: async () => {
      setSelectedId(null);
      setAnnouncement('Course approved and published.');
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
  const requestChanges = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes: string }) =>
      api(`/api/admin/course-reviews/${id}/request-changes`, {
        method: 'POST',
        auth: true,
        body: { notes: reviewNotes },
      }),
    onSuccess: async () => {
      setSelectedId(null);
      setNotes('');
      setAnnouncement('Change request sent to the operator.');
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <h1 className="text-3xl font-bold font-display">Course reviews</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review operator-authored courses before they are published.
      </p>
      {queue.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading review queue…</p> : null}
      {queue.error ? <ErrorMessage error={queue.error} /> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section aria-labelledby="review-queue-title">
          <h2 id="review-queue-title" className="text-lg font-bold">
            Queue ({queue.data?.courses.length ?? 0})
          </h2>
          <div className="mt-3 space-y-3">
            {queue.data?.courses.map((course) => (
              <button
                type="button"
                key={course.id}
                onClick={() => {
                  setSelectedId(course.id);
                  setNotes('');
                }}
                aria-pressed={course.id === selectedId}
                className={`w-full rounded-2xl border-2 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  course.id === selectedId ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <span className="font-bold">{course.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {course.provider} · {course.parts.length} parts · {course.tier}
                </span>
              </button>
            ))}
            {queue.data?.courses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <ClipboardList className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">The review queue is empty.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="review-detail-title">
          {selected ? (
            <ReviewDetail
              course={selected}
              notes={notes}
              setNotes={setNotes}
              busy={approve.isPending || requestChanges.isPending}
              error={approve.error ?? requestChanges.error}
              onApprove={() => {
                if (window.confirm(`Approve and publish "${selected.title}"?`)) {
                  approve.mutate(selected.id);
                }
              }}
              onRequestChanges={(event) => {
                event.preventDefault();
                requestChanges.mutate({ id: selected.id, reviewNotes: notes.trim() });
              }}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Select a course to inspect its complete content.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ReviewDetail({
  course,
  notes,
  setNotes,
  busy,
  error,
  onApprove,
  onRequestChanges,
}: {
  course: AdminCourse;
  notes: string;
  setNotes: (notes: string) => void;
  busy: boolean;
  error: unknown;
  onApprove: () => void;
  onRequestChanges: (event: FormEvent) => void;
}) {
  return (
    <div className="rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Submitted course</p>
          <h2 id="review-detail-title" className="mt-1 text-2xl font-bold">{course.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.provider} · {course.tagName} · {course.tier} · {course.duration} minutes
          </p>
        </div>
        <Button type="button" disabled={busy} onClick={onApprove} className="rounded-full">
          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
          {busy ? 'Working…' : 'Approve and publish'}
        </Button>
      </div>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-border p-4 text-sm sm:grid-cols-2">
        <Meta label="Slug" value={`/${course.slug}`} />
        <Meta label="Visibility" value={course.visibility} />
        <Meta label="Price per seat" value={course.priceCents === 0 ? 'Free' : `${(course.priceCents / 100).toFixed(2)} USD`} />
        <Meta label="Pass mark" value={`${course.passMark}%`} />
        <Meta label="Retake cooldown" value={`${course.retakeCooldownHours} hours`} />
        <Meta label="Tech score" value={String(course.techScoreContribution)} />
      </dl>
      <div className="mt-5">
        <h3 className="font-bold">Description</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{course.description || 'No description.'}</p>
      </div>
      <div className="mt-5">
        <h3 className="font-bold">Technical competencies</h3>
        {course.technicalCompetencies.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {course.technicalCompetencies.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted-foreground">None listed.</p>}
      </div>
      <div className="mt-6 space-y-4">
        <h3 className="font-bold">Parts ({course.parts.length})</h3>
        {course.parts.map((part, index) => (
          <article key={part.partId} className="rounded-2xl border border-border p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {index + 1}. {part.type.replace('_', ' ')}
            </p>
            <h4 className="mt-1 font-bold">{part.title}</h4>
            {part.duration ? <p className="mt-1 text-xs text-muted-foreground">{part.duration}</p> : null}
            {part.content ? <p className="mt-3 whitespace-pre-wrap text-sm">{part.content}</p> : null}
            {part.topics.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {part.topics.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
            ) : null}
            {part.videoId ? <p className="mt-3 text-sm text-muted-foreground">Attached video: {part.videoId}</p> : null}
            {part.questions.length ? (
              <ol className="mt-4 space-y-3">
                {part.questions.map((question, questionIndex) => (
                  <li key={`${question.question}-${questionIndex}`} className="rounded-xl bg-muted/50 p-3 text-sm">
                    <p className="font-semibold">{questionIndex + 1}. {question.question}</p>
                    <ul className="mt-2 space-y-1">
                      {question.options.map((option, optionIndex) => (
                        <li key={`${option}-${optionIndex}`} className={optionIndex === question.correctIndex ? 'font-bold text-primary' : ''}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                          {optionIndex === question.correctIndex ? ' (correct)' : ''}
                        </li>
                      ))}
                    </ul>
                    {question.explanation ? <p className="mt-2 text-muted-foreground">Explanation: {question.explanation}</p> : null}
                  </li>
                ))}
              </ol>
            ) : null}
          </article>
        ))}
      </div>

      <form onSubmit={onRequestChanges} className="mt-8 rounded-2xl border-2 border-amber-500/30 p-5">
        <h3 className="font-bold">Request changes</h3>
        <label htmlFor="review-notes" className="mt-3 block text-sm font-semibold">
          Required notes for the operator
        </label>
        <textarea
          id="review-notes"
          required
          minLength={1}
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-1.5 w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {error ? <ErrorMessage error={error} /> : null}
        <Button type="submit" variant="outline" disabled={busy || !notes.trim()} className="mt-4 rounded-full text-destructive">
          <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Send change request
        </Button>
      </form>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold">{label}</dt><dd className="capitalize text-muted-foreground">{value}</dd></div>;
}

function ErrorMessage({ error }: { error: unknown }) {
  return <p role="alert" className="mt-4 text-sm text-destructive">{error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'}</p>;
}
