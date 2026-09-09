import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface AdminSupplier { _id: string; companyName: string; slug: string; approved: boolean; status: string; categories: string[]; serviceRegions: string[]; ownerUserId?: string | null }
interface AdminProduct { _id: string; supplierId: string; name: string; slug: string; category: string; active: boolean }
interface AdminOffer { _id: string; productId: string; disclosureLabel: string; active: boolean; commissionType: string; commissionAmount: number | null }
interface AdminLead { id: string; category: string; city: string; region: string; status: string; urgency: string; createdAt: string }
interface AdminData { suppliers: AdminSupplier[]; products: AdminProduct[]; offers: AdminOffer[]; leads: AdminLead[] }

const inputClass = 'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm';
const csv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export default function AdminMarketplace() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-marketplace'], queryFn: () => api<AdminData>('/api/admin/marketplace', { auth: true }) });
  const refresh = () => client.invalidateQueries({ queryKey: ['admin-marketplace'] });
  const write = useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: string; body: unknown }) => api(path, { method, auth: true, body }),
    onSuccess: refresh,
  });
  const data = query.data;
  const error = query.error ?? write.error;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Commerce controls</p>
      <h1 className="mt-2 text-3xl font-bold font-display">Marketplace</h1>
      <p className="mt-2 text-sm text-muted-foreground">Approve suppliers, maintain demo catalog facts and offers, and monitor consented leads. Commission never enters fit ranking.</p>
      {error ? <p className="mt-5 text-sm text-destructive" role="alert">{error instanceof ApiError ? error.message : 'Marketplace action failed.'}</p> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <SupplierForm busy={write.isPending} onCreate={(body) => write.mutateAsync({ path: '/api/admin/marketplace/suppliers', method: 'POST', body })} />
        <ProductForm suppliers={data?.suppliers ?? []} busy={write.isPending} onCreate={(body) => write.mutateAsync({ path: '/api/admin/marketplace/products', method: 'POST', body })} />
        <OfferForm products={data?.products ?? []} busy={write.isPending} onCreate={(body) => write.mutateAsync({ path: '/api/admin/marketplace/offers', method: 'POST', body })} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Suppliers</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(data?.suppliers ?? []).map((supplier) => <article key={supplier._id} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{supplier.companyName}</h3><p className="text-xs text-muted-foreground">{supplier.categories.join(', ') || 'No categories'} · {supplier.serviceRegions.join(', ') || 'No regions'}</p></div><Button size="sm" variant={supplier.approved ? 'outline' : 'default'} onClick={() => write.mutate({ path: `/api/admin/marketplace/suppliers/${supplier._id}`, method: 'PATCH', body: { approved: !supplier.approved } })}>{supplier.approved ? 'Suspend approval' : 'Approve'}</Button></div></article>)}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Products and affiliate offers</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Offer disclosure</th><th className="p-3">State</th></tr></thead>
            <tbody>{(data?.products ?? []).map((product) => { const offer = data?.offers.find((item) => String(item.productId) === product._id); return <tr key={product._id} className="border-t border-border"><td className="p-3 font-semibold">{product.name}</td><td className="p-3">{product.category}</td><td className="p-3">{offer?.disclosureLabel ?? 'No offer'}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={() => write.mutate({ path: `/api/admin/marketplace/products/${product._id}`, method: 'PATCH', body: { active: !product.active } })}>{product.active ? 'Active' : 'Inactive'}</Button></td></tr>; })}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Lead overview</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.leads ?? []).map((lead) => <article key={lead.id} className="rounded-2xl border border-border p-4"><div className="flex justify-between gap-3"><h3 className="font-bold">{lead.category}</h3><span className="text-xs font-bold uppercase text-primary">{lead.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{lead.city}, {lead.region} · {lead.urgency}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p></article>)}
        </div>
      </section>
    </div>
  );
}

function SupplierForm({ busy, onCreate }: { busy: boolean; onCreate: (body: unknown) => Promise<unknown> }) {
  const [form, setForm] = useState({ companyName: '', slug: '', contactEmail: '', websiteUrl: '', ownerUserId: '', categories: '', regions: '' });
  const submit = async (e: FormEvent) => { e.preventDefault(); await onCreate({ companyName: form.companyName, slug: form.slug, contactEmail: form.contactEmail, websiteUrl: form.websiteUrl || null, ownerUserId: form.ownerUserId || null, categories: csv(form.categories), serviceRegions: csv(form.regions), approved: false, status: 'active' }); setForm({ companyName: '', slug: '', contactEmail: '', websiteUrl: '', ownerUserId: '', categories: '', regions: '' }); };
  return <form onSubmit={submit} className="rounded-3xl bg-card p-5"><h2 className="font-bold">Add supplier</h2><Fields form={form} setForm={setForm} labels={{ companyName: 'Company name', slug: 'Slug', contactEmail: 'Contact email', websiteUrl: 'Website URL', ownerUserId: 'Owner user ID (optional)', categories: 'Categories, comma separated', regions: 'Regions, comma separated' }} /><Button disabled={busy} className="mt-4 rounded-full">Add supplier</Button></form>;
}

function ProductForm({ suppliers, busy, onCreate }: { suppliers: AdminSupplier[]; busy: boolean; onCreate: (body: unknown) => Promise<unknown> }) {
  const [form, setForm] = useState({ supplierId: '', name: '', slug: '', category: '', brand: '', model: '', description: '', regions: '', sourceUrl: '', min: '', max: '' });
  const submit = async (e: FormEvent) => { e.preventDefault(); await onCreate({ supplierId: form.supplierId, name: form.name, slug: form.slug, category: form.category, brand: form.brand, model: form.model, description: form.description, regions: csv(form.regions), specifications: {}, priceMinCents: form.min ? Math.round(Number(form.min) * 100) : null, priceMaxCents: form.max ? Math.round(Number(form.max) * 100) : null, currency: 'USD', sourceUrl: form.sourceUrl, sourceUpdatedAt: new Date().toISOString(), active: true }); };
  return <form onSubmit={submit} className="rounded-3xl bg-card p-5"><h2 className="font-bold">Add product</h2><select required value={form.supplierId} onChange={(e) => setForm((v) => ({ ...v, supplierId: e.target.value }))} className={`${inputClass} mt-3`}><option value="">Supplier</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}</select><Fields form={form} setForm={setForm} labels={{ name: 'Name', slug: 'Slug', category: 'Category', brand: 'Brand', model: 'Model', description: 'Description', regions: 'Regions, comma separated', sourceUrl: 'Source URL', min: 'Minimum price USD', max: 'Maximum price USD' }} /><Button disabled={busy} className="mt-4 rounded-full">Add product</Button></form>;
}

function OfferForm({ products, busy, onCreate }: { products: AdminProduct[]; busy: boolean; onCreate: (body: unknown) => Promise<unknown> }) {
  const [productId, setProductId] = useState(''); const [destinationUrl, setDestinationUrl] = useState('');
  const submit = async (e: FormEvent) => { e.preventDefault(); const product = products.find((item) => item._id === productId); if (!product) return; await onCreate({ productId, supplierId: String(product.supplierId), destinationUrl, disclosureLabel: 'Affiliate link · QUIPP may earn a commission', commissionType: 'unknown', commissionAmount: null, active: true, priority: 0 }); setDestinationUrl(''); };
  return <form onSubmit={submit} className="rounded-3xl bg-card p-5"><h2 className="font-bold">Add affiliate offer</h2><select required value={productId} onChange={(e) => setProductId(e.target.value)} className={`${inputClass} mt-3`}><option value="">Product</option>{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select><input required type="url" placeholder="Stored destination URL" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} className={`${inputClass} mt-2`} /><p className="mt-3 text-xs text-muted-foreground">Disclosure is mandatory. Priority is administrative only and never changes product ranking.</p><Button disabled={busy} className="mt-4 rounded-full">Add offer</Button></form>;
}

function Fields<T extends Record<string, string>>({ form, setForm, labels }: { form: T; setForm: React.Dispatch<React.SetStateAction<T>>; labels: Partial<Record<keyof T, string>> }) {
  return <>{Object.entries(labels).map(([key, label]) => <input key={key} required={!label?.includes('optional')} placeholder={label} value={form[key]} onChange={(e) => setForm((value) => ({ ...value, [key]: e.target.value }))} className={`${inputClass} mt-2`} />)}</>;
}
