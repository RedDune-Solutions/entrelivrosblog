import type { Metadata } from "next";
import Content from "@/components/AboutMe/Content";
import Footer from "@/app/layout/Footer";
import Navbar from "../layout/NavBar";
import { createPublicClient } from "@/lib/supabase/public";
import { withRetry } from "@/lib/retry";

export const metadata: Metadata = {
  title: "Sobre Mim",
  description:
    "Conhece a Tatiana Felício, a leitora por detrás do blog Entre Livros. Descobre a sua história, os seus gostos literários e o que a inspira.",
  alternates: { canonical: "/aboutMe" },
};

export const revalidate = 3600;

// Only `genre` is needed (count + favourite genre). Retry rides out transient
// errors so we don't cache "0 livros" for an hour on a single hiccup.
async function getGenres(): Promise<string[]> {
  try {
    return await withRetry(async () => {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('BookReview')
        .select('genre')
      if (error) throw error
      return (data ?? []).map((r) => r.genre as string)
    })
  } catch (err) {
    console.error('aboutMe getGenres failed:', err)
    return []
  }
}


const About = async () => {

  const genres = await getGenres();
  const quantidadeDeLivros = genres.length;
  const favCategory = genres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoriaFavorita = Object.keys(favCategory).length > 0
    ? Object.keys(favCategory).reduce((a, b) => favCategory[a] > favCategory[b] ? a : b)
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <Content quantidadeDeLivros={quantidadeDeLivros} categoriaFavorita={categoriaFavorita} />

      <Footer />

    </div>
  );
};

export default About;