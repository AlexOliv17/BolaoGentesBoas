import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createPoolSchema } from '@/lib/validators/pool';
import { handleApiError } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('pool_members')
      .select(`
        role,
        joined_at,
        pools (
          id,
          name,
          description,
          owner_id,
          created_at,
          invite_token,
          pool_members (count)
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const formattedData = data.map((membership: any) => ({
      ...membership.pools,
      my_role: membership.role,
      joined_at: membership.joined_at,
      member_count: membership.pools.pool_members[0].count
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPoolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        owner_id: user.id,
      })
      .select()
      .single();

    if (poolError) {
      return NextResponse.json({ error: poolError.message }, { status: 400 });
    }

    const { error: memberError } = await supabase
      .from('pool_members')
      .insert({
        pool_id: pool.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    revalidatePath('/dashboard');

    return NextResponse.json({ data: pool }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
