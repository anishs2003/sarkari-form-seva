import { SiteShell } from "@/components/site-shell";
import { PortalHome } from "@/components/portal-home";
import { getLatestPublishedNotificationsResult } from "@/lib/public-notifications";
import { getLatestPublishedFormsResult } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [notificationsResult, formsResult] = await Promise.all([
    getLatestPublishedNotificationsResult(1000),
    getLatestPublishedFormsResult(1000),
  ]);
  const dataError = [notificationsResult.error, formsResult.error].filter(Boolean).join(" ") || null;

  return (
    <SiteShell>
      <PortalHome items={notificationsResult.items} forms={formsResult.items} dataError={dataError} />
    </SiteShell>
  );
}
