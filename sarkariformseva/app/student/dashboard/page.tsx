import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { sampleApplications } from "@/lib/data";

export default function StudentDashboardPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, Aditi</h1>
          </div>
          <Link href="/apply-through-us" className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
            New Application
          </Link>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["My Applications", "04"],
            ["Payment History", "02"],
            ["Documents", "12"],
            ["Notifications", "07"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">My applications</h2>
              <Link href="/track-application" className="text-sm font-semibold text-indigo-600">Track status</Link>
            </div>
            <div className="space-y-4">
              {sampleApplications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{application.service}</p>
                      <p className="text-xs text-slate-500">{application.id}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {application.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Current step: {application.currentStep}</span>
                    <span>Payment: {application.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Recent messages</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Payment verification pending</li>
                <li>• Documents requested for SSC CGL</li>
                <li>• Form filling started</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Upload documents</h2>
              <button className="mt-4 w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
                Manage Documents
              </button>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
