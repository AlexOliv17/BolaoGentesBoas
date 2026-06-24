import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@/lib/validators/profile';
import { handleApiError, UnauthorizedError, ValidationError } from '@/lib/errors';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // 2. Leitura do body
    const body = await request.json();
    
    // 3. Validação
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // 4. Update no banco
    // A política RLS garante que o usuário só possa atualizar a própria linha.
    const updateData: { nickname?: string; avatar_url?: string | null } = {};
    if (parsed.data.nickname !== undefined) updateData.nickname = parsed.data.nickname;
    if (parsed.data.avatar_url !== undefined) updateData.avatar_url = parsed.data.avatar_url;

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('Nenhum dado válido para atualizar foi enviado.');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Opcionalmente também atualizar os auth.users user_meta_data
    // para que na próxima vez que ele logar o meta_data esteja atualizado
    await supabase.auth.updateUser({
      data: updateData
    });

    return NextResponse.json({ message: 'Perfil atualizado com sucesso' }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
