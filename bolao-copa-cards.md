# Bolão da Copa 2026 — Quadro de Atividades (Cards)

> Cada card é uma unidade de trabalho entregável. Implemente na ordem (respeitando "Depende de"), valide o **Resultado esperado** antes de seguir.
>
> **Stack:** Next.js (App Router, TS) na Vercel · Supabase (Postgres + Auth + Storage + pg_cron/pg_net) · E-mail via SMTP · football-data.org (horário/status/placar dos jogos).
> **Regra transversal:** mobile-first (projetar a partir de ~360px); tudo em PT-BR; horários em UTC no banco, exibidos em America/Sao_Paulo; RLS ativo em todas as tabelas.

---

## 🟦 Card 0 — Fundação do projeto
**Depende de:** —

**Feature**
Esqueleto do projeto Next.js + Supabase pronto para desenvolvimento, com layout base responsivo (mobile-first) e variáveis de ambiente configuradas.

**Regras de negócio**
- Projeto Next.js (App Router, TypeScript) + Tailwind, com meta tag `viewport` correta.
- Conexão com o projeto Supabase (cliente público no front, cliente admin só no servidor).
- Estrutura de pastas previsível; `lib/football.ts` reservado como única fonte de dados de jogos.
- Nenhum segredo no cliente (`service_role`, chaves de API e e-mail só no servidor).

**Resultado esperado**
Rodo o projeto localmente, vejo uma página inicial responsável que se ajusta de 360px a 1280px, e a conexão com o Supabase responde sem erro.

---

## 🟦 Card 1 — Modelo de dados e segurança (RLS)
**Depende de:** Card 0

**Feature**
Esquema do banco com todas as entidades e Row Level Security ativo.

**Regras de negócio**
- Tabelas: `profiles`, `friendships`, `friend_invite_codes`, `pools`, `pool_members`, `matches`, `predictions`, `notifications_log`.
- `predictions` único por (`pool_id`, `user_id`, `match_id`); `pool_members` único por (`pool_id`, `user_id`).
- `matches` guarda `kickoff_at` (timestamptz/UTC), `status` (`scheduled`/`live`/`finished`), `home_score`, `away_score`.
- RLS: usuário só lê/edita os próprios palpites; só enxerga bolões dos quais é membro; perfis públicos só nos campos necessários (apelido, foto).

**Resultado esperado**
Migrações aplicadas; tento ler dados de outro usuário e o banco **bloqueia** pela policy; diagrama das relações documentado.

---

## 🟩 Card 2 — Cadastro e autenticação
**Depende de:** Card 1

**Feature**
Criação de conta e login.

**Regras de negócio**
- Campos **obrigatórios**: login (username), senha, apelido e e-mail.
- Username e e-mail únicos; validar formato de e-mail e força mínima da senha.
- Senha nunca em texto puro (Supabase Auth cuida do hash).
- Ao cadastrar, criar automaticamente a linha em `profiles`.
- Fluxos de logout e recuperação de senha disponíveis.

**Resultado esperado**
Crio conta com os 4 campos, saio, entro de novo; tentar cadastrar com e-mail/username repetido ou campo vazio é recusado com mensagem clara.

---

## 🟩 Card 3 — Perfil e foto
**Depende de:** Card 2

**Feature**
Customização de perfil.

**Regras de negócio**
- Alterar apelido a qualquer momento.
- Upload de foto para o Supabase Storage; validar tipo (imagem) e tamanho máximo.
- Gerar URL para exibir o avatar; trocar a foto substitui a anterior.

**Resultado esperado**
Troco o apelido e a foto pelo celular; a nova foto aparece imediatamente no meu perfil e onde meu avatar é exibido.

---

## 🟨 Card 4 — Amizades (código e busca)
**Depende de:** Card 2

**Feature**
Adicionar amigos por código ou por busca de nome.

**Regras de negócio**
- Cada usuário gera um código de convite de amizade (único, opcionalmente com expiração).
- Inserir um código válido dispara um pedido de amizade ao dono do código.
- Buscar usuários por username/apelido e enviar pedido.
- Pedido tem status `pending`/`accepted`/`blocked`; o destinatário aceita ou recusa.
- Não permitir pedido duplicado nem auto-amizade.

**Resultado esperado**
Gero meu código; outro usuário me adiciona por código e por busca; aceito e ambos passam a constar como amigos.

---

## 🟨 Card 5 — Bolões e convites
**Depende de:** Card 4

**Feature**
Criar bolão e convidar participantes.

**Regras de negócio**
- Qualquer usuário cria um bolão e vira `owner` + primeiro membro.
- Gerar link de convite (`/join/{invite_token}`) válido para entrar no bolão.
- Botão "Convidar pelo WhatsApp" abre `wa.me` com mensagem pré-preenchida contendo o link.
- Dono também pode convidar amigos diretamente.
- A tela do bolão tem três áreas: Membros, Ranking e Jogos/Palpites.

**Resultado esperado**
Crio um bolão, compartilho o link no WhatsApp, um amigo entra pelo link e aparece na lista de membros do bolão.

---

## 🟧 Card 6 — Integração com a API de futebol
**Depende de:** Card 1

**Feature**
Sincronizar jogos, horários e resultados da Copa.

**Regras de negócio**
- Toda chamada à fonte externa fica isolada em `lib/football.ts` (`getTodaysMatches()`, `getMatchResult(id)`), para a fonte ser trocável.
- Fonte de horário/status/placar: **football-data.org** (usar `utcDate` como `kickoff_at`). Chave só no servidor.
- Cache no banco (`matches`): não chamar a API a cada request; respeitar o rate limit (~10 req/min).
- Sincronizações: (a) 1x/dia importa os jogos do dia; (b) durante/depois dos jogos atualiza `status` e placar.
- (Opcional) dados estáticos visuais (bandeira, grupo, estádio) podem vir da API open source rezarahiminia/worldcup2026, sem misturar com a fonte de timing.

**Resultado esperado**
Os jogos do dia aparecem sem cadastro manual; quando um jogo termina, o placar real entra no banco automaticamente.

---

## 🟧 Card 7 — Jogos do dia e palpites
**Depende de:** Cards 5 e 6

**Feature**
Palpitar nos jogos, com trava de horário.

**Regras de negócio**
- Só ficam disponíveis para palpite os **jogos do dia** (filtrados por `kickoff_at` no fuso America/Sao_Paulo).
- Um palpite por jogo, por usuário, dentro de cada bolão (placar mandante x visitante).
- **Trava:** criar/editar permitido só enquanto `agora < kickoff_at − 1 minuto`. A regra real é **validada no servidor**; no front, desabilitar o input é só UX.
- Exibir claramente o horário-limite e se ainda dá para editar.

**Resultado esperado**
Vejo só os jogos de hoje; edito o palpite até 1 min antes; depois disso o backend recusa a alteração mesmo se eu burlar o front.

---

## 🟥 Card 8 — Pontuação
**Depende de:** Cards 6 e 7

**Feature**
Cálculo automático de pontos por palpite.

**Regras de negócio**
- **8 pontos** — placar exato (ex.: palpite 2×1, resultado 2×1).
- **5 pontos** — acertou o resultado (vitória mandante / empate / vitória visitante) mas não o placar exato.
- **0 pontos** — errou o resultado.
- Empate é um "resultado" próprio (palpitou 1×1, terminou 2×2 → 5 pontos).
- Cálculo dispara quando o jogo vira `finished`; grava `points` em cada `prediction`.
- Cobrir as três faixas com testes unitários.

**Resultado esperado**
Para o mesmo jogo, palpites diferentes recebem 8 / 5 / 0 corretamente, e os testes passam.

---

## 🟥 Card 9 — Ranking do bolão
**Depende de:** Card 8

**Feature**
Classificação dos membros dentro de cada bolão.

**Regras de negócio**
- Soma de `points` por membro, ordem **decrescente** (maior em 1º lugar).
- Desempate: maior nº de placares exatos; depois ordem alfabética do apelido.
- **Mobile:** lista em formato de **cards empilhados** (posição, avatar, apelido, pontos); detalhes extras (placares exatos, nº de acertos) aparecem ao tocar na linha. Nada de tabela larga com rolagem horizontal.

**Resultado esperado**
O ranking ordena do maior para o menor, aplica o desempate, e é legível e tocável numa tela de 360px.

---

## 🟩 Card 10 — E-mail de lembrete (30 min antes) - [x] CONCLUÍDO
**Depende de:** Cards 6 e 7

**Feature**
Avisar por e-mail quem ainda não palpitou um jogo prestes a começar.

**Regras de negócio**
- Agendamento via **pg_cron do Supabase** rodando a cada minuto (não usar o cron grátis da Vercel: roda 1x/dia e atrasa).
- A cada minuto: selecionar jogos com `kickoff_at` entre `agora+29min` e `agora+31min` e `status = 'scheduled'`.
- Para cada membro de cada bolão **sem palpite** naquele jogo e **sem registro** em `notifications_log` (`type='reminder_30min'`): enviar e-mail (via SMTP/Nodemailer na rota `/api/cron/reminders`) e gravar no log.
- Idempotência obrigatória: no máximo **um** e-mail por jogo/usuário. Rota protegida por `CRON_SECRET`.

**Resultado esperado**
Crio um jogo de teste começando em ~30 min: quem não palpitou recebe exatamente um e-mail; quem já palpitou não recebe.

---

## 🟩 Card 11 — Responsividade e acabamento mobile - [x] CONCLUÍDO
**Depende de:** transversal (revisar ao fim de cada card)

**Feature**
Garantir que todo o app funciona bem no celular.

**Regras de negócio**
- Sem rolagem horizontal e sem corte de conteúdo em 360px.
- Áreas de toque ≥ 44px; inputs e botões confortáveis.
- Pontos críticos: ranking, lista de jogos e formulário de palpite.
- Testar cada tela em 360px, 768px e 1280px.

**Resultado esperado**
Navego por cadastro, perfil, bolão, palpites e ranking inteiramente pelo celular, sem quebras de layout.

---

## ⬛ Card 12 — Deploy
**Depende de:** todos os anteriores

**Feature**
Sistema no ar, gratuito.

**Regras de negócio**
- Supabase: subir banco + policies; ativar `pg_cron` e `pg_net`; agendar o lembrete e a sincronização diária.
- Configurar variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FOOTBALL_DATA_API_KEY`, `CRON_SECRET`.
- Configurar as credenciais do servidor SMTP fornecido para disparar os e-mails.
- README com setup local, variáveis, migrações e passo a passo de deploy.

**Resultado esperado**
Abro a URL de produção no celular, crio conta, entro num bolão, palpito e vejo o ranking — tudo funcionando ponta a ponta sem custo.

---

### Legenda do fluxo
`Card 0 → 1 → 2` então em paralelo `{3, 4}` · `4 → 5` · `1 → 6` · `(5,6) → 7 → 8 → 9` · `(6,7) → 10` · `11` contínuo · `12` ao final.
