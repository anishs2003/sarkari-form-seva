import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-api-auth";

export async function requireAdminPage() {
  await connection();
  const admin = await getCurrentAdmin();
  if (!admin.authorized) {
    if (admin.status === 401) redirect("/admin/login");
    if (admin.status === 403) redirect("/admin/access-denied");
    redirect("/admin/login?error=unavailable");
  }
  return admin;
}
