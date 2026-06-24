import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/invitations
 * 
 * Retorna todos os convites pendentes recebidos pelo usuário logado.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data, error } = await supabase
      .from('pool_invitations')
      .select(`
        id,
        status,
        created_at,
        pool_id,
        pool:pools!pool_invitations_pool_id_fkey(name),
        inviter:profiles!pool_invitations_inviter_id_fkey(nickname, avatar_url)
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('[GET /api/invitations] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/invitations
 * 
 * Aceita ou recusa um convite.
 * Body: { invitationId: string, action: 'accept' | 'reject' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { invitationId, action } = await request.json();

    if (!invitationId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // 1. Busca o convite para validar se pertence ao usuário
    const { data: invitation, error: getErr } = await supabase
      .from('pool_invitations')
      .select('id, pool_id, status')
      .eq('id', invitationId)
      .eq('invitee_id', user.id)
      .single();

    if (getErr || !invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Convite já processado' }, { status: 400 });
    }

    // 2. Atualiza o status do convite
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { error: updErr } = await supabase
      .from('pool_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId);

    if (updErr) throw updErr;

    // 3. Se aceitou, adiciona como membro do bolão
    if (action === 'accept') {
      const { error: joinErr } = await supabase
        .from('pool_members')
        .insert({
          pool_id: invitation.pool_id,
          user_id: user.id,
          role: 'member'
        });

      // Ignora erro se já for membro
      if (joinErr && joinErr.code !== '23505') {
        throw joinErr;
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('[PATCH /api/invitations] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
