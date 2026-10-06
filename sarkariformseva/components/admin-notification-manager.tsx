"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { NotificationItem } from "@/lib/types";

export function AdminNotificationManager({ initialItems }: { initialItems: NotificationItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState<NotificationItem["category"]>("SSC");
  const [description, setDescription] = useState("");
  const [applicationStartDate, setApplicationStartDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [examDate, setExamDate] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [ageLimit, setAgeLimit] = useState("");
  const [applicationFee, setApplicationFee] = useState("");
  const [notificationPdfUrl, setNotificationPdfUrl] = useState("");
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState("");
  const [applyOnlineUrl, setApplyOnlineUrl] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/notifications", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { error?: string; items?: NotificationItem[] };
        if (!response.ok) throw new Error(result.error || "Could not load notifications.");
        setItems(result.items ?? []);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Could not load notifications.");
      });
    return () => controller.abort();
  }, []);

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const publish = submitter instanceof HTMLButtonElement && submitter.value === "publish";
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const now = new Date().toISOString().slice(0, 10);
    const item: NotificationItem = {
      id: "",
      slug,
      title: title.trim(),
      organization: organization.trim(),
      category,
      shortDescription: description.trim(),
      description: description.trim(),
      notificationDate: now,
      applicationStartDate: applicationStartDate.trim(),
      lastDate: lastDate.trim(),
      examDate: examDate.trim(),
      vacancy: vacancy.trim() || "Not specified",
      eligibility: eligibility.trim() || "See official notification",
      ageLimit: ageLimit.trim() || "See official notification",
      applicationFee: applicationFee.trim() || "See official notification",
      notificationPdfUrl: notificationPdfUrl.trim(),
      officialNotificationUrl: notificationPdfUrl.trim(),
      officialWebsiteUrl: officialWebsiteUrl.trim(),
      applyOnlineUrl: applyOnlineUrl.trim(),
      requiredDocuments: requiredDocuments.trim(),
      serviceCharge: serviceCharge.trim(),
      source: "Admin entry",
      fetchedDate: now,
      status: publish ? "published" : "draft",
      seoTitle: title.trim(),
      metaDescription: description.trim(),
    };
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json() as { error?: string; item?: NotificationItem };
      if (!response.ok || !result.item) throw new Error(result.error || "Could not save notification.");
      setItems((current) => [result.item!, ...current]);
      setMessage(result.item.status === "published" ? "Notification published to the database." : "Notification draft saved to the database.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save notification.");
      setBusy(false);
      return;
    }
    setTitle("");
    setOrganization("");
    setCategory("SSC");
    setDescription("");
    setApplicationStartDate("");
    setLastDate("");
    setExamDate("");
    setVacancy("");
    setEligibility("");
    setAgeLimit("");
    setApplicationFee("");
    setNotificationPdfUrl("");
    setOfficialWebsiteUrl("");
    setApplyOnlineUrl("");
    setRequiredDocuments("");
    setServiceCharge("");
    setShowCreateForm(false);
    setBusy(false);
  }

  async function updateStatus(id: string, status: NotificationItem["status"]) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const result = await response.json() as { error?: string; item?: NotificationItem };
      if (!response.ok || !result.item) throw new Error(result.error || "Could not update notification.");
      setItems((current) => current.map((item) => item.id === id ? result.item! : item));
      setMessage("Notification status saved to the database.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update notification."); }
    finally { setBusy(false); }
  }

  async function deleteNotification(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not delete notification.");
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Notification deleted from the database.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete notification."); }
    finally { setBusy(false); }
  }

  async function updateNotification(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const existing = items.find((item) => item.id === id);
    if (!existing) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const publish = submitter instanceof HTMLButtonElement && submitter.value === "publish";
    const updated = {
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
      officialNotificationUrl: String(formData.get("notificationPdfUrl") ?? "").trim(),
      officialWebsiteUrl: String(formData.get("officialWebsiteUrl") ?? "").trim(),
      applyOnlineUrl: String(formData.get("applyOnlineUrl") ?? "").trim(),
      requiredDocuments: String(formData.get("requiredDocuments") ?? "").trim(),
      serviceCharge: String(formData.get("serviceCharge") ?? "").trim(),
      status: publish ? "published" as const : existing.status,
    };
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...updated, id }) });
      const result = await response.json() as { error?: string; item?: NotificationItem };
      if (!response.ok || !result.item) throw new Error(result.error || "Could not save notification changes.");
      setItems((current) => current.map((item) => item.id === id ? result.item! : item));
      setMessage("Notification changes saved to the database.");
      setEditingId(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save notification changes."); }
    finally { setBusy(false); }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-slate-600">{message || "Review and manage portal notifications."}</p>
        <button type="button" onClick={() => setShowCreateForm(!showCreateForm)} className="rounded-md bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white">
          {showCreateForm ? "Cancel" : "Add notification"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={createNotification} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
          <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Form Name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Organization" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={category} onChange={(event) => setCategory(event.target.value as NotificationItem["category"])} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
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
          </select>
          <textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short Description" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
          <input type="date" value={applicationStartDate} onChange={(event) => setApplicationStartDate(event.target.value)} placeholder="Application Start Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" value={lastDate} onChange={(event) => setLastDate(event.target.value)} placeholder="Last Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} placeholder="Exam Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={vacancy} onChange={(event) => setVacancy(event.target.value)} placeholder="Vacancy" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={eligibility} onChange={(event) => setEligibility(event.target.value)} placeholder="Eligibility" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={ageLimit} onChange={(event) => setAgeLimit(event.target.value)} placeholder="Age Limit" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={applicationFee} onChange={(event) => setApplicationFee(event.target.value)} placeholder="Application Fee" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={notificationPdfUrl} onChange={(event) => setNotificationPdfUrl(event.target.value)} placeholder="Notification PDF" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={officialWebsiteUrl} onChange={(event) => setOfficialWebsiteUrl(event.target.value)} placeholder="Official Website" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input value={applyOnlineUrl} onChange={(event) => setApplyOnlineUrl(event.target.value)} placeholder="Apply Online Link" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea value={requiredDocuments} onChange={(event) => setRequiredDocuments(event.target.value)} placeholder="Required Documents" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
          <input value={serviceCharge} onChange={(event) => setServiceCharge(event.target.value)} placeholder="Service Charge" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2 md:col-span-2 xl:col-span-3">
            <button type="submit" disabled={busy} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Save Draft</button>
            <button type="submit" name="intent" value="publish" disabled={busy} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Publish</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No notifications to review.</p>}
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {editingId === item.id ? (
              <form onSubmit={(event) => updateNotification(event, item.id)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                </select>
                <textarea name="shortDescription" defaultValue={item.shortDescription} aria-label="Short Description" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <textarea name="description" defaultValue={item.description || item.shortDescription} aria-label="Description" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <input type="date" name="applicationStartDate" defaultValue={item.applicationStartDate} aria-label="Application Start Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" name="lastDate" defaultValue={item.lastDate} aria-label="Last Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input type="date" name="examDate" defaultValue={item.examDate} aria-label="Exam Date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="vacancy" defaultValue={item.vacancy} aria-label="Vacancy" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="eligibility" defaultValue={item.eligibility} aria-label="Eligibility" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="ageLimit" defaultValue={item.ageLimit} aria-label="Age Limit" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="applicationFee" defaultValue={item.applicationFee} aria-label="Application Fee" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="notificationPdfUrl" defaultValue={item.notificationPdfUrl ?? item.officialNotificationUrl} aria-label="Notification PDF" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="officialWebsiteUrl" defaultValue={item.officialWebsiteUrl} aria-label="Official Website" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="applyOnlineUrl" defaultValue={item.applyOnlineUrl} aria-label="Apply Online Link" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <textarea name="requiredDocuments" defaultValue={item.requiredDocuments ?? ""} aria-label="Required Documents" rows={3} className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2 xl:col-span-3" />
                <input name="serviceCharge" defaultValue={item.serviceCharge ?? ""} aria-label="Service Charge" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <div className="flex gap-2 md:col-span-2 xl:col-span-3">
                  <button type="submit" className="rounded-md bg-[#0f4c81] px-3 py-2 text-xs font-semibold text-white">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Cancel</button>
                  <button type="submit" name="intent" value="publish" className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Save &amp; Publish</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#edf4ff] px-2 py-1 text-[10px] font-bold uppercase text-[#0f4c81]">{item.category}</span>
                      <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-800">{item.status}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.organization}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{expandedId === item.id ? "Hide" : "View"}</button>
                    <button type="button" onClick={() => setEditingId(item.id)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Edit</button>
                    <button type="button" onClick={() => updateStatus(item.id, item.status === "published" ? "archived" : "published")} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">{item.status === "published" ? "Deactivate" : "Activate"}</button>
                    <button type="button" onClick={() => updateStatus(item.id, "rejected")} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Reject</button>
                    <button type="button" onClick={() => deleteNotification(item.id)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Delete</button>
                  </div>
                </div>
                {expandedId === item.id && <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{item.description || item.shortDescription}</p>}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
