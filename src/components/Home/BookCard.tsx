"use client"
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeClosed, Heart } from "lucide-react";
import StarRating from "../../app/layout/StarRating";
import type { BookReview } from "@/interface/book";
import Image from "next/image";

interface BookCardProps {
  book: BookReview;
  index: number;
  onSelect: (book: BookReview) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const BookCard = ({ book, index, onSelect, isExpanded, onToggle }: BookCardProps) => {
  return (
    /* 1. O Wrapper mantém o espaço na grid (h-full ou altura fixa se necessário) */
    <div className="relative min-h-[300px] w-full">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`group flex flex-col cursor-pointer rounded-lg bg-card p-5 shadow-sm border border-border/50 absolute top-0 left-0 w-full h-fit hover:overflow-hidden ${isExpanded ? "z-20 shadow-xl border-primary/30 " : "z-10 hover:z-20"} transition-all duration-300 hover:shadow-xl`}
        onClick={() => onSelect(book)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(book);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes de ${book.title} por ${book.author}`}
      >
        <div className="flex gap-5">
          <div className="w-24 shrink-0 overflow-hidden rounded-md">
            {book.bookCoverUrl ? (
              <Image
                src={book.bookCoverUrl}
                width={160}
                height={240}
                alt={`Capa de ${book.title}`}
                className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="96px"
              />
            ) : (
              <div className="h-36 w-full bg-muted flex items-center justify-center rounded-md">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between min-w-0 w-full">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 font-body text-xs font-medium text-secondary-foreground">
                  {book.genre}
                </span>
                {book.recommendation && (
                  <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                )}
              </div>
              <h3 className="font-display text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {book.title}
              </h3>
              <p className="mt-0.5 font-body text-sm text-muted-foreground">
                de {book.author}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <StarRating rating={book.rating} />
              <span className="font-body text-xs text-muted-foreground">
                {book?.reviewDate ? new Date(book.reviewDate).toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-primary">Sinopse</span>

             <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Recolher sinopse" : "Expandir sinopse"}
              className="sm:hidden flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-body text-xs font-medium text-primary hover:bg-accent transition-colors"
            >
              {isExpanded ? <EyeClosed className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>

          {/* line-clamp dá reticências automáticas quando o texto excede as linhas.
              Hover: até 7 linhas. */}
          <p className={`mt-1 font-body text-sm leading-relaxed text-muted-foreground transition-all duration-300 ${isExpanded ? "line-clamp-none" : "line-clamp-2"} group-hover:line-clamp-[7]`}>
            {book.sinopse}
          </p>
        </div>

        <div className="mt-1 flex items-center gap-1.5 font-body text-xs font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <BookOpen className="h-3.5 w-3.5" />
          Clica para ver a minha avaliação
        </div>
      </motion.article>
    </div>
  );
};

export default BookCard;
