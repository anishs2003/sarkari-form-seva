import { AdminSourceManager } from "@/components/admin-source-manager";
import { SiteShell } from "@/components/site-shell";
import { requireAdminPage } from "@/lib/admin-page-auth";

const sources = [
  { name: "SSC Official Feed", website: "ssc.nic.in", type: "RSS", checked: "10 mins ago", status: "Active" },
  { name: "UPSC Public Notice", website: "upsc.gov.in", type: "Public URL", checked: "22 mins ago", status: "Enabled" },
  { name: "RRB Portal", website: "rrbcdg.gov.in", type: "API", checked: "40 mins ago", status: "Healthy" },
];

export default async function NotificationSourcesPage() {
  await requireAdminPage();
  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Admin sources</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Notification source management</h1>
          </div>
        </div>

        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo admin mode: changes are saved only in this browser. URL checks validate format and do not fetch or sync official notices.
        </p>
        <AdminSourceManager initialSources={sources} />
      </main>
    </SiteShell>
  );
}
