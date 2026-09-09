import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import {
  BookOpen,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileText,
  MapPin,
  PenLine,
  Printer,
  ShoppingBag,
  UserPlus,
  Users,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type {
  BaseRole,
  Course,
  CourseAccessPack,
  CourseAssignment,
  Endorsement,
  Operator,
  OperatorLocation,
  OperatorOverview,
  OperatorRosterMember,
  TrainingRequirement,
} from '@/lib/types';

const TABS = [
  { key: 'overview', label: 'Overview', Icon: ClipboardCheck },
  { key: 'team', label: 'Team', Icon: Users },
  { key: 'training', label: 'Training', Icon: BookOpen },
  { key: 'endorsements', label: 'Endorsements', Icon: BadgeCheck },
  { key: 'locations', label: 'Locations', Icon: MapPin },
  { key: 'compliance', label: 'Compliance', Icon: FileText },
] as const;

type Tab = (typeof TABS)[number]['key'];

const BASE_ROLES: BaseRole[] = [
  'Kitchen',
  'Bar',
  'Floor',
  'Management',
  'Ownership',
  'Other',
];

const fieldClass =
  'mt-2 h-11 w-full rounded-xl border-2 border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const numberFormatter = new Intl.NumberFormat();

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : dateFormatter.format(date);
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

function workerName(member: OperatorRosterMember): string {
  const name = [member.worker.firstName, member.worker.lastName].filter(Boolean).join(' ');
  return name || member.worker.email || 'Unnamed worker';
}

const OperatorDashboard = () => {
  const { tab } = useParams<{ tab: string }>();
  const activeTab = (tab ?? 'overview') as Tab;
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState('');

  const operatorQuery = useQuery({
    queryKey: ['operator', 'me'],
    queryFn: () =>
      api<{
        operator: Operator;
        membership: { id: string; role: 'owner' | 'admin' | 'manager'; status: 'active' };
      }>('/api/operator/me', { auth: true }),
  });
  const overviewQuery = useQuery({
    queryKey: ['operator', 'overview'],
    queryFn: () =>
      api<{ overview: OperatorOverview }>('/api/operator/overview', { auth: true }),
  });
  const locationsQuery = useQuery({
    queryKey: ['operator', 'locations'],
    queryFn: () =>
      api<{ locations: OperatorLocation[] }>('/api/operator/locations', { auth: true }),
  });
  const rosterQuery = useQuery({
    queryKey: ['operator', 'roster'],
    queryFn: () =>
      api<{ roster: OperatorRosterMember[] }>('/api/operator/roster', { auth: true }),
  });
  const requirementsQuery = useQuery({
    queryKey: ['operator', 'requirements'],
    queryFn: () =>
      api<{ requirements: TrainingRequirement[] }>('/api/operator/requirements', {
        auth: true,
      }),
  });
  const assignmentsQuery = useQuery({
    queryKey: ['operator', 'assignments'],
    queryFn: () =>
      api<{ assignments: CourseAssignment[] }>('/api/operator/assignments', { auth: true }),
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => api<{ courses: Course[] }>('/api/courses', { auth: true }),
  });
  const packsQuery = useQuery({
    queryKey: ['operator', 'course-packs'],
    queryFn: () =>
      api<{ packs: CourseAccessPack[] }>('/api/operator/course-packs', { auth: true }),
  });
  const endorsementsQuery = useQuery({
    queryKey: ['operator', 'endorsements'],
    queryFn: () =>
      api<{ endorsements: Endorsement[] }>('/api/operator/endorsements', { auth: true }),
  });

  const refreshOperatorData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['operator'] });
  };

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; locationId?: string }) =>
      api('/api/operator/workplace/invite', { method: 'POST', auth: true, body }),
    onSuccess: async () => {
      setAnnouncement('Worker invitation sent.');
      await refreshOperatorData();
    },
  });
  const locationMutation = useMutation({
    mutationFn: (body: {
      name: string;
      code: string;
      address?: string;
      city: string;
      country: string;
      timezone: string;
    }) => api('/api/operator/locations', { method: 'POST', auth: true, body }),
    onSuccess: async () => {
      setAnnouncement('Location added.');
      await refreshOperatorData();
    },
  });
  const requirementMutation = useMutation({
    mutationFn: (body: {
      courseId: string;
      locationId?: string;
      baseRole?: BaseRole;
      required: boolean;
    }) => api('/api/operator/requirements', { method: 'POST', auth: true, body }),
    onSuccess: async () => {
      setAnnouncement('Training requirement saved.');
      await refreshOperatorData();
    },
  });
  const assignmentMutation = useMutation({
    mutationFn: (body: { workerId: string; courseId: string; locationId?: string }) =>
      api('/api/operator/assignments', { method: 'POST', auth: true, body }),
    onSuccess: async () => {
      setAnnouncement('Course assigned.');
      await refreshOperatorData();
    },
  });
  const checkoutMutation = useMutation({
    mutationFn: (body: { courseId: string; quantity: number }) =>
      api<{ checkoutUrl: string | null; pack: CourseAccessPack | null }>(
        '/api/operator/course-packs/checkout',
        { method: 'POST', auth: true, body },
      ),
    onSuccess: async ({ checkoutUrl }) => {
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      setAnnouncement('Course pack created. Seats are ready to assign.');
      await queryClient.invalidateQueries({ queryKey: ['operator', 'course-packs'] });
    },
  });
  const seatMutation = useMutation({
    mutationFn: ({ packId, workerId }: { packId: string; workerId: string }) =>
      api(`/api/operator/course-packs/${packId}/assign`, {
        method: 'POST',
        auth: true,
        body: { workerId },
      }),
    onSuccess: async () => {
      setAnnouncement('Course pack seat assigned.');
      await refreshOperatorData();
    },
  });
  const endorsementMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reviewNotes,
    }: {
      id: string;
      action: 'approve' | 'reject';
      reviewNotes: string;
    }) =>
      api(`/api/operator/endorsements/${id}/${action}`, {
        method: 'POST',
        auth: true,
        body: { ...(reviewNotes.trim() ? { reviewNotes: reviewNotes.trim() } : {}) },
      }),
    onSuccess: async (_data, variables) => {
      setAnnouncement(
        variables.action === 'approve'
          ? 'Endorsement approved.'
          : 'Endorsement rejected.',
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['operator', 'endorsements'] }),
        queryClient.invalidateQueries({ queryKey: ['operator', 'roster'] }),
      ]);
    },
  });

  if (!TABS.some((item) => item.key === activeTab)) {
    return <Navigate to="/operator/overview" replace />;
  }

  const operator = operatorQuery.data?.operator;
  const overview = overviewQuery.data?.overview;
  const locations = locationsQuery.data?.locations ?? [];
  const roster = rosterQuery.data?.roster ?? [];
  const requirements = requirementsQuery.data?.requirements ?? [];
  const assignments = assignmentsQuery.data?.assignments ?? [];
  const courses = coursesQuery.data?.courses ?? [];
  const packs = packsQuery.data?.packs ?? [];
  const endorsements = endorsementsQuery.data?.endorsements ?? [];
  const firstError = [
    operatorQuery.error,
    overviewQuery.error,
    locationsQuery.error,
    rosterQuery.error,
    requirementsQuery.error,
    assignmentsQuery.error,
    coursesQuery.error,
    packsQuery.error,
    endorsementsQuery.error,
  ].find(Boolean);

  return (
    <AppShell>
      <header className="border-b border-border bg-background print:border-0">
        <div className="mx-auto max-w-[1200px] px-5 py-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Operator workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold font-display text-foreground">
            {operator?.companyName ?? 'Your business'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {operator ? `${operator.businessType} · ${operator.hqLocation}` : 'Loading workspace…'}
          </p>
        </div>
      </header>

      <nav className="border-b border-border bg-background print:hidden" aria-label="Operator">
        <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-5">
          {TABS.map(({ key, label, Icon }) => (
            <NavLink
              key={key}
              to={`/operator/${key}`}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'border-primary text-secondary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        {firstError ? (
          <div role="alert" className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Some workspace data could not be loaded: {errorMessage(firstError)}
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <Overview overview={overview} operator={operator} isLoading={overviewQuery.isLoading} />
        ) : null}
        {activeTab === 'team' ? (
          <Team
            roster={roster}
            locations={locations}
            isLoading={rosterQuery.isLoading}
            onInvite={(body) => inviteMutation.mutateAsync(body)}
            isSaving={inviteMutation.isPending}
            error={inviteMutation.error}
          />
        ) : null}
        {activeTab === 'training' ? (
          <Training
            roster={roster}
            locations={locations}
            courses={courses}
            requirements={requirements}
            assignments={assignments}
            packs={packs}
            isLoading={
              requirementsQuery.isLoading || assignmentsQuery.isLoading || coursesQuery.isLoading ||
              packsQuery.isLoading
            }
            onAddRequirement={(body) => requirementMutation.mutateAsync(body)}
            onAssign={(body) => assignmentMutation.mutateAsync(body)}
            onCheckout={(body) => checkoutMutation.mutateAsync(body)}
            onAssignSeat={(body) => seatMutation.mutateAsync(body)}
            requirementSaving={requirementMutation.isPending}
            assignmentSaving={assignmentMutation.isPending}
            checkoutSaving={checkoutMutation.isPending}
            seatSaving={seatMutation.isPending}
            requirementError={requirementMutation.error}
            assignmentError={assignmentMutation.error}
            checkoutError={checkoutMutation.error}
            seatError={seatMutation.error}
          />
        ) : null}
        {activeTab === 'endorsements' ? (
          <EndorsementReviews
            endorsements={endorsements}
            isLoading={endorsementsQuery.isLoading}
            isSaving={endorsementMutation.isPending}
            error={endorsementMutation.error}
            onReview={(body) => endorsementMutation.mutateAsync(body)}
          />
        ) : null}
        {activeTab === 'locations' ? (
          <Locations
            locations={locations}
            isLoading={locationsQuery.isLoading}
            onAdd={(body) => locationMutation.mutateAsync(body)}
            isSaving={locationMutation.isPending}
            error={locationMutation.error}
          />
        ) : null}
        {activeTab === 'compliance' ? (
          <Compliance
            operator={operator}
            roster={roster}
            requirements={requirements}
            assignments={assignments}
          />
        ) : null}
      </div>
    </AppShell>
  );
};

function Overview({
  overview,
  operator,
  isLoading,
}: {
  overview?: OperatorOverview;
  operator?: Operator;
  isLoading: boolean;
}) {
  const metrics = [
    { label: 'Active staff', value: overview?.staff.active },
    { label: 'Pending invites', value: overview?.staff.pending },
    { label: 'Locations', value: overview?.locations },
    { label: 'Completed training', value: overview?.assignments.completed },
    { label: 'In progress', value: overview?.assignments.inProgress },
    { label: 'Assigned', value: overview?.assignments.assigned },
  ];

  return (
    <section aria-labelledby="overview-title">
      <h2 id="overview-title" className="text-2xl font-bold font-display">
        Overview
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Current workforce and training activity for {operator?.companyName ?? 'your organization'}.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl bg-card p-6">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-2 text-4xl font-bold font-display tabular-nums">
              {isLoading || metric.value === undefined
                ? '—'
                : numberFormatter.format(metric.value)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Team({
  roster,
  locations,
  isLoading,
  onInvite,
  isSaving,
  error,
}: {
  roster: OperatorRosterMember[];
  locations: OperatorLocation[];
  isLoading: boolean;
  onInvite: (body: { email: string; locationId?: string }) => Promise<unknown>;
  isSaving: boolean;
  error: unknown;
}) {
  const [email, setEmail] = useState('');
  const [locationId, setLocationId] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onInvite({ email: email.trim(), ...(locationId ? { locationId } : {}) });
      setEmail('');
      setLocationId('');
    } catch {
      // Mutation state renders the API error without clearing the form.
    }
  };

  return (
    <section aria-labelledby="team-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <h2 id="team-title" className="text-2xl font-bold font-display">
            Team
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Active linked workers and the credentials they have earned.
          </p>
          <div className="mt-6 space-y-4">
            {isLoading ? <EmptyMessage>Loading team…</EmptyMessage> : null}
            {!isLoading && roster.length === 0 ? (
              <EmptyMessage>No active workers are linked yet.</EmptyMessage>
            ) : null}
            {roster.map((member) => (
              <article key={member.link.id} className="rounded-3xl bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{workerName(member)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.worker.profile?.techRole ??
                        member.worker.profile?.baseRole ??
                        'Role not provided'}
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    {numberFormatter.format(member.worker.credentials.length)} credentials
                  </span>
                </div>
                {member.worker.credentials.length > 0 ? (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {member.worker.credentials.map((credential) => (
                      <li
                        key={`${credential.courseSlug}-${credential.earnedDate}`}
                        className="rounded-2xl border border-border p-3 text-sm"
                      >
                        <p className="font-semibold">{credential.courseName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {credential.tier} · {credential.tagName} · earned{' '}
                          {formatDate(credential.earnedDate)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No credentials yet.</p>
                )}
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="h-fit rounded-3xl bg-card p-6">
          <UserPlus className="h-6 w-6 text-secondary" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-bold">Invite a worker</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The worker must already have a QUIPP account.
          </p>
          <label className="mt-5 block text-sm font-semibold">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Location (optional)
            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Organization-wide</option>
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <FormError error={error} /> : null}
          <Button type="submit" disabled={isSaving} className="mt-5 w-full rounded-full">
            {isSaving ? 'Sending…' : 'Send invitation'}
          </Button>
        </form>
      </div>
    </section>
  );
}

function Training({
  roster,
  locations,
  courses,
  packs,
  requirements,
  assignments,
  isLoading,
  onAddRequirement,
  onAssign,
  onCheckout,
  onAssignSeat,
  requirementSaving,
  assignmentSaving,
  checkoutSaving,
  seatSaving,
  requirementError,
  assignmentError,
  checkoutError,
  seatError,
}: {
  roster: OperatorRosterMember[];
  locations: OperatorLocation[];
  courses: Course[];
  packs: CourseAccessPack[];
  requirements: TrainingRequirement[];
  assignments: CourseAssignment[];
  isLoading: boolean;
  onAddRequirement: (body: {
    courseId: string;
    locationId?: string;
    baseRole?: BaseRole;
    required: boolean;
  }) => Promise<unknown>;
  onAssign: (body: {
    workerId: string;
    courseId: string;
    locationId?: string;
  }) => Promise<unknown>;
  onCheckout: (body: { courseId: string; quantity: number }) => Promise<unknown>;
  onAssignSeat: (body: { packId: string; workerId: string }) => Promise<unknown>;
  requirementSaving: boolean;
  assignmentSaving: boolean;
  checkoutSaving: boolean;
  seatSaving: boolean;
  requirementError: unknown;
  assignmentError: unknown;
  checkoutError: unknown;
  seatError: unknown;
}) {
  const [requirementCourse, setRequirementCourse] = useState('');
  const [requirementLocation, setRequirementLocation] = useState('');
  const [requirementRole, setRequirementRole] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [assignmentCourse, setAssignmentCourse] = useState('');
  const [purchaseCourse, setPurchaseCourse] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addRequirement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onAddRequirement({
        courseId: requirementCourse,
        required: true,
        ...(requirementLocation ? { locationId: requirementLocation } : {}),
        ...(requirementRole ? { baseRole: requirementRole as BaseRole } : {}),
      });
      setRequirementCourse('');
      setRequirementLocation('');
      setRequirementRole('');
    } catch {
      // Mutation state renders the API error without clearing the form.
    }
  };

  const assignCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const member = roster.find((item) => item.link.workerId === workerId);
    try {
      await onAssign({
        workerId,
        courseId: assignmentCourse,
        ...(member?.link.locationId ? { locationId: member.link.locationId } : {}),
      });
      setWorkerId('');
      setAssignmentCourse('');
    } catch {
      // Mutation state renders the API error without clearing the form.
    }
  };

  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onCheckout({ courseId: purchaseCourse, quantity });
      setPurchaseCourse('');
      setQuantity(1);
    } catch {
      // Mutation state keeps the form visible with the API error.
    }
  };

  const freeCourses = courses.filter((course) => course.priceCents === 0);

  return (
    <section aria-labelledby="training-title">
      <h2 id="training-title" className="text-2xl font-bold font-display">
        Training
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Set organization requirements and assign published courses to active workers.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/operator/courses">
            <PenLine className="mr-2 h-4 w-4" aria-hidden="true" />
            Manage your courses
          </Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <a href="#course-packs">
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
            Course packs
          </a>
        </Button>
      </div>

      <section id="course-packs" className="mt-6 rounded-3xl border border-border bg-card p-6" aria-labelledby="course-packs-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h3 id="course-packs-title" className="text-xl font-bold">Course packs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Purchase seats for paid courses, then assign available seats to active workers.
            </p>
            <div className="mt-5 space-y-3">
              {isLoading ? <EmptyMessage>Loading course packs…</EmptyMessage> : null}
              {!isLoading && packs.length === 0 ? <EmptyMessage>No course packs yet.</EmptyMessage> : null}
              {packs.map((pack) => (
                <PackCard
                  key={pack._id}
                  pack={pack}
                  roster={roster}
                  busy={seatSaving}
                  onAssign={onAssignSeat}
                />
              ))}
              {seatError ? <FormError error={seatError} /> : null}
            </div>
          </div>
          <form onSubmit={checkout} className="h-fit rounded-2xl border border-border bg-background p-5">
            <h4 className="font-bold">Get course seats</h4>
            <label className="mt-4 block text-sm font-semibold">
              Published course
              <CourseSelect value={purchaseCourse} onChange={setPurchaseCourse} courses={courses} required showPrice />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Number of seats
              <input
                type="number"
                min={1}
                max={500}
                required
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(500, Number(event.target.value) || 1)))}
                className={fieldClass}
              />
            </label>
            {checkoutError ? <FormError error={checkoutError} /> : null}
            <Button type="submit" disabled={checkoutSaving || courses.length === 0} className="mt-5 w-full rounded-full">
              {checkoutSaving ? 'Preparing checkout…' : 'Continue to checkout'}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Free courses create the pack immediately. Paid courses continue to secure checkout.
            </p>
          </form>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={addRequirement} className="rounded-3xl bg-card p-6">
          <h3 className="text-lg font-bold">Add requirement</h3>
          <label className="mt-4 block text-sm font-semibold">
            Published course
            <CourseSelect
              value={requirementCourse}
              onChange={setRequirementCourse}
              courses={courses}
              required
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Location (optional)
              <select
                value={requirementLocation}
                onChange={(event) => setRequirementLocation(event.target.value)}
                className={fieldClass}
              >
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Role (optional)
              <select
                value={requirementRole}
                onChange={(event) => setRequirementRole(event.target.value)}
                className={fieldClass}
              >
                <option value="">All roles</option>
                {BASE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {requirementError ? <FormError error={requirementError} /> : null}
          <Button type="submit" disabled={requirementSaving || courses.length === 0} className="mt-5 rounded-full">
            {requirementSaving ? 'Saving…' : 'Save requirement'}
          </Button>
        </form>

        <form onSubmit={assignCourse} className="rounded-3xl bg-card p-6">
          <h3 className="text-lg font-bold">Assign a free course</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paid courses must be assigned from an available course pack above.
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Active worker
            <select
              required
              value={workerId}
              onChange={(event) => setWorkerId(event.target.value)}
              className={fieldClass}
            >
              <option value="">Choose a worker</option>
              {roster.map((member) => (
                <option key={member.link.workerId} value={member.link.workerId}>
                  {workerName(member)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Published course
            <CourseSelect
              value={assignmentCourse}
              onChange={setAssignmentCourse}
              courses={freeCourses}
              required
            />
          </label>
          {assignmentError ? <FormError error={assignmentError} /> : null}
          <Button
            type="submit"
            disabled={assignmentSaving || roster.length === 0 || freeCourses.length === 0}
            className="mt-5 rounded-full"
          >
            {assignmentSaving ? 'Assigning…' : 'Assign course'}
          </Button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">Requirements</h3>
          <div className="mt-4 space-y-3">
            {isLoading ? <EmptyMessage>Loading training…</EmptyMessage> : null}
            {!isLoading && requirements.length === 0 ? (
              <EmptyMessage>No training requirements yet.</EmptyMessage>
            ) : null}
            {requirements.map((requirement) => (
              <article key={requirement._id} className="rounded-2xl border border-border p-4">
                <p className="font-semibold">{requirement.courseId.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {requirement.baseRole ?? 'All roles'} ·{' '}
                  {locations.find((location) => location._id === requirement.locationId)?.name ??
                    'All locations'}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold">Assignments</h3>
          <div className="mt-4 space-y-3">
            {!isLoading && assignments.length === 0 ? (
              <EmptyMessage>No courses assigned yet.</EmptyMessage>
            ) : null}
            {assignments.map((assignment) => (
              <article key={assignment._id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{assignment.courseId.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[assignment.workerId.firstName, assignment.workerId.lastName]
                        .filter(Boolean)
                        .join(' ') || assignment.workerId.email}
                    </p>
                  </div>
                  <StatusPill status={assignment.status} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Assigned {formatDate(assignment.assignedAt)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EndorsementReviews({
  endorsements,
  isLoading,
  isSaving,
  error,
  onReview,
}: {
  endorsements: Endorsement[];
  isLoading: boolean;
  isSaving: boolean;
  error: unknown;
  onReview: (body: {
    id: string;
    action: 'approve' | 'reject';
    reviewNotes: string;
  }) => Promise<unknown>;
}) {
  const pending = endorsements.filter((endorsement) => endorsement.status === 'pending');
  const reviewed = endorsements.filter((endorsement) => endorsement.status !== 'pending');

  return (
    <section aria-labelledby="endorsement-reviews-title">
      <h2 id="endorsement-reviews-title" className="text-2xl font-bold font-display">
        Employer endorsements
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Confirm real-world THERE capability only when you can verify the worker’s statement.
      </p>
      {error ? <FormError error={error} /> : null}

      <div className="mt-6 space-y-4">
        {isLoading ? <EmptyMessage>Loading endorsement requests…</EmptyMessage> : null}
        {!isLoading && pending.length === 0 ? (
          <EmptyMessage>No pending endorsement requests.</EmptyMessage>
        ) : null}
        {pending.map((endorsement) => (
          <EndorsementReviewCard
            key={endorsement.id}
            endorsement={endorsement}
            isSaving={isSaving}
            onReview={onReview}
          />
        ))}
      </div>

      {reviewed.length > 0 ? (
        <div className="mt-10">
          <h3 className="text-lg font-bold">Review history</h3>
          <div className="mt-4 space-y-3">
            {reviewed.map((endorsement) => (
              <article key={endorsement.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {endorsement.thereCourse?.title ?? 'THERE course'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {endorsementWorkerName(endorsement)} · reviewed{' '}
                      {formatDate(endorsement.reviewedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold capitalize text-secondary">
                    {endorsement.status}
                  </span>
                </div>
                {endorsement.reviewNotes ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {endorsement.reviewNotes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EndorsementReviewCard({
  endorsement,
  isSaving,
  onReview,
}: {
  endorsement: Endorsement;
  isSaving: boolean;
  onReview: (body: {
    id: string;
    action: 'approve' | 'reject';
    reviewNotes: string;
  }) => Promise<unknown>;
}) {
  const [reviewNotes, setReviewNotes] = useState('');

  const review = async (action: 'approve' | 'reject') => {
    try {
      await onReview({ id: endorsement.id, action, reviewNotes });
    } catch {
      // Parent mutation renders the API error and leaves notes intact.
    }
  };

  return (
    <article className="rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {endorsement.thereCourse?.title ?? 'THERE course'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {endorsementWorkerName(endorsement)} · requested{' '}
            {formatDate(endorsement.requestedAt)}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
          Awaiting review
        </span>
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-background p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Worker statement
        </p>
        <p className="mt-2 text-sm leading-relaxed">{endorsement.statement}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Supported by {endorsement.deepCredential?.courseName ?? 'an active DEEP credential'}
        </p>
      </div>
      <label className="mt-5 block text-sm font-semibold">
        Review notes
        <textarea
          rows={3}
          maxLength={1000}
          value={reviewNotes}
          onChange={(event) => setReviewNotes(event.target.value)}
          placeholder="Required for rejection; optional for approval."
          className={`${fieldClass} h-auto min-h-24 py-3`}
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={isSaving}
          className="rounded-full"
          onClick={() => review('approve')}
        >
          {isSaving ? 'Saving…' : 'Approve endorsement'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving || !reviewNotes.trim()}
          className="rounded-full"
          onClick={() => review('reject')}
        >
          Reject with notes
        </Button>
      </div>
    </article>
  );
}

function endorsementWorkerName(endorsement: Endorsement): string {
  const name = [endorsement.worker?.firstName, endorsement.worker?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || endorsement.worker?.email || 'Worker';
}

function Locations({
  locations,
  isLoading,
  onAdd,
  isSaving,
  error,
}: {
  locations: OperatorLocation[];
  isLoading: boolean;
  onAdd: (body: {
    name: string;
    code: string;
    address?: string;
    city: string;
    country: string;
    timezone: string;
  }) => Promise<unknown>;
  isSaving: boolean;
  error: unknown;
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onAdd({
        name: form.name.trim(),
        code: form.code.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        timezone: form.timezone.trim(),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
      });
      setForm((current) => ({ ...current, name: '', code: '', address: '', city: '' }));
    } catch {
      // Mutation state renders the API error without clearing the form.
    }
  };

  return (
    <section aria-labelledby="locations-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <h2 id="locations-title" className="text-2xl font-bold font-display">
            Locations
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sites used to organize workers, requirements, and assignments.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {isLoading ? <EmptyMessage>Loading locations…</EmptyMessage> : null}
            {locations.map((location) => (
              <article key={location._id} className="rounded-3xl bg-card p-5">
                <Building2 className="h-5 w-5 text-secondary" aria-hidden="true" />
                <h3 className="mt-4 font-bold">{location.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {location.city}, {location.country}
                </p>
                {location.address ? (
                  <p className="mt-1 text-sm text-muted-foreground">{location.address}</p>
                ) : null}
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {location.code} · {location.timezone}
                </p>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="h-fit rounded-3xl bg-card p-6">
          <h3 className="text-lg font-bold">Add location</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <TextField label="Name" value={form.name} onChange={(value) => update('name', value)} required />
            <TextField label="Code" value={form.code} onChange={(value) => update('code', value)} required pattern="[A-Za-z0-9_-]+" />
            <TextField label="Address (optional)" value={form.address} onChange={(value) => update('address', value)} autoComplete="street-address" />
            <TextField label="City" value={form.city} onChange={(value) => update('city', value)} required autoComplete="address-level2" />
            <TextField label="Country" value={form.country} onChange={(value) => update('country', value)} required autoComplete="country-name" />
            <TextField label="Timezone" value={form.timezone} onChange={(value) => update('timezone', value)} required />
          </div>
          {error ? <FormError error={error} /> : null}
          <Button type="submit" disabled={isSaving} className="mt-5 w-full rounded-full">
            {isSaving ? 'Adding…' : 'Add location'}
          </Button>
        </form>
      </div>
    </section>
  );
}

function Compliance({
  operator,
  roster,
  requirements,
  assignments,
}: {
  operator?: Operator;
  roster: OperatorRosterMember[];
  requirements: TrainingRequirement[];
  assignments: CourseAssignment[];
}) {
  return (
    <section aria-labelledby="compliance-title">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h2 id="compliance-title" className="text-2xl font-bold font-display">
            Compliance report
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Print or save this live workforce training report as a PDF.
          </p>
        </div>
        <Button type="button" onClick={() => window.print()} className="rounded-full">
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Print report
        </Button>
      </div>

      <article className="mt-6 rounded-3xl bg-card p-6 print:mt-0 print:rounded-none print:bg-white print:p-0 print:text-black">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary print:text-black">
          QUIPP training record
        </p>
        <h3 className="mt-2 text-2xl font-bold">{operator?.companyName ?? 'Organization'}</h3>
        <p className="mt-1 text-sm text-muted-foreground print:text-black">
          Generated {dateFormatter.format(new Date())} · {numberFormatter.format(roster.length)} active
          workers · {numberFormatter.format(requirements.length)} requirements
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border print:border-black">
                <th scope="col" className="py-3 pr-4 font-bold">Worker</th>
                <th scope="col" className="py-3 pr-4 font-bold">Credentials</th>
                <th scope="col" className="py-3 pr-4 font-bold">Assignments</th>
                <th scope="col" className="py-3 font-bold">Completed</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((member) => {
                const workerAssignments = assignments.filter(
                  (assignment) => assignment.workerId._id === member.link.workerId,
                );
                return (
                  <tr key={member.link.id} className="border-b border-border print:border-black">
                    <th scope="row" className="py-3 pr-4 font-semibold">{workerName(member)}</th>
                    <td className="py-3 pr-4">{member.worker.credentials.length}</td>
                    <td className="py-3 pr-4">{workerAssignments.length}</td>
                    <td className="py-3">
                      {workerAssignments.filter((item) => item.status === 'completed').length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {roster.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground print:text-black">
              No active workers are linked.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function PackCard({
  pack,
  roster,
  busy,
  onAssign,
}: {
  pack: CourseAccessPack;
  roster: OperatorRosterMember[];
  busy: boolean;
  onAssign: (body: { packId: string; workerId: string }) => Promise<unknown>;
}) {
  const [workerId, setWorkerId] = useState('');
  const available = Math.max(0, pack.quantity - pack.assignedCount);
  const active = pack.status === 'active' && available > 0;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onAssign({ packId: pack._id, workerId });
      setWorkerId('');
    } catch {
      // Parent mutation renders the API error.
    }
  };
  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-bold">{pack.courseId.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Purchased {formatDate(pack.createdAt)} · payment {pack.paymentId.status}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}`}>
          {available} of {pack.quantity} seats available
        </span>
      </div>
      {active ? (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`pack-worker-${pack._id}`}>Active worker</label>
          <select
            id={`pack-worker-${pack._id}`}
            required
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            className={`${fieldClass} mt-0 flex-1`}
          >
            <option value="">Choose an active worker</option>
            {roster.map((member) => (
              <option key={member.link.workerId} value={member.link.workerId}>
                {workerName(member)}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={busy || roster.length === 0} className="rounded-full">
            {busy ? 'Assigning…' : 'Assign seat'}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground capitalize">Pack is {pack.status}.</p>
      )}
    </article>
  );
}

function CourseSelect({
  value,
  onChange,
  courses,
  required,
  showPrice = false,
}: {
  value: string;
  onChange: (value: string) => void;
  courses: Course[];
  required?: boolean;
  showPrice?: boolean;
}) {
  return (
    <select
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClass}
    >
      <option value="">Choose a course</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.title} ({course.tier})
          {showPrice ? ` · ${course.priceCents === 0 ? 'Free' : `$${(course.priceCents / 100).toFixed(2)}/seat`}` : ''}
        </option>
      ))}
    </select>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  pattern,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  pattern?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        value={value}
        required={required}
        pattern={pattern}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  );
}

function StatusPill({ status }: { status: CourseAssignment['status'] }) {
  const label =
    status === 'in_progress' ? 'In progress' : status === 'completed' ? 'Completed' : 'Assigned';
  return (
    <span className="whitespace-nowrap rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
      {label}
    </span>
  );
}

function FormError({ error }: { error: unknown }) {
  return (
    <p role="alert" className="mt-4 text-sm text-destructive">
      {errorMessage(error)}
    </p>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default OperatorDashboard;
