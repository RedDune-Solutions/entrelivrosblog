# entrelivrosblog — notas para o Claude

Blog Next.js (App Router) na Vercel + Supabase (project ref `stxvdcwmbfeebxmdmqsb`).
Admin única: a Tatiana, via Supabase Auth. Deploy = push para `main` (Vercel auto).

## Estado de segurança / privacidade (feito)
- Ações de admin protegidas com `requireAdmin()` (`src/lib/auth-guard.ts`), por cima da RLS.
- Comentários: a posse está ligada à **sessão anónima** do Supabase (`user_id = auth.uid()`),
  garantida no código (`src/app/commentActions.ts` -> `canModifyComment`) e na RLS.
  O dono edita/apaga o seu; a admin (conta não-anónima) modera tudo.
- Sem fingerprinting: `src/lib/userIdentifier.ts` devolve um id aleatório em localStorage.
  Leitores passivos não criam sessão (`getAnonUserId` lê, não cria; só `ensureAnonUserId` cria, no ato de comentar).
- Rate limit: `rateLimitDistributed` (Upstash opcional -> RPC `rate_limit_hit` no próprio Postgres -> memória).
- CAPTCHA Turnstile montado mas **adormecido** (sem chaves) — `src/lib/turnstile.ts`, `src/components/Turnstile.tsx`.
- Headers de segurança em `next.config.ts`.
- Home usa cliente **sem cookies** (`src/lib/supabase/public.ts`) + retry (`src/lib/retry.ts`)
  para corrigir os livros que às vezes não carregavam (era render dinâmico + sem retry).

## Migrações Supabase (em `supabase/migrations/`)
- `0003` adiciona `book_comments.user_id` (aditiva, segura).
- `0004` RLS estrita dos comentários — **exige Anonymous sign-ins ligado primeiro**.
- `0005` store do rate limit (`rate_limit_hit`).
- O utilizador reportou ter feito "tudo no Supabase" (anonymous sign-ins + migrações) — **confirmar**.
- "Leaked Password Protection" NÃO ficou ligada (não encontrada no painel) — opcional.

## Opcional / pendente
- Chaves Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) só se aparecer spam.
- Chaves Upstash opcionais (já usa o Postgres por defeito).
- Buckets públicos `BookCovers`/`PostCovers` permitem listar ficheiros (menor).
- O mesmo padrão (cliente sem cookies + retry) podia ser aplicado a `/posts`, `/posts/[slug]`, `/aboutMe`.

## Conclusão
CAPTCHA NÃO é prioritário nesta fase — rate limit + sessão + RLS já cobrem o abuso real.
