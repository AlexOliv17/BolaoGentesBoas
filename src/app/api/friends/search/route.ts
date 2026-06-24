import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Termo de busca muito curto (mínimo 2 caracteres)' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca perfis cujo username ou nickname contenham o termo de busca, exceto o próprio usuário
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('id, username, nickname, avatar_url')
      .neq('id', user.id)
      .or(`username.ilike.%${q}%,nickname.ilike.%${q}%`)
      .limit(10);

    if (dbError) throw dbError;

    // Também precisamos buscar se já existe uma amizade (ou pedido pendente) com esses usuários
    // para mostrar no front-end "Já são amigos", "Pedido enviado", etc.
    const profileIds = profiles?.map(p => p.id) || [];
    
    let friendships: any[] = [];
    if (profileIds.length > 0) {
      const { data: rels } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.in.(${profileIds.join(',')}),addressee_id.in.(${profileIds.join(',')})`);
        
      if (rels) {
        friendships = rels.filter(r => 
          (r.requester_id === user.id && profileIds.includes(r.addressee_id)) || 
          (r.addressee_id === user.id && profileIds.includes(r.requester_id))
        );
      }
    }

    // Mesclando a informação de amizade no retorno
    const results = profiles?.map(p => {
      const relation = friendships.find(r => r.requester_id === p.id || r.addressee_id === p.id);
      return {
        ...p,
        friendship_status: relation ? relation.status : null,
        is_requester: relation ? relation.requester_id === user.id : false
      };
    }) || [];

    return NextResponse.json({ data: results }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
