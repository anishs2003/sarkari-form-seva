import { SiteShell } from "@/components/site-shell";

export default function StudentRegisterPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Student registration</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Create your account</h1>

          <form className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="Enter full name" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mobile number</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="10-digit mobile number" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="Create a password" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">OTP</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="Enter verification code" />
            </div>
            <button type="button" className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
              Register & Verify OTP
            </button>
          </form>
        </div>
      </main>
    </SiteShell>
  );
}
