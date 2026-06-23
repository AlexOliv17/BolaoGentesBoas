import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email } = parsed.data;
    const supabase = await createSupabaseServerClient();

    // The callback route will handle exchanging the code and redirecting to /reset-password
    const callbackUrl = new URL('/api/auth/callback', request.url);
    callbackUrl.searchParams.set('next', '/reset-password');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'E-mail enviado' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
