import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getRequestIp } from '@/lib/rate-limit'

function page(title: string, message: string, ok: boolean) {
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
      <p style="font-size:15px;line-height:1.6;color:${ok ? '#444' : '#b91c1c'}">${message}</p>
      <a href="/" style="display:inline-block;margin-top:24px;color:#1a1a1a">Voltar ao site</a>
    </div>
  </body>
</html>`
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  const html = (title: string, message: string, ok: boolean, status = 200) =>
    new Response(page(title, message, ok), {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })

  if (!token) {
    return html('Link inválido', 'Falta o código de cancelamento.', false, 400)
  }

  const ip = await getRequestIp()
  const rl = rateLimit(`unsubscribe:${ip}`, 20, 10 * 60 * 1000)
  if (!rl.allowed) {
    return html(
      'Demasiados pedidos',
      'Recebemos demasiados pedidos deste dispositivo. Tenta novamente mais tarde.',
      false,
      429
    )
  }

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

  return html(
    'Subscrição não encontrada',
    'Este link já foi usado ou não corresponde a nenhuma subscrição.',
    false
  )
}
