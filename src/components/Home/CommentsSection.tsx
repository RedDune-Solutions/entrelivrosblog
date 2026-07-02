"use client";

import { BookComment } from "@/interface/book";
import { ChevronDown, ChevronUp, MessageCircle, Edit3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import CommentForm from "./CommentForm";
import { useBookComments } from "@/hooks/useBookComments";
import { generateUserIdentifier } from "@/lib/userIdentifier";
import { ensureAnonUserId, getAnonUserId } from "@/lib/supabase/anon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommentsSectionProps {
  bookId: number;
  comments: BookComment[];
  onCommentAdded: () => void;
  isLoading: boolean;
  error: string | null;
}

const CommentsSection = ({
  bookId,
  comments,
  onCommentAdded,
  isLoading,
  error,
}: CommentsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateComment, deleteComment } = useBookComments(bookId);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [currentUserIdentifier, setCurrentUserIdentifier] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Read the existing session id (without creating one — passive readers stay
  // cookie-free) and the local anonymous id, to decide which comments are the
  // visitor's own.
  useEffect(() => {
    const init = async () => {
      try {
        setCurrentUserId(await getAnonUserId());
        setCurrentUserIdentifier(await generateUserIdentifier());
      } catch (error) {
        console.error("Error initialising comment identity:", error);
      }
    };

    init();
  }, []);

  // A comment is the current visitor's when it belongs to their session, or
  // (for legacy comments with no session) when the fingerprint matches.
  const isOwnComment = (comment: BookComment) =>
    (currentUserId != null && comment.user_id === currentUserId) ||
    (comment.user_id == null &&
      currentUserIdentifier != null &&
      comment.user_identifier === currentUserIdentifier);

  const handleEditClick = (comment: BookComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;

    try {
      await ensureAnonUserId();
      const userIdentifier = await generateUserIdentifier();
      const result = await updateComment(editingCommentId, {
        user_identifier: userIdentifier,
        comment_text: editText.trim(),
      });

      if (result) {
        toast.success("Comentário atualizado com sucesso!");
        setEditingCommentId(null);
        setEditText("");
        onCommentAdded(); // Refresh comments
      } else {
        toast.error("Erro ao atualizar comentário");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Erro ao atualizar comentário");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  const handleDeleteClick = async (commentId: string) => {
    setConfirmingDeleteId(null);
    try {
      await ensureAnonUserId();
      const userIdentifier = await generateUserIdentifier();
      const result = await deleteComment(commentId, userIdentifier);

      if (result) {
        toast.success("Comentário excluído com sucesso!");
        onCommentAdded(); // Refresh comments
      } else {
        toast.error("Erro ao excluir comentário");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário");
    }
  };

  return (
    <div className="mt-4 border-t border-border/50 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="comments-panel"
        className="flex w-full items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 font-body text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span>
            Comentários ({comments.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div id="comments-panel" className="mt-3 space-y-3">
          <div role="status" aria-live="polite">
            {isLoading && (
              <p className="text-center font-body text-xs text-muted-foreground py-4">
                A carregar comentários...
              </p>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 font-body text-xs text-destructive">
                Erro: {error}
              </div>
            )}

            {!isLoading && comments.length === 0 && (
              <p className="text-center font-body text-sm text-muted-foreground py-4">
                Sem comentários ainda. Sê o primeiro a comentar!
              </p>
            )}
          </div>

          <CommentForm bookId={bookId} onCommentAdded={onCommentAdded} />

          {comments.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md bg-muted/40 p-3"
                >
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full resize-none rounded border border-border bg-background font-body text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                        maxLength={250}
                      />
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs text-muted-foreground">
                          {editText.length}/250
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCancelEdit}
                            className="font-body text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editText.trim() || editText.length > 250}
                            className="font-body text-xs"
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 font-body text-xs text-foreground break-words">
                          {comment.comment_text}
                        </p>
                        {isOwnComment(comment) && (
                          confirmingDeleteId === comment.id ? (
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="font-body text-xs text-muted-foreground">
                                Apagar?
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 px-2 font-body text-xs"
                                onClick={() => handleDeleteClick(comment.id)}
                              >
                                Sim
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 px-2 font-body text-xs"
                                onClick={() => setConfirmingDeleteId(null)}
                              >
                                Não
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Editar comentário"
                                className="h-6 w-6 p-1 hover:bg-muted"
                                onClick={() => handleEditClick(comment)}
                              >
                                <Edit3 className="h-3 w-3" aria-hidden="true" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Apagar comentário"
                                className="h-6 w-6 p-1 hover:bg-muted"
                                onClick={() => setConfirmingDeleteId(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                      <p className="mt-1.5 font-body text-xs text-muted-foreground">
                        {(() => {
                          const date = new Date(comment.created_at);
                          return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        })()}{" "}
                        {comment.updated_at !== comment.created_at && comment.updated_at &&
                          `(Editado em ${(() => {
                            const date = new Date(comment.updated_at);
                            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                          })()})`}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
