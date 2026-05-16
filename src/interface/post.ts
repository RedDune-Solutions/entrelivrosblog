export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  body: string
  coverImageUrl: string | null
  bookId: number | null
  published: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface PostWithBook extends Post {
  book?: {
    id: number
    title: string
    author: string
  } | null
}

export type PostInput = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
