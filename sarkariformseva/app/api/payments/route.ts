import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPublishedFormBySlugResult } from "@/lib/public-forms";
import { deletePaymentScreenshot, uploadPaymentScreenshot } from "@/lib/payment-storage";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

export const runtime = "nodejs";

const screenshotTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "application/pdf": { extension: "pdf", signature: (bytes: Buffer) => bytes.subarray(0, 1024).includes(Buffer.from("%PDF-")) },
};

async function deletePaymentRecord(supabaseUrl: string, key: string, paymentId: string) {
  const url = new URL(`${supabaseUrl}/rest/v1/payments`);
  url.searchParams.set("id", `eq.${paymentId}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: supabaseHeaders(key),
    cache: "no-store",
  });
  if (!response.ok) console.error("Could not roll back an incomplete payment submission:", await supabaseErrorMessage(response));
}

export async function POST(request: Request) {
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const { url: supabaseUrl, key: serviceRoleKey } = database.config;

  const maxSizeMb = Number(process.env.PAYMENT_SCREENSHOT_MAX_SIZE_MB) > 0 ? Number(process.env.PAYMENT_SCREENSHOT_MAX_SIZE_MB) : 5;
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxSizeMb * 1024 * 1024 + 1024 * 1024) {
    return NextResponse.json({ error: `Screenshot must be ${maxSizeMb} MB or smaller.` }, { status: 413 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("screenshot");
  const slug = String(formData?.get("slug") ?? "").trim();
  const applicationId = String(formData?.get("applicationId") ?? "").trim();
  const amount = Number(formData?.get("amount"));
  const utrNumber = String(formData?.get("utrNumber") ?? "").trim();
  if (!(file instanceof File) || !slug || !/^[0-9a-f-]{36}$/i.test(applicationId) || !Number.isFinite(amount) || amount <= 0 || utrNumber.length < 6 || utrNumber.length > 120) {
    return NextResponse.json({ error: "Enter a valid amount and UTR, select a saved application, and upload a screenshot." }, { status: 400 });
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return NextResponse.json({ error: `Screenshot must be ${maxSizeMb} MB or smaller.` }, { status: 413 });
  }
  const fileType = screenshotTypes[file.type as keyof typeof screenshotTypes];
  if (!fileType || !file.name.toLowerCase().endsWith(`.${fileType.extension}`)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, WebP, or PDF payment screenshot." }, { status: 415 });
  }

  const formResult = await getPublishedFormBySlugResult(slug);
  if (formResult.error) return NextResponse.json({ error: formResult.error }, { status: 503 });
  const item = formResult.item;
  if (!item) return NextResponse.json({ error: "Published form was not found." }, { status: 404 });

  const applicationUrl = new URL(`${supabaseUrl}/rest/v1/applications`);
  applicationUrl.searchParams.set("select", "id,form_slug,payment_status,status");
  applicationUrl.searchParams.set("id", `eq.${applicationId}`);
  applicationUrl.searchParams.set("form_slug", `eq.${slug}`);
  const applicationResponse = await fetch(applicationUrl, {
    headers: supabaseHeaders(serviceRoleKey),
    cache: "no-store",
  });
  if (!applicationResponse.ok) return NextResponse.json({ error: `Could not verify the saved application: ${await supabaseErrorMessage(applicationResponse)}.` }, { status: 502 });
  const applications = await applicationResponse.json() as { id: string; payment_status: string; status: string }[];
  const application = applications[0];
  if (!application) return NextResponse.json({ error: "Saved application was not found for this form." }, { status: 404 });
  if (["Verification Pending", "Paid"].includes(application.payment_status)) {
    return NextResponse.json({ error: "Payment details have already been submitted for this application." }, { status: 409 });
  }

  const expectedServiceCharge = Number((item.serviceCharge ?? "").replace(/[^\d.]/g, ""));
  if (Number.isFinite(expectedServiceCharge) && expectedServiceCharge > 0 && amount !== expectedServiceCharge) {
    return NextResponse.json({ error: "Amount entered does not match this form's service charge." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!fileType.signature(bytes)) return NextResponse.json({ error: "The uploaded file does not match its file type." }, { status: 415 });

  const storagePath = `payment-screenshots/${randomUUID()}.${fileType.extension}`;
  let paymentId = "";
  try {
    const upload = await uploadPaymentScreenshot(storagePath, new Uint8Array(bytes), file.type);
    if (!upload.ok) return NextResponse.json({ error: "Could not securely store the screenshot." }, { status: 502 });

    const insert = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(serviceRoleKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify([{
        application_id: applicationId,
        amount,
        payment_method: "UPI",
        utr_number: utrNumber,
        payment_screenshot_url: storagePath,
        payment_status: "verification-pending",
        form_slug: item.slug,
        form_title: item.title,
        service_charge: item.serviceCharge ?? null,
        official_application_fee: item.applicationFee,
      }]),
      cache: "no-store",
    });
    if (!insert.ok) {
      await deletePaymentScreenshot(storagePath);
      const error = await supabaseErrorMessage(insert);
      console.error("Payment record creation failed:", error);
      return NextResponse.json({ error: `Payment details could not be queued for verification: ${error}.` }, { status: 502 });
    }
    const paymentRows = await insert.json() as { id?: unknown }[];
    paymentId = typeof paymentRows[0]?.id === "string" ? paymentRows[0].id : "";
    if (!paymentId) {
      await deletePaymentScreenshot(storagePath);
      return NextResponse.json({ error: "Payment details could not be confirmed for verification." }, { status: 502 });
    }

    const applicationUpdate = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${encodeURIComponent(applicationId)}`, {
      method: "PATCH",
      headers: {
        ...supabaseHeaders(serviceRoleKey),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ payment_status: "Verification Pending", status: "Payment Verification" }),
      cache: "no-store",
    });
    if (!applicationUpdate.ok) {
      console.error("Payment submission application update failed:", await supabaseErrorMessage(applicationUpdate));
      await deletePaymentRecord(supabaseUrl, serviceRoleKey, paymentId);
      paymentId = "";
      await deletePaymentScreenshot(storagePath);
      return NextResponse.json({ error: "Payment details could not be linked to the application. Please retry." }, { status: 502 });
    }

    paymentId = "";
    return NextResponse.json({ success: true, status: "verification-pending", applicationCode: undefined }, { status: 201 });
  } catch (error) {
    if (paymentId) await deletePaymentRecord(supabaseUrl, serviceRoleKey, paymentId).catch(() => undefined);
    await deletePaymentScreenshot(storagePath).catch(() => undefined);
    console.error("Payment submission failed.", error);
    return NextResponse.json({ error: "Payment submission is temporarily unavailable." }, { status: 503 });
  }
}
