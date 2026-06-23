import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';

const requestSchema = z.object({
  addressee_id: z.string().uuid().optional(),
  code: z.string().optional(),
}).refine(data => data.addressee_id || data.code, {
  message: 'Forneça o ID do destinatário ou o código de convite',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { addressee_id, code } = parsed.data;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let targetId = addressee_id;

    // Se veio um código, busca o ID do dono
    if (code) {
      const { data: inviteCode, error: codeError } = await supabase
        .from('friend_invite_codes')
        .select('owner_id, expires_at')
        .eq('code', code.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !inviteCode) {
        return NextResponse.json({ error: 'Código de convite inválido ou expirado' }, { status: 404 });
      }

      targetId = inviteCode.owner_id;
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: 'Você não pode adicionar a si mesmo' }, { status: 400 });
    }

    // Verifica se já existe amizade ou pedido pendente
    const { data: existing, error: checkError } = await supabase
      .from('friendships')
      .select('id, status, requester_id')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Vocês já são amigos' }, { status: 400 });
      }
      if (existing.status === 'pending') {
        if (existing.requester_id === user.id) {
          return NextResponse.json({ error: 'Pedido já enviado' }, { status: 400 });
        } else {
          return NextResponse.json({ error: 'Este usuário já te enviou um pedido. Verifique seus pedidos pendentes.' }, { status: 400 });
        }
      }
      if (existing.status === 'blocked') {
        return NextResponse.json({ error: 'Não é possível adicionar este usuário' }, { status: 403 });
      }
    }

    // Cria o pedido de amizade
    const { data: newFriendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: targetId,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: newFriendship, message: 'Pedido de amizade enviado!' }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
