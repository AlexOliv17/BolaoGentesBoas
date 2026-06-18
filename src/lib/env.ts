/**
 * Validação de variáveis de ambiente no startup.
 * Lança erro imediato se uma variável obrigatória estiver ausente.
 */
function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[env] Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

/**
 * Objeto tipado com todas as variáveis de ambiente do projeto.
 *
 * Variáveis NEXT_PUBLIC_* são seguras para o cliente.
 * As demais NUNCA devem ser importadas em Client Components.
 */
export const env = {
  // Públicas (bundladas no cliente)
  supabaseUrl:        assertEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:    assertEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Somente servidor — lança erro se usadas no cliente
  get supabaseServiceRoleKey() { return assertEnv('SUPABASE_SERVICE_ROLE_KEY'); },
  get resendApiKey()           { return assertEnv('RESEND_API_KEY'); },
  get footballDataApiKey()     { return assertEnv('FOOTBALL_DATA_API_KEY'); },
  get cronSecret()             { return assertEnv('CRON_SECRET'); },
} as const;
