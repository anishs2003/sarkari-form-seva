"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AdminNotificationPdfUpload } from "@/components/admin-notification-pdf-upload";
import { findDuplicateForms } from "@/lib/form-duplicates";
import type { NotificationItem, NotificationStatus } from "@/lib/types";

const categories: NotificationItem["category"][] = [
  "Government Job",
  "New Form",
  "Scholarship",
  "Admission",
  "Entrance Exam",
  "Other",
];

const statuses: { value: NotificationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending-review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const inputClassName = "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0f4c81] focus:ring-2 focus:ring-[#0f4c81]/15";
const labelClassName = "mb-1.5 block text-sm font-semibold text-slate-700";

export function AdminNewForm({ maxPdfSizeMb }: { maxPdfSizeMb: number }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [formStatus, setFormStatus] = useState<NotificationStatus>("draft");
  const [notificationPdfUrl, setNotificationPdfUrl] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState<NotificationItem[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/forms", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { error?: string; items?: NotificationItem[] };
        if (!active) return;
        if (!response.ok) {
          setFormError(result.error || "Could not load forms.");
          return;
        }
        setItems(result.items ?? []);
      })
      .catch(() => { if (active) setFormError("Could not reach the protected forms service."); })
      .finally(() => { if (active) setLoadingItems(false); });
    return () => { active = false; };
  }, []);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadingItems || submitting) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const publish = submitter instanceof HTMLButtonElement && submitter.value === "publish";
    const title = String(values.get("title") ?? "").trim();
    const organization = String(values.get("organization") ?? "").trim();
    const applicationStartDate = String(values.get("applicationStartDate") ?? "");
    const lastDate = String(values.get("lastDate") ?? "");
    const examDate = String(values.get("examDate") ?? "");
    setFormError("");
    const candidate = {
      title,
      organization,
      applicationStartDate,
      lastDate,
      examDate,
      officialNotificationUrl: String(values.get("officialNotificationUrl") ?? "").trim(),
      notificationPdfUrl,
      officialWebsiteUrl: String(values.get("officialWebsiteUrl") ?? "").trim(),
      applyOnlineUrl: String(values.get("applyOnlineUrl") ?? "").trim(),
    };
    const matchingItems = findDuplicateForms(items, candidate);
    if (matchingItems.length > 0) {
      setDuplicateMatches(matchingItems);
      return;
    }
    setDuplicateMatches([]);

    const description = String(values.get("shortDescription") ?? "").trim();

    const item: NotificationItem = {
      id: "",
      slug: "",
      title,
      organization,
      category: String(values.get("category") ?? "Other") as NotificationItem["category"],
      shortDescription: description,
      description,
      notificationDate: "",
      applicationStartDate,
      lastDate,
      examDate,
      vacancy: String(values.get("vacancy") ?? "").trim(),
      qualification: String(values.get("qualification") ?? "").trim(),
      eligibility: String(values.get("eligibility") ?? "").trim(),
      ageLimit: String(values.get("ageLimit") ?? "").trim(),
      applicationFee: String(values.get("applicationFee") ?? "").trim(),
      serviceCharge: String(values.get("serviceCharge") ?? "").trim(),
      requiredDocuments: String(values.get("requiredDocuments") ?? "").trim(),
      notificationPdfUrl,
      officialNotificationUrl: String(values.get("officialNotificationUrl") ?? "").trim(),
      officialWebsiteUrl: String(values.get("officialWebsiteUrl") ?? "").trim(),
      applyOnlineUrl: String(values.get("applyOnlineUrl") ?? "").trim(),
      featured: values.get("featured") === "yes",
      keepVisibleAfterLastDate: values.get("keepVisibleAfterLastDate") === "yes",
      source: "Admin entry",
      fetchedDate: "",
      status: publish ? "published" : formStatus,
      seoTitle: title,
      metaDescription: description,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json() as { error?: string; item?: NotificationItem; duplicates?: NotificationItem[]; auditLogged?: boolean };
      if (response.status === 409) {
        setDuplicateMatches(result.duplicates ?? []);
        setFormError(result.error || "A matching form already exists.");
        return;
      }
      if (!response.ok) {
        setFormError(result.error || "Could not create the form.");
        return;
      }
      if (result.auditLogged === false) {
        setFormError("Form created, but its audit entry could not be written. Do not submit this form again; review the form list and contact your administrator.");
        return;
      }
      router.push("/admin/forms");
      router.refresh();
    } catch {
      setFormError("Could not reach the protected forms service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="space-y-6">
      {duplicateMatches.length > 0 && (
        <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-bold">Possible duplicate form found</h2>
          <p className="mt-1 text-sm">No new record was created. Update the matching record instead:</p>
          <ul className="mt-3 space-y-2">
            {duplicateMatches.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/70 px-3 py-2 text-sm">
                <span><strong>{item.title}</strong> · {item.organization} · Last date: {item.lastDate || "Not set"}</span>
                <Link href={`/admin/forms?edit=${encodeURIComponent(item.id)}`} className="font-semibold text-[#0f4c81] underline">Update Existing Record</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError} <Link href="/admin/login" className="font-semibold underline">Sign in as admin/staff</Link></p>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Form Details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label>
            <span className={labelClassName}>Form Name <span className="text-red-600">*</span></span>
            <input name="title" required className={inputClassName} />
          </label>
          <label>
            <span className={labelClassName}>Organization <span className="text-red-600">*</span></span>
            <input name="organization" required className={inputClassName} />
          </label>
          <label>
            <span className={labelClassName}>Category <span className="text-red-600">*</span></span>
            <select name="category" required defaultValue="" className={inputClassName}>
              <option value="" disabled>Select category</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="md:col-span-2 xl:col-span-3">
            <span className={labelClassName}>Short Description</span>
            <textarea name="shortDescription" rows={3} className={inputClassName} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Dates and Eligibility</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label><span className={labelClassName}>Application Start Date</span><input name="applicationStartDate" type="date" className={inputClassName} /></label>
          <label><span className={labelClassName}>Last Date</span><input name="lastDate" type="date" className={inputClassName} /></label>
          <label><span className={labelClassName}>Exam Date</span><input name="examDate" type="date" className={inputClassName} /></label>
          <label><span className={labelClassName}>Vacancy</span><input name="vacancy" className={inputClassName} /></label>
          <label><span className={labelClassName}>Qualification</span><input name="qualification" className={inputClassName} /></label>
          <label><span className={labelClassName}>Eligibility</span><input name="eligibility" className={inputClassName} /></label>
          <label><span className={labelClassName}>Age Limit</span><input name="ageLimit" className={inputClassName} /></label>
          <label><span className={labelClassName}>Application Fee</span><input name="applicationFee" className={inputClassName} /></label>
          <label><span className={labelClassName}>Our Service Charge</span><input name="serviceCharge" className={inputClassName} /><span className="mt-1 block text-xs text-slate-500">Private form-filling assistance charge; not an official government fee.</span></label>
          <label className="md:col-span-2 xl:col-span-3"><span className={labelClassName}>Required Documents</span><textarea name="requiredDocuments" rows={3} placeholder="One document per line, e.g. Aadhaar, Photo, Signature" className={inputClassName} /><span className="mt-1 block text-xs text-slate-500">Each line becomes a required upload in the student application.</span></label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Links and Publishing</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <AdminNotificationPdfUpload value={notificationPdfUrl} onChange={setNotificationPdfUrl} maxSizeMb={maxPdfSizeMb} />
            <input type="hidden" name="notificationPdfUrl" value={notificationPdfUrl} />
          </div>
          <label><span className={labelClassName}>Official Notification URL</span><input name="officialNotificationUrl" type="url" className={inputClassName} /></label>
          <label><span className={labelClassName}>Official Website URL</span><input name="officialWebsiteUrl" type="url" className={inputClassName} /></label>
          <label><span className={labelClassName}>Apply Online URL</span><input name="applyOnlineUrl" type="url" className={inputClassName} /></label>
          <label>
            <span className={labelClassName}>Featured Form</span>
            <select name="featured" defaultValue="no" className={inputClassName}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            <span className={labelClassName}>Keep Visible After Last Date</span>
            <select name="keepVisibleAfterLastDate" defaultValue="no" className={inputClassName}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label>
            <span className={labelClassName}>Status</span>
            <select value={formStatus} onChange={(event) => setFormStatus(event.target.value as NotificationStatus)} className={inputClassName}>
              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="submit" disabled={loadingItems || submitting} className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loadingItems ? "Loading forms..." : submitting ? "Saving..." : "Save Draft"}</button>
        <button type="submit" value="publish" disabled={loadingItems || submitting} className="rounded-md bg-[#0f4c81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3f6c] disabled:opacity-50">Publish</button>
      </div>
    </form>
  );
}
