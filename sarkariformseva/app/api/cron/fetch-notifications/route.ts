import { NextResponse } from "next/server";
import { getLatestPublishedNotificationsResult } from "@/lib/public-notifications";

export async function GET() {
  const result = await getLatestPublishedNotificationsResult(1000);
  if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: 503 });
  return NextResponse.json({
    success: true,
    message: "Current published notifications loaded from Supabase. No external source fetcher is configured.",
    fetched: result.items.length,
    nextRun: "1 hour from now",
    pendingReview: null,
  });
}
