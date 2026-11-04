"use client";

import { useEffect, useState } from "react";
import { birthdayGiftsApi, type BirthdayGiftItem } from "@/api/birthdayGifts";
import { businessesApi, type BusinessItem } from "@/api/businesses";
import { toast } from "@/components/Toast";

export default function BirthdayGiftsPage() {
  const [items, setItems] = useState<BirthdayGiftItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", terms: "", merchantId: "", category: "", expiresAt: "" });
  const [claimCode, setClaimCode] = useState("");
  const [validationMerchant, setValidationMerchant] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await birthdayGiftsApi.list({ page, limit: 25, search: search || undefined, status: status === "ALL" ? undefined : status });
      setItems(result.items || []); setTotalPages(result.meta?.totalPages || 1);
    } catch { toast.error("Could not load birthday gifts", { title: "Birthday Gifts" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page, status]);
  useEffect(() => { businessesApi.list().then(setBusinesses).catch(() => {}); }, []);

  async function createGift(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.merchantId) { toast.error("Title, description and business are required", { title: "Missing fields" }); return; }
    setSaving(true);
    try { await birthdayGiftsApi.create({ ...form, expiresAt: form.expiresAt || undefined, category: form.category || undefined }); setForm({ title: "", description: "", terms: "", merchantId: "", category: "", expiresAt: "" }); toast.success("Birthday gift created", { title: "Saved" }); await load(); }
    catch { toast.error("Could not create birthday gift", { title: "Save failed" }); }
    finally { setSaving(false); }
  }

  async function toggle(item: BirthdayGiftItem) { try { await birthdayGiftsApi.update(item.id, { status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); await load(); } catch { toast.error("Could not update gift", { title: "Update failed" }); } }
  async function archive(item: BirthdayGiftItem) { if (!window.confirm(`Archive ${item.title}?`)) return; try { await birthdayGiftsApi.remove(item.id); await load(); } catch { toast.error("Could not archive gift", { title: "Archive failed" }); } }
  async function validateClaim(event: React.FormEvent) { event.preventDefault(); setValidationMessage(""); try { const result: any = await birthdayGiftsApi.validate({ claimCode, merchantId: validationMerchant }); setValidationMessage(`Valid and redeemed${result?.claim?.user?.fullName ? ` for ${result.claim.user.fullName}` : ""}.`); setClaimCode(""); } catch (error: any) { setValidationMessage(error?.response?.data?.message || "Invalid, expired, already redeemed, or wrong-business code."); } }

  return <main className="p-6 lg:p-8 space-y-6"><div><h1 className="text-2xl font-bold text-slate-900">Birthday Gifts</h1><p className="text-sm text-slate-500 mt-1">Create the gifts users can claim on their birthday.</p></div>
    <form onSubmit={createGift} className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3"><input className="rounded-lg border p-2.5" placeholder="Gift title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><select className="rounded-lg border p-2.5" value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value })}><option value="">Select business</option>{businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><input className="rounded-lg border p-2.5" placeholder="Category (optional)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><textarea className="rounded-lg border p-2.5 md:col-span-2" placeholder="Gift description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /><input className="rounded-lg border p-2.5" placeholder="Terms (optional)" value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} /><label className="text-sm text-slate-600">Expiry<input type="date" className="rounded-lg border p-2.5 w-full mt-1" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></label><button disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2.5 font-bold text-white md:col-span-2 lg:col-span-1">{saving ? "Saving..." : "Create Birthday Gift"}</button></form>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6"><h2 className="font-bold text-slate-900">Validate Birthday Claim</h2><p className="text-sm text-slate-500 mt-1 mb-3">Businesses can redeem a claimed code only for their own gifts.</p><form onSubmit={validateClaim} className="flex flex-wrap gap-3"><select required className="rounded-lg border p-2.5" value={validationMerchant} onChange={e => setValidationMerchant(e.target.value)}><option value="">Select business</option>{businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><input required className="rounded-lg border p-2.5" placeholder="BD-CLAIM-CODE" value={claimCode} onChange={e => setClaimCode(e.target.value)} /><button className="rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white">Validate & Redeem</button></form>{validationMessage && <p className="mt-3 text-sm font-semibold text-orange-700">{validationMessage}</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap gap-3 mb-5"><input className="rounded-lg border p-2.5 flex-1 min-w-56" placeholder="Search gifts or businesses" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), setPage(1), load())} /><select className="rounded-lg border p-2.5" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="EXPIRED">Expired</option></select><button className="rounded-lg border px-4" onClick={() => { setPage(1); load(); }}>Search</button></div>{loading ? <p className="text-slate-500">Loading...</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Gift</th><th className="p-3">Business</th><th className="p-3">Status</th><th className="p-3">Claims</th><th className="p-3">Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-b last:border-0"><td className="p-3"><div className="font-semibold">{item.title}</div><div className="text-xs text-slate-500">{item.description}</div></td><td className="p-3">{item.merchant.name}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span></td><td className="p-3">{item._count?.claims ?? 0}</td><td className="p-3 flex gap-2"><button className="text-orange-600" onClick={() => toggle(item)}>{item.status === "ACTIVE" ? "Disable" : "Enable"}</button><button className="text-red-600" onClick={() => archive(item)}>Archive</button></td></tr>)}</tbody></table>{!items.length && <p className="py-8 text-center text-slate-500">No birthday gifts found.</p>}</div>}<div className="flex items-center justify-between mt-5 text-sm"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={page >= totalPages} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(p => p + 1)}>Next</button></div></div></div>
  </main>;
}
