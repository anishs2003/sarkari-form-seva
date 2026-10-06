import { SiteShell } from "@/components/site-shell";

export default function ContactPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Contact</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Get in touch with the service team</h1>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-sm text-slate-600">
              <p><strong className="text-slate-900">Phone:</strong> +91 7091670016</p>
              <p><strong className="text-slate-900">Email:</strong> anishsingh@outlook.in</p>
              <p><strong className="text-slate-900">WhatsApp:</strong> +91 7091670016</p>
              <p><strong className="text-slate-900">Address:</strong> INDRAPURI ROAD NO 8B KESHRI NAGAR PATNA NEAR CANARA BANK PATNA BIHAR PIN CODE 800024</p>
            </div>
            <form className="space-y-4">
              <input placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-3 py-3" />
              <input placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-3" />
              <textarea placeholder="Your message" rows={5} className="w-full rounded-xl border border-slate-200 px-3 py-3" />
              <button type="button" className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
