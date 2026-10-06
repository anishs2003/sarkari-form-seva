import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getLatestPublishedFormsResult } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export default async function ApplyThroughUsPage() {
  const result = await getLatestPublishedFormsResult(1000);
  const published = result.items;

  return (
    <SiteShell>
      <main className="portal-main">
        <div className="directory-heading">
          <div><p className="eyebrow">Optional student service</p><h1>Apply Through Us</h1></div>
        </div>
        <p className="service-disclaimer">Private Form Filling Service. Sarkari Form Seva is not a government department. Official applications must be submitted through the relevant official website.</p>
        {result.error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{result.error}</p>}
        <section className="portal-section">
          <div className="portal-section-heading"><h2>Select a notification</h2><span>{published.length} available</span></div>
          <div className="service-list">
            {published.map((item) => (
              <article key={item.id} className="service-list-row">
                <div><span className="directory-category">{item.category}</span><h2><Link href={`/forms/${item.slug}`}>{item.title}</Link></h2><p>{item.organization}</p></div>
                <div className="service-list-dates"><span>Last date</span><strong>{item.lastDate || "To be announced"}</strong></div>
                <Link className="service-link-button" href={`/apply/${item.slug}`}>Start service request</Link>
              </article>
            ))}
            {published.length === 0 && <p className="portal-empty">There are no published notifications available for service requests.</p>}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
