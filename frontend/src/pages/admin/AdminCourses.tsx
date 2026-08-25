import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { AdminCourse } from '@/lib/types';

const TAG_NAMES = ['THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'] as const;
const TIERS = ['IN', 'DEEP', 'THERE'] as const;

const AdminCourses = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const q = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => api<{ courses: AdminCourse[] }>('/api/admin/courses', { auth: true }),
  });

  const publish = useMutation({
    mutationFn: (input: { slug: string; status: 'published' | 'coming_soon' }) =>
      api<{ course: AdminCourse }>(`/api/admin/courses/${input.slug}/status`, {
        method: 'POST',
        auth: true,
        body: { status: input.status },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-display text-foreground">Courses</h1>
        <Button className="rounded-full" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-4 h-4 mr-1" aria-hidden />
          New course
        </Button>
      </div>

      {showCreate && (
        <CreateCourse
          onDone={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
          }}
        />
      )}

      {q.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-sm text-destructive">Could not load courses.</p>}

      <div className="grid gap-3">
        {q.data?.courses.map((c) => (
          <div
            key={c.id}
            className="bg-card rounded-2xl p-5 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    c.status === 'published'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {c.tier} · {c.tagName}
                </span>
              </div>
              <p className="text-lg font-semibold text-card-foreground truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                /{c.slug} · {c.parts.length} parts
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  publish.mutate({
                    slug: c.slug,
                    status: c.status === 'published' ? 'coming_soon' : 'published',
                  })
                }
                disabled={publish.isPending}
              >
                {c.status === 'published' ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" aria-hidden /> Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" aria-hidden /> Publish
                  </>
                )}
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to={`/admin/courses/${c.slug}`}>Edit</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateCourse = ({ onDone }: { onDone: () => void }) => {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [techFocus, setTechFocus] = useState('');
  const [tier, setTier] = useState<'IN' | 'DEEP' | 'THERE'>('IN');
  const [tagName, setTagName] = useState<(typeof TAG_NAMES)[number]>('THERMAL');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/api/admin/courses', {
        method: 'POST',
        auth: true,
        body: {
          slug: slug.toLowerCase().trim(),
          title: title.trim(),
          techFocus: techFocus.trim(),
          tier,
          tagName,
        },
      });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not create course.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-card rounded-2xl p-5 mb-4 grid gap-3 md:grid-cols-2"
    >
      <div>
        <label htmlFor="new-slug" className="text-xs font-medium text-card-foreground block mb-1.5">
          Slug (kebab-case)
        </label>
        <input
          id="new-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="new-title" className="text-xs font-medium text-card-foreground block mb-1.5">
          Title
        </label>
        <input
          id="new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="new-tf" className="text-xs font-medium text-card-foreground block mb-1.5">
          Tech focus
        </label>
        <input
          id="new-tf"
          value={techFocus}
          onChange={(e) => setTechFocus(e.target.value)}
          className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="new-tier" className="text-xs font-medium text-card-foreground block mb-1.5">
            Tier
          </label>
          <select
            id="new-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as typeof tier)}
            className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          >
            {TIERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-tag" className="text-xs font-medium text-card-foreground block mb-1.5">
            Category
          </label>
          <select
            id="new-tag"
            value={tagName}
            onChange={(e) => setTagName(e.target.value as typeof tagName)}
            className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          >
            {TAG_NAMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" className="rounded-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create draft'}
        </Button>
        {err && <p className="text-sm text-destructive self-center">{err}</p>}
      </div>
    </form>
  );
};

export default AdminCourses;
