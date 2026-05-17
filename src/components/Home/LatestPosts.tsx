"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PostWithBook } from "@/interface/post";
import PostCard from "../PostCard";

const GAP_PX = 16; // matches gap-4
const BOTTOM_BUFFER = 80; // space for footer link + margin
const XL_BREAKPOINT = 1280;
const MOBILE_DEFAULT = 3;

const LatestPosts = ({ posts }: { posts: PostWithBook[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState(posts.length);
  const [measured, setMeasured] = useState(false);

  useLayoutEffect(() => {
    if (posts.length === 0) return;

    let raf1 = 0;
    let raf2 = 0;

    const measure = () => {
      if (!containerRef.current) return;

      // Below xl: not a sticky sidebar — use small fixed default
      if (window.innerWidth < XL_BREAKPOINT) {
        setVisible(Math.min(MOBILE_DEFAULT, posts.length));
        setMeasured(true);
        return;
      }

      const top = containerRef.current.getBoundingClientRect().top;
      const available = window.innerHeight - top - BOTTOM_BUFFER;

      let used = 0;
      let count = 0;
      for (let i = 0; i < posts.length; i++) {
        const el = itemRefs.current[i];
        if (!el) break;
        const h = el.offsetHeight;
        used += h + (i > 0 ? GAP_PX : 0);
        if (used > available) break;
        count = i + 1;
      }
      setVisible(Math.max(1, count));
      setMeasured(true);
    };

    const schedule = () => {
      // Show all first so refs measure real heights, then trim next frame
      setVisible(posts.length);
      setMeasured(false);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(measure);
      });
    };

    schedule();
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [posts.length]);

  // Server-render with all visible so SSR matches a sensible default
  useEffect(() => {
    if (!measured) setVisible(posts.length);
  }, [measured, posts.length]);

  if (posts.length === 0) return null;

  return (
    <aside className="xl:sticky xl:top-24 xl:self-start">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        Últimas publicações
      </h2>
      <div ref={containerRef} className="flex flex-col gap-4">
        {posts.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={i >= visible ? "hidden" : ""}
          >
            <PostCard post={p} variant="sidebar" />
          </div>
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
