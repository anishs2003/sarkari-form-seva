import { AdminPaymentReview } from "@/components/admin-payment-review";
import { SiteShell } from "@/components/site-shell";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminPaymentsPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0f4c81]">Manual review</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Payment Verification</h1>
        </div>
        <AdminPaymentReview />
      </main>
    </SiteShell>
  );
}
