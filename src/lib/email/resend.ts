import { Resend } from 'resend'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.entrelivrosblog.pt'

const FROM =
  process.env.RESEND_FROM ?? 'Entre Livros <newsletter@entrelivrosblog.pt>'

export interface SubscriberTarget {
  email: string
  unsubscribe_token: string
}

export interface NewContentEmail {
  url: string
}

const SUBJECT = 'Há novidades no Entre Livros 📚'

const CHUNK = 100

function buildHtml(content: NewContentEmail, unsubscribeUrl: string) {
  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <p style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#999;margin:0 0 24px">Entre Livros</p>
      <h1 style="font-size:22px;line-height:1.3;margin:0 0 16px">Há novidades no site 📚</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 24px">
        Foi adicionado conteúdo novo ao Entre Livros. Passa pelo site para ver.
      </p>
      <a href="${content.url}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px">Ver no site</a>
      <hr style="border:none;border-top:1px solid #e5e0d8;margin:32px 0 16px" />
      <p style="font-size:12px;color:#999;line-height:1.5;margin:0">
        Recebes este email porque subscreveste a newsletter do Entre Livros.
        <a href="${unsubscribeUrl}" style="color:#999">Cancelar subscrição</a>.
      </p>
    </div>
  </body>
</html>`
}

/**
 * Sends the new-content email to every subscriber.
 * No-ops (logs) when RESEND_API_KEY is missing so publishing never breaks.
 */
export async function sendNewContentEmail(
  subscribers: SubscriberTarget[],
  content: NewContentEmail
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping newsletter send')
    return
  }
  if (subscribers.length === 0) return

  const resend = new Resend(apiKey)

  for (let i = 0; i < subscribers.length; i += CHUNK) {
    const batch = subscribers.slice(i, i + CHUNK).map((s) => {
      const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?token=${s.unsubscribe_token}`
      return {
        from: FROM,
        to: s.email,
        subject: SUBJECT,
        html: buildHtml(content, unsubscribeUrl),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    })

    try {
      const { error } = await resend.batch.send(batch)
      if (error) console.error('Resend batch error:', error)
    } catch (err) {
      console.error('Resend send failed:', err)
    }
  }
}
