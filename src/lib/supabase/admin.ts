import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Cliente Supabase Admin com service_role key.
 *
 * ⚠️  SOMENTE para uso em Route Handlers e Server Actions que precisam
 *     contornar o RLS (ex.: cron jobs, triggers, operações administrativas).
 *
 * NUNCA importe este módulo em:
 *   - Client Components ('use client')
 *   - Arquivos prefixados com NEXT_PUBLIC_
 *   - Código que possa ser bundlado no cliente
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[Supabase Admin] Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.',
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
