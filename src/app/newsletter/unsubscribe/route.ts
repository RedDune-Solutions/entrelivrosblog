import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'

function shell(title: string, body: string, ok: boolean) {
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a">
    <div style="max-width:480px;margin:80px auto;padding:32px 24px;text-align:center">
      <p style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#999;margin:0 0 24px">Entre Livros</p>
      <h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:${ok ? '#444' : '#b91c1c'}">${body}</div>
      <a href="/" style="display:inline-block;margin-top:24px;color:#1a1a1a">Voltar ao site</a>
    </div>
  </body>
</html>`
}

function html(title: string, body: string, ok: boolean, status = 200) {
  return new Response(shell(title, body, ok), {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

// Confirmation page shown on GET. The actual unsubscribe happens on POST so
// that email link scanners / prefetchers (which only issue GET requests)
// can't silently consume the one-time token before the reader clicks.
function confirmPage(token: string) {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 24px">
      Queres mesmo cancelar a subscrição da newsletter do Entre Livros?
    </p>
    <form method="POST" action="/newsletter/unsubscribe">
      <input type="hidden" name="token" value="${token}" />
      <button type="submit"
        style="display:inline-block;background:#1a1a1a;color:#fff;border:0;cursor:pointer;padding:12px 24px;border-radius:6px;font-size:15px;font-family:inherit">
        Confirmar cancelamento
      </button>
    </form>`
  return html('Cancelar subscrição', body, true)
}

// Validate the token shape before touching the DB.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function unsubscribe(token: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('newsletter_unsubscribe', {
    p_token: token,
  })

  if (error) {
    console.error('Unsubscribe error:', error)
    return html(
      'Algo correu mal',
      'Não foi possível cancelar agora. Tenta de novo mais tarde.',
      false,
      500
    )
  }

  if (data === true) {
    return html(
      'Subscrição cancelada',
      'Já não vais receber emails do Entre Livros. Tens sempre as portas abertas para voltar.',
      true
    )
  }

  // Token not found = already unsubscribed (or a scanner got here first).
  // Treat as success: the reader's intent — not being subscribed — is met.
  return html(
    'Subscrição cancelada',
    'Já não estás subscrito na newsletter do Entre Livros.',
    true
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token || !UUID_RE.test(token)) {
    return html('Link inválido', 'Falta o código de cancelamento.', false, 400)
  }

  // GET never mutates: just show the confirmation button.
  return confirmPage(token)
}

export async function POST(req: NextRequest) {
  // Token can arrive via the confirm form (body) or the query string
  // (RFC 8058 List-Unsubscribe one-click POST).
  let token = req.nextUrl.searchParams.get('token')
  if (!token) {
    try {
      const form = await req.formData()
      token = (form.get('token') as string) || null
    } catch {
      token = null
    }
  }

  if (!token || !UUID_RE.test(token)) {
    return html('Link inválido', 'Falta o código de cancelamento.', false, 400)
  }

  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`unsubscribe:${ip}`, 20, 10 * 60 * 1000)
  if (!rl.allowed) {
    return html(
      'Demasiados pedidos',
      'Recebemos demasiados pedidos deste dispositivo. Tenta novamente mais tarde.',
      false,
      429
    )
  }

  return unsubscribe(token)
}
