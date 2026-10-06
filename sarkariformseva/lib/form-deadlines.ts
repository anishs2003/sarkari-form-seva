import type { NotificationItem } from "@/lib/types";

const daysUntilLastDate = (lastDate: string, now = new Date()): number | null => {
  if (!lastDate) return null;

  let year: number;
  let month: number;
  let day: number;
  const isoDate = lastDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]);
    day = Number(isoDate[3]);
  } else {
    const parsed = new Date(lastDate);
    if (Number.isNaN(parsed.getTime())) return null;
    year = parsed.getFullYear();
    month = parsed.getMonth() + 1;
    day = parsed.getDate();
  }

  const deadline = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((deadline - today) / 86_400_000);
};

export function formatPublicDate(date: string): string {
  const isoDate = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date || "To be announced";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(parsed);
}

export function isExpiredForm(item: NotificationItem, now = new Date()): boolean {
  const daysLeft = daysUntilLastDate(item.lastDate, now);
  return daysLeft !== null && daysLeft < 0;
}

export function isVisibleInActiveForms(item: NotificationItem, now = new Date()): boolean {
  return item.status === "published" && (!isExpiredForm(item, now) || item.keepVisibleAfterLastDate === true);
}

export function isInClosedForms(item: NotificationItem, now = new Date()): boolean {
  return item.status === "published" && isExpiredForm(item, now) && item.keepVisibleAfterLastDate !== true;
}

export function getLastDateLabel(item: NotificationItem, now = new Date()): "Last Date Soon" | "Application Closed" | null {
  const daysLeft = daysUntilLastDate(item.lastDate, now);
  if (daysLeft === null) return null;
  if (daysLeft < 0) return "Application Closed";
  if (daysLeft <= 7) return "Last Date Soon";
  return null;
}
