import { SiteShell } from "@/components/site-shell";

export default function ArchivedFormsLoading() {
  return (
    <SiteShell>
      <main className="portal-main space-y-4" aria-busy="true" aria-label="Loading archived forms">
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
      </main>
    </SiteShell>
  );
}
