import { notFound } from "next/navigation";
import { ApplicationWizard } from "@/components/application-wizard";
import { SiteShell } from "@/components/site-shell";
import { getPublishedFormBySlugResult } from "@/lib/public-forms";
import { isExpiredForm } from "@/lib/form-deadlines";
import Link from "next/link";

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedFormBySlugResult(slug);
  if (result.error) {
    return (
      <SiteShell>
        <main className="portal-main">
          <section role="alert" className="portal-section border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-xl font-bold">Form service is temporarily unavailable</h1>
            <p className="mt-2">{result.error}</p>
            <Link href="/new-forms" className="mt-4 inline-block font-semibold underline">Back to New Forms</Link>
          </section>
        </main>
      </SiteShell>
    );
  }
  const item = result.item;
  if (!item) notFound();

  if (isExpiredForm(item) && !item.keepVisibleAfterLastDate) {
    return (
      <SiteShell>
        <main className="portal-main">
          <section role="status" className="portal-section border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-xl font-bold">Application Closed</h1>
            <p className="mt-2">The last date for {item.title} has passed. New assistance requests are no longer available.</p>
            <Link href="/archived-forms" className="mt-4 inline-block font-semibold underline">View Archived / Closed Forms</Link>
          </section>
        </main>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <ApplicationWizard item={item} />
    </SiteShell>
  );
}
