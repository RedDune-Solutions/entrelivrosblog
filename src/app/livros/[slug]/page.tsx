import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, Heart } from "lucide-react";
import type { Metadata } from "next";
import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";
import StarRating from "@/app/layout/StarRating";
import { createPublicClient } from "@/lib/supabase/public";
import { withRetry } from "@/lib/retry";
import { bookHref, bookIdFromSlug } from "@/lib/bookSlug";
import { SITE_URL } from "@/lib/site";
import type { BookReview } from "@/interface/book";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBook(id: number): Promise<BookReview | null> {
  try {
    return await withRetry(async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("BookReview")
        .select(
          "id, title, author, rating, genre, reviewDate, sinopse, fullReview, recommendation, bookCoverUrl"
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      return (data as BookReview) ?? null;
    });
  } catch (e) {
    console.error("Failed to fetch book review:", e);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = bookIdFromSlug(slug);
  if (!id) return { title: "Livro não encontrado" };
  const book = await getBook(id);
  if (!book) return { title: "Livro não encontrado" };

  const description =
    book.sinopse?.slice(0, 160) ??
    `Avaliação de ${book.title} de ${book.author} no Entre Livros.`;
  const canonical = bookHref(book);

  return {
    title: `${book.title} — ${book.author}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${book.title} — ${book.author}`,
      description,
      url: canonical,
      type: "article",
      images: book.bookCoverUrl ? [book.bookCoverUrl] : undefined,
    },
    twitter: {
      card: book.bookCoverUrl ? "summary_large_image" : "summary",
      title: `${book.title} — ${book.author}`,
      description,
      images: book.bookCoverUrl ? [book.bookCoverUrl] : undefined,
    },
  };
}

export default async function BookReviewPage({ params }: PageProps) {
  const { slug } = await params;
  const id = bookIdFromSlug(slug);
  if (!id) notFound();

  const book = await getBook(id);
  if (!book) notFound();

  // Canonicalise: if the title-derived slug drifted (title edited), redirect.
  const canonicalSlug = bookHref(book).replace("/livros/", "");
  if (slug !== canonicalSlug) redirect(bookHref(book));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Book",
      name: book.title,
      author: { "@type": "Person", name: book.author },
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: book.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: { "@type": "Person", name: "Tatiana Felício" },
    ...(book.reviewDate ? { datePublished: book.reviewDate } : {}),
    reviewBody: book.fullReview,
    url: `${SITE_URL}${bookHref(book)}`,
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
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="w-40 shrink-0 self-center sm:self-start">
              {book.bookCoverUrl ? (
                <Image
                  src={book.bookCoverUrl}
                  alt={`Capa de ${book.title}`}
                  width={160}
                  height={240}
                  className="w-full rounded-md shadow-md"
                  sizes="160px"
                  priority
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md bg-muted shadow-md">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <header className="min-w-0 flex-1">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-body text-xs font-medium text-secondary-foreground">
                {book.genre}
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground">
                {book.title}
              </h1>
              <p className="mt-1 font-body text-muted-foreground">de {book.author}</p>
              <div className="mt-3 flex items-center gap-3">
                <StarRating rating={book.rating} />
                {book.recommendation && (
                  <span className="flex items-center gap-1 font-body text-xs font-medium text-primary">
                    <Heart className="h-3.5 w-3.5 fill-primary" />
                    Recomendado
                  </span>
                )}
              </div>
              {book.reviewDate && (
                <p className="mt-1 font-body text-xs text-muted-foreground">
                  Avaliação de{" "}
                  {new Date(book.reviewDate).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </header>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-primary">Sinopse</h2>
            <p className="mt-2 whitespace-pre-wrap font-body text-base leading-relaxed text-foreground/90">
              {book.sinopse}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold text-primary">
              A minha avaliação
            </h2>
            <p className="mt-2 whitespace-pre-wrap font-body text-base leading-relaxed text-foreground/90">
              {book.fullReview}
            </p>
          </section>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-primary hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              Ver todas as avaliações
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
