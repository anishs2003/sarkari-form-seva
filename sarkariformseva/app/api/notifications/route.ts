import { NextResponse } from "next/server";
import { getLatestPublishedNotificationsResult } from "@/lib/public-notifications";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await getLatestPublishedNotificationsResult(Number(url.searchParams.get("limit") ?? 1000));
  if (result.error) return NextResponse.json({ success: false, error: result.error, items: [] }, { status: 503 });
  return NextResponse.json({
    success: true,
    items: result.items,
    total: result.items.length,
  });
}
