"use client";

import { useState } from "react";
import Table from "./Table";
import PostsTable from "./PostsTable";
import type { BookReview, BookComment } from "@/interface/book";
import type { Post } from "@/interface/post";

interface AdminTabsProps {
  books: BookReview[];
  unreadComments: BookComment[];
  posts: Post[];
}

const AdminTabs = ({ books, unreadComments, posts }: AdminTabsProps) => {
  const [tab, setTab] = useState<"reviews" | "posts">("reviews");

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={`rounded-md px-4 py-1.5 font-body text-sm font-medium transition-colors ${
            tab === "reviews"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reviews
        </button>
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`rounded-md px-4 py-1.5 font-body text-sm font-medium transition-colors ${
            tab === "posts"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Publicações
        </button>
      </div>

      {tab === "reviews" ? (
        <Table tabela={books} unreadComments={unreadComments} />
      ) : (
        <div className="mt-8">
          <PostsTable
            posts={posts}
            books={books.map((b) => ({ id: b.id, title: b.title }))}
          />
        </div>
      )}
    </div>
  );
};

export default AdminTabs;
