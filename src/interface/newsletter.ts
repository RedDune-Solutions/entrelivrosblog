export interface NewsletterSubscriber {
  id: string
  email: string
  unsubscribe_token: string
  confirmed: boolean
  consent_at: string | null
  created_at: string
}
