"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPublicDate, getLastDateLabel, isInClosedForms, isVisibleInActiveForms } from "@/lib/form-deadlines";
import { getSafeExternalUrl } from "@/lib/safe-links";
import type { NotificationItem } from "@/lib/types";

const categoryOptions = ["All", "Government Job", "New Form", "Scholarship", "Admission", "Entrance Exam"];
const governmentJobCategories = new Set([
  "Government Job", "SSC", "UPSC", "Railway", "IBPS", "SBI", "Banking", "Defence", "Police", "Teaching",
  "State Government Jobs", "Outsourcing / Offline Jobs",
]);

function matchesCategory(item: NotificationItem, category: string): boolean {
  if (category === "All") return true;
  if (category === "Government Job") return governmentJobCategories.has(item.category);
  if (category === "Admission") return ["Admission", "Universities", "Colleges", "Board Exams"].includes(item.category);
  return item.category === category;
}

function dateSortValue(value: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function NewFormsDirectory({ items, closed = false, error = null }: { items: NotificationItem[]; closed?: boolean; error?: string | null }) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"Latest" | "Last Date" | "Organization">("Latest");
  const publishedForms = useMemo(() => {
    const available = closed
      ? items.filter((item) => isInClosedForms(item))
      : items.filter((item) => isVisibleInActiveForms(item));

    return available.filter((item) => matchesCategory(item, category)).sort((left, right) => {
      if (sort === "Organization") return left.organization.localeCompare(right.organization);
      if (sort === "Last Date") return dateSortValue(left.lastDate) - dateSortValue(right.lastDate);
      return dateSortValue(right.notificationDate) - dateSortValue(left.notificationDate);
    });
  }, [category, closed, items, sort]);

  return (
    <main className="portal-main">
      <header className="directory-heading">
        <div>
          <p className="eyebrow">Sarkari Form Seva</p>
          <h1>{closed ? "Archived / Closed Forms" : "Latest New Forms"}</h1>
        </div>
        <div className="text-right">
          <p className="directory-count" role="status">{publishedForms.length} {closed ? "closed" : "active"} form{publishedForms.length === 1 ? "" : "s"}</p>
          <Link href={closed ? "/new-forms" : "/archived-forms"} className="text-sm font-semibold text-[#0f4c81] underline">{closed ? "View Active Forms" : "Archived / Closed Forms"}</Link>
        </div>
      </header>

      {error && (
        <section role="alert" className="portal-section border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="font-bold">Forms are temporarily unavailable</h2>
          <p className="mt-1 text-sm">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-md border border-red-300 px-3 py-2 text-sm font-semibold">Try again</button>
        </section>
      )}

      <section className="portal-section public-form-list" aria-label="Published new forms">
        <div className="public-form-filters mb-3 flex flex-wrap gap-3">
          <label className="text-sm font-semibold text-slate-700">Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
              {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Sort
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-normal">
              <option value="Latest">Latest</option>
              <option value="Last Date">Last Date</option>
              <option value="Organization">Organization</option>
            </select>
          </label>
        </div>
        <div className="service-list">
          {publishedForms.map((item) => {
            const applyUrl = getSafeExternalUrl(item.applyOnlineUrl) || getSafeExternalUrl(item.officialWebsiteUrl);

            return (
              <article key={item.id} className="public-form-card rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="directory-category">{item.category}</span>
                    <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">{item.title}</h2>
                    <p className="mt-0.5 text-sm text-slate-600">{item.organization}</p>
                    <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Date</dt><dd className="mt-1 text-sm font-medium text-slate-800">{formatPublicDate(item.lastDate)}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualification</dt><dd className="mt-1 text-sm font-medium text-slate-800">{item.qualification || item.eligibility || "See official notification"}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vacancy</dt><dd className="mt-1 text-sm font-medium text-slate-800">{item.vacancy || "See official notification"}</dd></div>
                      <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application Fee</dt><dd className="mt-1 text-sm font-medium text-slate-800">{item.applicationFee || "See official notification"}</dd></div>
                    </dl>
                    {getLastDateLabel(item) && <p className={`mt-4 text-sm font-bold ${getLastDateLabel(item) === "Application Closed" ? "text-red-700" : "text-amber-700"}`}>{getLastDateLabel(item)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 lg:max-w-64 lg:justify-end">
                    <Link href={`/forms/${item.slug}`} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Details</Link>
                    {applyUrl ? (
                      <a href={applyUrl} target="_blank" rel="noreferrer" className="rounded-md bg-[#0f4c81] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0c3f6c]">Apply Online</a>
                    ) : (
                      <span title={item.applyOnlineUrl || item.officialWebsiteUrl ? "The stored application URL is invalid." : "No application URL is available."} className="cursor-not-allowed rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">{item.applyOnlineUrl || item.officialWebsiteUrl ? "Invalid Apply URL" : "Apply Online unavailable"}</span>
                    )}
                    <Link href={`/apply/${item.slug}`} className="rounded-md border border-[#0f4c81] px-2.5 py-1.5 text-xs font-semibold text-[#0f4c81] hover:bg-[#edf4ff]">Apply Through Us</Link>
                  </div>
                </div>
              </article>
            );
          })}
          {publishedForms.length === 0 && !error && <p className="portal-empty">{closed ? "There are no archived or closed forms at this time." : "There are no published forms at this time."}</p>}
        </div>
      </section>
    </main>
  );
}
