import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function AdminAccessDeniedPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-3 text-sm text-slate-600">
            This account does not have an admin, super_admin, or staff role.
          </p>
          <Link href="/admin/login" className="mt-6 inline-flex rounded-md bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white">
            Return to admin login
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
