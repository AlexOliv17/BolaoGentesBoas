import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Cliente Supabase para uso em Client Components.
 * Usa a anon key pública — o RLS protege os dados no servidor.
 *
 * Use este cliente APENAS em arquivos com 'use client'.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
