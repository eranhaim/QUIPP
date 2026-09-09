import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Building2, Check, ChefHat, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Quippy from '@/components/Quippy';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { BaseRole, Profile, TechDeclaration } from '@/lib/types';

type Audience = 'worker' | 'operator';

const ROLES: Array<{ label: string; value: BaseRole; icon: string }> = [
  { label: 'Kitchen', value: 'Kitchen', icon: '🔥' },
  { label: 'Bar', value: 'Bar', icon: '🍸' },
  { label: 'Floor', value: 'Floor', icon: '🍽️' },
  { label: 'Management', value: 'Management', icon: '📋' },
  { label: 'Ownership', value: 'Ownership', icon: '🔑' },
  { label: 'Other', value: 'Other', icon: '➕' },
];

const EQUIPMENT = [
  'Combi Oven',
  'Espresso Machine',
  'Commercial Griddle',
  'Fryer',
  'POS System',
  'Commercial Dishwasher',
  'Blast Chiller',
  'Sous Vide',
  'Commercial Refrigeration',
  'Soft Serve Machine',
];

const BUSINESS_TYPES = ['Restaurant', 'Hotel', 'Café', 'Bar', 'Catering', 'Other'];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [role, setRole] = useState<BaseRole | ''>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [staffSize, setStaffSize] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Canada');
  const [saving, setSaving] = useState(false);
  const { user, loading, refresh, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!loading && !user) navigate('/signup');
  }, [user, loading, navigate]);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;
  const name = user?.firstName?.trim() || 'there';

  const prompt = useMemo(() => {
    if (step === 0) return `Good to meet you, ${name}. First, tell me what brought you here.`;
    if (step === 1 && audience === 'worker') return 'Where do you spend most of your shift?';
    if (step === 1) return 'Tell me about the business you run.';
    if (step === 2 && audience === 'worker') return 'Which equipment do you work with today?';
    if (step === 2) return 'Where is your first location?';
    if (step === 3) return audience === 'worker'
      ? 'That gives me enough to build your first Passport.'
      : 'That gives me enough to set up your team workspace.';
    return 'Ready when you are.';
  }, [audience, name, step]);

  useEffect(() => {
    if (!user || !audience) return;
    const timer = window.setTimeout(() => {
      api('/api/quippy/profile', {
        method: 'PATCH',
        auth: true,
        body: {
          audience,
          onboardingStage: `web-step-${step}`,
          facts:
            audience === 'operator'
              ? { companyName, businessType, staffSize: Number(staffSize) || 0, city, country }
              : { baseRole: role || 'unknown', equipment },
        },
      }).catch(() => undefined);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [audience, businessType, city, companyName, country, equipment, role, staffSize, step, user]);

  const toggleEquipment = (item: string) => {
    setEquipment((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  const finish = async () => {
    if (!audience) return;
    setSaving(true);
    try {
      if (audience === 'operator') {
        await api('/api/operator/setup', {
          method: 'POST',
          auth: true,
          body: {
            companyName,
            businessType,
            staffSize: Number(staffSize),
            hqLocation: `${city}, ${country}`,
            locationName: 'Main location',
            city,
            country,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        });
        await api('/api/quippy/profile', {
          method: 'PATCH',
          auth: true,
          body: { audience, onboardingStage: 'complete', completed: true },
        });
        await refresh();
        navigate('/operator', { replace: true });
        return;
      }

      if (role) {
        await api<{ profile: Profile }>('/api/profile/me', {
          method: 'PATCH',
          auth: true,
          body: { baseRole: role },
        });
      }
      if (equipment.length > 0) {
        await api<{ declarations: TechDeclaration[] }>('/api/tech-declarations/bulk', {
          method: 'POST',
          auth: true,
          body: { equipmentNames: equipment },
        });
      }
      await api('/api/quippy/profile', {
        method: 'PATCH',
        auth: true,
        body: { audience, onboardingStage: 'complete', completed: true },
      });
      await refreshProfile();
      navigate('/home', { replace: true });
    } catch (error) {
      toast({
        title: 'Onboarding was not saved',
        description: error instanceof ApiError ? error.message : 'Check your details and try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const canAdvance =
    (step === 0 && audience !== null) ||
    (step === 1 && audience === 'worker' && role !== '') ||
    (step === 1 &&
      audience === 'operator' &&
      companyName.trim() !== '' &&
      businessType !== '' &&
      Number(staffSize) > 0) ||
    (step === 2 && audience === 'worker') ||
    (step === 2 && audience === 'operator' && city.trim() !== '' && country.trim() !== '') ||
    step >= 3;

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted" aria-hidden="true">
        <div
          className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-w-0 flex-col px-5 pb-8 pt-16 md:px-12 lg:px-16">
          <div className="mb-10 flex items-center justify-between">
            <span className="font-display text-xl font-bold lowercase text-primary">quipp</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.min(step + 1, totalSteps)} / {totalSteps}
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
            <Quippy size="sm" message={prompt} className="mb-7" />

            <AnimatePresence mode="wait">
              <motion.div
                key={`${audience ?? 'new'}-${step}`}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                className="min-h-[340px]"
              >
                {step === 0 ? (
                  <AudienceStep value={audience} onChange={setAudience} />
                ) : null}
                {step === 1 && audience === 'worker' ? (
                  <RoleStep value={role} onChange={setRole} />
                ) : null}
                {step === 1 && audience === 'operator' ? (
                  <BusinessStep
                    companyName={companyName}
                    businessType={businessType}
                    staffSize={staffSize}
                    onCompanyName={setCompanyName}
                    onBusinessType={setBusinessType}
                    onStaffSize={setStaffSize}
                  />
                ) : null}
                {step === 2 && audience === 'worker' ? (
                  <EquipmentStep selected={equipment} onToggle={toggleEquipment} />
                ) : null}
                {step === 2 && audience === 'operator' ? (
                  <LocationStep city={city} country={country} onCity={setCity} onCountry={setCountry} />
                ) : null}
                {step >= 3 ? (
                  <ReviewStep
                    audience={audience}
                    role={role}
                    equipment={equipment}
                    companyName={companyName}
                    businessType={businessType}
                    staffSize={staffSize}
                    city={city}
                    country={country}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 rounded-full px-6"
                  onClick={() => setStep((current) => current - 1)}
                >
                  Back
                </Button>
              ) : null}
              {step < 3 ? (
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-full font-bold"
                  disabled={!canAdvance}
                  onClick={() => setStep((current) => current + 1)}
                >
                  {step === 0 ? 'This is me' : 'Keep going'}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-full font-bold"
                  disabled={saving}
                  onClick={finish}
                >
                  {saving
                    ? 'Building your space…'
                    : audience === 'operator'
                      ? 'Open my workspace'
                      : 'Build my Passport'}
                </Button>
              )}
            </div>
          </div>
        </section>

        <aside className="hidden border-l border-border bg-card p-8 lg:flex lg:flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Live brief</p>
          <h2 className="mt-3 text-3xl font-bold font-display text-balance">What QUIPPY knows</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This grows as you talk. You control what becomes public.
          </p>
          <div className="mt-10 space-y-4">
            <BriefRow icon={audience === 'operator' ? Building2 : ChefHat} label="Path" value={audience === 'operator' ? 'Business' : audience === 'worker' ? 'Worker' : 'Not chosen'} />
            <BriefRow icon={Users} label="People" value={audience === 'operator' && staffSize ? `${staffSize} staff` : role || 'Not added'} />
            <BriefRow icon={MapPin} label="Place" value={city ? `${city}, ${country}` : 'Not added'} />
          </div>
          <div className="mt-auto rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
            Private answers stay between you and QUIPPY. Businesses never receive private chat history.
          </div>
        </aside>
      </div>
    </main>
  );
};

const AudienceStep = ({
  value,
  onChange,
}: {
  value: Audience | null;
  onChange: (value: Audience) => void;
}) => (
  <div>
    <h1 className="text-3xl font-bold font-display text-balance md:text-5xl">What are we building?</h1>
    <p className="mt-3 text-muted-foreground">Choose the path that matches today. You can add another role later.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <ChoiceCard selected={value === 'worker'} icon={ChefHat} title="My professional Passport" body="Earn credentials and carry them everywhere." onClick={() => onChange('worker')} />
      <ChoiceCard selected={value === 'operator'} icon={Building2} title="My business team" body="Assign training and see who is ready." onClick={() => onChange('operator')} />
    </div>
  </div>
);

const RoleStep = ({ value, onChange }: { value: BaseRole | ''; onChange: (value: BaseRole) => void }) => (
  <div>
    <h1 className="text-3xl font-bold font-display text-balance md:text-5xl">Your world at work</h1>
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {ROLES.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={`min-h-28 rounded-2xl border-2 p-4 text-left transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            value === item.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground'
          }`}
        >
          <span className="text-2xl" aria-hidden="true">{item.icon}</span>
          <span className="mt-3 block text-sm font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const BusinessStep = ({
  companyName,
  businessType,
  staffSize,
  onCompanyName,
  onBusinessType,
  onStaffSize,
}: {
  companyName: string;
  businessType: string;
  staffSize: string;
  onCompanyName: (value: string) => void;
  onBusinessType: (value: string) => void;
  onStaffSize: (value: string) => void;
}) => (
  <div>
    <h1 className="text-3xl font-bold font-display text-balance md:text-5xl">Start with the basics</h1>
    <div className="mt-8 space-y-5">
      <Field label="Business name" name="companyName" value={companyName} onChange={onCompanyName} autoComplete="organization" placeholder="The Drake Hotel…" />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Business type
          <select name="businessType" value={businessType} onChange={(event) => onBusinessType(event.target.value)} className="mt-2 h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <option value="">Choose one</option>
            {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <Field label="Team size" name="staffSize" value={staffSize} onChange={onStaffSize} type="number" min={1} inputMode="numeric" autoComplete="off" placeholder="25…" />
      </div>
    </div>
  </div>
);

const LocationStep = ({ city, country, onCity, onCountry }: { city: string; country: string; onCity: (value: string) => void; onCountry: (value: string) => void }) => (
  <div>
    <h1 className="text-3xl font-bold font-display text-balance md:text-5xl">Where is the team?</h1>
    <p className="mt-3 text-muted-foreground">We use this for local courses, equipment support and future connections.</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      <Field label="City" name="city" value={city} onChange={onCity} autoComplete="address-level2" placeholder="Toronto…" />
      <Field label="Country" name="country" value={country} onChange={onCountry} autoComplete="country-name" placeholder="Canada…" />
    </div>
  </div>
);

const EquipmentStep = ({ selected, onToggle }: { selected: string[]; onToggle: (item: string) => void }) => (
  <div>
    <h1 className="text-3xl font-bold font-display text-balance md:text-5xl">Your everyday technology</h1>
    <p className="mt-3 text-muted-foreground">Pick any you use. It is fine to skip this.</p>
    <div className="mt-8 flex flex-wrap gap-3">
      {EQUIPMENT.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={selected.includes(item)}
          onClick={() => onToggle(item)}
          className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-[border-color,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selected.includes(item) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-muted-foreground'
          }`}
        >
          {selected.includes(item) ? <Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" /> : null}
          {item}
        </button>
      ))}
    </div>
  </div>
);

const ReviewStep = ({ audience, role, equipment, companyName, businessType, staffSize, city, country }: { audience: Audience | null; role: BaseRole | ''; equipment: string[]; companyName: string; businessType: string; staffSize: string; city: string; country: string }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your starting point</p>
    <h1 className="mt-3 text-3xl font-bold font-display text-balance md:text-5xl">
      {audience === 'operator' ? companyName : `${role || 'Hospitality'} Passport`}
    </h1>
    <div className="mt-8 rounded-3xl bg-card p-6">
      {audience === 'operator' ? (
        <div className="space-y-3 text-sm">
          <p><span className="text-muted-foreground">Business</span><span className="float-right font-semibold">{businessType}</span></p>
          <p><span className="text-muted-foreground">Team</span><span className="float-right font-semibold">{staffSize} people</span></p>
          <p><span className="text-muted-foreground">First location</span><span className="float-right font-semibold">{city}, {country}</span></p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground">Equipment saved</p>
          <p className="mt-2 text-lg font-semibold">{equipment.length > 0 ? equipment.join(' · ') : 'Add equipment later'}</p>
        </div>
      )}
    </div>
  </div>
);

const ChoiceCard = ({ selected, icon: Icon, title, body, onClick }: { selected: boolean; icon: typeof ChefHat; title: string; body: string; onClick: () => void }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`rounded-3xl border-2 p-6 text-left transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground'
    }`}
  >
    <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
    <span className="mt-8 block text-lg font-bold">{title}</span>
    <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{body}</span>
  </button>
);

const Field = ({ label, name, value, onChange, type = 'text', placeholder, autoComplete, inputMode, min }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; placeholder: string; autoComplete: string; inputMode?: 'numeric'; min?: number }) => (
  <label className="block text-sm font-semibold">
    {label}
    <input
      name={name}
      type={type}
      min={min}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    />
  </label>
);

const BriefRow = ({ icon: Icon, label, value }: { icon: typeof ChefHat; label: string; value: string }) => (
  <div className="flex items-center gap-3 border-b border-border pb-4">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  </div>
);

export default Onboarding;
