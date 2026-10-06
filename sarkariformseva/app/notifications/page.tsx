import { NotificationDirectory } from "@/components/notification-directory";
import { SiteShell } from "@/components/site-shell";
import { getLatestPublishedNotificationsResult } from "@/lib/public-notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "All" } = await searchParams;
  const result = await getLatestPublishedNotificationsResult(1000);

  return (
    <SiteShell>
      <NotificationDirectory items={result.items} initialCategory={category} error={result.error} />
    </SiteShell>
  );
}
