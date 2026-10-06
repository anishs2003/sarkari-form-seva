import { SiteShell } from "@/components/site-shell";

export default function RefundPolicyPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Refund Policy</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Refund and cancellation terms</h1>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
            <p>Charges are collected for professional form-filling and assistance. Refunds may be processed before substantial work begins.</p>
            <p>If the application is cancelled due to customer non-compliance or incorrect documents provided by the student, no refund may be issued.</p>
            <p>Any eligible refund will be processed within 7 to 10 business days after approval by the admin team.</p>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
