import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const inviteToken = resolvedParams.token;

    const { data: poolData, error: poolError } = await supabase
      .from('pools')
      .select('id')
      .eq('invite_token', inviteToken)
      .single();

    if (poolError || !poolData) {
      return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 404 });
    }

    const poolId = poolData.id;

    const { data: memberData } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', poolId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberData) {
      return NextResponse.json({ message: 'Você já é membro deste bolão', data: { pool_id: poolId } }, { status: 200 });
    }

    const { error: joinError } = await supabase
      .from('pool_members')
      .insert({
        pool_id: poolId,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      return NextResponse.json({ error: 'Erro ao entrar no bolão: ' + joinError.message }, { status: 400 });
    }

    revalidatePath('/dashboard');

    return NextResponse.json({ message: 'Entrou no bolão com sucesso', data: { pool_id: poolId } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
