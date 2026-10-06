export function formatFeeAmount(value: string | undefined, fallback: string): string {
  const amount = value?.trim();
  if (!amount) return fallback;
  if (/^(₹|INR\b|free\b|nil\b|not applicable\b)/i.test(amount)) return amount;
  if (/^\d[\d,]*(\.\d{1,2})?$/.test(amount)) return `₹${amount}`;
  return amount;
}