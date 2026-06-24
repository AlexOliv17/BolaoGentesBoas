import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // 1. Verificação de segurança (Secret)
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  // 2. Buscar jogos que começam daqui a ~30 minutos
  const now = new Date();
  const minTime = new Date(now.getTime() + 29 * 60000).toISOString();
  const maxTime = new Date(now.getTime() + 31 * 60000).toISOString();

  const { data: matches, error: matchesErr } = await supabase
    .from('matches')
    .select('id, homeTeam, awayTeam, kickoff_at')
    .eq('status', 'scheduled')
    .gte('kickoff_at', minTime)
    .lte('kickoff_at', maxTime);

  if (matchesErr) {
    console.error('[cron/reminders] Erro ao buscar jogos:', matchesErr);
    return NextResponse.json({ error: 'Erro ao buscar jogos' }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({ message: 'Nenhum jogo começando em 30 min' }, { status: 200 });
  }

  let totalEmailsSent = 0;

  for (const match of matches) {
    // Buscar todos os membros de bolões com seus e-mails
    // Como Supabase Auth limita o acesso direto ao email pelo front, usando o service_role nós teríamos acesso, mas o Supabase App Router não usa service_role nativamente pra ler auth.users.
    // MAS, na criação do usuário, nós não guardamos o e-mail na tabela profiles por segurança. 
    // Opa! Vamos checar se profiles tem email.
    // Se não tiver, precisamos usar uma query com service_role para auth.users.
    
    // Para simplificar, vou criar um client admin para ler e-mails.
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pega todos os membros
    const { data: members } = await supabaseAdmin
      .from('pool_members')
      .select('pool_id, user_id');
      
    if (!members) continue;

    // Pega todos os palpites deste jogo
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('pool_id, user_id')
      .eq('match_id', match.id);

    const predsSet = new Set((predictions || []).map(p => `${p.pool_id}_${p.user_id}`));

    // Encontra membros que não palpitaram nesse bolão específico
    const missingUsers = new Set<string>();
    for (const m of members) {
      if (!predsSet.has(`${m.pool_id}_${m.user_id}`)) {
        missingUsers.add(m.user_id);
      }
    }

    if (missingUsers.size === 0) continue;

    // Pega notificações já enviadas para não enviar duplicado
    const { data: logs } = await supabaseAdmin
      .from('notifications_log')
      .select('user_id')
      .eq('type', 'reminder_30min')
      .eq('reference_id', match.id);

    const alreadySentSet = new Set((logs || []).map(l => l.user_id));

    // Filtra quem ainda precisa receber
    const usersToNotify = Array.from(missingUsers).filter(uid => !alreadySentSet.has(uid));

    if (usersToNotify.length === 0) continue;

    // Busca e-mails no auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    const usersMap = new Map((authData?.users || []).map(u => [u.id, u]));

    // Busca apelidos
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, nickname')
      .in('id', usersToNotify);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.nickname]));

    for (const userId of usersToNotify) {
      const authUser = usersMap.get(userId);
      const nickname = profileMap.get(userId) || 'Torcedor';
      
      if (!authUser || !authUser.email) continue;

      const subject = `O jogo ${match.homeTeam} x ${match.awayTeam} vai começar!`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #ff7a00;">Bolão Gentes Boas</h2>
          <p>Olá <strong>${nickname}</strong>,</p>
          <p>Faltam apenas 30 minutos para o apito inicial de <strong>${match.homeTeam} x ${match.awayTeam}</strong>!</p>
          <p>Notamos que você ainda <strong>não fez ou esqueceu de fazer o seu palpite</strong> em um ou mais bolões que você participa.</p>
          <p>Corra e garanta seus pontos antes que o jogo seja travado!</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #ff7a00; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 16px;">Ir para o Bolão</a>
        </div>
      `;

      const success = await sendEmail({
        to: authUser.email,
        subject,
        html
      });

      if (success) {
        // Registra o envio
        await supabaseAdmin.from('notifications_log').insert({
          user_id: userId,
          type: 'reminder_30min',
          reference_id: match.id
        });
        totalEmailsSent++;
      }
    }
  }

  return NextResponse.json({ message: `Reminders check completed. Emails sent: ${totalEmailsSent}` }, { status: 200 });
}
