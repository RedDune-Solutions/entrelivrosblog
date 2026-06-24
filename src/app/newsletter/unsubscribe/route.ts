import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'

// Standalone page styled to match the site: Playfair Display headings,
// Source Sans body, the warm palette from globals.css, logo header and a
// terracotta primary button. Kept as a route handler (not a page) so the
// prefetch-safe GET/POST split and RFC 8058 one-click keep working.
function shell(title: string, inner: string, ok: boolean) {
  const accent = ok ? 'hsl(20 8% 40%)' : 'hsl(0 60% 42%)'
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · Entre Livros</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      a:hover { text-decoration: underline; }
      .btn { transition: filter .15s ease; }
      .btn:hover { filter: brightness(1.06); }
    </style>
  </head>
  <body style="min-height:100vh;display:flex;flex-direction:column;background:hsl(36 33% 97%);color:hsl(20 10% 15%);font-family:'Source Sans 3',system-ui,sans-serif">
    <header style="border-bottom:1px solid hsl(30 15% 85%)">
      <div style="max-width:1120px;margin:0 auto;padding:14px 24px">
        <a href="/" aria-label="Entre Livros" style="display:inline-block">
          <img src="/logo.svg" alt="Entre Livros" style="height:38px;width:auto;display:block" />
        </a>
      </div>
    </header>
    <main style="flex:1;display:flex;align-items:center;justify-content:center;padding:48px 20px">
      <div style="width:100%;max-width:440px;background:hsl(36 30% 95%);border:1px solid hsl(30 15% 85%);border-radius:14px;padding:40px 32px;text-align:center;box-shadow:0 1px 3px rgba(20,16,12,.05)">
        <p style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:hsl(20 8% 50%);margin:0 0 18px">Newsletter</p>
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:26px;line-height:1.25;margin:0 0 14px;color:hsl(20 10% 15%)">${title}</h1>
        <div style="font-size:16px;line-height:1.65;color:${accent}">${inner}</div>
      </div>
    </main>
  </body>
</html>`
}

function html(title: string, inner: string, ok: boolean, status = 200) {
  return new Response(shell(title, inner, ok), {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

const BTN_PRIMARY =
  "display:inline-block;background:hsl(16 65% 45%);color:hsl(36 33% 97%);border:0;cursor:pointer;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;font-family:'Source Sans 3',system-ui,sans-serif"

const LINK_BACK =
  'display:inline-block;margin-top:24px;color:hsl(16 65% 45%);text-decoration:none;font-weight:500;font-size:15px'

function backLink() {
  return `<a href="/" style="${LINK_BACK}">Voltar ao site</a>`
}

// Confirmation page shown on GET. The actual unsubscribe happens on POST so
// that email link scanners / prefetchers (which only issue GET requests)
// can't silently consume the one-time token before the reader clicks.
function confirmPage(token: string) {
  const inner = `
    <p style="margin:0 0 28px">
      Queres mesmo cancelar a subscrição da newsletter do Entre Livros?
    </p>
    <form method="POST" action="/newsletter/unsubscribe" style="margin:0">
      <input type="hidden" name="token" value="${token}" />
      <button type="submit" class="btn" style="${BTN_PRIMARY}">Confirmar cancelamento</button>
    </form>
    ${backLink()}`
  return html('Cancelar subscrição', inner, true)
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
      `<p style="margin:0">Não foi possível cancelar agora. Tenta de novo mais tarde.</p>${backLink()}`,
      false,
      500
    )
  }

  if (data === true) {
    return html(
      'Subscrição cancelada',
      `<p style="margin:0">Já não vais receber emails do Entre Livros. Tens sempre as portas abertas para voltar.</p>${backLink()}`,
      true
    )
  }

  // Token not found = already unsubscribed (or a scanner got here first).
  // Treat as success: the reader's intent — not being subscribed — is met.
  return html(
    'Subscrição cancelada',
    `<p style="margin:0">Já não estás subscrito na newsletter do Entre Livros.</p>${backLink()}`,
    true
  )
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token || !UUID_RE.test(token)) {
    return html(
      'Link inválido',
      `<p style="margin:0">Falta o código de cancelamento.</p>${backLink()}`,
      false,
      400
    )
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
    return html(
      'Link inválido',
      `<p style="margin:0">Falta o código de cancelamento.</p>${backLink()}`,
      false,
      400
    )
  }

  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`unsubscribe:${ip}`, 20, 10 * 60 * 1000)
  if (!rl.allowed) {
    return html(
      'Demasiados pedidos',
      `<p style="margin:0">Recebemos demasiados pedidos deste dispositivo. Tenta novamente mais tarde.</p>${backLink()}`,
      false,
      429
    )
  }

  return unsubscribe(token)
}
