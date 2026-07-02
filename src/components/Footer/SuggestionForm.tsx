"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { createSuggestion } from "@/app/suggestionActions";

const MAX_LEN = 500;

const SuggestionForm = () => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Escreve a tua sugestão");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSuggestion(text.trim());

      if (!result.success) {
        toast.error(result.error || "Não foi possível enviar a sugestão");
        return;
      }

      setText("");
      toast.success("Obrigado pela sugestão!");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("Não foi possível enviar a sugestão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_LEN) {
      setText(e.target.value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <h3 className="font-display text-base font-semibold text-foreground">
          Deixa uma sugestão
        </h3>
        <p className="font-body text-xs text-muted-foreground mt-1">
          O que gostavas de ver no site? É anónimo.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-2">
        <label htmlFor="suggestion-text" className="sr-only">
          A tua sugestão
        </label>
        <textarea
          id="suggestion-text"
          value={text}
          onChange={handleChange}
          placeholder="A tua ideia, livro que queres ver, melhoria..."
          rows={3}
          disabled={isSubmitting}
          aria-label="A tua sugestão"
          className="w-full resize-none rounded border-none bg-transparent font-body text-sm text-foreground placeholder-muted-foreground focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-body text-xs text-muted-foreground">
            {text.length}/{MAX_LEN}
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 font-body text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Lightbulb className="h-4 w-4" />
            {isSubmitting ? "A enviar..." : "Enviar"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SuggestionForm;
