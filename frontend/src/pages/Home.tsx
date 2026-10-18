import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
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

  return (
    <AppShell>
      {/* ── Hero: score + greeting ── */}
      <section className="px-5 md:px-10 py-12 md:py-16" style={{ background: '#00182E' }}>
        <div className="max-w-[680px] mx-auto flex flex-col items-center text-center gap-6">
          <TechScoreRing score={techScore} size={120} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              {greeting()}
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold font-display text-white tracking-tight uppercase leading-none">
              {firstNameFromUser(user)}.
            </h1>
            <p className="mt-3 text-base text-white/70 max-w-sm mx-auto">
              {heroSubcopy(techScore, credentials.length > 0)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Content: minimal, just what matters ── */}
      <section className="px-5 md:px-10 py-10 md:py-14">
        <div className="max-w-[680px] mx-auto space-y-8">

          {/* Current course */}
          {enrollmentsQuery.isPending ? (
            <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="mt-3 h-6 w-64 bg-muted rounded" />
            </div>
          ) : currentCourse ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                {currentCourse.tagName} · {currentCourse.tier}
              </p>
              <h3 className="mt-1 text-xl font-bold font-display uppercase text-foreground">
                {currentCourse.courseTitle}
              </h3>
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${currentCourse.progressPct}%` }}
                />
              </div>
              <Link
                to={`/training/${currentCourse.courseSlug}`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          ) : null}

          {/* Recent credentials */}
          {credentials.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
                Latest credentials
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {credentials.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    to={`/verify/${c.verificationId}`}
                    className="rounded-xl border border-border bg-card p-4 hover:border-primary transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-foreground text-background">
                      {c.tier}
                    </span>
                    <h4 className="mt-2 text-sm font-bold font-display uppercase text-foreground line-clamp-2">
                      {c.courseName}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <QuickLink to="/academy" label="Academy" />
            <QuickLink to="/passport/me" label="My Passport" />
            <QuickLink to="/credentials" label="Credentials" />
          </div>
        </div>
      </section>
    </AppShell>
  );
};

const QuickLink = ({ to, label }: { to: string; label: string }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary transition-colors"
  >
    {label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
  </Link>
);

export default Home;
