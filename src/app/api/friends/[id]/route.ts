import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['accept', 'block']),
});

// Aceitar (ou bloquear) um pedido de amizade
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const { action } = parsed.data;
    const { id } = await params;
    const friendshipId = id;

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'blocked';

    // A policy já protege para que o usuário só consiga atualizar pedidos onde ele é o `addressee_id`
    const { data: updated, error: updateError } = await supabase
      .from('friendships')
      .update({ status: newStatus })
      .eq('id', friendshipId)
      .eq('addressee_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Falha ao atualizar pedido. Verifique se ele existe e foi enviado para você.' }, { status: 400 });
    }

    return NextResponse.json({ data: updated, message: `Pedido ${action === 'accept' ? 'aceito' : 'bloqueado'} com sucesso!` }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// Recusar (deletar) um pedido pendente ou desfazer amizade
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const friendshipId = id;

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // O usuário pode deletar se for o requester (cancelar) ou o addressee (recusar/desfazer)
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (deleteError) {
      return NextResponse.json({ error: 'Falha ao remover amizade.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Amizade/Pedido removido.' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
