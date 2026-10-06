import { ApplicationTracker } from "@/components/application-tracker";
import { SiteShell } from "@/components/site-shell";

export default async function TrackApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const { applicationId = "" } = await searchParams;

  return (
    <SiteShell>
      <ApplicationTracker initialApplicationId={applicationId} />
    </SiteShell>
  );
}
