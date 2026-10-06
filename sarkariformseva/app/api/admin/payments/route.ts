import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-api-auth";
import { createPaymentScreenshotUrl, isPaymentScreenshotPath } from "@/lib/payment-storage";
import { supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

type PaymentRow = {
  id: string;
  application_id: string | null;
  amount: number | string;
  utr_number: string | null;
  payment_screenshot_url: string | null;
  payment_status: string;
  form_slug: string | null;
  form_title: string | null;
  service_charge: string | null;
  official_application_fee: string | null;
  created_at: string;
};

function getConfig() {
  return tryGetSupabaseServerConfig();
}

export async function GET(request: Request) {
  const database = getConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(`${config.url}/rest/v1/payments`);
  url.searchParams.set("select", "id,application_id,amount,utr_number,payment_screenshot_url,payment_status,form_slug,form_title,service_charge,official_application_fee,created_at");
  url.searchParams.set("payment_status", "eq.verification-pending");
  url.searchParams.set("order", "created_at.desc");

  try {
    const response = await fetch(url, {
      headers: supabaseHeaders(config.key),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Could not load pending payments." }, { status: 502 });
    const rows = await response.json() as PaymentRow[];
    const items = await Promise.all(rows.map(async (row) => ({
      ...row,
      screenshot_url: row.payment_screenshot_url && isPaymentScreenshotPath(row.payment_screenshot_url)
        ? await createPaymentScreenshotUrl(row.payment_screenshot_url).catch(() => "")
        : "",
    })));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Payment review list failed.", error);
    return NextResponse.json({ error: "Could not load pending payments." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const database = getConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null) as { id?: unknown; action?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action;
  if (!/^[0-9a-f-]{36}$/i.test(id) || (action !== "verify" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid payment review action." }, { status: 400 });
  }

  const url = new URL(`${config.url}/rest/v1/payments`);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("payment_status", "eq.verification-pending");
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: supabaseHeaders(config.key, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        payment_status: action === "verify" ? "verified" : "rejected",
        rejection_reason: action === "reject" ? "Rejected by administrator" : null,
      }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Could not update payment status." }, { status: 502 });
    const updated = await response.json() as PaymentRow[];
    if (!updated.length) return NextResponse.json({ error: "Payment is no longer pending review." }, { status: 409 });
    const payment = updated[0];
    if (payment.application_id) {
      const applicationUrl = new URL(`${config.url}/rest/v1/applications`);
      applicationUrl.searchParams.set("id", `eq.${payment.application_id}`);
      const applicationUpdate = await fetch(applicationUrl, {
        method: "PATCH",
        headers: supabaseHeaders(config.key, {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        }),
        body: JSON.stringify(action === "verify"
          ? { payment_status: "Paid", status: "Under Review" }
          : { payment_status: "Rejected", status: "Payment Pending" }),
        cache: "no-store",
      });
      if (!applicationUpdate.ok) {
        console.error("Payment status changed but application status update failed.", await applicationUpdate.text());
        return NextResponse.json({ error: "Payment reviewed, but application status could not be updated." }, { status: 502 });
      }
    }
    return NextResponse.json({ success: true, status: updated[0].payment_status });
  } catch (error) {
    console.error("Payment status update failed.", error);
    return NextResponse.json({ error: "Could not update payment status." }, { status: 503 });
  }
}
