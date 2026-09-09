import { type FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, Link2, Lock, MessageCircle, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import type { BaseRole, Profile, VisibilityStatus } from '@/lib/types';

const BASE_ROLES: BaseRole[] = [
  'Kitchen',
  'Bar',
  'Floor',
  'Management',
  'Ownership',
  'Other',
];

const VISIBILITY_OPTIONS: Array<{
  value: VisibilityStatus;
  label: string;
  description: string;
  Icon: typeof Eye;
}> = [
  {
    value: 'open',
    label: 'Open',
    description: 'Your public Passport can be viewed and shared.',
    Icon: Eye,
  },
  {
    value: 'employed',
    label: 'Employed',
    description: 'Show that you are employed while keeping your Passport available.',
    Icon: Users,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Hide your public Passport from visitors.',
    Icon: Lock,
  },
];

const fieldClass =
  'mt-2 h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

interface GreenApiStatus {
  configured: boolean;
  enabled: boolean;
  worker: {
    running: boolean;
    processing: boolean;
  };
}

interface WhatsAppLinkCode {
  code: string;
  expiresAt: string;
}

const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const [baseRole, setBaseRole] = useState<BaseRole | ''>('');
  const [specialty, setSpecialty] = useState('');
  const [yearsExperience, setYearsExperience] = useState('0');
  const [location, setLocation] = useState('');
  const [visibilityStatus, setVisibilityStatus] = useState<VisibilityStatus>('open');
  const [announcement, setAnnouncement] = useState('');

  const greenApiStatus = useQuery({
    queryKey: ['quippy', 'channels', 'greenapi', 'status'],
    queryFn: () =>
      api<GreenApiStatus>('/api/quippy/channels/greenapi/status', { auth: true }),
  });

  const createLinkCode = useMutation({
    mutationFn: () =>
      api<WhatsAppLinkCode>('/api/quippy/channels/greenapi/link-code', {
        method: 'POST',
        auth: true,
      }),
  });

  useEffect(() => {
    if (!profile) return;
    setBaseRole(profile.baseRole ?? '');
    setSpecialty(profile.specialty ?? '');
    setYearsExperience(String(profile.yearsExperience));
    setLocation(profile.location ?? '');
    setVisibilityStatus(profile.visibilityStatus);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const response = await api<{ profile: Profile }>('/api/profile/me', {
        method: 'PATCH',
        auth: true,
        body: {
          baseRole: baseRole || null,
          specialty: specialty.trim() || null,
          yearsExperience: Number(yearsExperience),
          location: location.trim() || null,
          visibilityStatus,
        },
      });
      await refreshProfile();
      return response.profile;
    },
    onSuccess: () => setAnnouncement('Profile settings saved.'),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAnnouncement('');
    save.mutate();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p>
        <h1 className="mt-2 text-3xl font-bold font-display">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep your professional details current and choose how your Passport appears.
        </p>

        <p role="status" aria-live="polite" className="mt-4 text-sm font-medium text-success">
          {announcement}
        </p>
        {save.error ? (
          <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            {save.error instanceof ApiError
              ? save.error.message
              : 'Your settings could not be saved.'}
          </p>
        ) : null}

        <section
          className="mt-6 rounded-3xl border-2 border-border bg-card p-6"
          aria-labelledby="whatsapp-heading"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-success/10 p-3 text-success">
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="whatsapp-heading" className="text-lg font-bold">
                  QUIPPY on WhatsApp
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    greenApiStatus.data?.configured && greenApiStatus.data.enabled
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {greenApiStatus.isPending
                    ? 'Checking…'
                    : greenApiStatus.data?.configured && greenApiStatus.data.enabled
                      ? greenApiStatus.data.worker.running
                        ? 'Available'
                        : 'Temporarily offline'
                      : greenApiStatus.data?.configured
                        ? 'Configured, disabled'
                        : 'Not configured'}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Link your account so QUIPPY can recognize you when you message the QUIPPY
                WhatsApp number. No WhatsApp credentials are shown or stored in your browser.
              </p>

              {greenApiStatus.error ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  WhatsApp status is unavailable right now.
                </p>
              ) : null}

              {createLinkCode.data ? (
                <div className="mt-5 rounded-2xl bg-primary/10 p-4">
                  <p className="text-sm font-semibold">Send this exact code to QUIPPY:</p>
                  <code className="mt-2 block select-all text-xl font-bold tracking-wider text-primary">
                    {createLinkCode.data.code}
                  </code>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This one-time code expires at{' '}
                    {new Date(createLinkCode.data.expiresAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    .
                  </p>
                </div>
              ) : null}

              {createLinkCode.error ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {createLinkCode.error instanceof ApiError
                    ? createLinkCode.error.message
                    : 'A link code could not be created.'}
                </p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-full"
                disabled={
                  createLinkCode.isPending ||
                  !greenApiStatus.data?.configured ||
                  !greenApiStatus.data.enabled
                }
                onClick={() => createLinkCode.mutate()}
              >
                <Link2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {createLinkCode.isPending ? 'Creating code…' : 'Create link code'}
              </Button>
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="mt-6 space-y-8">
          <section className="rounded-3xl bg-card p-6" aria-labelledby="professional-heading">
            <h2 id="professional-heading" className="text-lg font-bold">
              Professional profile
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Base role
                <select
                  value={baseRole}
                  onChange={(event) => setBaseRole(event.target.value as BaseRole | '')}
                  className={fieldClass}
                >
                  <option value="">Not specified</option>
                  {BASE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Specialty
                <input
                  value={specialty}
                  maxLength={120}
                  onChange={(event) => setSpecialty(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-semibold">
                Years of experience
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                  required
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-semibold">
                Location
                <input
                  value={location}
                  maxLength={120}
                  autoComplete="address-level2"
                  onChange={(event) => setLocation(event.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          <fieldset className="rounded-3xl bg-card p-6">
            <legend className="px-1 text-lg font-bold">Passport visibility</legend>
            <div className="mt-3 grid gap-3">
              {VISIBILITY_OPTIONS.map(({ value, label, description, Icon }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors ${
                    visibilityStatus === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibilityStatus"
                    value={value}
                    checked={visibilityStatus === value}
                    onChange={() => setVisibilityStatus(value)}
                    className="mt-1 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block font-bold">{label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" disabled={!profile || save.isPending} className="h-12 rounded-full px-8">
            {save.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </div>
    </AppShell>
  );
};

export default Settings;
