"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Suggestion } from "@/interface/suggestion";
import { markSuggestionAsRead, deleteSuggestion } from "@/app/admin/actions";

interface SuggestionsTableProps {
  suggestions: Suggestion[];
}

const SuggestionsTable = ({ suggestions }: SuggestionsTableProps) => {
  const [rows, setRows] = useState<Suggestion[]>(suggestions);

  const handleMarkRead = async (id: string) => {
    setRows((r) => r.map((s) => (s.id === id ? { ...s, is_read: true } : s)));
    const result = await markSuggestionAsRead(id);
    if (!result.success) {
      setRows((r) => r.map((s) => (s.id === id ? { ...s, is_read: false } : s)));
      toast.error("Não foi possível marcar como lida");
    }
  };

  const handleDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r.filter((s) => s.id !== id));
    const result = await deleteSuggestion(id);
    if (!result.success) {
      setRows(prev);
      toast.error("Não foi possível apagar");
    } else {
      toast.success("Sugestão apagada");
    }
  };

  if (rows.length === 0) {
    return (
      <p className="mt-8 py-8 text-center font-body text-sm text-muted-foreground">
        Ainda não há sugestões.
      </p>
    );
  }

  return (
    <ul className="mt-8 space-y-3">
      {rows.map((s) => (
        <li
          key={s.id}
          className={`rounded-lg border p-4 ${
            s.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm text-foreground whitespace-pre-wrap">
                {s.suggestion_text}
              </p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                {!s.is_read && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                    Nova
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!s.is_read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(s.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Marcar como lida"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Apagar sugestão"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default SuggestionsTable;
