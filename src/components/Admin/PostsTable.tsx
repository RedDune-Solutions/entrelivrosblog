"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Post } from "@/interface/post";
import type { BookReview } from "@/interface/book";
import { addPost, updatePost, deletePost } from "@/app/admin/posts/actions";
import PostFormModal from "./PostFormModal";

interface PostsTableProps {
  posts: Post[];
  books: Pick<BookReview, "id" | "title">[];
}

const PostsTable = ({ posts, books }: PostsTableProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const bookTitleById = (id: number | null) =>
    id === null ? null : books.find((b) => b.id === id)?.title ?? `#${id}`;

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (p: Post) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof addPost>[0]) => {
    if (editing) {
      await updatePost(editing.id, data);
    } else {
      await addPost(data);
    }
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteTarget !== null) {
      await deletePost(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Publicação
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden md:table-cell">Livro</TableHead>
              <TableHead className="hidden sm:table-cell text-center">Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {bookTitleById(p.bookId) ?? "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.published
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.published ? "Publicado" : "Rascunho"}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                  {new Date(p.publishedAt).toLocaleDateString("pt-PT")}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Ainda não há publicações. Cria a primeira!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PostFormModal
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        post={editing}
        books={books}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. A publicação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default PostsTable;
