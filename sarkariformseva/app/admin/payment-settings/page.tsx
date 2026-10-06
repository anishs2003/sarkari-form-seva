import { AdminPaymentSettingsForm } from "@/components/admin-payment-settings-form";
import { SiteShell } from "@/components/site-shell";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function PaymentSettingsPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Payment settings</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">QR code and payment configuration</h1>

          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Demo admin mode: changes and uploaded QR images are stored only in this browser and do not update checkout for other users.
          </p>
          <div className="mt-8">
            <AdminPaymentSettingsForm />
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
