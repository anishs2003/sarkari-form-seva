import { NewFormsDirectory } from "@/components/new-forms-directory";
import { SiteShell } from "@/components/site-shell";
import { getLatestPublishedFormsResult } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export default async function ArchivedFormsPage() {
  const result = await getLatestPublishedFormsResult(1000);

  return (
    <SiteShell>
      <NewFormsDirectory items={result.items} closed error={result.error} />
    </SiteShell>
  );
}
