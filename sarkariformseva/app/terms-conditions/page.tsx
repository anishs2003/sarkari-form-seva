import { SiteShell } from "@/components/site-shell";

export default function TermsPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Terms & Conditions</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Service terms</h1>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
            <p>Students must provide accurate personal and educational information while applying through the portal.</p>
            <p>The service provider acts as an application support partner and does not guarantee any recruitment, scholarship, or admission outcome.</p>
            <p>All fees are for service support and are non-refundable except as per the refund policy.</p>
            <p>Users are responsible for confirming eligibility before application submission.</p>
            <p id="disclaimer">Sarkari Form Seva is an independent information and form-filling service and is not affiliated with any government department unless explicitly stated.</p>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
