import { SiteShell } from "@/components/site-shell";
import { AdminFormManager } from "@/components/admin-form-manager";
import { getNotificationPdfMaxSizeMb } from "@/lib/notification-pdf-config";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminFormsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdminPage();
  const { edit } = await searchParams;

  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0f4c81]">Form management</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">New Form Management</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            Drafts, approvals, and published forms
          </div>
        </div>

        <AdminFormManager maxPdfSizeMb={getNotificationPdfMaxSizeMb()} editId={edit} />
      </main>
    </SiteShell>
  );
}
