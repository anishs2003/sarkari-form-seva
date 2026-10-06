import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { AdminSignOut } from "@/components/admin-sign-out";
import { dashboardMetrics, notificationMetrics, sampleApplications } from "@/lib/data";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Student service operations</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/forms" className="rounded-full bg-[#0f4c81] px-5 py-3 text-sm font-semibold text-white">
              Manage Forms
            </Link>
            <Link href="/admin/applications" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">Applications</Link>
            <Link href="/admin/notifications" className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
              Review Notifications
            </Link>
            <Link href="/admin/sources" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Manage Sources
            </Link>
            <Link href="/admin/payment-settings" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Payment Settings
            </Link>
            <Link href="/admin/payments" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              Verify Payments
            </Link>
            <AdminSignOut />
          </div>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">Recent applications</h2>
              <Link href="/track-application" className="text-sm font-semibold text-indigo-600">Search</Link>
            </div>

            <div className="space-y-4">
              {sampleApplications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{application.studentName}</p>
                      <p className="text-xs text-slate-500">{application.id} • {application.mobile}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Service: {application.service}</span>
                    <span>Payment: {application.paymentStatus}</span>
                    <span>Amount: {application.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Notification health</h2>
              <div className="mt-5 space-y-4">
                {notificationMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm text-slate-600 last:border-b-0 last:pb-0">
                    <span>{metric.label}</span>
                    <strong className="text-slate-900">{metric.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Priority actions</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Verify pending payment screenshots</li>
                <li>• Review automatic notification submissions</li>
                <li>• Request updated student documents</li>
                <li>• Mark completed applications</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
