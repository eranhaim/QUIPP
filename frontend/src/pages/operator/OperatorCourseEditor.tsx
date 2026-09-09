import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoveDown, MoveUp, Plus, Save, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import VideoUpload from '@/components/VideoUpload';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type {
  AdminCourse,
  AdminCoursePart,
  CoursePartType,
  CourseVisibility,
  TagName,
  Tier,
  Video,
} from '@/lib/types';

const TAGS: TagName[] = ['THERMAL', 'COLD', 'BEVERAGE', 'DIGITAL', 'SERVICE'];
const TIERS: Tier[] = ['IN', 'DEEP', 'THERE'];
const PART_TYPES: CoursePartType[] = ['knowledge', 'video', 'mastery_check'];
const inputClass =
  'mt-1.5 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const areaClass =
  'mt-1.5 w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function newPart(type: CoursePartType): AdminCoursePart {
  return {
    partId: `part_${crypto.randomUUID().slice(0, 8)}`,
    type,
    title: type === 'mastery_check' ? 'Mastery check' : type === 'video' ? 'Video' : 'Knowledge',
    duration: '',
    content: '',
    topics: [],
    questions: [],
    videoId: null,
  };
}

export default function OperatorCourseEditor() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ['operator', 'courses'],
    queryFn: () =>
      api<{ courses: AdminCourse[] }>('/api/operator/courses', { auth: true }),
  });
  const videosQuery = useQuery({
    queryKey: ['operator', 'videos'],
    queryFn: () => api<{ videos: Video[] }>('/api/operator/videos', { auth: true }),
  });
  const serverCourse = coursesQuery.data?.courses.find((course) => course.id === id);
  const [draft, setDraft] = useState<AdminCourse | null>(null);
  const [baseline, setBaseline] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (serverCourse && !draft) {
      setDraft(serverCourse);
      setBaseline(JSON.stringify(serverCourse));
    }
  }, [draft, serverCourse]);

  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    const warnForLink = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!target || window.confirm('Leave without saving your course edits?')) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', warnForLink, true);
    return () => document.removeEventListener('click', warnForLink, true);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error('Course is not loaded');
      return api<{ course: AdminCourse }>(`/api/operator/courses/${id}`, {
        method: 'PATCH',
        auth: true,
        body: editablePayload(draft),
      });
    },
    onSuccess: async ({ course }) => {
      setDraft(course);
      setBaseline(JSON.stringify(course));
      setAnnouncement('Course saved.');
      await queryClient.invalidateQueries({ queryKey: ['operator', 'courses'] });
    },
  });
  const submit = useMutation({
    mutationFn: () =>
      api<{ course: AdminCourse }>(`/api/operator/courses/${id}/submit`, {
        method: 'POST',
        auth: true,
      }),
    onSuccess: async ({ course }) => {
      setDraft(course);
      setBaseline(JSON.stringify(course));
      setAnnouncement('Course submitted for admin review.');
      await queryClient.invalidateQueries({ queryKey: ['operator', 'courses'] });
    },
  });

  if (coursesQuery.error) {
    return <AppShell><main className="mx-auto max-w-5xl px-5 py-8"><p role="alert" className="text-sm text-destructive">{errorMessage(coursesQuery.error)}</p></main></AppShell>;
  }
  if (coursesQuery.isLoading || !draft) {
    if (!coursesQuery.isLoading && coursesQuery.data && !serverCourse) {
      return (
        <AppShell>
          <main className="mx-auto max-w-5xl px-5 py-8">
            <p role="alert">Course not found.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/operator/courses">Back to courses</Link></Button>
          </main>
        </AppShell>
      );
    }
    return <AppShell><main className="mx-auto max-w-5xl px-5 py-8 text-sm text-muted-foreground">Loading course…</main></AppShell>;
  }

  const editable = draft.status === 'draft' || draft.status === 'changes_requested';
  const videos = (videosQuery.data?.videos ?? []).filter((video) => video.status === 'ready');
  const patch = (value: Partial<AdminCourse>) => setDraft({ ...draft, ...value });
  const setParts = (parts: AdminCoursePart[]) => patch({ parts });
  const goBack = () => {
    if (!dirty || window.confirm('Leave without saving your course edits?')) {
      navigate('/operator/courses');
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-[1100px] px-5 py-8">
        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={goBack}
              className="mb-3 inline-flex items-center gap-1 rounded text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All courses
            </button>
            <h1 className="text-3xl font-bold font-display">{draft.title}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">/{draft.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={!dirty || save.isPending}
                  onClick={() => save.mutate()}
                >
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  {save.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={dirty || submit.isPending}
                  title={dirty ? 'Save your edits before submitting' : undefined}
                  onClick={() => {
                    if (window.confirm('Submit this course for admin review? It will become read-only while reviewed.')) {
                      submit.mutate();
                    }
                  }}
                >
                  <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                  {submit.isPending ? 'Submitting…' : 'Submit for review'}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <ReviewNotice course={draft} />
        {save.error || submit.error ? (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage(save.error ?? submit.error)}
          </p>
        ) : null}
        {dirty ? <p className="mt-3 text-sm text-amber-700">You have unsaved edits.</p> : null}

        <section className="mt-6 rounded-3xl bg-card p-6" aria-labelledby="metadata-title">
          <h2 id="metadata-title" className="text-lg font-bold">Course details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Title" value={draft.title} disabled={!editable} onChange={(title) => patch({ title })} />
            <Field label="Technology focus" value={draft.techFocus} disabled={!editable} onChange={(techFocus) => patch({ techFocus })} />
            <SelectField label="Category" value={draft.tagName} options={TAGS} disabled={!editable} onChange={(tagName) => patch({ tagName: tagName as TagName })} />
            <SelectField label="Tier" value={draft.tier} options={TIERS} disabled={!editable} onChange={(tier) => patch({ tier: tier as Tier })} />
            <NumberField label="Duration (minutes)" value={draft.duration} min={0} disabled={!editable} onChange={(duration) => patch({ duration })} />
            <NumberField label="Price per seat (USD cents)" value={draft.priceCents} min={0} disabled={!editable} onChange={(priceCents) => patch({ priceCents })} />
            <NumberField label="Pass mark (%)" value={draft.passMark} min={0} max={100} disabled={!editable} onChange={(passMark) => patch({ passMark })} />
            <NumberField label="Retake cooldown (hours)" value={draft.retakeCooldownHours} min={0} disabled={!editable} onChange={(retakeCooldownHours) => patch({ retakeCooldownHours })} />
            <NumberField label="Tech score contribution" value={draft.techScoreContribution} min={0} disabled={!editable} onChange={(techScoreContribution) => patch({ techScoreContribution })} />
            <Field label="Provider" value={draft.provider} disabled={!editable} onChange={(provider) => patch({ provider })} />
            <SelectField
              label="Visibility"
              value={draft.visibility}
              options={['public', 'organization']}
              disabled={!editable}
              onChange={(visibility) => patch({ visibility: visibility as CourseVisibility })}
            />
            <Field label="Equipment name (optional)" value={draft.equipmentName ?? ''} disabled={!editable} required={false} onChange={(equipmentName) => patch({ equipmentName: equipmentName || null })} />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" disabled={!editable} checked={draft.isManufacturer} onChange={(event) => patch({ isManufacturer: event.target.checked })} />
            Manufacturer-certified
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Description
            <textarea required disabled={!editable} rows={5} className={areaClass} value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Technical competencies (one per line)
            <textarea
              disabled={!editable}
              rows={4}
              className={areaClass}
              value={draft.technicalCompetencies.join('\n')}
              onChange={(event) => patch({ technicalCompetencies: lines(event.target.value) })}
            />
          </label>
        </section>

        <section className="mt-6 rounded-3xl bg-card p-6" aria-labelledby="parts-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="parts-title" className="text-lg font-bold">Course parts ({draft.parts.length})</h2>
            {editable ? (
              <div className="flex flex-wrap gap-2">
                {PART_TYPES.map((type) => (
                  <Button key={type} type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setParts([...draft.parts, newPart(type)])}>
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" /> {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-5 space-y-4">
            {draft.parts.map((part, index) => (
              <PartEditor
                key={part.partId}
                part={part}
                videos={videos}
                disabled={!editable}
                onChange={(next) => setParts(draft.parts.map((item, itemIndex) => itemIndex === index ? next : item))}
                onMove={(offset) => {
                  const target = index + offset;
                  if (target < 0 || target >= draft.parts.length) return;
                  const next = [...draft.parts];
                  [next[index], next[target]] = [next[target], next[index]];
                  setParts(next);
                }}
                onDelete={() => {
                  if (window.confirm(`Remove "${part.title}" from this course?`)) {
                    setParts(draft.parts.filter((_, itemIndex) => itemIndex !== index));
                  }
                }}
              />
            ))}
            {draft.parts.length === 0 ? <p className="text-sm text-muted-foreground">Add at least one part before submitting.</p> : null}
          </div>
        </section>

        {editable ? (
          <section className="mt-6 grid gap-4 rounded-3xl border border-border p-6 md:grid-cols-[1fr_340px]" aria-labelledby="videos-title">
            <div>
              <h2 id="videos-title" className="text-lg font-bold">Course videos</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a video here, then select it on a video part above.
              </p>
              {videosQuery.error ? <p role="alert" className="mt-3 text-sm text-destructive">{errorMessage(videosQuery.error)}</p> : null}
            </div>
            <VideoUpload
              endpointBase="/api/operator/videos"
              onUploaded={() => queryClient.invalidateQueries({ queryKey: ['operator', 'videos'] })}
            />
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}

function PartEditor({
  part,
  videos,
  disabled,
  onChange,
  onMove,
  onDelete,
}: {
  part: AdminCoursePart;
  videos: Video[];
  disabled: boolean;
  onChange: (part: AdminCoursePart) => void;
  onMove: (offset: -1 | 1) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<AdminCoursePart>) => onChange({ ...part, ...patch });
  return (
    <article className="rounded-2xl border-2 border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{part.type.replace('_', ' ')}</span>
          <Field label="Part title" value={part.title} disabled={disabled} onChange={(title) => set({ title })} />
        </div>
        {!disabled ? (
          <div className="flex gap-1">
            <IconButton label="Move part up" onClick={() => onMove(-1)}><MoveUp className="h-4 w-4" /></IconButton>
            <IconButton label="Move part down" onClick={() => onMove(1)}><MoveDown className="h-4 w-4" /></IconButton>
            <IconButton label="Remove part" destructive onClick={onDelete}><Trash2 className="h-4 w-4" /></IconButton>
          </div>
        ) : null}
      </div>
      <div className="mt-3">
        <Field label="Duration label" value={part.duration} required={false} disabled={disabled} onChange={(duration) => set({ duration })} />
      </div>
      {part.type === 'video' ? (
        <label className="mt-4 block text-sm font-semibold">
          Attached video
          <select className={inputClass} disabled={disabled} required value={part.videoId ?? ''} onChange={(event) => set({ videoId: event.target.value || null })}>
            <option value="">Choose a video</option>
            {videos.map((video) => <option key={video.id} value={video.id}>{video.title}</option>)}
          </select>
        </label>
      ) : null}
      {part.type === 'knowledge' ? (
        <>
          <label className="mt-4 block text-sm font-semibold">
            Content
            <textarea className={areaClass} disabled={disabled} rows={5} value={part.content} onChange={(event) => set({ content: event.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Topics (one per line)
            <textarea className={areaClass} disabled={disabled} rows={4} value={part.topics.join('\n')} onChange={(event) => set({ topics: lines(event.target.value) })} />
          </label>
        </>
      ) : null}
      {part.type === 'mastery_check' ? <QuizEditor part={part} disabled={disabled} onChange={onChange} /> : null}
    </article>
  );
}

function QuizEditor({ part, disabled, onChange }: { part: AdminCoursePart; disabled: boolean; onChange: (part: AdminCoursePart) => void }) {
  const update = (index: number, patch: Partial<AdminCoursePart['questions'][number]>) =>
    onChange({ ...part, questions: part.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question) });
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Quiz questions ({part.questions.length})</h3>
        {!disabled ? (
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => onChange({ ...part, questions: [...part.questions, { question: '', options: ['', ''], correctIndex: 0, explanation: '' }] })}>
            <Plus className="mr-1 h-3 w-3" aria-hidden="true" /> Question
          </Button>
        ) : null}
      </div>
      <div className="mt-3 space-y-3">
        {part.questions.map((question, index) => (
          <fieldset key={index} className="rounded-xl bg-card p-4">
            <legend className="px-1 text-sm font-bold">Question {index + 1}</legend>
            <Field label="Question" value={question.question} disabled={disabled} onChange={(value) => update(index, { question: value })} />
            <div className="mt-3 space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2 text-sm">
                  <input type="radio" disabled={disabled} name={`${part.partId}-${index}`} checked={question.correctIndex === optionIndex} onChange={() => update(index, { correctIndex: optionIndex })} />
                  <span className="sr-only">Correct answer</span>
                  <input
                    required
                    disabled={disabled}
                    aria-label={`Option ${optionIndex + 1}`}
                    className={inputClass}
                    value={option}
                    onChange={(event) => update(index, { options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })}
                  />
                  {!disabled && question.options.length > 2 ? (
                    <IconButton label={`Remove option ${optionIndex + 1}`} destructive onClick={() => update(index, { options: question.options.filter((_, itemIndex) => itemIndex !== optionIndex), correctIndex: 0 })}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  ) : null}
                </label>
              ))}
            </div>
            {!disabled ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => update(index, { options: [...question.options, ''] })}>Add option</Button>
                <Button type="button" size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => {
                  if (window.confirm(`Remove question ${index + 1}?`)) {
                    onChange({ ...part, questions: part.questions.filter((_, itemIndex) => itemIndex !== index) });
                  }
                }}>Remove question</Button>
              </div>
            ) : null}
            <div className="mt-3">
              <Field label="Answer explanation" value={question.explanation} required={false} disabled={disabled} onChange={(explanation) => update(index, { explanation })} />
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function ReviewNotice({ course }: { course: AdminCourse }) {
  const text =
    course.reviewStatus === 'submitted'
      ? 'Submitted for admin review. Editing is locked until a decision is made.'
      : course.reviewStatus === 'changes_requested'
        ? `Changes requested${course.reviewNotes ? `: ${course.reviewNotes}` : '.'}`
        : course.reviewStatus === 'approved'
          ? 'Approved and published.'
          : 'Draft — not yet submitted.';
  return <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm"><strong className="capitalize">{course.reviewStatus.replace('_', ' ')}</strong><p className="mt-1 text-muted-foreground">{text}</p></div>;
}

function Field({ label, value, onChange, disabled, required = true }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; required?: boolean }) {
  const id = useMemo(() => `field-${Math.random().toString(36).slice(2)}`, []);
  return <label htmlFor={id} className="block text-sm font-semibold">{label}<input id={id} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}

function NumberField({ label, value, onChange, disabled, min, max }: { label: string; value: number; onChange: (value: number) => void; disabled: boolean; min?: number; max?: number }) {
  return <label className="block text-sm font-semibold">{label}<input type="number" required min={min} max={max} disabled={disabled} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className={inputClass} /></label>;
}

function SelectField({ label, value, options, onChange, disabled }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="block text-sm font-semibold">{label}<select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}</select></label>;
}

function IconButton({ label, destructive, onClick, children }: { label: string; destructive?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className={`rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${destructive ? 'text-destructive hover:bg-destructive/10' : 'hover:bg-muted'}`}>{children}</button>;
}

function editablePayload(course: AdminCourse) {
  return {
    title: course.title,
    techFocus: course.techFocus,
    tagName: course.tagName,
    tier: course.tier,
    duration: course.duration,
    description: course.description,
    provider: course.provider,
    isManufacturer: course.isManufacturer,
    equipmentName: course.equipmentName,
    passMark: course.passMark,
    retakeCooldownHours: course.retakeCooldownHours,
    techScoreContribution: course.techScoreContribution,
    priceCents: course.priceCents,
    visibility: course.visibility,
    technicalCompetencies: course.technicalCompetencies,
    parts: course.parts,
  };
}

function lines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
