import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import type { Course, Enrollment, TagName, TechTag, Tier } from '@/lib/types';

const TIER_STYLES: Record<Tier, { bg: string; color: string }> = {
  IN: { bg: '#221f20', color: '#ffffff' },
  DEEP: { bg: '#36186b', color: '#ffffff' },
  THERE: { bg: '#d1f300', color: '#221f20' },
};

function fetchCourses() {
  return api<{ courses: Course[] }>('/api/courses', { auth: true });
}

function fetchTags() {
  return api<{ tags: TechTag[] }>('/api/tags');
}

function fetchMyEnrollments() {
  return api<{ enrollments: Enrollment[] }>('/api/enrollments/me', { auth: true });
}

const Academy = () => {
  const [filter, setFilter] = useState<'ALL' | TagName>('ALL');

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: fetchTags });
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: fetchMyEnrollments,
  });

  const courses = coursesQuery.data?.courses ?? [];
  const tags = tagsQuery.data?.tags ?? [];
  const enrollmentBySlug = useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const e of enrollmentsQuery.data?.enrollments ?? []) map.set(e.courseSlug, e);
    return map;
  }, [enrollmentsQuery.data]);

  const visibleCourses = filter === 'ALL' ? courses : courses.filter((c) => c.tagName === filter);
  const shelves = tags
    .map((t) => ({ tag: t, items: visibleCourses.filter((c) => c.tagName === t.tagName) }))
    .filter((s) => s.items.length > 0);

  return (
    <AppShell>
      <section className="py-14 md:py-20" style={{ background: '#36186b' }}>
        <div className="max-w-[1000px] mx-auto px-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
            The academy
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold font-display text-white uppercase leading-[0.95] tracking-tight">
            Every credential<br />is earned.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/70 max-w-[520px] mx-auto">
            Scenario-based courses. 80% to pass. Fail and you retake — the credential means something.
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap mt-8">
            <StatBadge num={String(courses.length)} label="Live courses" />
            <StatBadge num={String(courses.length * 3)} label="Credentials incoming" />
            <StatBadge num={String(tags.length)} label="Categories" />
          </div>
        </div>
      </section>

      <section className="py-8 bg-background border-b border-border">
        <div className="max-w-[1000px] mx-auto px-5 flex flex-wrap justify-center gap-2">
          <FilterPill active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
            All
          </FilterPill>
          {tags.map((t) => (
            <FilterPill
              key={t.tagName}
              active={filter === t.tagName}
              onClick={() => setFilter(t.tagName)}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </FilterPill>
          ))}
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-[1000px] mx-auto px-5 space-y-14">
          {coursesQuery.isPending ? (
            <SkeletonShelf />
          ) : coursesQuery.isError ? (
            <p className="text-sm text-destructive text-center">
              Could not load courses. Try refreshing.
            </p>
          ) : shelves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No courses in this category yet.
            </p>
          ) : (
            shelves.map((shelf) => (
              <div key={shelf.tag.tagName}>
                <ShelfHeader tag={shelf.tag} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                  {shelf.items.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrollment={enrollmentBySlug.get(course.slug) ?? null}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
};

interface StatBadgeProps {
  num: string;
  label: string;
}
const StatBadge = ({ num, label }: StatBadgeProps) => (
  <div className="text-center">
    <span className="text-3xl md:text-4xl font-bold font-display text-primary">{num}</span>
    <span className="block text-xs text-white/60 mt-1 uppercase tracking-widest">{label}</span>
  </div>
);

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const FilterPill = ({ active, onClick, children }: FilterPillProps) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'text-sm font-bold px-5 py-2 rounded-full transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      active
        ? 'bg-primary text-[#221f20]'
        : 'bg-transparent text-foreground border border-foreground/30 hover:border-foreground',
    ].join(' ')}
  >
    {children}
  </button>
);

const ShelfHeader = ({ tag }: { tag: TechTag }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-widest text-primary">{tag.icon} {tag.label}</p>
    <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground uppercase mt-1">
      {tag.label} courses
    </h2>
    <div className="w-10 h-0.5 bg-primary mt-2" />
    <p className="mt-3 text-sm text-muted-foreground max-w-lg">{tag.description}</p>
  </div>
);

interface CourseCardProps {
  course: Course;
  enrollment: Enrollment | null;
}
const CourseCard = ({ course, enrollment }: CourseCardProps) => {
  const tierStyle = TIER_STYLES[course.tier];
  const isDone = enrollment?.status === 'completed';
  return (
    <Link
      to={`/training/${course.slug}`}
      className="bg-card border border-border rounded-2xl overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow hover:shadow-lg"
    >
      <div className="aspect-video bg-muted relative flex items-center justify-center text-5xl">
        <span className="opacity-30">{tagEmoji(course.tagName)}</span>
        <span
          className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
          style={{ background: tierStyle.bg, color: tierStyle.color }}
        >
          {course.tier}
        </span>
        {isDone && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary text-[#1d123c]">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Earned
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {course.provider}
        </p>
        <h3 className="mt-1 text-lg font-bold font-display uppercase text-foreground line-clamp-2">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {course.duration} min
          </span>
          <span className="inline-flex items-center gap-1 font-bold uppercase tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
            {isDone ? 'Review' : enrollment ? 'Resume' : 'Start'}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
};

function tagEmoji(tag: TagName): string {
  switch (tag) {
    case 'THERMAL':
      return '🔥';
    case 'COLD':
      return '❄️';
    case 'BEVERAGE':
      return '☕';
    case 'DIGITAL':
      return '💻';
    case 'SERVICE':
      return '🍽️';
  }
}

const SkeletonShelf = () => (
  <div>
    <div className="h-6 w-40 bg-muted rounded animate-pulse mb-5" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card animate-pulse">
          <div className="aspect-video bg-muted rounded-t-2xl" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Academy;
