import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

function generateRandomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca código válido existente
    const { data: existingCodes, error: dbError } = await supabase
      .from('friend_invite_codes')
      .select('code, expires_at')
      .eq('owner_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (dbError) throw dbError;

    if (existingCodes && existingCodes.length > 0) {
      return NextResponse.json({ data: existingCodes[0] }, { status: 200 });
    }

    // Se não tiver código válido, gera um novo com validade de 7 dias
    const newCode = generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: insertedCode, error: insertError } = await supabase
      .from('friend_invite_codes')
      .insert({
        owner_id: user.id,
        code: newCode,
        expires_at: expiresAt.toISOString()
      })
      .select('code, expires_at')
      .single();

    if (insertError) {
      // Caso haja colisão muito rara de UNIQUE code, vamos lançar pra tentar novamente
      throw insertError;
    }

    return NextResponse.json({ data: insertedCode }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST pode ser usado para forçar a geração de um novo código (ex: usuário quer um novo)
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const newCode = generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: insertedCode, error: insertError } = await supabase
      .from('friend_invite_codes')
      .insert({
        owner_id: user.id,
        code: newCode,
        expires_at: expiresAt.toISOString()
      })
      .select('code, expires_at')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: insertedCode }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
