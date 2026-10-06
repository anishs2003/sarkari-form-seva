"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPublicDate, getLastDateLabel, isVisibleInActiveForms } from "@/lib/form-deadlines";
import type { NotificationItem } from "@/lib/types";

const categories = ["All", "Jobs", "SSC", "UPSC", "Railway", "Banking", "Scholarship", "Admit Card", "Results", "Admission", "Answer Key", "Syllabus", "Certificate"];

function matchesCategory(item: NotificationItem, category: string) {
  if (category === "All") return true;
  if (["Jobs", "New Forms", "forms"].includes(category)) return !["Results", "Admit Card", "Scholarship", "Universities", "Colleges", "Board Exams", "Admission", "Answer Key", "Syllabus", "Certificate", "Outsourcing / Offline Jobs"].includes(item.category);
  if (category.toLowerCase() === "admission") return ["Admission", "Universities", "Colleges", "Board Exams"].includes(item.category);
  if (category === "Banking") return ["IBPS", "SBI", "Banking"].includes(item.category);
  return item.category.toLowerCase() === category.toLowerCase();
}

export function NotificationDirectory({ items, initialCategory, error = null }: { items: NotificationItem[]; initialCategory: string; error?: string | null }) {
  const [category, setCategory] = useState(categories.find((item) => item.toLowerCase() === initialCategory.toLowerCase()) ?? (["jobs", "forms"].includes(initialCategory.toLowerCase()) ? "Jobs" : "All"));
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isApplicationId = /^(ASF[- ]?)?\d{5,}$/i.test(query.trim());
  const activeListingsOnly = ["jobs", "new forms", "forms"].includes(category.toLowerCase());

  const visibleItems = useMemo(() => items.filter((item) =>
    matchesCategory(item, category) &&
    (!activeListingsOnly || isVisibleInActiveForms(item)) &&
    (!normalizedQuery || isApplicationId || `${item.title} ${item.organization} ${item.category}`.toLowerCase().includes(normalizedQuery)),
  ), [activeListingsOnly, category, isApplicationId, items, normalizedQuery]);

  return (
    <main className="portal-main">
      <div className="directory-heading">
        <div>
          <p className="eyebrow">Sarkari Form Seva updates</p>
          <h1>Latest Jobs &amp; Notifications</h1>
        </div>
        <label className="directory-search">
          <span className="sr-only">Search by title, organization, or category</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, organization, category..." />
        </label>
      </div>

      {isApplicationId && (
        <p className="portal-search-note">Track application <strong>{query}</strong> with your registered mobile number on the <Link href={`/track-application?applicationId=${encodeURIComponent(query)}`}>application status page</Link>.</p>
      )}

      <div className="directory-categories" aria-label="Notification categories">
        {categories.map((item) => (
          <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className={category === item ? "is-active" : ""}>{item}</button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <p className="directory-count" role="status">Showing {visibleItems.length} notification{visibleItems.length === 1 ? "" : "s"}</p>
      <div className="directory-list">
        {visibleItems.map((item) => (
          <article key={item.id} className="directory-row">
            <div className="directory-date" aria-label="Last date">
              <span>Last date</span>
              <strong>{formatPublicDate(item.lastDate)}</strong>
              {getLastDateLabel(item) && <em className={getLastDateLabel(item) === "Application Closed" ? "text-red-700" : "text-amber-700"}>{getLastDateLabel(item)}</em>}
            </div>
            <div className="directory-copy">
              <span className="directory-category">{item.category}</span>
              <h2><Link href={`/notification/${item.slug}`}>{item.title}</Link></h2>
              <p>{item.organization} · {item.shortDescription}</p>
            </div>
            <Link className="directory-detail-link" href={`/notification/${item.slug}`}>Details <span aria-hidden="true">›</span></Link>
          </article>
        ))}
        {visibleItems.length === 0 && <p className="portal-empty directory-empty">No published notifications match this category or search.</p>}
      </div>
    </main>
  );
}
