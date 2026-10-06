import { AdminLoginForm } from "@/components/admin-login-form";
import { SiteShell } from "@/components/site-shell";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <SiteShell>
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f4c81]">Restricted access</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin / Staff Sign In</h1>
          <p className="my-5 text-sm text-slate-600">Sign in with the administrator credentials configured for this portal. Only accounts assigned the admin, super_admin, or staff role can continue.</p>
          {error === "unavailable" && <p role="alert" className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Admin sign-in is temporarily unavailable. Check the Supabase configuration and try again.</p>}
          <AdminLoginForm />
        </section>
      </main>
    </SiteShell>
  );
}
