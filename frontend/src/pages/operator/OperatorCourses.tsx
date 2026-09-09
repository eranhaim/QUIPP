import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { AdminCourse, TagName, Tier } from '@/lib/types';

const TAGS: TagName[] = ['THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'];
const TIERS: Tier[] = ['IN', 'DEEP', 'THERE'];
const fieldClass =
  'mt-1.5 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export default function OperatorCourses() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const coursesQuery = useQuery({
    queryKey: ['operator', 'courses'],
    queryFn: () =>
      api<{ courses: AdminCourse[] }>('/api/operator/courses', { auth: true }),
  });
  const create = useMutation({
    mutationFn: (body: {
      slug: string;
      title: string;
      techFocus: string;
      tagName: TagName;
      tier: Tier;
    }) =>
      api<{ course: AdminCourse }>('/api/operator/courses', {
        method: 'POST',
        auth: true,
        body,
      }),
    onSuccess: async ({ course }) => {
      await queryClient.invalidateQueries({ queryKey: ['operator', 'courses'] });
      navigate(`/operator/courses/${course.id}`);
    },
  });

  return (
    <AppShell>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Operator workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold font-display">Course management</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Build organization training, submit it for review, and track approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/operator/training">
                <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
                Course packs
              </Link>
            </Button>
            <Button className="rounded-full" onClick={() => setShowCreate((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New course
            </Button>
          </div>
        </div>

        {showCreate ? (
          <CreateCourseForm
            busy={create.isPending}
            error={create.error}
            onSubmit={(body) => create.mutateAsync(body)}
            onCancel={() => setShowCreate(false)}
          />
        ) : null}

        <section className="mt-8" aria-labelledby="owned-courses-title">
          <h2 id="owned-courses-title" className="sr-only">Your courses</h2>
          {coursesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading courses…</p>
          ) : null}
          {coursesQuery.error ? (
            <p role="alert" className="text-sm text-destructive">
              {message(coursesQuery.error)}
            </p>
          ) : null}
          <div className="grid gap-4">
            {coursesQuery.data?.courses.map((course) => (
              <article key={course.id} className="rounded-3xl bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Status status={course.reviewStatus} />
                      <span className="text-xs font-bold text-muted-foreground">
                        {course.tier} · {course.tagName} ·{' '}
                        {course.visibility === 'organization' ? 'Organization only' : 'Public'}
                      </span>
                    </div>
                    <h3 className="truncate text-lg font-bold">{course.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{course.slug} · {course.parts.length} parts ·{' '}
                      {course.priceCents === 0
                        ? 'Free'
                        : new Intl.NumberFormat(undefined, {
                            style: 'currency',
                            currency: 'USD',
                          }).format(course.priceCents / 100)}
                    </p>
                    {course.reviewNotes ? (
                      <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-sm">
                        Review notes: {course.reviewNotes}
                      </p>
                    ) : null}
                  </div>
                  <Button asChild className="rounded-full">
                    <Link to={`/operator/courses/${course.id}`}>
                      {['draft', 'changes_requested'].includes(course.status) ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {coursesQuery.data?.courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <BookOpen className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted-foreground">
                No courses yet. Create a draft to get started.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}

function CreateCourseForm({
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  error: unknown;
  onSubmit: (body: {
    slug: string;
    title: string;
    techFocus: string;
    tagName: TagName;
    tier: Tier;
  }) => Promise<unknown>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    slug: '',
    title: '',
    techFocus: '',
    tagName: 'THERMAL' as TagName,
    tier: 'IN' as Tier,
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      slug: form.slug.trim().toLowerCase(),
      title: form.title.trim(),
      techFocus: form.techFocus.trim(),
    }).catch(() => undefined);
  };
  return (
    <form onSubmit={submit} className="mt-6 rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold">Create a course draft</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <Field
          label="Slug (kebab-case)"
          value={form.slug}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          onChange={(slug) => setForm({ ...form, slug })}
        />
        <Field
          label="Technology focus"
          value={form.techFocus}
          onChange={(techFocus) => setForm({ ...form, techFocus })}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold">
            Category
            <select
              className={fieldClass}
              value={form.tagName}
              onChange={(event) => setForm({ ...form, tagName: event.target.value as TagName })}
            >
              {TAGS.map((tag) => <option key={tag}>{tag}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Tier
            <select
              className={fieldClass}
              value={form.tier}
              onChange={(event) => setForm({ ...form, tier: event.target.value as Tier })}
            >
              {TIERS.map((tier) => <option key={tier}>{tier}</option>)}
            </select>
          </label>
        </div>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-destructive">{message(error)}</p> : null}
      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={busy} className="rounded-full">
          {busy ? 'Creating…' : 'Create draft'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  pattern,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pattern?: string;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        required
        value={value}
        pattern={pattern}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

function Status({ status }: { status: AdminCourse['reviewStatus'] }) {
  const label = status === 'changes_requested' ? 'Changes requested' : status;
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold capitalize text-primary">
      {label}
    </span>
  );
}

function message(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
