import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const poolId = resolvedParams.id;

    const { data: memberData, error: memberError } = await supabase
      .from('pool_members')
      .select('role')
      .eq('pool_id', poolId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Você não tem acesso a este bolão' }, { status: 403 });
    }

    const { data: poolData, error: poolError } = await supabase
      .from('pools')
      .select(`
        *,
        owner:profiles!owner_id(id, username, nickname, avatar_url)
      `)
      .eq('id', poolId)
      .single();

    if (poolError) {
      return NextResponse.json({ error: 'Bolão não encontrado' }, { status: 404 });
    }

    const responseData = {
      ...poolData,
      my_role: memberData.role,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const poolId = resolvedParams.id;

    // Verifica se o usuário é o dono (admin)
    const { data: memberData, error: memberError } = await supabase
      .from('pool_members')
      .select('role')
      .eq('pool_id', poolId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData || memberData.role !== 'admin') {
      return NextResponse.json({ error: 'Você não tem permissão para deletar este bolão' }, { status: 403 });
    }

    // A deleção em cascata (ON DELETE CASCADE) apagará também as participações e convites relacionados
    const { error: deleteError } = await supabase
      .from('pools')
      .delete()
      .eq('id', poolId);

    if (deleteError) {
      return NextResponse.json({ error: 'Erro ao deletar bolão: ' + deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Bolão deletado com sucesso' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
