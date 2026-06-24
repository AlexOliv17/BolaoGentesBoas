import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/pools/[id]/invitations
 * 
 * Retorna os amigos do usuário logado, junto com o status em relação ao bolão:
 * - is_member: se já está no bolão
 * - is_invited: se já possui um convite 'pending'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const resolvedParams = await params;
    const poolId = resolvedParams.id;

    // 1. Busca os IDs dos amigos do usuário logado
    const { data: friendsData, error: friendsErr } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (friendsErr) throw friendsErr;

    if (!friendsData || friendsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const friendIds = friendsData.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);

    // 1.1 Busca os dados dos perfis desses amigos
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, username, nickname, avatar_url')
      .in('id', friendIds);

    if (profErr) throw profErr;

    const friendsList = profiles || [];

    // 2. Busca quem já é membro do bolão
    const { data: members, error: memErr } = await supabase
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', poolId)
      .in('user_id', friendIds);

    if (memErr) throw memErr;
    const memberIds = new Set(members?.map(m => m.user_id) || []);

    // 3. Busca convites pendentes já enviados
    const { data: invites, error: invErr } = await supabase
      .from('pool_invitations')
      .select('invitee_id')
      .eq('pool_id', poolId)
      .eq('status', 'pending')
      .in('invitee_id', friendIds);

    if (invErr) throw invErr;
    const invitedIds = new Set(invites?.map(i => i.invitee_id) || []);

    // 4. Monta o payload final
    const result = friendsList.map(friend => ({
      ...friend,
      is_member: memberIds.has(friend.id),
      is_invited: invitedIds.has(friend.id),
    }));

    // Ordena: primeiro os que podem ser convidados
    result.sort((a, b) => {
      const aDisabled = a.is_member || a.is_invited;
      const bDisabled = b.is_member || b.is_invited;
      if (aDisabled && !bDisabled) return 1;
      if (!aDisabled && bDisabled) return -1;
      return a.nickname.localeCompare(b.nickname);
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[GET /api/pools/[id]/invitations] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/pools/[id]/invitations
 * 
 * Cria um convite para um amigo participar do bolão.
 * Body: { inviteeId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const resolvedParams = await params;
    const poolId = resolvedParams.id;
    const { inviteeId } = await request.json();

    if (!inviteeId) {
      return NextResponse.json({ error: 'inviteeId é obrigatório' }, { status: 400 });
    }

    // A política RLS garante que só membros do bolão possam criar o convite
    const { data, error } = await supabase
      .from('pool_invitations')
      .insert({
        pool_id: poolId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      // Se for violação de unique constraint (já convidou)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Convite já enviado' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/pools/[id]/invitations] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
