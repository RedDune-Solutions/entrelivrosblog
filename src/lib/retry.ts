// Retries an async operation a few times with exponential backoff. Used to
// ride out transient database/network hiccups (e.g. "connection reset by peer")
// that would otherwise blank a page on a single failed fetch.
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 150
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseMs * 2 ** i))
      }
    }
  }
  throw lastError
}
