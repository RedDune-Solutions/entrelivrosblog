import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";
import { createPublicClient } from "@/lib/supabase/public";
import { withRetry } from "@/lib/retry";
import { bookHref } from "@/lib/bookSlug";
import { SITE_URL } from "@/lib/site";
import type { Post } from "@/interface/post";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  // Cookie-less client + retry so ISR keeps working and a transient DB error
  // never turns a live post into a 404.
  try {
    return await withRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;
      if (!data) return null;
      const post = data as Post;

      let book = null;
      if (post.bookId !== null) {
        const { data: b } = await supabase
          .from("BookReview")
          .select("id, title, author")
          .eq("id", post.bookId)
          .single();
        book = b ?? null;
      }
      return { post, book };
    });
  } catch (e) {
    console.error("Failed to fetch post:", e);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) return { title: "Publicação não encontrada" };
  const { post } = result;
  const description = post.excerpt ?? post.body.slice(0, 160);
  return {
    // Root layout applies "%s | Entre Livros" — no manual suffix.
    title: post.title,
    description,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) notFound();
  const { post, book } = result;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Person", name: "Tatiana Felício" },
    mainEntityOfPage: `${SITE_URL}/posts/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <article>
          <header className="mb-8">
            <p className="font-body text-sm text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-foreground">
              {post.title}
            </h1>
            {book && (
              <Link
                href={bookHref(book)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-body text-xs font-medium text-secondary-foreground hover:bg-accent"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Sobre: {book.title} — {book.author}
              </Link>
            )}
          </header>

          {post.coverImageUrl && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                width={1200}
                height={630}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          {post.excerpt && (
            <p className="mb-6 font-body text-lg leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}

          <div className="font-body text-base leading-relaxed text-foreground whitespace-pre-wrap">
            {post.body}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
