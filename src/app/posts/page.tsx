import Navbar from "@/app/layout/NavBar";
import Footer from "@/app/layout/Footer";
import PostCard from "@/components/PostCard";
import { createClient } from "@/lib/supabase/server";
import type { Post, PostWithBook } from "@/interface/post";

export const revalidate = 3600;

export const metadata = {
  title: "Publicações | Entre Livros",
  description: "Pensamentos, novidades e notas da autora.",
};

async function getAllPosts(): Promise<PostWithBook[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("publishedAt", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const posts = (data ?? []) as Post[];
  const bookIds = [...new Set(posts.map((p) => p.bookId).filter((id): id is number => id !== null))];

  if (bookIds.length === 0) return posts.map((p) => ({ ...p, book: null }));

  const { data: books } = await supabase
    .from("BookReview")
    .select("id, title, author")
    .in("id", bookIds);

  const byId = new Map((books ?? []).map((b) => [b.id, b]));
  return posts.map((p) => ({ ...p, book: p.bookId !== null ? byId.get(p.bookId) ?? null : null }));
}

export default async function PostsIndex() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
