import Hero from "@/components/Home/Hero";
import Recomendations from "@/components/Home/Recomendations";
import LatestPosts from "@/components/Home/LatestPosts";
import Footer from "@/app/layout/Footer";
import Navbar from "./layout/NavBar";
import { createPublicClient } from '@/lib/supabase/public'
import { withRetry } from '@/lib/retry'
import { BookReview } from "@/interface/book";
import { Post, PostWithBook } from "@/interface/post";

export const revalidate = 3600;

async function getBooks() : Promise<BookReview[]> {
  // Cookie-less client + retry so a single transient DB hiccup does not blank
  // the page, and so this route stays statically cacheable (ISR).
  return withRetry(async () => {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('BookReview')
      .select('id, title, author, rating, genre, reviewDate, sinopse, fullReview, recommendation, bookCoverUrl')
      .order('reviewDate', { ascending: false })

    if (error) {
      console.error('Failed to fetch books:', error)
      throw new Error('Failed to load book reviews')
    }

    return data ?? []
  })
}

async function getLatestPosts(): Promise<PostWithBook[]> {
  try {
    return await withRetry(async () => {
      const supabase = createPublicClient()

      const { data, error } = await supabase
        .from('posts')
        // Only the columns the cards use — never the full `body`, which would
        // otherwise be serialized into the home page's RSC payload unused.
        .select('id, slug, title, excerpt, coverImageUrl, bookId, published, publishedAt')
        .eq('published', true)
        .order('publishedAt', { ascending: false })
        .limit(10)

      if (error) throw error

      const posts = (data ?? []) as Post[]
      const bookIds = [...new Set(posts.map((p) => p.bookId).filter((id): id is number => id !== null))]

      if (bookIds.length === 0) {
        return posts.map((p) => ({ ...p, book: null }))
      }

      const { data: books } = await supabase
        .from('BookReview')
        .select('id, title, author')
        .in('id', bookIds)

      const byId = new Map((books ?? []).map((b) => [b.id, b]))
      return posts.map((p) => ({ ...p, book: p.bookId !== null ? byId.get(p.bookId) ?? null : null }))
    })
  } catch (e) {
    console.error('Failed to fetch posts:', e)
    return []
  }
}


const Home = async () => {
  let livros: BookReview[] = []
  let posts: PostWithBook[] = []
  let fetchError = false

  try {
    [livros, posts] = await Promise.all([getBooks(), getLatestPosts()])
  } catch (e) {
    console.error(e)
    fetchError = true
  }

  const categories = ['Todos', ...new Set(livros.map((livro) => livro.genre))]

  return (
    <div className="min-h-screen bg-background">
        <Navbar />

        <h1 className="sr-only">
          Entre Livros — recomendações e avaliações de livros por Tatiana Felício
        </h1>

        <Hero />

        {fetchError ? (
          <div className="mx-auto max-w-5xl px-4 py-12 text-center">
            <p className="text-muted-foreground">Não foi possível carregar as avaliações. Tenta novamente mais tarde.</p>
          </div>
        ) : (
          <div
            className={`mx-auto px-4 py-12 sm:px-6 grid gap-10 ${
              posts.length > 0
                ? "max-w-7xl 2xl:max-w-[1600px] xl:grid-cols-[3fr_1fr] 2xl:grid-cols-[4fr_1fr]"
                : "max-w-7xl"
            }`}
          >
            {posts.length > 0 && (
              <div className="xl:order-2">
                <LatestPosts posts={posts} />
              </div>
            )}
            <div className="xl:order-1 min-w-0">
              <Recomendations livros={livros} categories={categories} />
            </div>
          </div>
        )}

        <Footer />
    </div>
  );
};

export default Home;
