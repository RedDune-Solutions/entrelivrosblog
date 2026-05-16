import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostWithBook } from "@/interface/post";
import PostCard from "../PostCard";

const LatestPosts = ({ posts }: { posts: PostWithBook[] }) => {
  if (posts.length === 0) return null;

  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        Últimas publicações
      </h2>
      <div className="flex flex-col gap-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} variant="sidebar" />
        ))}
      </div>
      <Link
        href="/posts"
        className="mt-4 inline-flex items-center gap-1 font-body text-sm font-medium text-primary hover:underline"
      >
        Ver todas as publicações
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
};

export default LatestPosts;
