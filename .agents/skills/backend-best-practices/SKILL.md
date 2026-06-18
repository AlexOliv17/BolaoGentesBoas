---
name: backend-best-practices
description: >
  Boas práticas de back-end para o projeto BolaoGB: Next.js App Router (Route Handlers),
  Supabase (Postgres + Auth + RLS + Storage), Zod, segurança de API, clean code,
  tratamento de erros, variáveis de ambiente e padrões de arquitetura.
---

# Boas Práticas de Back-End — BolaoGB

Stack de referência: **Next.js 14+ (App Router, TypeScript)** + **Supabase** (Postgres, Auth, RLS, Storage, pg_cron, pg_net) + **Zod** + **Resend**.

---

## 1. Estrutura de Pastas

Organize o projeto seguindo a separação clara entre camadas:

- src/app/api/ — Route Handlers (camada HTTP, fina)
  - uth/, pools/, predictions/, matches/, cron/reminders/
- src/lib/ — Lógica de infraestrutura reutilizável
  - supabase/server.ts — Cliente para Server Components / Route Handlers
  - supabase/client.ts — Cliente para Client Components
  - supabase/admin.ts — Cliente com service_role (SOMENTE no servidor)
  - ootball.ts — Interface única para a fonte de dados de futebol
  - email.ts — Wrapper do Resend
  - alidators/ — Schemas Zod (auth.ts, pool.ts, prediction.ts, match.ts)
  - errors.ts — Classes/tipos de erro padronizados
- src/types/database.ts — Tipos gerados pelo Supabase CLI
- src/utils/ — Funções puras sem efeitos colaterais
  - date.ts — Helpers de data/fuso horário
  - scoring.ts — Lógica de pontuação

**Regra:** nunca misture lógica de negócio dentro dos Route Handlers. Handlers são finos: validam entrada, chamam serviços e formatam resposta.

---

## 2. Variáveis de Ambiente

### Separação obrigatória

| Variável | Exposição | Uso |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Pública | Supabase client-side |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Pública | Supabase client-side (RLS protege) |
| SUPABASE_SERVICE_ROLE_KEY | Somente servidor | Operações admin (cron, triggers) |
| RESEND_API_KEY | Somente servidor | Envio de e-mail |
| FOOTBALL_DATA_API_KEY | Somente servidor | API de futebol |
| CRON_SECRET | Somente servidor | Proteção da rota de cron |

### Regras

- NUNCA prefixe NEXT_PUBLIC_ em segredos. Qualquer variável NEXT_PUBLIC_ é embutida no bundle do cliente.
- Valide a existência das variáveis no startup com uma função assertEnv():

`	ypescript
// src/lib/env.ts
function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(Variável de ambiente obrigatória ausente: );
  return value;
}

export const env = {
  supabaseUrl: assertEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: assertEnv('SUPABASE_SERVICE_ROLE_KEY'),
  resendApiKey: assertEnv('RESEND_API_KEY'),
  footballDataApiKey: assertEnv('FOOTBALL_DATA_API_KEY'),
  cronSecret: assertEnv('CRON_SECRET'),
} as const;
`

---

## 3. Clientes Supabase — Uso Correto

`	ypescript
// src/lib/supabase/server.ts — Use em Server Components, Route Handlers e Server Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );
}

// src/lib/supabase/admin.ts — Use SOMENTE em Route Handlers/Server Actions que precisam de service_role
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // NUNCA expor ao cliente
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
`

Importe createSupabaseAdminClient somente em arquivos dentro de app/api/ ou lib/. Nunca em components/.

---

## 4. Route Handlers — Padrão de Implementação

`	ypescript
// src/app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { predictionSchema } from '@/lib/validators/prediction';
import { handleApiError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validação de entrada com Zod
    const body = await request.json();
    const parsed = predictionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // 3. Regra de negócio (extraída em serviço)
    const result = await savePrediction(supabase, user.id, parsed.data);

    // 4. Resposta padronizada
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
`

---

## 5. Tratamento de Erros Centralizado

`	ypescript
// src/lib/errors.ts
import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(${resource} não encontrado, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Acesso negado', 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error);
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
}
`

---

## 6. Validação com Zod

`	ypescript
// src/lib/validators/prediction.ts
import { z } from 'zod';

export const predictionSchema = z.object({
  poolId: z.string().uuid('ID do bolão inválido'),
  matchId: z.number().int().positive('ID do jogo inválido'),
  homeGuess: z.number().int().min(0).max(20, 'Placar fora do intervalo'),
  awayGuess: z.number().int().min(0).max(20, 'Placar fora do intervalo'),
});

export type PredictionInput = z.infer<typeof predictionSchema>;

// src/lib/validators/auth.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _'),
  nickname: z.string().min(2).max(30),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
});
`

Regras Zod:
- Sempre use safeParse (nunca parse diretamente em handlers).
- Defina mensagens de erro em português do Brasil.
- Exporte o tipo inferido (z.infer<typeof schema>) para reuso no front-end.

---

## 7. Segurança — Checklist

### RLS (Row Level Security)

- Habilite RLS em TODAS as tabelas logo após criá-las.
- Nunca deixe tabela sem policy — sem policy + RLS ativo = bloqueado para todos (seguro por padrão, mas torne intencional).
- Exemplo para tabela predictions:

`sql
-- Leitura: somente membros do bolão
CREATE POLICY "members_can_read_pool_predictions"
  ON predictions FOR SELECT
  USING (
    pool_id IN (
      SELECT pool_id FROM pool_members WHERE user_id = auth.uid()
    )
  );

-- Inserção: usuário no bolão, escrevendo para si mesmo
CREATE POLICY "user_can_insert_own_prediction"
  ON predictions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND pool_id IN (
      SELECT pool_id FROM pool_members WHERE user_id = auth.uid()
    )
  );
`

### Proteção da rota de cron

`	ypescript
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  // ...lógica do cron
}
`

### Trava de palpite (validação no servidor — não apenas no front)

`	ypescript
const { data: match } = await supabase
  .from('matches')
  .select('kickoff_at')
  .eq('id', matchId)
  .single();

const DEADLINE_MS = 60_000; // 1 minuto
const deadline = new Date(match.kickoff_at).getTime() - DEADLINE_MS;
if (Date.now() >= deadline) {
  throw new ValidationError('Prazo de palpite encerrado para este jogo');
}
`

### Outras regras de segurança

- Nunca confie em dados do cliente para calcular user_id — sempre use auth.getUser() no servidor.
- Sanitize e valide uploads de imagem (tipo MIME + tamanho máximo) antes de enviar ao Storage.
- Não coloque dados pessoais em query strings de URL.
- Não exponha mensagens de erro internas do banco ao cliente.

---

## 8. Módulo de Futebol — Interface Trocável

`	ypescript
// src/lib/football.ts
export interface FootballMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string; // ISO 8601 UTC
  status: 'scheduled' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
}

export interface FootballDataSource {
  getTodaysMatches(): Promise<FootballMatch[]>;
  getMatchResult(id: number): Promise<FootballMatch | null>;
}

class FootballDataOrg implements FootballDataSource {
  private readonly baseUrl = 'https://api.football-data.org/v4';
  private readonly headers = { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! };

  async getTodaysMatches(): Promise<FootballMatch[]> {
    // implementação concreta
  }

  async getMatchResult(id: number): Promise<FootballMatch | null> {
    // implementação concreta
  }
}

// Singleton exportado — troque a classe para mudar a fonte
export const footballDataSource: FootballDataSource = new FootballDataOrg();
`

Qualquer chamada à API de futebol passa por footballDataSource. Para trocar a fonte, implemente FootballDataSource em uma nova classe e substitua o export.

---

## 9. Lógica de Pontuação — Pura e Testável

`	ypescript
// src/utils/scoring.ts — Função pura, fácil de testar unitariamente
export type MatchResult = 'home' | 'draw' | 'away';

export function getResult(home: number, away: number): MatchResult {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

export function calculatePoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number
): number {
  if (homeGuess === homeScore && awayGuess === awayScore) return 8; // placar exato
  if (getResult(homeGuess, awayGuess) === getResult(homeScore, awayScore)) return 5; // acertou resultado
  return 0;
}
`

Escreva testes unitários com Vitest cobrindo: placar exato (8pts), resultado certo (5pts), erro (0pts), empate como resultado próprio.

---

## 10. Datas e Fusos Horários

`	ypescript
// src/utils/date.ts
import { toZonedTime, format } from 'date-fns-tz';

const TZ = 'America/Sao_Paulo';
const DEADLINE_BEFORE_KICKOFF_MS = 60_000;

// Armazene SEMPRE em UTC no banco. Converta apenas na exibição.
export function toDisplayTime(utcIso: string): string {
  const date = toZonedTime(new Date(utcIso), TZ);
  return format(date, "dd/MM 'às' HH:mm", { timeZone: TZ });
}

export function isPredictionEditable(kickoffAtUtc: string): boolean {
  const deadline = new Date(kickoffAtUtc).getTime() - DEADLINE_BEFORE_KICKOFF_MS;
  return Date.now() < deadline;
}

export function getTodayRangeInUTC(): { start: string; end: string } {
  const now = toZonedTime(new Date(), TZ);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
}
`

---

## 11. Clean Code — Regras Gerais

1. **Funções pequenas e com um único propósito.** Se tiver mais de ~30 linhas, quebre em funções auxiliares.
2. **Nomes descritivos.** Prefira getUserPredictionForMatch() a getData().
3. **Evite comentários óbvios.** Comente apenas o "porquê", nunca o "o quê".
4. **Sem números mágicos.** Use constantes nomeadas: PREDICTION_DEADLINE_MS = 60_000.
5. **Imutabilidade por padrão.** Use const sempre que possível.
6. **Early return.** Valide e retorne cedo para evitar aninhamento excessivo.
7. **Tipagem estrita.** Habilite "strict": true no tsconfig.json. Nunca use any — use unknown e narrowing.
8. **DRY.** Se usou a mesma query em dois lugares, extraia para lib/.
9. **Logs estruturados.** Use console.error('[contexto]', error) com contexto.
10. **Idempotência em jobs.** Sempre verifique notifications_log antes de enviar e-mail.

---

## 12. Migrações SQL — Boas Práticas

- Guarde em supabase/migrations/ com timestamp: 20260101000000_create_profiles.sql
- NUNCA edite uma migration já aplicada. Crie uma nova para corrigir.
- Sempre inclua CREATE POLICY e ALTER TABLE ... ENABLE ROW LEVEL SECURITY na mesma migration da tabela.
- Use IF NOT EXISTS em índices.
- Documente o propósito de cada migration com um comentário no topo.

---

## 13. Tipos Gerados — Supabase CLI

`ash
# Gere os tipos TypeScript a partir do schema do banco
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
`

Importe e use Database em todos os clientes Supabase. Regenere sempre que alterar o schema.
