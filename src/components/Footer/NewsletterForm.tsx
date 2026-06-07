"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/app/newsletterActions";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Escreve o teu email");
      return;
    }

    if (!consent) {
      toast.error("Tens de aceitar receber emails para subscrever");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await subscribeNewsletter(email.trim());

      if (!result.success) {
        toast.error(result.error || "Não foi possível subscrever");
        return;
      }

      if (result.alreadySubscribed) {
        toast.success("Já estás subscrito. Obrigado!");
      } else {
        toast.success("Subscrição feita! Vais receber as novidades.");
      }

      setEmail("");
      setConsent(false);
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Não foi possível subscrever");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <h3 className="font-display text-base font-semibold text-foreground">
          Newsletter
        </h3>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Recebe um email quando há uma nova review ou publicação.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="o.teu@email.pt"
          autoComplete="email"
          disabled={isSubmitting}
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 font-body text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Mail className="h-4 w-4" />
          {isSubmitting ? "A subscrever..." : "Subscrever"}
        </button>
      </div>

      <label className="flex items-start gap-2 font-body text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={isSubmitting}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
        />
        <span>
          Aceito receber emails do Entre Livros e que o meu email seja guardado
          para esse fim. Posso cancelar a qualquer momento.
        </span>
      </label>
    </form>
  );
};

export default NewsletterForm;
