"use client";

import { SiteShell } from "@/components/site-shell";

export default function ArchivedFormsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SiteShell>
      <main className="portal-main">
        <section role="alert" className="portal-section border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-bold">Closed forms are temporarily unavailable</h1>
          <p className="mt-2">The form database could not be reached. Please try again.</p>
          <button type="button" onClick={reset} className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold">Try again</button>
        </section>
      </main>
    </SiteShell>
  );
}
