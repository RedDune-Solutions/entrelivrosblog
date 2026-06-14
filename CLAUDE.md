# entrelivrosblog — notas para o Claude

Blog Next.js (App Router) na Vercel + Supabase (project ref `stxvdcwmbfeebxmdmqsb`).
Admin única: a Tatiana, via Supabase Auth. Deploy = push para `main` (Vercel auto).
Owner/dev: Iuri (reddunesolutions@gmail.com).

## Estado de segurança / privacidade (FEITO e em produção)
- Ações de admin protegidas com `requireAdmin()` (`src/lib/auth-guard.ts`), por cima da RLS.
- Comentários: posse ligada à **sessão anónima** do Supabase (`user_id = auth.uid()`),
  garantida no código (`src/app/commentActions.ts` -> `canModifyComment`) e na RLS.
  O dono edita/apaga o seu; a admin (conta não-anónima) modera tudo.
- Sem fingerprinting: `src/lib/userIdentifier.ts` devolve um id aleatório em localStorage.
  Leitores passivos NÃO criam sessão (`getAnonUserId` lê, não cria; só `ensureAnonUserId` cria,
  no ato de comentar). Sem cookies de analytics/terceiros -> não precisa de banner de cookies.
- Rate limit: `rateLimitDistributed` (Upstash opcional -> RPC `rate_limit_hit` no Postgres -> memória).
- CAPTCHA Turnstile montado mas **adormecido** (sem chaves) — `src/lib/turnstile.ts`, `src/components/Turnstile.tsx`.
- Headers de segurança em `next.config.ts`.
- Home usa cliente **sem cookies** (`src/lib/supabase/public.ts`) + retry (`src/lib/retry.ts`)
  para corrigir os livros que às vezes não carregavam (era render dinâmico + sem retry).

## Supabase — estado REAL (confirmado em 2026-06-14)
- **Anonymous sign-ins: LIGADO** (confirmado nos logs de auth).
- Migração `0003` (coluna `book_comments.user_id`): **APLICADA**.
- Migração `0004` (RLS estrita dos comentários): **APLICADA**. Policies ativas em `book_comments`:
  - SELECT: público (`true`).
  - INSERT: `to authenticated`, `with check (user_id = auth.uid())`.
  - UPDATE/DELETE: `to authenticated`, `user_id = auth.uid()` OU admin (`is_anonymous = false`).
- Migração `0005` (`rate_limit_hit`): **NÃO aplicada** (desnecessária; usa fallback em memória).
  Não voltar a tentar sem o utilizador pedir.
- "Leaked Password Protection": NÃO ligada (utilizador não a encontrou no painel) — opcional, sem stress.
- Histórico do bug (resolvido): o utilizador ligou só o toggle das sessões anónimas mas NÃO
  correu as migrações; o código em prod gravava `user_id` numa coluna inexistente e comentar
  rebentava. Resolvido ao aplicar `0003`; a `0004` fechou a vulnerabilidade de edição/apagar alheio.
- Coments antigos (user_id NULL) só a admin os modera — esperado.

## UI / correções desta sessão (em prod)
- Imagens das publicações na landing usam `next/image` `fill` (preenchem a div) — `src/components/PostCard.tsx`.
- Toast (sonner) estava transparente: faltava `hsl()` nas vars de cor; agora fundo creme sólido,
  acento por tipo e z-index alto — `src/components/ui/sonner.tsx`.

## Opcional / pendente
- Chaves Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) só se aparecer spam.
  Alternativas discutidas: hCaptcha (encaixa no Supabase Auth), Vercel Firewall/BotID. NÃO é prioritário.
- Chaves Upstash opcionais (já usa o Postgres por defeito).
- Buckets públicos `BookCovers`/`PostCovers` permitem listar ficheiros (menor).
- O padrão "cliente sem cookies + retry" podia ser aplicado a `/posts`, `/posts/[slug]`, `/aboutMe`.

## Workflow git
- Trabalho desenvolvido na branch `security-update`, depois merge para `main`.
- Deploy = push para `main` (Vercel auto). O RedDune é um repo separado (ver o seu CLAUDE.md).

## Conclusão
Comentários funcionais E seguros. CAPTCHA não é prioritário — rate limit + sessão + RLS cobrem o abuso real.
