import { NextResponse } from "next/server";
import { sampleApplications } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json();
  const applicationId = String(body?.applicationId ?? "").trim();
  const mobile = String(body?.mobile ?? "").trim();

  const application = sampleApplications.find(
    (item) => item.id.toLowerCase() === applicationId.toLowerCase() && item.mobile === mobile,
  );

  if (!application) {
    return NextResponse.json(
      {
        success: false,
        error: "Application ID and mobile number do not match.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    application,
  });
}
