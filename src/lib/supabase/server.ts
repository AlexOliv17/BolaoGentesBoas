import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

type CookiesToSet = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0];

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 * Lê/escreve cookies para manter a sessão do usuário.
 *
 * NUNCA importe em Client Components ('use client').
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll chamado de um Server Component — ignorar.
            // O middleware cuida de atualizar os cookies de sessão.
          }
        },
      },
    },
  );
}
