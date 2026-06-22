import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText } from "lucide-react";
import type { PostWithBook } from "@/interface/post";

interface PostCardProps {
  post: PostWithBook;
  variant?: "sidebar" | "full";
}

const PostCard = ({ post, variant = "sidebar" }: PostCardProps) => {
  const compact = variant === "sidebar";
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block rounded-lg border border-border/50 bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30"
    >
      {post.coverImageUrl ? (
        <div className={`relative overflow-hidden rounded-md ${compact ? "h-28" : "h-48"} mb-3`}>
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={compact ? "300px" : "(min-width: 1024px) 600px, 100vw"}
          />
        </div>
      ) : (
        <div className={`flex ${compact ? "h-28" : "h-32"} items-center justify-center bg-muted`}>
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-body text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString("pt-PT")}
        </span>
        {post.book && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            <BookOpen className="h-3 w-3" />
            {post.book.title}
          </span>
        )}
      </div>

      <h3
        className={`font-display font-semibold leading-tight text-foreground group-hover:text-primary transition-colors ${
          compact ? "text-base" : "text-xl"
        }`}
      >
        {post.title}
      </h3>

      {post.excerpt && (
        <p
          className={`mt-1.5 font-body text-sm leading-relaxed text-muted-foreground ${
            compact ? "line-clamp-2" : "line-clamp-3"
          }`}
        >
          {post.excerpt}
        </p>
      )}
    </Link>
  );
};

export default PostCard;
