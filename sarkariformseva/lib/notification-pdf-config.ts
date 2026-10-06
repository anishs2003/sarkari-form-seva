export function getNotificationPdfMaxSizeMb(): number {
  const configured = Number(process.env.NOTIFICATION_PDF_MAX_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured : 10;
}
