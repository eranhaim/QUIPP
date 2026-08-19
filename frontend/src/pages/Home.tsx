import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  GraduationCap,
  IdCard,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import TechScoreRing from '@/components/TechScoreRing';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { Credential, Enrollment } from '@/lib/types';

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function firstNameFromUser(user: { firstName: string | null; email: string }): string {
  return (user.firstName ?? user.email.split('@')[0]).toUpperCase();
}

function heroSubcopy(techScore: number, hasCredentials: boolean): string {
  if (hasCredentials && techScore >= 50) {
    return 'Your Passport is talking. Add another credential and turn up the volume.';
  }
  if (hasCredentials) {
    return 'Nice start. Every new credential moves your score.';
  }
  return 'Your passport is quiet today. One credential is all it takes to change that.';
}

const Home = () => {
  const { user, profile } = useAuth();

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: () => api<{ enrollments: Enrollment[] }>('/api/enrollments/me', { auth: true }),
    enabled: !!user,
  });

  const credentialsQuery = useQuery({
    queryKey: ['credentials', 'me'],
    queryFn: () => api<{ credentials: Credential[] }>('/api/credentials/me', { auth: true }),
    enabled: !!user,
  });

  if (!user) return null;

  const techScore = profile?.techProficiencyScore ?? 0;
  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const credentials = credentialsQuery.data?.credentials ?? [];
  const currentCourse = enrollments.find((e) => e.status === 'in_progress' || e.status === 'failed');
  const recentCredentials = credentials.slice(0, 4);

  return (
    <AppShell>
      <section className="px-5 md:px-10 py-10 md:py-14" style={{ background: '#36186b' }}>
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              {greeting()}
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold font-display text-white tracking-tight uppercase leading-none">
              {firstNameFromUser(user)}.
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/70 max-w-md">
              {heroSubcopy(techScore, credentials.length > 0)}
            </p>
            <Link
              to="/academy"
              className="inline-flex items-center gap-2 mt-6 rounded-full bg-primary text-[#1d123c] px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#36186b]"
            >
              Browse Academy
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="shrink-0">
            <TechScoreRing score={techScore} size={140} />
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 py-10 md:py-14">
        <div className="max-w-[1000px] mx-auto">
          <SectionHeader eyebrow="Continue" title="Pick up where you left off" />
          {enrollmentsQuery.isPending ? (
            <SkeletonCard />
          ) : currentCourse ? (
            <ContinueCourseCard enrollment={currentCourse} />
          ) : (
            <EmptyCourseCard />
          )}

          <div className="h-10" />

          <SectionHeader eyebrow="Do next" title="Quick actions" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionTile
              to="/academy"
              Icon={GraduationCap}
              title="Take a course"
              body="20 subjects across thermal, cold, beverage, digital and service."
            />
            <ActionTile
              to="/passport/me"
              Icon={IdCard}
              title="View my Passport"
              body="See how you look to a hiring manager."
            />
            <ActionTile
              to="/credentials"
              Icon={ShieldCheck}
              title="My credentials"
              body="Every credential you have earned. Permanent. Portable."
            />
          </div>

          <div className="h-10" />

          <SectionHeader eyebrow="Latest" title="Recent credentials" />
          {credentialsQuery.isPending ? (
            <SkeletonCard />
          ) : recentCredentials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You have no credentials yet. Pass an assessment and it lands here — permanently.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentCredentials.map((c) => (
                <CredentialCard key={c.id} credential={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
}

const SectionHeader = ({ eyebrow, title }: SectionHeaderProps) => (
  <div className="mb-5">
    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
    <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground uppercase mt-1">
      {title}
    </h2>
    <div className="w-10 h-0.5 bg-primary mt-2" />
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-2xl border border-border bg-card p-6 md:p-8 animate-pulse">
    <div className="h-4 w-32 bg-muted rounded" />
    <div className="mt-3 h-6 w-64 bg-muted rounded" />
    <div className="mt-6 h-2 w-full bg-muted rounded-full" />
  </div>
);

const ContinueCourseCard = ({ enrollment }: { enrollment: Enrollment }) => (
  <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
    <div className="flex-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
        {enrollment.tagName} · {enrollment.tier}
      </p>
      <h3 className="mt-1 text-xl font-bold font-display uppercase text-foreground">
        {enrollment.courseTitle}
      </h3>
      <p className="text-sm text-muted-foreground mt-2">
        {enrollment.status === 'failed'
          ? enrollment.cooldownEndsAt && new Date(enrollment.cooldownEndsAt) > new Date()
            ? `You can retake after ${new Date(enrollment.cooldownEndsAt).toLocaleString()}.`
            : 'Retake ready. You have got this.'
          : `${enrollment.progressPct}% complete`}
      </p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${enrollment.progressPct}%` }}
        />
      </div>
    </div>
    <Link
      to={`/training/${enrollment.courseSlug}`}
      className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
    >
      Continue
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  </div>
);

const EmptyCourseCard = () => (
  <div className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
    <div className="flex-1">
      <h3 className="text-lg font-bold font-display uppercase text-foreground">
        Nothing in progress
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Every QUIPP credential is earned by passing a scenario-based assessment. Start with an IN
        certification to feel the format.
      </p>
    </div>
    <Link
      to="/academy"
      className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity self-start md:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
    >
      Start a course
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  </div>
);

const CredentialCard = ({ credential }: { credential: Credential }) => (
  <Link
    to={`/verify/${credential.verificationId}`}
    className="rounded-2xl border border-border bg-card p-5 flex flex-col hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {credential.provider}
      </p>
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-foreground text-background">
        {credential.tier}
      </span>
    </div>
    <h3 className="mt-2 text-base font-bold font-display uppercase text-foreground">
      {credential.courseName}
    </h3>
    <p className="text-xs text-muted-foreground mt-1">
      Earned {new Date(credential.earnedDate).toLocaleDateString()}
    </p>
  </Link>
);

interface ActionTileProps {
  to: string;
  title: string;
  body: string;
  Icon: LucideIcon;
}

const ActionTile = ({ to, title, body, Icon }: ActionTileProps) => (
  <Link
    to={to}
    className="group rounded-2xl border border-border bg-card p-5 flex flex-col hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <Icon className="h-5 w-5 text-primary" aria-hidden />
    <h3 className="mt-4 text-base font-bold font-display uppercase text-foreground">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">
      Open <ArrowRight className="h-3 w-3" aria-hidden />
    </span>
  </Link>
);

export default Home;
