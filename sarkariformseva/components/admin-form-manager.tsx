"use client";

import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { AdminNotificationPdfUpload } from "@/components/admin-notification-pdf-upload";
import type { NotificationItem } from "@/lib/types";

export function AdminFormManager({ maxPdfSizeMb, editId }: { maxPdfSizeMb: number; editId?: string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(editId ?? null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | NotificationItem["status"]>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [organizationFilter, setOrganizationFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [editingPdfUrl, setEditingPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/forms", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { error?: string; items?: NotificationItem[] };
        if (!active) return;
        if (!response.ok) {
          setMessage(response.status === 401 ? "Admin sign-in required. Sign in at /admin/login." : result.error || "Could not load forms.");
          return;
        }
        setItems(result.items ?? []);
      })
      .catch(() => { if (active) setMessage("Could not reach the protected forms service."); });
    return () => { active = false; };
  }, []);

  async function updateForm(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const publish = (event.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement
      && (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "publish";

    const existing = items.find((item) => item.id === id);
    if (!existing) return;
    const updated: NotificationItem = {
          ...existing,
          title: String(formData.get("title") ?? "").trim(),
          organization: String(formData.get("organization") ?? "").trim(),
          category: String(formData.get("category") ?? existing.category) as NotificationItem["category"],
          shortDescription: String(formData.get("shortDescription") ?? "").trim(),
          description: String(formData.get("description") ?? "").trim(),
          applicationStartDate: String(formData.get("applicationStartDate") ?? "").trim(),
          lastDate: String(formData.get("lastDate") ?? "").trim(),
          examDate: String(formData.get("examDate") ?? "").trim(),
          vacancy: String(formData.get("vacancy") ?? "").trim(),
          eligibility: String(formData.get("eligibility") ?? "").trim(),
          ageLimit: String(formData.get("ageLimit") ?? "").trim(),
          applicationFee: String(formData.get("applicationFee") ?? "").trim(),
          notificationPdfUrl: String(formData.get("notificationPdfUrl") ?? "").trim(),
          officialNotificationUrl: String(formData.get("officialNotificationUrl") ?? "").trim(),
          officialWebsiteUrl: String(formData.get("officialWebsiteUrl") ?? "").trim(),
          applyOnlineUrl: String(formData.get("applyOnlineUrl") ?? "").trim(),
          requiredDocuments: String(formData.get("requiredDocuments") ?? "").trim(),
          serviceCharge: String(formData.get("serviceCharge") ?? "").trim(),
          keepVisibleAfterLastDate: formData.get("keepVisibleAfterLastDate") === "yes",
          status: publish ? "published" : existing.status,
        };

    const saved = await updateItem(id, updated);
    if (saved) setEditingId(null);
  }

  async function deleteForm(id: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/forms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json() as { error?: string; auditLogged?: boolean };
      if (!response.ok) {
        setMessage(response.status === 401 ? "Admin sign-in required. Sign in at /admin/login." : result.error || "Could not delete the form.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage(result.auditLogged === false ? "Form deleted, but its audit entry could not be written." : "Form deleted.");
    } catch {
      setMessage("Could not reach the protected forms service.");
    } finally {
      setBusy(false);
    }
  }

  async function updateItem(id: string, changes: Partial<NotificationItem>): Promise<boolean> {
    const current = items.find((item) => item.id === id);
    if (!current) return false;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, ...changes }),
      });
      const result = await response.json() as { error?: string; item?: NotificationItem; auditLogged?: boolean };
      if (!response.ok || !result.item) {
        setMessage(response.status === 401 ? "Admin sign-in required. Sign in at /admin/login." : result.error || "Could not update the form.");
        return false;
      }
      setItems((allItems) => allItems.map((item) => item.id === id ? result.item! : item));
      setMessage(result.auditLogged === false ? "Form saved, but its audit entry could not be written." : "Form changes saved to the database.");
      return true;
    } catch {
      setMessage("Could not reach the protected forms service.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function updateStatus(id: string, nextStatus: NotificationItem["status"]) {
    void updateItem(id, { status: nextStatus });
  }

  function toggleFeatured(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (item) void updateItem(id, { featured: !item.featured });
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesQuery = !normalized || item.title.toLowerCase().includes(normalized);
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesOrganization = organizationFilter === "All" || item.organization === organizationFilter;
      const matchesDateFrom = !dateFrom || item.applicationStartDate >= dateFrom;
      const matchesDateTo = !dateTo || item.applicationStartDate <= dateTo;
      return matchesStatus && matchesQuery && matchesCategory && matchesOrganization && matchesDateFrom && matchesDateTo;
    });
  }, [items, query, statusFilter, categoryFilter, organizationFilter, dateFrom, dateTo]);

  const categories = [...new Set(items.map((item) => item.category))].sort();
  const organizations = [...new Set(items.map((item) => item.organization).filter(Boolean))].sort();

  const stats = {
    total: items.length,
    published: items.filter((item) => item.status === "published").length,
    drafts: items.filter((item) => item.status === "draft" || item.status === "pending-review").length,
  };

  return (
    <section aria-busy={busy}>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total forms</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Published</p>
          <p className="mt-3 text-3xl font-black text-emerald-700">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Drafts</p>
          <p className="mt-3 text-3xl font-black text-amber-700">{stats.drafts}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-slate-600">{message || "Manage new form entries and publish them to the portal."} {message.includes("/admin/login") && <Link href="/admin/login" className="font-semibold text-[#0f4c81] underline">Sign in</Link>}</p>
        <Link href="/admin/forms/new" className="rounded-md bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white">+ Add New Form</Link>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-6">
        <input aria-label="Search Form" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Form" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="All">All Categories</option>
          {categories.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select aria-label="Filter by organization" value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="All">All Organizations</option>
          {organizations.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | NotificationItem["status"])} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="All">All Statuses</option>
          {(["draft", "pending-review", "published", "archived"] as const).map((option) => <option key={option} value={option}>{option.replace("-", " ")}</option>)}
        </select>
        <input aria-label="Start date from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input aria-label="Start date to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="admin-forms-table-wrap overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="admin-forms-table w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Form Name</th>
              <th className="px-4 py-3 font-semibold">Organization</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Start Date</th>
              <th className="px-4 py-3 font-semibold">Last Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Featured</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 && <tr className="admin-form-empty-row"><td colSpan={8} className="px-4 py-10 text-center text-slate-600">No forms match these filters.</td></tr>}
            {filteredItems.map((item) => (
              <Fragment key={item.id}>
                <tr className="admin-form-row align-top">
                  <td data-label="Form Name" className="px-4 py-4 font-semibold text-slate-900">{item.title}</td>
                  <td data-label="Organization" className="px-4 py-4 text-slate-700">{item.organization}</td>
                  <td data-label="Category" className="px-4 py-4 text-slate-700">{item.category}</td>
                  <td data-label="Start Date" className="px-4 py-4 text-slate-700">{item.applicationStartDate || "—"}</td>
                  <td data-label="Last Date" className="px-4 py-4 text-slate-700">{item.lastDate || "—"}</td>
                  <td data-label="Status" className="px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{item.status.replace("-", " ")}</span></td>
                  <td data-label="Featured" className="px-4 py-4">
                    <input type="checkbox" checked={Boolean(item.featured)} onChange={() => toggleFeatured(item.id)} aria-label={`Feature ${item.title}`} className="h-4 w-4 accent-[#0f4c81]" />
                  </td>
                  <td data-label="Actions" className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setViewingId(viewingId === item.id ? null : item.id)} className="font-semibold text-[#0f4c81] hover:underline">View</button>
                      <button type="button" onClick={() => { setViewingId(null); setEditingId(editingId === item.id ? null : item.id); setEditingPdfUrl(item.notificationPdfUrl ?? ""); }} className="font-semibold text-slate-700 hover:underline">Edit</button>
                      <button type="button" onClick={() => updateStatus(item.id, item.status === "published" ? "archived" : "published")} className="font-semibold text-emerald-700 hover:underline">{item.status === "published" ? "Deactivate" : "Activate"}</button>
                      <button type="button" onClick={() => { if (window.confirm(`Delete ${item.title}?`)) deleteForm(item.id); }} className="font-semibold text-red-700 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
                {viewingId === item.id && editingId !== item.id && (
                  <tr key={`${item.id}-details`} className="admin-form-expanded-row"><td colSpan={8} className="bg-slate-50 px-5 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{item.shortDescription}</p>
                    <p className="mt-2">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                      <span>Exam date: {item.examDate || "—"}</span><span>Vacancy: {item.vacancy || "—"}</span><span>Eligibility: {item.eligibility || "—"}</span><span>Age limit: {item.ageLimit || "—"}</span><span>Application fee: {item.applicationFee || "—"}</span>
                    </div>
                    {item.applyOnlineUrl && <a href={item.applyOnlineUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-[#0f4c81] underline">Apply link</a>}
                  </td></tr>
                )}
                {editingId === item.id && (
                  <tr key={`${item.id}-edit`} className="admin-form-expanded-row"><td colSpan={8} className="bg-slate-50 p-4">
                    <form onSubmit={(event) => updateForm(event, item.id)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input name="title" required defaultValue={item.title} aria-label="Form Name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="organization" required defaultValue={item.organization} aria-label="Organization" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <select name="category" defaultValue={item.category} aria-label="Category" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="SSC">SSC</option>
                  <option value="UPSC">UPSC</option>
                  <option value="Railway">Railway</option>
                  <option value="IBPS">IBPS</option>
                  <option value="SBI">SBI</option>
                  <option value="Banking">Banking</option>
                  <option value="Defence">Defence</option>
                  <option value="Police">Police</option>
                  <option value="Teaching">Teaching</option>
                  <option value="State Government Jobs">State Government Jobs</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Admit Card">Admit Card</option>
                  <option value="Results">Results</option>
                  <option value="Answer Key">Answer Key</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Admission">Admission</option>
                  <option value="Government Job">Government Job</option>
                  <option value="New Form">New Form</option>
                  <option value="Entrance Exam">Entrance Exam</option>
                  <option value="Other">Other</option>
                </select>
                <textarea name="shortDescription" defaultValue={item.shortDescription} aria-label="Short Description" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <textarea name="description" defaultValue={item.description} aria-label="Description" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <input type="date" name="applicationStartDate" defaultValue={item.applicationStartDate} aria-label="Application Start Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" name="lastDate" defaultValue={item.lastDate} aria-label="Last Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" name="examDate" defaultValue={item.examDate} aria-label="Exam Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="vacancy" defaultValue={item.vacancy} aria-label="Vacancy" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="eligibility" defaultValue={item.eligibility} aria-label="Eligibility" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="ageLimit" defaultValue={item.ageLimit} aria-label="Age Limit" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="applicationFee" defaultValue={item.applicationFee} aria-label="Application Fee" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <div className="md:col-span-2 xl:col-span-3">
                  <AdminNotificationPdfUpload value={editingPdfUrl ?? item.notificationPdfUrl ?? ""} onChange={setEditingPdfUrl} maxSizeMb={maxPdfSizeMb} />
                  <input type="hidden" name="notificationPdfUrl" value={editingPdfUrl ?? item.notificationPdfUrl ?? ""} />
                </div>
                <input name="officialNotificationUrl" defaultValue={item.officialNotificationUrl} aria-label="Official Notification URL" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="officialWebsiteUrl" defaultValue={item.officialWebsiteUrl} aria-label="Official Website" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="applyOnlineUrl" defaultValue={item.applyOnlineUrl} aria-label="Apply Online Link" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <textarea name="requiredDocuments" defaultValue={item.requiredDocuments ?? ""} aria-label="Required Documents" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <input name="serviceCharge" defaultValue={item.serviceCharge ?? ""} aria-label="Service Charge" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <label className="text-sm font-semibold text-slate-700">Keep visible after last date
                  <select name="keepVisibleAfterLastDate" defaultValue={item.keepVisibleAfterLastDate ? "yes" : "no"} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>
                <div className="flex gap-2 md:col-span-2 xl:col-span-3">
                  <button type="submit" className="rounded-md bg-[#0f4c81] px-3 py-2 text-xs font-semibold text-white">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Cancel</button>
                  <button type="submit" name="intent" value="publish" className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Save &amp; Publish</button>
                </div>
                    </form>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
