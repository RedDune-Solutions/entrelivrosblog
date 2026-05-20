import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

// Anon read-only client — no cookies, safe for static generation
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { auth: { persistSession: false } }
  );
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrelivros.vercel.app";

async function getPostEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("slug, updatedAt, publishedAt")
      .eq("published", true)
      .order("publishedAt", { ascending: false });

    if (error || !data) return [];

    return data.map((p) => ({
      url: `${BASE_URL}/posts/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error("sitemap posts fetch failed:", e);
    return [];
  }
}

async function getReviewLastModified(): Promise<Date> {
  try {
    const supabase = publicClient();
    const { data } = await supabase
      .from("BookReview")
      .select("reviewDate")
      .order("reviewDate", { ascending: false })
      .limit(1)
      .single();
    return data?.reviewDate ? new Date(data.reviewDate) : new Date();
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postEntries, homeLastMod] = await Promise.all([
    getPostEntries(),
    getReviewLastModified(),
  ]);

  return [
    {
      url: BASE_URL,
      lastModified: homeLastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/posts`,
      lastModified: postEntries[0]?.lastModified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/aboutMe`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
