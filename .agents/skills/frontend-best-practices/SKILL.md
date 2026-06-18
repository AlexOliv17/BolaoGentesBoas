---
name: frontend-best-practices
description: >
  Boas práticas de front-end para o projeto BolaoGB: Next.js App Router com TypeScript,
  componentes React, mobile-first design, acessibilidade, formulários com React Hook Form + Zod,
  gerenciamento de estado, performance, clean code e padrões de UX.
---

# Boas Práticas de Front-End — BolaoGB

Stack de referência: **Next.js 14+ (App Router, TypeScript)** + **React Hook Form** + **Zod** + **CSS Modules / Vanilla CSS** + **date-fns-tz**.

---

## 1. Estrutura de Pastas

`
src/
├── app/                            # Rotas (App Router)
│   ├── (auth)/                     # Grupo de rotas públicas (login, signup)
│   ├── (app)/                      # Grupo protegido (layout com auth check)
│   │   ├── dashboard/
│   │   ├── pools/[poolId]/
│   │   └── profile/
│   └── layout.tsx                  # Root layout (metadata, fonts, providers)
├── components/
│   ├── ui/                         # Componentes primitivos (Button, Input, Card, Avatar)
│   ├── auth/                       # Formulários de login/signup
│   ├── pools/                      # Componentes de bolão (PoolCard, MemberList, Ranking)
│   ├── predictions/                # Formulário de palpite, lista de jogos
│   └── shared/                     # Header, Footer, LoadingSpinner, ErrorBoundary
├── hooks/
│   ├── useAuth.ts
│   ├── usePrediction.ts
│   └── usePool.ts
├── lib/
│   ├── supabase/client.ts          # Cliente Supabase para Client Components
│   └── validators/                 # Schemas Zod compartilhados com o back-end
├── styles/
│   ├── globals.css                 # Reset, variáveis CSS, tipografia base
│   └── tokens.css                  # Design tokens (cores, espaçamentos, breakpoints)
└── utils/
    └── date.ts                     # Helpers de data (compartilhados com back-end)
`

---

## 2. Mobile-First — Regras Obrigatórias

O acesso ao bolão será predominantemente via celular. Toda tela deve ser projetada primeiro para ~360px e depois escalar.

### Meta tag obrigatória

`html
<meta name="viewport" content="width=device-width, initial-scale=1" />
`

### CSS Mobile-First

`css
/* Sempre comece pelo mobile e expanda com min-width */
.ranking-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .ranking-table {
    display: table;
  }
}
`

### Áreas de toque

- Todos os botões e inputs devem ter min-height: 44px e min-width: 44px.
- Use padding generoso em elementos clicáveis — não confie só no tamanho do texto.

`css
.btn {
  min-height: 44px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}
`

### Unidades relativas

- Use em para tipografia e espaçamentos (escala com preferências do usuário).
- Use % ou r para larguras de layout (fluido).
- Evite px fixo para larguras de container.

### Telas críticas — teste em 360px, 768px e 1280px

- **Ranking:** use cards no mobile em vez de tabela horizontal.
- **Lista de jogos:** cards empilhados, placar grande e legível.
- **Formulário de palpite:** inputs grandes, sem zoom forçado (font-size >= 16px em inputs).
- Sem rolagem horizontal em nenhuma tela.

---

## 3. Design Tokens — CSS Variables

`css
/* src/styles/tokens.css */
:root {
  /* Cores */
  --color-primary: hsl(220, 90%, 56%);
  --color-primary-dark: hsl(220, 90%, 44%);
  --color-success: hsl(142, 71%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-error: hsl(0, 84%, 60%);
  --color-bg: hsl(220, 20%, 8%);
  --color-surface: hsl(220, 16%, 14%);
  --color-surface-elevated: hsl(220, 14%, 20%);
  --color-text: hsl(220, 20%, 95%);
  --color-text-muted: hsl(220, 10%, 60%);
  --color-border: hsl(220, 12%, 25%);

  /* Tipografia */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Espaçamento */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Bordas */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.3);
  --shadow-md: 0 4px 12px hsl(0 0% 0% / 0.4);
  --shadow-lg: 0 8px 24px hsl(0 0% 0% / 0.5);

  /* Transições */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}
`

Nunca use cores, tamanhos ou espaçamentos hardcoded no CSS de componentes — sempre use os tokens.

---

## 4. Componentes — Padrões

### Server vs Client Components

`	ypescript
// Prefira Server Components por padrão
// app/pools/[poolId]/page.tsx — Server Component
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PoolRanking } from '@/components/pools/PoolRanking';

export default async function PoolPage({ params }: { params: { poolId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: pool } = await supabase.from('pools').select('*').eq('id', params.poolId).single();
  return <PoolRanking pool={pool} />;
}

// Adicione 'use client' APENAS quando necessário (interatividade, hooks, eventos)
'use client';
// components/predictions/PredictionForm.tsx — Client Component
`

### Estrutura de componente

`	ypescript
// components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={[styles.btn, styles[variant], styles[size]].join(' ')}
      aria-busy={isLoading}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
`

Regras de componentes:
- Interface Props sempre com tipos explícitos — sem object ou any.
- Props com valores padrão razoáveis.
- Spread restante (...props) para permitir extensão sem perder atributos HTML nativos.
- aria-* para acessibilidade.
- CSS Modules para estilos escopados — evite classes globais em componentes.

---

## 5. Formulários — React Hook Form + Zod

`	ypescript
// components/auth/SignUpForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '@/lib/validators/auth';
import type { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpFormData) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const { error } = await response.json();
      // Mapear erros do servidor para campos do formulário
      if (error.includes('username')) {
        setError('username', { message: 'Username já em uso' });
      } else {
        setError('root', { message: error });
      }
      return;
    }
    // redirecionar
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="username"
        label="Username"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        id="email"
        type="email"
        label="E-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      {errors.root && <p role="alert">{errors.root.message}</p>}
      <Button type="submit" isLoading={isSubmitting}>
        Criar conta
      </Button>
    </form>
  );
}
`

Regras de formulários:
- Sempre use zodResolver — compartilha o schema de validação com o back-end.
- Use noValidate no form para desativar validação nativa do browser (a do Zod é superior).
- Exiba erros por campo, não apenas erros genéricos.
- Desative o botão de submit enquanto isSubmitting for true.
- Use setError('root', ...) para erros que não mapeiam para um campo específico.
- Font-size >= 16px em todos os inputs (evita zoom automático no iOS).

---

## 6. Gerenciamento de Estado

### Hierarquia de decisão

1. **Estado local (useState):** dados que afetam apenas um componente.
2. **Context API:** dados globais leves (usuário autenticado, tema).
3. **URL state (searchParams):** filtros, abas — compartilháveis por link.
4. **Supabase Realtime:** atualizações ao vivo (ranking, placares).

### Contexto de autenticação

`	ypescript
// hooks/useAuth.ts
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
`

---

## 7. Tratamento de Estados de UI

Toda operação assíncrona deve ter três estados visíveis ao usuário: loading, sucesso e erro.

`	ypescript
// Padrão para operações assíncronas em Client Components
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const [errorMessage, setErrorMessage] = useState('');

async function handleAction() {
  setStatus('loading');
  try {
    await doSomething();
    setStatus('success');
  } catch (err) {
    setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado');
    setStatus('error');
  }
}
`

Checklist de estados de UI:
- Loading: spinner ou skeleton (nunca deixe a tela em branco).
- Erro: mensagem clara em português, com ação de retry quando aplicável.
- Empty state: quando não há dados, mostre mensagem útil (não tela vazia).
- Optimistic update: para palpites, atualize a UI antes da confirmação do servidor.

---

## 8. Acessibilidade (a11y)

- Todo input deve ter um label associado via htmlFor/id (nunca use placeholder como substituto de label).
- Use role="alert" em mensagens de erro que aparecem dinamicamente.
- Mantenha ordem de foco lógica — não quebre com tabindex positivo.
- Imagens decorativas: alt="". Imagens informativas: alt descritivo.
- Botões com apenas ícones devem ter aria-label.
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande.
- Use elementos semânticos: nav, main, section, article, header, footer.

---

## 9. Performance

- **Imagens:** use next/image com width e height explícitos. Nunca use <img> nativo para imagens de conteúdo.
- **Fontes:** carregue via next/font (zero layout shift, otimização automática).
- **Code splitting:** o App Router já faz por rota. Evite importar bibliotecas pesadas em componentes usados em todas as páginas.
- **Memoização:** use useMemo e useCallback apenas quando há evidência de problema de performance (não antecipadamente).
- **Supabase queries:** selecione apenas as colunas necessárias (.select('id, name, score')).
- **Cache de API externa:** sempre leia primeiro do banco (tabela matches) antes de chamar a API de futebol.

---

## 10. Middleware de Autenticação

`	ypescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup');

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)'],
};
`

---

## 11. Clean Code — Regras de Front-End

1. **Um componente, uma responsabilidade.** Separe lógica (hooks) de apresentação (JSX).
2. **Extraia lógica complexa para hooks customizados** (usePool, usePrediction).
3. **Nomes descritivos.** PredictionForm, não Form. PoolRankingCard, não Card2.
4. **Sem inline styles** — exceto para valores verdadeiramente dinâmicos (ex.: --progress-width: 80%).
5. **Evite prop drilling excessivo.** Se um dado passa por mais de 2 níveis, considere Context ou composição.
6. **Tipagem dos props sempre explícita** — nunca use any ou object em Props.
7. **Keys únicas em listas** — nunca use array index como key em listas dinâmicas.
8. **Carregamento progressivo.** Use Suspense + loading.tsx para indicar carregamento.
9. **Feedback imediato.** O usuário deve receber resposta visual em menos de 100ms para interações (botão de salvar palpite, por exemplo).
10. **Internacionalização de datas.** Sempre converta UTC para America/Sao_Paulo antes de exibir.

---

## 12. Tela do Palpite — Comportamentos Críticos

`	ypescript
// components/predictions/MatchCard.tsx
// Comportamentos obrigatórios para a tela de palpites

// 1. Mostrar horário-limite do jogo em horário local
const displayTime = toDisplayTime(match.kickoff_at); // ex: "15/06 às 16:00"

// 2. Verificar se ainda pode editar
const canEdit = isPredictionEditable(match.kickoff_at);

// 3. Desabilitar input no front (a validação real é no servidor)
<input
  type="number"
  min={0}
  max={20}
  disabled={!canEdit}
  aria-label="Gols do time da casa"
  style={{ fontSize: '16px' }} // Evita zoom no iOS
/>

// 4. Indicador visual de status
{!canEdit && <span className={styles.locked}>Prazo encerrado</span>}
{canEdit && <span className={styles.open}>Aberto para palpite</span>}

// 5. Mostrar pontuação quando o jogo terminar
{match.status === 'finished' && (
  <div className={styles.result}>
    {match.home_score} x {match.away_score}
    {prediction && <span>{prediction.points} pts</span>}
  </div>
)}
`

---

## 13. SEO e Metadata

`	ypescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Bolão Copa 2026',
    default: 'Bolão Copa 2026',
  },
  description: 'Dispute o bolão da Copa do Mundo 2026 com seus amigos',
  viewport: 'width=device-width, initial-scale=1',
};

// app/pools/[poolId]/page.tsx — metadata dinâmico
export async function generateMetadata({ params }: { params: { poolId: string } }): Promise<Metadata> {
  const pool = await getPool(params.poolId);
  return { title: pool.name };
}
`

Regras de SEO:
- Uma única tag h1 por página.
- Ordem hierárquica de headings: h1 > h2 > h3.
- Elementos semânticos: nav, main, article, section.
- Não exponha IDs de usuário ou dados sensíveis na URL.
