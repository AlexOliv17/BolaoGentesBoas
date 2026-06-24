import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signInSchema } from '@/lib/validators/auth';
import { handleApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('email not confirmed')) {
        return NextResponse.json({ error: 'O e-mail ainda não foi confirmado. Verifique sua caixa de entrada.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
    }

    return NextResponse.json({ data: data.user }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
