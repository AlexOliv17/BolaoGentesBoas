# Prompt — Sistema de Bolão da Copa (do código ao deploy, stack grátis)

> Cole este prompt em um agente de código (Claude Code, Cursor, etc.). Ele está dividido em **fases**: peça para implementar uma fase por vez, validar, e só então seguir. No fim de cada fase, peça testes e um commit.

---

## 0. Papel e princípios

Você é um engenheiro full-stack sênior. Vamos construir, do zero ao deploy, um **bolão da Copa do Mundo 2026** para um grupo de amigos. Requisitos transversais que valem para TODO o projeto:

- **Stack obrigatória (tudo no plano grátis):** Next.js (App Router, TypeScript) hospedado na Vercel; Supabase para Postgres + Auth + Storage + agendamento (pg_cron + pg_net); Nodemailer + SMTP gratuito (ex: Gmail) para e-mails; football-data.org como fonte dos jogos.
- **Mobile-first (alvo principal):** não haverá app de loja; o acesso será 100% via navegador, predominantemente no **celular**. Projete todas as telas começando pela largura de smartphone (~360–390px) e escale para tablet/desktop depois. Use layout fluido (flexbox/grid), `rem`/unidades relativas, imagens responsivas e respeite áreas de toque ≥ 44px. Inclua a meta tag `viewport` correta. Teste cada tela em 360px, 768px e 1280px antes de dar a fase como pronta.
- **Não comercial:** uso entre amigos, sem cobrança. (Importante porque o Hobby da Vercel é só para uso pessoal.)
- **Segurança primeiro:** nunca armazene senha em texto puro (a Auth do Supabase já cuida disso); habilite **Row Level Security (RLS)** em todas as tabelas; nunca exponha a `service_role key` no cliente.
- **Código incremental e testável:** entregue uma fase de cada vez, com instruções de como rodar e validar localmente.
- **Idioma da interface:** português do Brasil. Fuso horário de referência: America/Sao_Paulo (armazene tudo em UTC no banco, converta na exibição).
- Ao final de cada fase, gere: (a) o que foi feito, (b) como testar, (c) variáveis de ambiente novas, (d) um comando de commit sugerido.

---

## 1. Modelo de dados

Crie as migrações SQL no Supabase com RLS ativo. Entidades mínimas:

- **profiles** (1:1 com `auth.users`): `id` (uuid, = auth.users.id), `username` (login, único, obrigatório), `nickname` (apelido, obrigatório), `email` (obrigatório, único), `avatar_url` (nullable), `created_at`. Observação: o e-mail e a senha vivem na Auth do Supabase; replique e-mail/username/apelido em `profiles`.
- **friendships**: `id`, `requester_id`, `addressee_id`, `status` (`pending` | `accepted` | `blocked`), `created_at`. Par único (requester, addressee).
- **friend_invite_codes**: `id`, `owner_id`, `code` (curto, único), `expires_at` (nullable). Para "pedido de amizade por código".
- **pools** (bolões): `id`, `name`, `owner_id`, `invite_token` (único, para o link de convite), `created_at`.
- **pool_members**: `id`, `pool_id`, `user_id`, `joined_at`. Par único (pool_id, user_id).
- **matches** (espelho dos jogos vindos da API): `id` (id da fonte externa), `home_team`, `away_team`, `kickoff_at` (timestamptz, UTC), `status` (`scheduled` | `live` | `finished`), `home_score` (nullable), `away_score` (nullable), `last_synced_at`.
- **predictions** (palpites): `id`, `pool_id`, `user_id`, `match_id`, `home_guess` (int), `away_guess` (int), `points` (int, default 0), `created_at`, `updated_at`. Único por (pool_id, user_id, match_id).
- **notifications_log**: `id`, `user_id`, `match_id`, `type` (`reminder_30min`), `sent_at`. Para **não enviar o mesmo lembrete duas vezes** (idempotência).

Entregue um diagrama textual das relações e as policies de RLS por tabela (ex.: um usuário só lê/edita os próprios palpites; só vê bolões dos quais é membro).

---

## 2. Autenticação e conta (Fase 1)

- Cadastro com **login (username), senha, apelido e e-mail — todos obrigatórios**. Valide unicidade de username e e-mail; valide formato de e-mail e força mínima de senha.
- Use Supabase Auth (e-mail + senha). Crie a linha em `profiles` no momento do cadastro (via trigger no banco ou na rota de signup).
- Login, logout, recuperação de senha (fluxo padrão do Supabase).
- Proteja as rotas autenticadas (middleware do Next.js).

**Aceite:** consigo criar conta, sair, entrar de novo, e os 4 campos são realmente obrigatórios e validados.

---

## 3. Perfil e amizades (Fase 2)

- **Customização do perfil:** alterar apelido e enviar **foto** (upload para Supabase Storage; gere URL pública ou assinada; valide tipo e tamanho do arquivo).
- **Amizade por código:** cada usuário pode gerar um `friend_invite_code`; outro usuário insere o código e dispara um pedido de amizade.
- **Amizade por busca:** buscar usuários por `username`/`nickname` e enviar pedido.
- Aceitar / recusar pedidos; listar amigos.
- (Opcional) e-mail de aviso "fulano te enviou um pedido de amizade" via SMTP.

**Aceite:** troco foto e apelido; gero código; outro usuário me adiciona por código e por busca; aceito o pedido e viramos amigos.

---

## 4. Bolões e convites (Fase 3)

- Qualquer usuário cria um **bolão** (vira `owner` e primeiro membro).
- O dono gera um **link de convite** (`/join/{invite_token}`) e um **botão "Convidar pelo WhatsApp"** que abre `https://wa.me/?text=...` com mensagem pré-preenchida contendo o link.
- O dono também pode convidar **amigos** diretamente (entram como membros, ou recebem um pedido para entrar).
- Tela do bolão: lista de membros + aba de **Ranking** + aba de **Jogos/Palpites**.

**Aceite:** crio bolão, gero link, compartilho no WhatsApp, um amigo entra pelo link e aparece na lista de membros.

---

## 5. Jogos, palpites e a trava de horário (Fase 4)

- **Apenas os jogos do dia** ficam disponíveis para palpitar. Filtre `matches` por `kickoff_at` dentro do dia atual (no fuso America/Sao_Paulo).
- Cada membro dá um palpite (placar `home_guess` x `away_guess`) por jogo, **dentro daquele bolão**.
- **Trava de edição:** o palpite pode ser criado/alterado **até 1 minuto antes do `kickoff_at`**. Isto é uma **validação no servidor**, não um job: na rota de salvar, rejeite se `now() >= kickoff_at - interval '1 minute'`. Faça também a checagem no front (desabilitar o input) só para UX — a regra real é no backend.
- Mostre claramente o horário-limite de cada jogo e se ainda dá para editar.

**Aceite:** só vejo jogos de hoje; consigo editar até 1 min antes; depois disso o backend recusa a alteração mesmo se eu burlar o front.

---

## 6. Sincronização com a API de futebol (Fase 5)

- Crie um módulo isolado `lib/football.ts` com UMA interface (`getTodaysMatches()`, `getMatchResult(id)`) para que a fonte de dados seja trocável. Implemente sobre **football-data.org** (competição: Copa do Mundo). Guarde a chave em variável de ambiente no servidor.
- Faça **cache no banco** (tabela `matches`): não chame a API a cada request. Sincronize:
  1. **Uma vez por dia:** importar/atualizar os jogos do dia em `matches`.
  2. **Durante/depois dos jogos:** atualizar `status`, `home_score`, `away_score`.
- Respeite o rate limit (≈10 req/min no free tier): faça poucas chamadas e cacheie.
- Deixe documentado como trocar a fonte (ex.: API alternativa) mexendo só em `lib/football.ts`.

**Aceite:** os jogos do dia aparecem sem eu cadastrar nada à mão; quando um jogo termina, o placar real entra no banco.

---

## 7. Pontuação e ranking (Fase 6)

Regras de pontuação (defina com precisão e cubra com testes unitários):

- **8 pontos** — acertou o **placar exato** (ex.: palpite 2x1, resultado 2x1).
- **5 pontos** — acertou o **resultado** (vitória do mandante / empate / vitória do visitante) **mas não o placar exato**.
- **0 pontos** — errou o resultado.
- Empate conta como "resultado" próprio (ex.: palpitou 1x1 e terminou 2x2 → acertou o resultado "empate" → 5 pontos).

- O cálculo roda **quando o jogo fica `finished`** (no job de sincronização ou logo após). Grave `points` em cada `prediction`.
- **Ranking por bolão:** soma de `points` dos membros, **ordem decrescente** (maior pontuação em 1º). Desempate sugerido: maior nº de placares exatos; depois ordem alfabética do apelido.

**Aceite:** dois palpites diferentes para o mesmo jogo recebem 8/5/0 corretamente; o ranking do bolão ordena do maior para o menor.

---

## 8. E-mail de lembrete 30 min antes (Fase 7 — a parte crítica)

Objetivo: enviar e-mail para o usuário que **ainda não palpitou** um jogo, quando faltam **~30 minutos** para o início — uma vez só por jogo/usuário.

- **Agendamento (escolha A, recomendada):** use **pg_cron do Supabase** rodando **a cada minuto** uma função que:
  1. seleciona jogos com `kickoff_at` entre `now()+29min` e `now()+31min` e `status = 'scheduled'`;
  2. para cada membro de cada bolão que tem esse jogo **sem palpite** e **sem registro em `notifications_log`** para `type='reminder_30min'`;
  3. dispara o e-mail (via `pg_net` chamando uma rota `/api/cron/reminders` do Next.js, que usa Nodemailer + SMTP) e grava em `notifications_log` para garantir idempotência.
- **Agendamento (escolha B, alternativa sem pg_cron):** agendador externo grátis (ex.: cron-job.org) batendo de 5 em 5 min na rota `/api/cron/reminders`, protegida por um header secreto (`CRON_SECRET`).
- **Não use o cron nativo da Vercel no plano grátis para isto:** ele só roda 1x/dia e pode atrasar ~59 min.
- Proteja a rota de cron com `CRON_SECRET` (rejeite quem não mandar o header correto). Garanta idempotência para não spammar.
- **NOTA IMPORTANTE SOBRE CUSTOS:** Como optamos pelo fluxo 100% gratuito sem compra de domínios, a confirmação de e-mail no cadastro fica **desativada**. Os e-mails (como lembretes e recuperação de senha) serão disparados via SMTP (Nodemailer usando uma conta do Gmail, por exemplo).

**Aceite:** crio um jogo de teste começando em ~30 min, deixo um usuário sem palpite, e ele recebe exatamente UM e-mail; quem já palpitou não recebe.

---

## 9. Segurança, privacidade e qualidade

- RLS em todas as tabelas; teste que um usuário não consegue ler palpites/bolões de terceiros.
- Variáveis sensíveis (chaves Supabase service_role, credenciais SMTP, football-data.org, CRON_SECRET) **só no servidor**.
- Validação de entrada em todas as rotas (zod ou equivalente).
- Tratamento de erros e estados de carregamento na UI.
- **Responsividade obrigatória:** toda tela deve funcionar bem no celular (sem rolagem horizontal, sem corte de conteúdo, botões e inputs confortáveis ao toque). O ranking, a lista de jogos e o formulário de palpite são os pontos críticos — garanta que ficam legíveis e operáveis numa tela de 360px. Considere tabelas roláveis ou em formato de cards no mobile.
- Não coloque dados pessoais em query strings de URL.

---

## 10. Deploy (Fase 8)

- Suba o banco e as policies no **Supabase** (projeto grátis); ative as extensões `pg_cron` e `pg_net`; agende o job de lembrete e o de sincronização diária.
- Faça deploy do Next.js na **Vercel** (Hobby), conectando o repositório Git.
- Configure todas as variáveis de ambiente na Vercel e no Supabase.
- Configure as variáveis do SMTP (Gmail app password ou similar) para o disparo de e-mails.
- Entregue um **README** com: setup local, variáveis necessárias, como rodar migrações, e o passo a passo de deploy.

**Variáveis de ambiente esperadas (liste e explique cada uma):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USER`, `SMTP_PASS`, `FOOTBALL_DATA_API_KEY`, `CRON_SECRET`.

---

## 11. Ordem de entrega sugerida

Implemente nesta ordem, pausando para validação após cada fase:
1. Setup do projeto + modelo de dados + Auth (Fases 0–2).
2. Perfil e amizades (Fase 3).
3. Bolões e convites (Fase 4).
4. Jogos do dia + trava de palpite (Fase 5).
5. Sincronização com a API (Fase 6).
6. Pontuação e ranking (Fase 7).
7. E-mail de lembrete 30 min (Fase 8).
8. Deploy (Fase 9).

**Comece agora pela Fase 0–1:** monte o esqueleto do projeto Next.js + Supabase, crie as migrações do modelo de dados com RLS, e implemente o cadastro/login com os 4 campos obrigatórios. Ao terminar, me mostre como testar localmente antes de seguir.
