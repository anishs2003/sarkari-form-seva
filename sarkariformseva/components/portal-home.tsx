"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { formatPublicDate, getLastDateLabel, isVisibleInActiveForms } from "@/lib/form-deadlines";
import type { NotificationItem } from "@/lib/types";

type SectionProps = {
  id: string;
  title: string;
  items: NotificationItem[];
  emptyText: string;
  moreHref?: string;
  itemLimit?: number;
};

function NotificationSection({ id, title, items, emptyText, moreHref, itemLimit = 18 }: SectionProps) {
  return (
    <section id={id} className="portal-section scroll-mt-6">
      <div className="portal-section-heading">
        <h2>{title}</h2>
        <Link href={moreHref ?? `/notifications?category=${encodeURIComponent(title)}`}>View More</Link>
      </div>
      {items.length ? (
        <ul className="portal-link-list">
          {items.slice(0, itemLimit).map((item) => (
            <li key={item.id}>
              <Link href={`/forms/${item.slug}`}>{item.title}</Link>
              {item.lastDate && <span>Last Date: {formatPublicDate(item.lastDate)}</span>}
              {getLastDateLabel(item) && <strong className={getLastDateLabel(item) === "Application Closed" ? "text-red-700" : "text-amber-700"}>{getLastDateLabel(item)}</strong>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="portal-empty">{emptyText}</p>
      )}
    </section>
  );
}

const featuredLinks = [
  { label: "Latest Jobs", category: "jobs", tone: "blue", href: "/notifications?category=jobs" },
  { label: "New Forms", category: "forms", tone: "green", href: "/new-forms" },
  { label: "Admit Card", category: "Admit Card", tone: "orange", href: "/notifications?category=Admit%20Card" },
  { label: "Results", category: "Results", tone: "red", href: "/notifications?category=Results" },
];

export function PortalHome({ items, forms = [], dataError = null }: { items: NotificationItem[]; forms?: NotificationItem[]; dataError?: string | null }) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const isApplicationId = /^(ASF[- ]?)?\d{5,}$/i.test(searchTerm.trim());
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedSearch || isApplicationId) return items;
    return items.filter((item) =>
      `${item.title} ${item.organization} ${item.category}`.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [items, isApplicationId, normalizedSearch]);
  const filteredForms = useMemo(() => {
    if (!normalizedSearch || isApplicationId) return forms;
    return forms.filter((item) =>
      `${item.title} ${item.organization} ${item.category}`.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [forms, isApplicationId, normalizedSearch]);

  const byCategory = (categories: string[]) => filteredItems.filter((item) => categories.includes(item.category));
  const results = byCategory(["Results"]);
  const answerKeys = byCategory(["Answer Key"]);
  const admitCards = byCategory(["Admit Card"]);
  const admissions = byCategory(["Universities", "Colleges", "Board Exams"]);
  const syllabus = byCategory(["Syllabus"]);
  const certificates = byCategory(["Certificate"]);
  const important = filteredItems;
  const outsourcing = byCategory(["Outsourcing / Offline Jobs"]);
  const activeForms = filteredForms.filter((item) => isVisibleInActiveForms(item)).slice(0, 10);
  const featuredForms = filteredForms.filter((item) => item.featured && isVisibleInActiveForms(item)).slice(0, 6);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(query);
  }

  return (
    <main className="portal-main">
      <section className="portal-search" id="portal-search" aria-label="Search notifications">
        <div className="portal-search-copy">
          <p className="eyebrow">Find your next opportunity</p>
          <h1>Government jobs, forms and exam updates</h1>
        </div>
        <form onSubmit={submitSearch} className="portal-search-form">
          <label className="sr-only" htmlFor="portal-search-input">Search jobs, forms, results, or application ID</label>
          <input
            id="portal-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Government Jobs, Forms, Results..."
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>
        {isApplicationId && (
          <p className="portal-search-note">
            Looking for application <strong>{searchTerm}</strong>? <Link href={`/track-application?applicationId=${encodeURIComponent(searchTerm)}`}>Track with your registered mobile number</Link>.
          </p>
        )}
        {searchTerm && !isApplicationId && (
            <p className="portal-search-note" role="status">{filteredItems.length + filteredForms.length} matching result{filteredItems.length + filteredForms.length === 1 ? "" : "s"}. <button type="button" onClick={() => { setSearchTerm(""); setQuery(""); }}>Clear search</button></p>
        )}
      </section>

      <section className="portal-announcement" aria-label="Latest announcements">
        <strong>Latest updates</strong>
        <div className="announcement-links">
          <Link href="/notifications?category=jobs">Government Jobs</Link>
          <Link href="/new-forms">New Online Forms</Link>
          <Link href="/notifications?category=Admit%20Card">Admit Cards</Link>
          <Link href="/notifications?category=Results">Results</Link>
          <Link href="/notifications?category=Scholarship">Scholarships</Link>
        </div>
      </section>

      {dataError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">Live form and notification data is temporarily unavailable. {dataError}</p>}

      <nav className="featured-links" aria-label="Featured categories">
        {featuredLinks.map((item) => (
          <Link key={item.label} href={item.href} className={`featured-link featured-${item.tone}`}>
            <span>{item.label}</span><span aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>

      {featuredForms.length > 0 && (
        <section className="portal-section border-l-4 border-amber-500 bg-amber-50/60 px-5 py-5" aria-labelledby="featured-forms-heading">
          <div className="portal-section-heading">
            <h2 id="featured-forms-heading">Featured Forms</h2>
            <Link href="/new-forms">View More</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {featuredForms.map((item) => (
              <article key={item.id} className="rounded-md border border-amber-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">{item.category}</p>
                <h3 className="mt-2 font-bold text-slate-900"><Link href={`/forms/${item.slug}`} className="hover:underline">{item.title}</Link></h3>
                <p className="mt-1 text-sm text-slate-600">{item.organization}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">Last Date: {formatPublicDate(item.lastDate)}</span>
                  {getLastDateLabel(item) && <strong className="text-amber-700">{getLastDateLabel(item)}</strong>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="portal-grid">
        <NotificationSection id="results" title="Result" items={results} emptyText="No result notices are currently available." />
        <NotificationSection id="new-forms" title="New Forms" items={activeForms} emptyText="No active published forms are currently available." moreHref="/new-forms" itemLimit={10} />
        <NotificationSection id="answer-key" title="Answer Key" items={answerKeys} emptyText="No answer key notices are currently available." />
        <NotificationSection id="admit-card" title="Admit Card" items={admitCards} emptyText="No admit card notices are currently available." />
        <NotificationSection id="admission" title="Admission" items={admissions} emptyText="No admission notices are currently available." />
        <NotificationSection id="syllabus" title="Syllabus" items={syllabus} emptyText="No syllabus notices are currently available." />
        <NotificationSection id="certificate" title="Certificate" items={certificates} emptyText="No certificate notices are currently available." />
        <NotificationSection id="important" title="Important" items={important} emptyText="No important notices are currently available." />
      </div>

      <section className="portal-section outsourcing-section" id="outsourcing">
        <div className="portal-section-heading">
          <h2>Outsourcing / Offline Jobs</h2>
          <Link href="/notifications?category=outsourcing">View more</Link>
        </div>
        {outsourcing.length ? (
          <ul className="portal-link-list portal-link-list-wide">
            {outsourcing.slice(0, 18).map((item) => <li key={item.id}><Link href={`/notification/${item.slug}`}>{item.title}</Link></li>)}
          </ul>
        ) : (
          <p className="portal-empty">No outsourcing or offline job notices are currently available.</p>
        )}
      </section>

      <section className="service-notice">
        <div>
          <p className="eyebrow">Private Form Filling Service</p>
          <h2>Need support with an application?</h2>
          <p>We offer optional form-filling assistance. We are not a government department.</p>
        </div>
        <Link href="/apply-through-us">Apply Through Us</Link>
      </section>
    </main>
  );
}
