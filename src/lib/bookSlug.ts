// Builds a human/SEO-friendly URL for a book review and extracts the id back.
// Format: "o-nome-do-livro-42" — the trailing number is the BookReview id, so
// lookups stay by primary key even though the URL reads nicely.

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function bookHref(book: { id: number; title: string }): string {
  const base = slugifyTitle(book.title)
  return `/livros/${base ? `${base}-${book.id}` : book.id}`
}

// Extracts the numeric id from the trailing "-<id>" (or a bare number).
export function bookIdFromSlug(slug: string): number | null {
  const m = slug.match(/(?:^|-)(\d+)$/)
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
