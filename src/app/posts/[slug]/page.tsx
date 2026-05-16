import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/interface/post";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;
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
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) return { title: "Publicação não encontrada" };
  const { post } = result;
  return {
    title: `${post.title} | Entre Livros`,
    description: post.excerpt ?? post.body.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPost(slug);
  if (!result) notFound();
  const { post, book } = result;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
                href="/"
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
