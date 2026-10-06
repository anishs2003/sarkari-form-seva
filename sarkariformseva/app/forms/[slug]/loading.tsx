import { SiteShell } from "@/components/site-shell";

export default function FormDetailLoading() {
  return (
    <SiteShell>
      <main className="portal-main space-y-5" aria-busy="true" aria-label="Loading form details">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      </main>
    </SiteShell>
  );
}
