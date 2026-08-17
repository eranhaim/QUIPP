import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, IdCard, ShieldCheck, type LucideIcon } from 'lucide-react';
import AppShell from '@/components/AppShell';
import TechScoreRing from '@/components/TechScoreRing';
import { useAuth } from '@/hooks/useAuth';
import { getTechScoreLabel } from '@/data/mockData';

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function firstNameFromUser(user: { firstName: string | null; email: string }): string {
  return (user.firstName ?? user.email.split('@')[0]).toUpperCase();
}

const Home = () => {
  const { user } = useAuth();
  if (!user) return null;

  // TODO(M3): replace with real profile.techProficiencyScore and course enrollment
  const techScore = 0;
  const scoreLabel = getTechScoreLabel(techScore);
  const hasCurrentCourse = false;

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
              Your passport is quiet today. One credential is all it takes to change that.
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
          {hasCurrentCourse ? (
            <div className="rounded-2xl border border-border p-6" />
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
              title="Verify a badge"
              body="Check any QUIPP credential by ID."
            />
          </div>

          <div className="h-10" />

          <SectionHeader eyebrow="Latest" title="Recent credentials" />
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You have no credentials yet. Pass an assessment and it lands here — permanently.
            </p>
          </div>
        </div>
      </section>

      <p className="sr-only">Tech score label: {scoreLabel}</p>
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
