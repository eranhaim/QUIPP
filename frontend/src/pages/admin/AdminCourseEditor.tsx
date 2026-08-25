import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Plus, MoveUp, MoveDown } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type {
  AdminCourse,
  AdminCoursePart,
  CoursePartType,
  TagName,
  Tier,
  Video,
} from '@/lib/types';

const PART_TYPES: CoursePartType[] = ['real_world', 'knowledge', 'video', 'mastery_check', 'credential'];
const TAG_NAMES: TagName[] = ['THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'];
const TIERS: Tier[] = ['IN', 'DEEP', 'THERE'];

/**
 * Convenience type — the parts we hold in local state can grow/shrink freely,
 * so this is just an alias for clarity.
 */
type LocalPart = AdminCoursePart;

const emptyPart = (type: CoursePartType): LocalPart => ({
  partId: `part_${Math.random().toString(36).slice(2, 8)}`,
  type,
  title:
    type === 'video'
      ? 'Watch: intro'
      : type === 'mastery_check'
        ? 'Mastery check'
        : type === 'credential'
          ? 'Your credential'
          : type === 'knowledge'
            ? 'Learn the essentials'
            : 'Why this matters',
  duration: '',
  content: '',
  topics: [],
  questions: [],
  videoId: null,
});

const AdminCourseEditor = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const courseQuery = useQuery({
    queryKey: ['admin', 'course', slug],
    queryFn: () => api<{ course: AdminCourse }>(`/api/admin/courses/${slug}`, { auth: true }),
    enabled: !!slug,
  });
  const videosQuery = useQuery({
    queryKey: ['admin', 'videos'],
    queryFn: () => api<{ videos: Video[] }>('/api/admin/videos', { auth: true }),
  });

  const [draft, setDraft] = useState<AdminCourse | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    if (courseQuery.data?.course) setDraft(courseQuery.data.course);
  }, [courseQuery.data]);

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('no draft');
      return api<{ course: AdminCourse }>(`/api/admin/courses/${slug}`, {
        method: 'PATCH',
        auth: true,
        body: {
          title: draft.title,
          techFocus: draft.techFocus,
          tagName: draft.tagName,
          tier: draft.tier,
          duration: draft.duration,
          description: draft.description,
          provider: draft.provider,
          isManufacturer: draft.isManufacturer,
          equipmentName: draft.equipmentName,
          passMark: draft.passMark,
          retakeCooldownHours: draft.retakeCooldownHours,
          techScoreContribution: draft.techScoreContribution,
          status: draft.status,
          technicalCompetencies: draft.technicalCompetencies,
          parts: draft.parts,
        },
      });
    },
    onSuccess: () => {
      setSaveErr(null);
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'course', slug] });
    },
    onError: (e) => setSaveErr(e instanceof ApiError ? e.message : 'Save failed'),
  });

  const videos = useMemo(
    () => (videosQuery.data?.videos ?? []).filter((v) => v.status === 'ready'),
    [videosQuery.data],
  );

  if (courseQuery.isPending || !draft) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (courseQuery.error) {
    return <p className="text-sm text-destructive">Could not load course.</p>;
  }

  const patch = (p: Partial<AdminCourse>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setParts = (parts: LocalPart[]) => setDraft((d) => (d ? { ...d, parts } : d));
  const movePart = (idx: number, dir: -1 | 1) => {
    const parts = [...draft.parts];
    const j = idx + dir;
    if (j < 0 || j >= parts.length) return;
    [parts[idx], parts[j]] = [parts[j], parts[idx]];
    setParts(parts);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/admin/courses"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> All courses
          </Link>
          <h1 className="text-3xl font-bold font-display text-foreground">{draft.title}</h1>
          <p className="text-xs text-muted-foreground font-mono">/{draft.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() =>
              patch({ status: draft.status === 'published' ? 'coming_soon' : 'published' })
            }
          >
            {draft.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button className="rounded-full" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="w-4 h-4 mr-1" aria-hidden />
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {saveErr && (
        <p className="text-sm text-destructive mb-3" role="alert">
          {saveErr}
        </p>
      )}
      {save.isSuccess && (
        <p className="text-sm text-primary mb-3" role="status">
          Saved.
        </p>
      )}

      <section className="bg-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Metadata</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput label="Title" id="ed-title" value={draft.title} onChange={(v) => patch({ title: v })} />
          <LabeledInput label="Tech focus" id="ed-tf" value={draft.techFocus} onChange={(v) => patch({ techFocus: v })} />
          <LabeledSelect
            label="Tier"
            id="ed-tier"
            value={draft.tier}
            onChange={(v) => patch({ tier: v as Tier })}
            options={TIERS}
          />
          <LabeledSelect
            label="Category"
            id="ed-tag"
            value={draft.tagName}
            onChange={(v) => patch({ tagName: v as TagName })}
            options={TAG_NAMES}
          />
          <LabeledInput
            label="Duration (min)"
            id="ed-dur"
            type="number"
            value={String(draft.duration)}
            onChange={(v) => patch({ duration: Number(v) || 0 })}
          />
          <LabeledInput
            label="Pass mark (%)"
            id="ed-pm"
            type="number"
            value={String(draft.passMark)}
            onChange={(v) => patch({ passMark: Math.max(0, Math.min(100, Number(v) || 0)) })}
          />
          <LabeledInput
            label="Tech score contribution"
            id="ed-tsc"
            type="number"
            value={String(draft.techScoreContribution)}
            onChange={(v) => patch({ techScoreContribution: Math.max(0, Number(v) || 0) })}
          />
          <LabeledInput
            label="Provider"
            id="ed-prov"
            value={draft.provider}
            onChange={(v) => patch({ provider: v })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isManufacturer}
              onChange={(e) => patch({ isManufacturer: e.target.checked })}
            />
            Manufacturer-certified
          </label>
          <LabeledInput
            label="Equipment name"
            id="ed-eq"
            value={draft.equipmentName ?? ''}
            onChange={(v) => patch({ equipmentName: v || null })}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="ed-desc" className="text-xs font-medium text-card-foreground block mb-1.5">
            Description
          </label>
          <textarea
            id="ed-desc"
            value={draft.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="ed-comp" className="text-xs font-medium text-card-foreground block mb-1.5">
            Technical competencies (one per line)
          </label>
          <textarea
            id="ed-comp"
            value={(draft.technicalCompetencies ?? []).join('\n')}
            onChange={(e) =>
              patch({
                technicalCompetencies: e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm"
          />
        </div>
      </section>

      <section className="bg-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Parts ({draft.parts.length})</h2>
          <div className="flex gap-2">
            {PART_TYPES.map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setParts([...draft.parts, emptyPart(t)])}
              >
                <Plus className="w-3 h-3 mr-1" aria-hidden />
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {draft.parts.map((part, idx) => (
            <PartEditor
              key={part.partId}
              part={part}
              videos={videos}
              onChange={(next) => {
                const parts = [...draft.parts];
                parts[idx] = next;
                setParts(parts);
              }}
              onDelete={() => setParts(draft.parts.filter((_, i) => i !== idx))}
              onUp={() => movePart(idx, -1)}
              onDown={() => movePart(idx, 1)}
            />
          ))}
          {draft.parts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No parts yet. Add a real_world → video → knowledge → mastery_check → credential
              sequence for a typical course.
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button className="rounded-full" onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="w-4 h-4 mr-1" aria-hidden />
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="mt-6">
        <Button variant="ghost" onClick={() => navigate(`/training/${slug}`)}>
          Preview as learner →
        </Button>
      </div>
    </div>
  );
};

const PartEditor = ({
  part,
  videos,
  onChange,
  onDelete,
  onUp,
  onDown,
}: {
  part: LocalPart;
  videos: Video[];
  onChange: (next: LocalPart) => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
}) => {
  const p = part;
  const set = (partial: Partial<LocalPart>) => onChange({ ...p, ...partial });

  const topicsText = (p.topics ?? []).join('\n');

  return (
    <div className="rounded-2xl border-2 border-border p-5 bg-background">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {p.type}
          </span>
          <input
            className="text-base font-semibold bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
            value={p.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={onUp} className="p-1 hover:bg-muted rounded">
            <MoveUp className="w-4 h-4" aria-label="Move up" />
          </button>
          <button type="button" onClick={onDown} className="p-1 hover:bg-muted rounded">
            <MoveDown className="w-4 h-4" aria-label="Move down" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 hover:bg-destructive/10 text-destructive rounded"
          >
            <Trash2 className="w-4 h-4" aria-label="Delete part" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 mb-3">
        <LabeledInput
          label="Duration label (e.g., 3 min)"
          id={`p-${p.partId}-dur`}
          value={p.duration}
          onChange={(v) => set({ duration: v })}
        />
      </div>

      {p.type === 'video' && (
        <div>
          <label className="text-xs font-medium block mb-1.5">Video</label>
          <select
            value={p.videoId ?? ''}
            onChange={(e) => set({ videoId: e.target.value || null })}
            className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
          >
            <option value="">— Choose a video —</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} · {v.durationSec ? `${Math.round(v.durationSec)}s` : 'unknown'}
              </option>
            ))}
          </select>
          {videos.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No ready videos yet. Upload one in <Link className="underline" to="/admin/videos">Videos</Link>.
            </p>
          )}
        </div>
      )}

      {(p.type === 'real_world' || p.type === 'knowledge') && (
        <div>
          <label htmlFor={`p-${p.partId}-content`} className="text-xs font-medium block mb-1.5">
            Content (plain text; blank lines separate paragraphs)
          </label>
          <textarea
            id={`p-${p.partId}-content`}
            value={p.content}
            onChange={(e) => set({ content: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm"
          />
        </div>
      )}

      {p.type === 'knowledge' && (
        <div className="mt-3">
          <label htmlFor={`p-${p.partId}-topics`} className="text-xs font-medium block mb-1.5">
            Bullet topics (one per line)
          </label>
          <textarea
            id={`p-${p.partId}-topics`}
            value={topicsText}
            onChange={(e) =>
              set({
                topics: e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border-2 border-border bg-background text-sm"
          />
        </div>
      )}

      {p.type === 'mastery_check' && (
        <QuizEditor
          questions={p.questions}
          onChange={(qs) => set({ questions: qs })}
        />
      )}
    </div>
  );
};

const QuizEditor = ({
  questions,
  onChange,
}: {
  questions: LocalPart['questions'];
  onChange: (next: LocalPart['questions']) => void;
}) => {
  const add = () =>
    onChange([
      ...questions,
      { question: '', options: ['', '', ''], correctIndex: 0, explanation: '' },
    ]);
  const set = (i: number, patch: Partial<LocalPart['questions'][number]>) => {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(questions.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium">Questions ({questions.length})</p>
        <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={add}>
          <Plus className="w-3 h-3 mr-1" aria-hidden /> Add question
        </Button>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="rounded-xl bg-card p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Q{i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-destructive hover:bg-destructive/10 rounded p-1"
              >
                <Trash2 className="w-3 h-3" aria-label="Delete question" />
              </button>
            </div>
            <input
              value={q.question}
              onChange={(e) => set(i, { question: e.target.value })}
              placeholder="Question…"
              className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm mb-2"
            />
            <div className="space-y-1">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2">
                  <input
                    type="radio"
                    name={`q-${i}-correct`}
                    checked={q.correctIndex === oi}
                    onChange={() => set(i, { correctIndex: oi })}
                    aria-label={`Mark option ${oi + 1} correct`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      const options = [...q.options];
                      options[oi] = e.target.value;
                      set(i, { options });
                    }}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 h-9 px-3 rounded-full border-2 border-border bg-background text-sm"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        set(i, { options: q.options.filter((_, k) => k !== oi) })
                      }
                      className="text-destructive hover:bg-destructive/10 rounded px-2"
                    >
                      <Trash2 className="w-3 h-3" aria-label="Remove option" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => set(i, { options: [...q.options, ''] })}
              >
                <Plus className="w-3 h-3 mr-1" aria-hidden /> Option
              </Button>
            </div>
            <input
              value={q.explanation}
              onChange={(e) => set(i, { explanation: e.target.value })}
              placeholder="Why this answer? (shown after grading)"
              className="mt-2 w-full h-10 px-4 rounded-full border-2 border-border bg-background text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const LabeledInput = ({
  label,
  id,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div>
    <label htmlFor={id} className="text-xs font-medium block mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
    />
  </div>
);

const LabeledSelect = ({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) => (
  <div>
    <label htmlFor={id} className="text-xs font-medium block mb-1.5">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-full border-2 border-border bg-background text-sm"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

export default AdminCourseEditor;
