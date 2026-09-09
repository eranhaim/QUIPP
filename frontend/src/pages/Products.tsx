import { type FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExternalLink, Filter, PackageSearch, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import type { MarketplaceProduct } from '@/lib/types';

const fieldClass =
  'h-11 rounded-xl border-2 border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function money(cents: number | null, currency: string): string {
  if (cents === null) return 'Price on request';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function Products() {
  const [draft, setDraft] = useState({ q: '', category: '', region: '', budget: '' });
  const [filters, setFilters] = useState(draft);
  const productsQuery = useQuery({
    queryKey: ['marketplace-products', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.category) params.set('category', filters.category);
      if (filters.region) params.set('region', filters.region);
      if (filters.budget) params.set('budget', String(Math.round(Number(filters.budget) * 100)));
      return api<{ products: MarketplaceProduct[] }>(
        `/api/marketplace/products?${params}`,
        { auth: true },
      );
    },
  });
  const clickMutation = useMutation({
    mutationFn: (offerId: string) =>
      api<{ destination: string }>(
        `/api/marketplace/offers/${offerId}/click?return=destination`,
        { auth: true },
      ),
    onSuccess: ({ destination }) => window.location.assign(destination),
  });
  const products = productsQuery.data?.products ?? [];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ ...draft });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Approved catalog</p>
          <h1 className="mt-3 text-4xl font-bold font-display">Equipment options, with the commercial layer visible.</h1>
          <p className="mt-4 text-muted-foreground">
            Results are ranked by fit. Demo catalog facts are unverified; confirm price, compatibility,
            stock, and service coverage directly.
          </p>
        </header>

        <aside className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm" aria-label="Affiliate disclosure">
          <Sparkles className="mr-2 inline h-4 w-4 text-primary" aria-hidden />
          <strong>Some links may earn QUIPP a commission.</strong> This does not change how options are ranked.
        </aside>

        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-3xl bg-card p-5 md:grid-cols-[1fr_180px_180px_150px_auto]">
          <input className={fieldClass} aria-label="Search products" placeholder="Search brand, model, or need" value={draft.q} onChange={(e) => setDraft((v) => ({ ...v, q: e.target.value }))} />
          <input className={fieldClass} aria-label="Category" placeholder="Category" value={draft.category} onChange={(e) => setDraft((v) => ({ ...v, category: e.target.value }))} />
          <input className={fieldClass} aria-label="Region" placeholder="Region" value={draft.region} onChange={(e) => setDraft((v) => ({ ...v, region: e.target.value }))} />
          <input className={fieldClass} aria-label="Maximum budget" type="number" min="0" placeholder="Max budget" value={draft.budget} onChange={(e) => setDraft((v) => ({ ...v, budget: e.target.value }))} />
          <Button type="submit" className="h-11 rounded-full"><Filter className="mr-2 h-4 w-4" />Apply</Button>
        </form>

        {productsQuery.error ? (
          <p className="mt-6 text-sm text-destructive" role="alert">
            {productsQuery.error instanceof ApiError ? productsQuery.error.message : 'Catalog could not be loaded.'}
          </p>
        ) : null}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="flex flex-col rounded-3xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{product.category}</span>
                {product.offer ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Affiliate link</span> : null}
              </div>
              <h2 className="mt-5 text-xl font-bold">{product.name}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{product.brand} · {product.model}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              <p className="mt-5 text-lg font-bold">
                {money(product.priceMinCents, product.currency)}
                {product.priceMaxCents !== null ? ` – ${money(product.priceMaxCents, product.currency)}` : ''}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Demo source dated {new Date(product.sourceUpdatedAt).toLocaleDateString()} · {product.supplier.companyName}
              </p>
              {product.offer ? (
                <>
                  <p className="mt-4 text-xs font-semibold text-primary">{product.offer.disclosureLabel}</p>
                  <Button type="button" className="mt-3 rounded-full" disabled={clickMutation.isPending} onClick={() => clickMutation.mutate(product.offer!.id)}>
                    Visit supplier <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button asChild variant="outline" className="mt-4 rounded-full">
                  <a href={product.sourceUrl} rel="noopener noreferrer">View source <ExternalLink className="ml-2 h-4 w-4" /></a>
                </Button>
              )}
            </article>
          ))}
        </div>
        {!productsQuery.isLoading && products.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <PackageSearch className="mx-auto h-8 w-8" />
            <p className="mt-3">No approved products match these filters.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
