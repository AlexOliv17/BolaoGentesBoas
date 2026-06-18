# Regras do Projeto — BolaoGB

## Idioma e Localização

- Toda a interface do usuário deve estar em **português do Brasil**.
- Mensagens de erro, validações e notificações também em português do Brasil.
- Datas e horários sempre exibidos no fuso horário **America/Sao_Paulo**.
- Armazene tudo em **UTC** no banco; converta apenas na exibição.

## Stack Obrigatória

- **Front-end:** Next.js 14+ com App Router e TypeScript.
- **Back-end:** Next.js Route Handlers (dentro do mesmo projeto).
- **Banco de dados:** Supabase (Postgres + Auth + Storage + pg_cron + pg_net).
- **E-mail:** Resend.
- **API de futebol:** football-data.org (fonte de horário/status/placar), isolada em `src/lib/football.ts`.
- **Validação:** Zod (compartilhado entre front e back).
- **Formulários:** React Hook Form + zodResolver.
- **CSS:** Vanilla CSS / CSS Modules (sem Tailwind, sem CSS-in-JS).
- **Distribuição:** apenas web responsiva (sem app de loja, sem PWA empacotado).

## Segurança — Regras Absolutas

- **RLS obrigatório** em todas as tabelas Supabase. Nunca desabilite.
- **SUPABASE_SERVICE_ROLE_KEY** nunca pode ser prefixada com `NEXT_PUBLIC_` nem usada em Client Components.
- **CRON_SECRET** deve ser validada em todo request para rotas de cron.
- Validação de entrada com Zod em **todos** os Route Handlers — nunca confie em dados do cliente.
- Trava de palpite validada **no servidor** (não apenas no front): editar só enquanto `agora < kickoff_at − 1 min`.
- Agendamento de e-mails via **pg_cron do Supabase** (a cada minuto) — não usar o cron da Vercel. E-mail de lembrete com **idempotência** (no máximo um por jogo/usuário, registrado em `notifications_log`).

## Mobile-First

- Toda tela deve funcionar em **360px de largura** sem rolagem horizontal.
- Áreas de toque mínimas de **44x44px** em todos os elementos interativos.
- Font-size >= **16px** em inputs (evita zoom automático no iOS).
- Teste as telas críticas (ranking, jogos, palpite) nos breakpoints 360px, 768px e 1280px.
- Use **container queries** para componentes que aparecem em contextos de largura diferente (card de jogo, linha de ranking), não só media queries globais.

## Direção de Design — Fugir do "aspecto de IA"

> O visual genérico de IA não vem do framework de CSS; vem das escolhas de design. Estas regras são tão obrigatórias quanto as de segurança.

### Anti-padrões PROIBIDOS

- ❌ Paleta roxo/índigo com gradiente (`purple → indigo`) e fundo branco-acinzentado padrão.
- ❌ Tudo em cards brancos flutuantes, todos com a **mesma** sombra e o **mesmo** `border-radius`.
- ❌ Inter (ou `system-ui`) como única fonte, sem hierarquia — títulos tímidos, pouco contraste com o corpo.
- ❌ Emoji como ícone de seção ou em títulos ("🚀 Comece agora").
- ❌ Espaçamento uniforme e morno, sem ritmo vertical.
- ❌ Botões e badges todos iguais, sem hierarquia visual (primário vs. secundário vs. perigo).

### Tokens de Design (obrigatório)

- Defina **todos** os valores como CSS custom properties num `@layer tokens` (em `src/styles/tokens.css`): cores, tipografia, espaçamento, raios, sombras, durações.
- Componentes consomem **só** os tokens — nada de cor/medida "mágica" hardcoded nos CSS Modules.
- Organize a cascata com `@layer reset, tokens, base, components, utilities`.

### Identidade visual sugerida (ponto de partida, com personalidade)

- **Paleta:** clima de gramado/Copa, mas sóbrio — um verde-campo profundo como cor de marca, um dourado/âmbar como destaque (vitória, 1º lugar), neutros levemente quentes (não cinza-azulado de IA). Defina estados claros para acerto (verde), erro (vermelho terroso) e pendente (âmbar). Gere variações com `color-mix()` em vez de dezenas de hex soltos.
- **Tipografia:** uma fonte de **display com caráter** para títulos e números grandes (placares, pontuação) — uma grotesca condensada ou esportiva — contra uma fonte neutra e legível no corpo. Hierarquia ousada com `clamp()` para escalar do mobile ao desktop.
- **Modo escuro:** suporte via `prefers-color-scheme`, trocando apenas os tokens de cor.

### Componentes-chave (a alma visual do app)

- **Card de jogo:** trate como peça de identidade, não como card branco genérico. Bandeiras/escudos dos times, placar com a fonte de display, estado claro (aberto para palpite / travado / encerrado) e o horário-limite em destaque.
- **Linha de ranking:** no mobile, cards empilhados (posição, avatar, apelido, pontos); o 1º lugar recebe tratamento dourado/destacado. Detalhes extras (placares exatos, nº de acertos) aparecem ao tocar. Nunca tabela larga com rolagem horizontal.
- **Feedback de pontuação:** comunicar visualmente 8 / 5 / 0 pontos com clareza (cor + rótulo), não só número.

### CSS moderno (use, não tema)

- Aninhamento nativo, `@layer`, custom properties, `clamp()` para tipografia/espaço fluido, `color-mix()`, `:has()`, container queries.
- `:focus-visible` estilizado em tudo que é interativo (acessibilidade de teclado).
- Respeite `prefers-reduced-motion` para animações.
- Contraste mínimo AA (texto normal ≥ 4.5:1).

## Qualidade de Código

- TypeScript com **`"strict": true`** — proibido usar `any`.
- Funções puras para lógica de negócio (pontuação, datas) — isoladas em `src/utils/`.
- Handlers de API são finos — apenas validam entrada, delegam para serviços e formatam resposta.
- Testes unitários obrigatórios para a lógica de pontuação (`calculatePoints`), cobrindo as três faixas: placar exato (8), resultado certo (5) e erro (0), incluindo o caso de empate.
- Migrações SQL em `supabase/migrations/` com timestamp — nunca editar migrações já aplicadas.
- Toda chamada à API de futebol passa por `src/lib/football.ts` e usa cache no banco (respeitar rate limit ~10 req/min).