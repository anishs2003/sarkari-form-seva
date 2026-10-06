import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function StudentLoginPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Student login</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Access your account</h1>

          <form className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="Enter your password" />
            </div>
            <button type="button" className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
              Log In
            </button>
            <p className="text-sm text-slate-600">
              New here? <Link href="/student/register" className="font-semibold text-indigo-600">Create account</Link>
            </p>
          </form>
        </div>
      </main>
    </SiteShell>
  );
}
