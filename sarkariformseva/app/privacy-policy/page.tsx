import { SiteShell } from "@/components/site-shell";

export default function PrivacyPolicyPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">How we protect your data</h1>
          <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
            <p>We collect only the data required to process your selected application and provide service support.</p>
            <p>Documents are stored in private cloud storage and are accessible only to authorized student or admin users through secure signed URLs.</p>
            <p>We do not sell personal data. We use your information only for application processing, communication, verification, and required compliance.</p>
            <p>By submitting documents, you consent that the provider may use the submitted information and documents only for processing the selected application.</p>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
