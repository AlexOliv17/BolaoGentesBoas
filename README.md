# Bolão Gentes Boas ⚽🏆

O **BolãoGB** é uma plataforma moderna e responsiva criada para gerenciar palpites em jogos da Copa. Construída com as melhores práticas de desenvolvimento web, oferece uma experiência premium, segura e em tempo real para grupos de amigos competirem durante os campeonatos.

## 🚀 Tecnologias Utilizadas

- **Front-end:** Next.js 15+ (App Router), React, TypeScript.
- **Estilização:** Vanilla CSS Modules (Design System próprio, sem frameworks utilitários).
- **Back-end:** Next.js Route Handlers integrados.
- **Banco de Dados:** Supabase (PostgreSQL + Row Level Security + Auth).
- **E-mails Transacionais:** Nodemailer via SMTP.
- **Integração Esportiva:** [football-data.org](https://www.football-data.org/) API (para dados ao vivo e histórico).
- **Agendamentos (Cron):** Supabase `pg_cron` acionando endpoints do servidor.

## ✨ Principais Funcionalidades

- **Autenticação Segura:** Login e cadastro gerenciados pelo Supabase Auth, com exigência de verificação de e-mail.
- **Criação de Bolões:** Crie grupos, convide amigos via link exclusivo/WhatsApp e gerencie os membros.
- **Palpites (Predictions):**
  - Trava de segurança no lado do servidor: os palpites são bloqueados exatemente **1 minuto antes** do início da partida.
  - O histórico de jogos finalizados e jogos ao vivo são protegidos em modo "somente leitura".
- **Sistema de Pontuação:**
  - **8 Pontos:** Placar exato (Na Mosca).
  - **5 Pontos:** Acerto do resultado (ex: apostou vitória e o time venceu, mas errou os gols).
  - **0 Pontos:** Errou o vencedor.
- **Ranking Automático:** Atualização instantânea com critério de desempate por maior número de placares exatos.
- **Lembretes Automáticos:** Sistema em plano de fundo varre jogos prestes a começar e envia um e-mail de lembrete (30 min antes) para quem esqueceu de palpitar.
- **Mobile-First:** Design fluido que roda perfeitamente em telas de celular (360px) sem quebras.

---

## ⚙️ Variáveis de Ambiente

Para rodar este projeto na sua máquina ou fazer o deploy, você precisa configurar um arquivo `.env.local` na raiz do projeto com as seguintes chaves. 

*(Atenção: Apenas as chaves `NEXT_PUBLIC_` ficam expostas no navegador; o restante é exclusivo do servidor, mantendo a arquitetura 100% segura).*

```env
# ─────────────────────────────────────────────
# Supabase — Configurações Públicas do Banco
# Obtenha em: Supabase Dashboard → Settings → API
# ─────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key-publica>

# ─────────────────────────────────────────────
# Supabase — Chave Administrativa (SOMENTE SERVIDOR)
# Obtenha em: Supabase Dashboard → Settings → API → service_role key
# ─────────────────────────────────────────────
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key-secreta>

# ─────────────────────────────────────────────
# Servidor SMTP — Envio de Lembretes (SOMENTE SERVIDOR)
# Utilize qualquer provedor (ex: Gmail, SendGrid, Hostinger)
# ─────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua-senha-de-app

# ─────────────────────────────────────────────
# API de Futebol (SOMENTE SERVIDOR)
# Obtenha em: https://www.football-data.org/client/register
# ─────────────────────────────────────────────
FOOTBALL_DATA_API_KEY=<sua-chave-api>

# ─────────────────────────────────────────────
# Segurança para Cron Jobs
# Gere uma string aleatória (ex: openssl rand -hex 32)
# ─────────────────────────────────────────────
CRON_SECRET=<sua-senha-secreta-do-cron>
```

---

## 💻 Como Rodar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/AlexOliv17/BolaoGentesBoas.git
   cd BolaoGentesBoas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` usando o modelo detalhado acima e preencha suas credenciais do Supabase, API de Futebol e SMTP.

4. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```

5. O aplicativo estará rodando em [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Scripts do Banco de Dados (Migrações)
O projeto contém arquivos SQL na pasta `supabase/migrations/` que criam tabelas, ativam políticas de RLS e configuram os gatilhos do Cron. Quando criar o seu banco no Supabase pela primeira vez, basta executar esses scripts na aba **SQL Editor** do seu painel do Supabase.
