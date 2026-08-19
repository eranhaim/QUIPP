import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { Course, Enrollment } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

const TAG_ICON: Record<string, string> = {
  THERMAL: '🔥',
  COLD: '❄️',
  BEVERAGE: '☕',
  DIGITAL: '💻',
  SERVICE: '🍽️',
};

const TIER_STYLES = {
  IN: 'bg-foreground text-background',
  DEEP: 'bg-secondary text-secondary-foreground',
  THERE: 'bg-primary text-primary-foreground',
} as const;

function fetchCourse(slug: string) {
  return api<{ course: Course }>(`/api/courses/${slug}`, { auth: true });
}

const CourseDetail = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['course', slug],
    queryFn: () => fetchCourse(slug),
    enabled: !!slug,
  });

  const enrollMutation = useMutation({
    mutationFn: () =>
      api<{ enrollment: Enrollment }>(`/api/courses/${slug}/enroll`, {
        method: 'POST',
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments', 'me'] });
      navigate(`/learn/${slug}`);
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not start course';
      toast({ title: 'Enrollment failed', description: message, variant: 'destructive' });
    },
  });

  if (query.isPending) {
    return (
      <AppShell>
        <div className="max-w-[680px] mx-auto px-5 py-20">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="mt-6 h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="mt-4 h-4 w-full bg-muted rounded animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AppShell>
        <div className="max-w-[680px] mx-auto px-5 py-20 text-center">
          <h1 className="text-2xl font-bold font-display">Course not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            It may have been renamed. Head back to the Academy.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/academy">Back to Academy</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const course = query.data.course;
  const realWorldPart = course.parts.find((p) => p.type === 'real_world');
  const knowledgePart = course.parts.find((p) => p.type === 'knowledge');
  const masteryPart = course.parts.find((p) => p.type === 'mastery_check');

  return (
    <AppShell>
      <section className="pt-16 md:pt-24 pb-24">
        <div className="max-w-[720px] mx-auto px-5">
          <p className="text-xs text-muted-foreground mb-8">
            <Link to="/academy" className="hover:text-foreground">
              Academy
            </Link>{' '}
            → {course.title}
          </p>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">{TAG_ICON[course.tagName]}</span>
              <span className="text-xs font-bold uppercase text-muted-foreground">
                {course.tagName}
              </span>
            </div>
            <h1 className="text-3xl md:text-[56px] font-bold font-display text-foreground mb-4 uppercase leading-[0.95] tracking-tight">
              {course.title}
            </h1>
            <span
              className={`inline-block text-[11px] font-bold uppercase px-4 py-1.5 rounded-full ${TIER_STYLES[course.tier]}`}
            >
              {course.tier}
            </span>
            {course.isManufacturer && (
              <span className="inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-primary/40 text-primary ml-2">
                {course.provider} CERTIFIED
              </span>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              {course.duration} minutes · {course.passMark}% to pass · {masteryPart?.questionCount ?? 10}{' '}
              questions
            </p>
            <p className="text-sm font-bold text-primary mt-2">
              +{course.techScoreContribution} score points
            </p>
          </div>

          <div className="flex justify-center mb-14">
            <Button
              size="lg"
              className="rounded-full h-14 px-10 font-bold"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? 'Starting…' : 'Start earning →'}
            </Button>
          </div>

          {realWorldPart && (
            <SectionCard title="Why this matters">
              <p className="text-base text-muted-foreground leading-relaxed">
                {realWorldPart.content}
              </p>
            </SectionCard>
          )}

          {knowledgePart?.topics && knowledgePart.topics.length > 0 && (
            <SectionCard title="What you will master">
              <ul className="space-y-3">
                {knowledgePart.topics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-muted-foreground">
                    <span className="text-primary font-bold">→</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="How it works">
            <div className="space-y-3">
              {course.parts.map((part, i) => (
                <div key={part.partId} className="flex items-center gap-4 p-4 rounded-2xl bg-background">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{part.title}</p>
                    {part.duration && (
                      <p className="text-xs text-muted-foreground">{part.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="What you will earn">
            <ul className="space-y-3">
              <Bullet>Verified credential — permanent, portable, verifiable by anyone</Bullet>
              <Bullet>+{course.techScoreContribution} to your tech proficiency score</Bullet>
              <Bullet>Added to your public Passport instantly</Bullet>
              <Bullet>Shareable badge with a unique verification ID</Bullet>
            </ul>
          </SectionCard>

          <div className="flex justify-center mt-8">
            <Button
              size="lg"
              className="rounded-full h-14 px-10 font-bold"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? 'Starting…' : 'Start earning →'}
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-3xl p-6 md:p-8 mb-5">
    <h2 className="text-xl md:text-2xl font-bold font-display text-card-foreground mb-4 uppercase">
      {title}
    </h2>
    {children}
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-base text-muted-foreground">
    <span className="text-primary">→</span>
    {children}
  </li>
);

export default CourseDetail;
