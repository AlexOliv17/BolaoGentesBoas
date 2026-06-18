import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

type CookiesToSet = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0];
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy de autenticação do BolaoGB (Next.js 16+ — anteriormente "middleware").
 *
 * - Rotas públicas (/login, /signup, /join/*): acessíveis sem login.
 * - Rotas protegidas: redireciona para /login se não autenticado.
 * - Usuário logado tentando acessar /login ou /signup: redireciona para /dashboard.
 *
 * O proxy também atualiza os cookies de sessão do Supabase em cada request.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Atualiza a sessão — não remova esta linha
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/esqueci-senha');

  const isPublicPage =
    isAuthPage ||
    pathname.startsWith('/join/') ||
    pathname === '/';

  // Redireciona usuário não autenticado para login
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redireciona usuário autenticado para fora das páginas de auth
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy a todas as rotas EXCETO:
     * - Arquivos estáticos do Next.js (_next/static, _next/image, favicon)
     * - Rotas de cron (protegidas por CRON_SECRET, não por sessão)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/cron).*)',
  ],
};
