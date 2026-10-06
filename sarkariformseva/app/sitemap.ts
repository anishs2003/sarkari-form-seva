import type { MetadataRoute } from "next";
import { getAllPublishedNotifications } from "@/lib/public-notifications";
import { getAllPublishedForms } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [publishedForms, publishedNotifications] = await Promise.all([getAllPublishedForms(), getAllPublishedNotifications()]);

  const staticRoutes = ["", "/notifications", "/new-forms", "/archived-forms", "/apply-through-us", "/track-application", "/contact", "/privacy-policy", "/terms-conditions", "/refund-policy"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...publishedNotifications.map((notification) => ({
      url: `${baseUrl}/notification/${notification.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...publishedForms.map((form) => ({
      url: `${baseUrl}/forms/${form.slug}`,
      lastModified: form.fetchedDate ? new Date(form.fetchedDate) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];
}
