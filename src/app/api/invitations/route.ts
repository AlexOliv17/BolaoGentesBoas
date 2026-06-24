import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/invitations
 * 
 * Retorna todos os convites pendentes recebidos pelo usuário logado (bolão e amizade).
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: poolData, error: poolError } = await supabase
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
      .eq('status', 'pending');

    if (poolError) throw poolError;

    const { data: friendData, error: friendError } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        requester:profiles!friendships_requester_id_fkey(nickname, avatar_url)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (friendError) throw friendError;

    const notifications = [
      ...(poolData || []).map(p => ({ ...p, type: 'pool' })),
      ...(friendData || []).map(f => ({ ...f, type: 'friend', inviter: f.requester }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: notifications });
  } catch (error: any) {
    console.error('[GET /api/invitations] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/invitations
 * 
 * Aceita ou recusa um convite.
 * Body: { invitationId: string, action: 'accept' | 'reject', type?: 'pool' | 'friend' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { invitationId, action, type = 'pool' } = await request.json();

    if (!invitationId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    if (type === 'friend') {
      const { data: friendship, error: getErr } = await supabase
        .from('friendships')
        .select('id, status')
        .eq('id', invitationId)
        .eq('addressee_id', user.id)
        .single();
      
      if (getErr || !friendship) return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
      if (friendship.status !== 'pending') return NextResponse.json({ error: 'Convite já processado' }, { status: 400 });

      const { error: updErr } = await supabase.from('friendships').update({ status: newStatus }).eq('id', invitationId);
      if (updErr) throw updErr;

      return NextResponse.json({ success: true, status: newStatus });
    }

    // Lógica para bolão (type === 'pool')
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
