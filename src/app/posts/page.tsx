import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";
import PostCard from "@/components/PostCard";
import { createPublicClient } from "@/lib/supabase/public";
import { withRetry } from "@/lib/retry";
import type { Post, PostWithBook } from "@/interface/post";

export const revalidate = 3600;

// Columns the card actually needs — never the full `body`.
const POST_CARD_COLUMNS =
  "id, slug, title, excerpt, coverImageUrl, bookId, published, publishedAt";

export const metadata = {
  // The root layout applies the "%s | Entre Livros" template, so no manual suffix.
  title: "Publicações",
  description: "Pensamentos, novidades e notas da autora.",
  alternates: { canonical: "/posts" },
};

async function getAllPosts(): Promise<PostWithBook[]> {
  // Cookie-less client + retry: keeps ISR working (no forced dynamic render)
  // and rides out a transient DB hiccup instead of showing an empty list.
  try {
    return await withRetry(async () => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("posts")
        .select(POST_CARD_COLUMNS)
        .eq("published", true)
        .order("publishedAt", { ascending: false });

      if (error) throw error;

      const posts = (data ?? []) as Post[];
      const bookIds = [...new Set(posts.map((p) => p.bookId).filter((id): id is number => id !== null))];

      if (bookIds.length === 0) return posts.map((p) => ({ ...p, book: null }));

      const { data: books } = await supabase
        .from("BookReview")
        .select("id, title, author")
        .in("id", bookIds);

      const byId = new Map((books ?? []).map((b) => [b.id, b]));
      return posts.map((p) => ({ ...p, book: p.bookId !== null ? byId.get(p.bookId) ?? null : null }));
    });
  } catch (e) {
    console.error("Failed to fetch posts:", e);
    return [];
  }
}

export default async function PostsIndex() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground">Publicações</h1>
          <p className="mt-2 font-body text-muted-foreground">
            Pensamentos, novidades e notas avulsas.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="py-16 text-center font-body text-muted-foreground">
            Ainda sem publicações. Volta em breve!
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} variant="full" />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
