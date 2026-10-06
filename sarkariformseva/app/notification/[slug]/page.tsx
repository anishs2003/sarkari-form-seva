import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getPublishedNotificationBySlugResult } from "@/lib/public-notifications";

export const dynamic = "force-dynamic";

export default async function NotificationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedNotificationBySlugResult(slug);
  if (result.error) {
    return (
      <SiteShell>
        <main className="portal-main">
          <section role="alert" className="portal-section border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-xl font-bold">Notification data is unavailable</h1>
            <p className="mt-2">{result.error}</p>
            <Link href="/notifications" className="mt-4 inline-block font-semibold underline">Back to Notifications</Link>
          </section>
        </main>
      </SiteShell>
    );
  }
  const item = result.item;

  if (!item) notFound();

  const facts = [
    ["Application start", item.applicationStartDate || "To be announced"],
    ["Last date", item.lastDate || "To be announced"],
    ["Exam date", item.examDate || "To be announced"],
    ["Application fee", item.applicationFee || "See official notice"],
    ["Total vacancy", item.vacancy || "See official notice"],
    ["Eligibility", item.eligibility || "See official notice"],
    ["Age limit", item.ageLimit || "See official notice"],
    ["Selection process", "Refer to the official notification"],
  ];

  return (
    <SiteShell>
      <main className="portal-main detail-page">
        <div className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/notifications">Notifications</Link><span>/</span><span>{item.category}</span></div>
        <header className="detail-heading">
          <span className="directory-category">{item.category}</span>
          <h1>{item.title}</h1>
          <p>{item.organization}</p>
        </header>
        <div className="detail-layout">
          <article className="detail-content">
            <section className="portal-section">
              <div className="portal-section-heading"><h2>Overview</h2></div>
              <p className="detail-description">{item.description}</p>
            </section>
            <section className="portal-section">
              <div className="portal-section-heading"><h2>Important Dates &amp; Details</h2></div>
              <dl className="detail-facts">
                {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </section>
            <section className="portal-section">
              <div className="portal-section-heading"><h2>How to Apply</h2></div>
              <div className="detail-description">
                <p>Check the eligibility and dates in the official notification before applying. Use the official application website linked here for government application submission.</p>
                <p>For optional assistance with preparing an application, use our private form-filling service. Sarkari Form Seva is not a government department.</p>
                <Link href={`/apply/${item.slug}`} className="service-link-button">Apply Through Us</Link>
              </div>
            </section>
          </article>
          <aside className="detail-sidebar">
            <section className="portal-section">
              <div className="portal-section-heading"><h2>Important Links</h2></div>
              <ul className="important-links">
                <li><a href={item.officialNotificationUrl} target="_blank" rel="noreferrer">Official Notification</a></li>
                <li><a href={item.officialWebsiteUrl} target="_blank" rel="noreferrer">Official Website</a></li>
                <li><a href={item.applyOnlineUrl} target="_blank" rel="noreferrer">Apply Online</a></li>
                <li><Link href={`/apply/${item.slug}`}>Private Form Filling Service</Link></li>
              </ul>
            </section>
            <section className="source-note">
              <h2>Source details</h2>
              <p>{item.source}</p>
              <p>Updated: {item.fetchedDate}</p>
            </section>
          </aside>
        </div>
      </main>
    </SiteShell>
  );
}
