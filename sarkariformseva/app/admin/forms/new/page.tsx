import Link from "next/link";
import { AdminNewForm } from "@/components/admin-new-form";
import { SiteShell } from "@/components/site-shell";
import { getNotificationPdfMaxSizeMb } from "@/lib/notification-pdf-config";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminNewFormPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin/forms" className="text-sm font-semibold text-[#0f4c81] hover:underline">Forms</Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Add New Form</h1>
          </div>
        </div>
        <AdminNewForm maxPdfSizeMb={getNotificationPdfMaxSizeMb()} />
      </main>
    </SiteShell>
  );
}
