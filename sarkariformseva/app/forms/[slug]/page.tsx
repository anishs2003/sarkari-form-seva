import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { formatPublicDate, getLastDateLabel, isExpiredForm } from "@/lib/form-deadlines";
import { getPublishedFormBySlugResult } from "@/lib/public-forms";
import { getSafeExternalUrl, validateExternalUrl } from "@/lib/safe-links";

export const dynamic = "force-dynamic";

const getFormBySlug = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { item: null, error: null };
  return getPublishedFormBySlugResult(slug);
});

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getFormBySlug(slug);
  if (!item) return { title: "Form Not Found | Sarkari Form Seva", robots: { index: false, follow: false } };

  const canonicalUrl = `${getSiteUrl()}/forms/${item.slug}`;
  const title = item.seoTitle && item.seoTitle !== item.title
    ? item.seoTitle
    : `${item.title} Online Form - Sarkari Form Seva`;
  const description = item.metaDescription && item.metaDescription !== item.title
    ? item.metaDescription
    : item.shortDescription || item.description || `${item.title} application dates, eligibility, fees, vacancy, and official links.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      siteName: "Sarkari Form Seva",
    },
  };
}

function ExternalFormLink({ href, children }: { href: string | undefined; children: string }) {
  const result = validateExternalUrl(href);
  return result.state === "valid" ? (
    <a href={result.href} target="_blank" rel="noreferrer">{children}</a>
  ) : (
    <span aria-disabled="true" className="text-slate-400">{children} {result.state === "invalid" ? "has an invalid URL" : "unavailable"}</span>
  );
}

export default async function FormDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item, error } = await getFormBySlug(slug);

  if (error) {
    return (
      <SiteShell>
        <main className="portal-main">
          <section role="alert" className="portal-section border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-xl font-bold">Form details are temporarily unavailable</h1>
            <p className="mt-2">{error}</p>
            <Link href="/new-forms" className="mt-4 inline-block font-semibold underline">Back to New Forms</Link>
          </section>
        </main>
      </SiteShell>
    );
  }

  if (!item) notFound();
  const expired = isExpiredForm(item) && !item.keepVisibleAfterLastDate;
  const downloadNotificationUrl = getSafeExternalUrl(item.notificationPdfUrl)
    ?? getSafeExternalUrl(item.officialNotificationUrl)
    ?? item.notificationPdfUrl
    ?? item.officialNotificationUrl;

  return (
    <SiteShell>
      <main className="portal-main detail-page public-form-detail">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/new-forms">New Forms</Link><span>/</span><span>{item.title}</span>
        </nav>

        <header className="detail-heading">
          <p className="eyebrow">{item.organization}</p>
          <h1>{item.title}</h1>
          <p>{item.shortDescription || item.description}</p>
        </header>

        {expired && <p role="status" className="rounded-md border border-red-200 bg-red-50 p-4 font-semibold text-red-800">Application Closed. The last date has passed, so applications are no longer being accepted.</p>}

        <div className="detail-layout">
          <article className="detail-content">
            <section className="portal-section">
              <div className="portal-section-heading"><h2>Important Dates</h2></div>
              <dl className="detail-facts">
                <div><dt>Application Start Date</dt><dd>{item.applicationStartDate || "To be announced"}</dd></div>
                <div><dt>Last Date</dt><dd>{formatPublicDate(item.lastDate)}{getLastDateLabel(item) && <span className="ml-2 block text-sm font-semibold text-amber-700">{getLastDateLabel(item)}</span>}</dd></div>
                <div><dt>Exam Date</dt><dd>{item.examDate || "To be announced"}</dd></div>
              </dl>
            </section>

            <section className="portal-section">
              <div className="portal-section-heading"><h2>Vacancy</h2></div>
              <dl className="detail-facts"><div><dt>Total Vacancy</dt><dd>{item.vacancy || "See official notification"}</dd></div></dl>
            </section>

            <section className="portal-section">
              <div className="portal-section-heading"><h2>Eligibility</h2></div>
              <dl className="detail-facts">
                <div><dt>Qualification</dt><dd>{item.qualification || item.eligibility || "See official notification"}</dd></div>
                <div><dt>Age Limit</dt><dd>{item.ageLimit || "See official notification"}</dd></div>
                <div><dt>Other Eligibility</dt><dd>{item.eligibility || "See official notification"}</dd></div>
              </dl>
            </section>

            <section className="portal-section">
              <div className="portal-section-heading"><h2>Application Fee</h2></div>
              <dl className="detail-facts">
                <div><dt>Official Application Fee</dt><dd>{item.applicationFee || "See official notification"}</dd></div>
                <div><dt>Service Charge</dt><dd>{item.serviceCharge || "Not applicable"}</dd></div>
              </dl>
            </section>

            {item.requiredDocuments && <section className="portal-section">
              <div className="portal-section-heading"><h2>Required Documents</h2></div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{item.requiredDocuments.split(/[\r\n,;]+/).map((document) => document.trim()).filter(Boolean).map((document) => <li key={document}>{document}</li>)}</ul>
            </section>}

            <section className="portal-section">
              <div className="portal-section-heading"><h2>Important Links</h2></div>
              <ul className="important-links">
                <li><ExternalFormLink href={downloadNotificationUrl}>Download Notification</ExternalFormLink></li>
                <li><ExternalFormLink href={item.officialWebsiteUrl}>Official Website</ExternalFormLink></li>
                <li>{expired ? <span aria-disabled="true" className="text-slate-400">Application Closed</span> : <ExternalFormLink href={item.applyOnlineUrl}>Apply Online</ExternalFormLink>}</li>
              </ul>
            </section>
          </article>

          <aside className="detail-sidebar">
            <section className="service-notice">
              <div>
                <p className="eyebrow">Optional student service</p>
                <h2>Need help with this form?</h2>
                <p>Sarkari Form Seva is a private service, not a government department.</p>
              </div>
              {expired ? <span aria-disabled="true" className="text-slate-400">Application Closed</span> : <Link href={`/apply/${item.slug}`}>Apply Through Us</Link>}
            </section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
