import type { NotificationItem } from "@/lib/types";

type DuplicateCandidate = Pick<NotificationItem,
  "title" | "organization" | "applicationStartDate" | "lastDate" | "examDate" |
  "officialNotificationUrl" | "notificationPdfUrl" | "officialWebsiteUrl" | "applyOnlineUrl"
>;

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return trimmed.replace(/\/$/, "").toLowerCase();
  }
}

export function findDuplicateForms(items: NotificationItem[], candidate: DuplicateCandidate, excludeId?: string): NotificationItem[] {
  const candidateNotificationUrls = [candidate.officialNotificationUrl, candidate.notificationPdfUrl].map(normalizeUrl).filter(Boolean);
  const candidateOfficialUrls = [candidate.officialWebsiteUrl, candidate.applyOnlineUrl].map(normalizeUrl).filter(Boolean);
  const candidateDates = [candidate.applicationStartDate, candidate.lastDate, candidate.examDate].filter(Boolean);

  return items.filter((item) => {
    if (item.id === excludeId) return false;
    const titleMatches = normalizeText(item.title) === normalizeText(candidate.title);
    const organizationMatches = normalizeText(item.organization) === normalizeText(candidate.organization);
    const itemDates = [item.applicationStartDate, item.lastDate, item.examDate].filter(Boolean);
    const dateMatches = candidateDates.some((date) => itemDates.includes(date));
    const notificationUrlMatches = candidateNotificationUrls.some((url) =>
      [item.officialNotificationUrl, item.notificationPdfUrl].map(normalizeUrl).includes(url),
    );
    const officialUrlMatches = candidateOfficialUrls.some((url) =>
      [item.officialWebsiteUrl, item.applyOnlineUrl].map(normalizeUrl).includes(url),
    );

    return notificationUrlMatches || officialUrlMatches || (titleMatches && organizationMatches) || ((titleMatches || organizationMatches) && dateMatches);
  });
}
