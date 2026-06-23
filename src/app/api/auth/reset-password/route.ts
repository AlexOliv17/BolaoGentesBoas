import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Precisa de ao menos um número'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { password } = parsed.data;
    const supabase = await createSupabaseServerClient();

    // Verifica se o usuário está logado (o callback o logou temporariamente)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada. Tente o link do e-mail novamente.' }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Após redefinir a senha, podemos deslogar se quisermos forçar um novo login,
    // mas o Supabase mantém a sessão válida. Vamos manter logado.
    return NextResponse.json({ message: 'Senha redefinida' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
