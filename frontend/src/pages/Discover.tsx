import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RequestIntroductionDialog from '@/components/RequestIntroductionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { DiscoveredWorker } from '@/lib/types';

const ROLES = ['', 'Kitchen', 'Bar', 'Floor', 'Management', 'Ownership', 'Other'];
const TIERS = ['', 'IN', 'DEEP', 'THERE'];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const workersQuery = useQuery({
    queryKey: ['discovery', queryString],
    queryFn: () =>
      api<{ workers: DiscoveredWorker[] }>(
        `/api/discovery/workers${queryString ? `?${queryString}` : ''}`,
      ),
  });

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const normalized = String(value).trim();
      if (normalized) next.set(key, normalized);
    }
    setSearchParams(next);
  };

  const workers = workersQuery.data?.workers ?? [];
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Open Passports</p>
          <h1 className="mt-2 text-3xl font-extrabold font-display uppercase md:text-5xl">
            Discover professionals
          </h1>
          <p className="mt-3 text-muted-foreground">
            Search verified credentials and experience. Contact details stay private until both
            people consent to an introduction.
          </p>
        </header>

        <form
          className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-6"
          onSubmit={submitFilters}
        >
          <FilterInput name="q" label="Search" defaultValue={searchParams.get('q') ?? ''} />
          <FilterInput
            name="location"
            label="Location"
            defaultValue={searchParams.get('location') ?? ''}
          />
          <FilterInput
            name="tag"
            label="Credential tag"
            defaultValue={searchParams.get('tag') ?? ''}
          />
          <FilterInput
            name="equipment"
            label="Equipment"
            defaultValue={searchParams.get('equipment') ?? ''}
          />
          <div className="space-y-2">
            <Label htmlFor="discover-role">Base role</Label>
            <select
              id="discover-role"
              name="baseRole"
              defaultValue={searchParams.get('baseRole') ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ROLES.map((role) => (
                <option key={role || 'any'} value={role}>
                  {role || 'Any role'}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discover-tier">Minimum tier</Label>
            <select
              id="discover-tier"
              name="tier"
              defaultValue={searchParams.get('tier') ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TIERS.map((tier) => (
                <option key={tier || 'any'} value={tier}>
                  {tier || 'Any tier'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 md:col-span-6">
            <Button type="submit">
              <Search className="h-4 w-4" aria-hidden />
              Apply filters
            </Button>
            {queryString ? (
              <Button type="button" variant="outline" onClick={() => setSearchParams({})}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {workersQuery.isPending
            ? 'Searching open Passports…'
            : workersQuery.isError
              ? 'Discovery is unavailable right now.'
              : `${workers.length} open professional${workers.length === 1 ? '' : 's'} found`}
        </p>

        <section className="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Discovery results">
          {workers.map((worker) => (
            <WorkerCard key={worker.username} worker={worker} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function FilterInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const id = `discover-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function WorkerCard({ worker }: { worker: DiscoveredWorker }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">
              <Link className="hover:text-secondary hover:underline" to={`/p/${worker.username}`}>
                @{worker.username}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {worker.techRole ?? worker.baseRole ?? 'Hospitality professional'}
            </p>
          </div>
          <div className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            {worker.techProficiencyScore}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {worker.location ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" aria-hidden />
            {worker.location}
          </p>
        ) : null}
        {worker.specialty ? <p className="text-sm">{worker.specialty}</p> : null}
        <div className="flex flex-wrap gap-2">
          {worker.credentials.map((credential) => (
            <Badge key={`${credential.title}-${credential.tier}`} variant="secondary">
              <Award className="mr-1 h-3 w-3" aria-hidden />
              {credential.title} · {credential.tier}
            </Badge>
          ))}
          {worker.equipment.map((equipment) => (
            <Badge key={`${equipment.name}-${equipment.brand ?? ''}`} variant="outline">
              {equipment.brand ? `${equipment.brand} ` : ''}
              {equipment.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/p/${worker.username}`}>View Passport</Link>
          </Button>
          <RequestIntroductionDialog username={worker.username} triggerClassName="flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
