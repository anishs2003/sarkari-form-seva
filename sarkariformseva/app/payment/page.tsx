import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { formatFeeAmount } from "@/lib/fees";
import { getPublishedFormBySlugResult } from "@/lib/public-forms";
import { PaymentSubmissionForm } from "@/components/payment-submission-form";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ slug?: string; applicationId?: string }> }) {
  const { slug, applicationId } = await searchParams;
  const formResult = slug ? await getPublishedFormBySlugResult(slug) : { item: null, error: null };
  const item = formResult.item;
  type SavedApplication = { id: string; application_id: string; form_slug: string; payment_status: string };
  let application: SavedApplication | null = null;
  let applicationError = formResult.error ?? "";
  if (!applicationId || !/^[0-9a-f-]{36}$/i.test(applicationId)) {
    applicationError = "Open payment from your saved application to continue.";
  } else {
    const database = tryGetSupabaseServerConfig();
    if (!database.config) {
      applicationError = database.error;
    } else {
      const applicationUrl = new URL(`${database.config.url}/rest/v1/applications`);
      applicationUrl.searchParams.set("select", "id,application_id,form_slug,payment_status");
      applicationUrl.searchParams.set("id", `eq.${applicationId}`);
      applicationUrl.searchParams.set("form_slug", `eq.${slug ?? ""}`);
      try {
        const response = await fetch(applicationUrl, {
          headers: supabaseHeaders(database.config.key),
          cache: "no-store",
        });
        if (!response.ok) applicationError = `Could not verify this saved application: ${await supabaseErrorMessage(response)}.`;
        else {
          const rows = await response.json() as SavedApplication[];
          application = rows[0] ?? null;
          if (!application) applicationError = "Saved application not found for this form.";
        }
      } catch {
        applicationError = "Application lookup is temporarily unavailable.";
      }
    }
  }
  const qrUrl = process.env.NEXT_PUBLIC_PAYMENT_QR_URL;
  const upiId = process.env.NEXT_PUBLIC_PAYMENT_UPI_ID;
  const maxScreenshotSizeMb = Number(process.env.PAYMENT_SCREENSHOT_MAX_SIZE_MB) > 0
    ? Number(process.env.PAYMENT_SCREENSHOT_MAX_SIZE_MB)
    : 5;
  const initialAmount = item?.serviceCharge?.replace(/[^\d.]/g, "") ?? "";

  return (
    <SiteShell>
      <main className="portal-main payment-page">
        <div className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/apply-through-us">Private Form Service</Link><span>/</span><span>Payment</span></div>
        <header className="directory-heading"><div><p className="eyebrow">Private Form Filling Service</p><h1>Payment</h1></div></header>
        <div className="payment-layout">
          <section className="portal-section payment-summary">
            <div className="portal-section-heading"><h2>Payment breakdown</h2></div>
            {item && <p className="payment-caption">Applying for: <strong>{item.title}</strong></p>}
            {application && <p className="payment-caption">Application ID: <strong>{application.application_id}</strong></p>}
            <dl className="review-facts">
              <div><dt>Official Application Fee</dt><dd>{formatFeeAmount(item?.applicationFee, "Select a form to view its official fee")}</dd></div>
              <div><dt>Service Charge</dt><dd>{formatFeeAmount(item?.serviceCharge, "Not specified")}</dd></div>
            </dl>
            <p className="payment-caption">Service Charge is for our private form-filling assistance.</p>
            <p className="payment-caption">The official application fee is paid separately to the official authority. The QR payment below is only for the service charge.</p>
            <div className="payment-qr" aria-label="Payment QR code">
              {qrUrl ? <Image src={qrUrl} alt="Sarkari Form Seva UPI payment QR code" width={260} height={260} unoptimized /> : <p>Payment QR has not been configured.</p>}
            </div>
            <div className="upi-details"><strong>UPI ID</strong><span>{upiId || "Not configured"}</span></div>
            <p className="payment-caption">Scan QR and pay only after confirming the service charge and payment details with the service team.</p>
          </section>

          <section className="portal-section payment-submit">
            <div className="portal-section-heading"><h2>Submit payment details</h2></div>
            {applicationError ? (
              <div role="alert" className="p-4 text-sm text-red-800">
                <p>{applicationError}</p>
                <Link href={slug ? `/apply/${encodeURIComponent(slug)}` : "/new-forms"} className="mt-2 inline-block font-semibold underline">Return to application</Link>
              </div>
            ) : item && application ? (
              <PaymentSubmissionForm applicationId={application.id} applicationCode={application.application_id} slug={item.slug} initialAmount={initialAmount} maxScreenshotSizeMb={maxScreenshotSizeMb} disabled={application.payment_status === "Verification Pending" || application.payment_status === "Paid"} />
            ) : null}
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
