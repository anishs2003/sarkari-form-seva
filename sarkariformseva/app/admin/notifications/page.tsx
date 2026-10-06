import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { AdminNotificationManager } from "@/components/admin-notification-manager";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminNotificationsPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Automatic notifications</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Pending review and approval</h1>
          </div>
          <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Back to dashboard
          </Link>
        </div>

        <AdminNotificationManager initialItems={[]} />
      </main>
    </SiteShell>
  );
}
