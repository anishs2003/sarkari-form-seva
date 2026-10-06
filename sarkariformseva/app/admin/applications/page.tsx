import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { AdminApplicationReview } from "@/components/admin-application-review";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminApplicationsPage() {
  await requireAdminPage();
  return <SiteShell><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f4c81]">Student service operations</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Applications</h1><p className="mt-2 mb-6 text-sm text-slate-600"><Link href="/admin/payments" className="font-semibold text-[#0f4c81] underline">Verify payments</Link> before processing paid applications.</p><AdminApplicationReview /></main></SiteShell>;
}
