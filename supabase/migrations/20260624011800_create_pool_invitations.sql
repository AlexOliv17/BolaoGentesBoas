-- Criação da tabela de convites
CREATE TABLE IF NOT EXISTS public.pool_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Impede convites duplicados do mesmo bolão para a mesma pessoa
    UNIQUE(pool_id, invitee_id)
);

-- Habilita RLS
ALTER TABLE public.pool_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- O inviter ou o invitee podem ver o convite
CREATE POLICY "Usuários podem ver seus próprios convites (enviados ou recebidos)"
ON public.pool_invitations FOR SELECT
USING (
    auth.uid() = inviter_id OR auth.uid() = invitee_id
);

-- Qualquer membro do bolão pode convidar alguém
-- Nota: Aqui estamos verificando se o inviter é de fato membro do bolão via pool_members
CREATE POLICY "Membros do bolão podem criar convites"
ON public.pool_invitations FOR INSERT
WITH CHECK (
    auth.uid() = inviter_id AND 
    EXISTS (
        SELECT 1 FROM public.pool_members 
        WHERE pool_id = pool_invitations.pool_id AND user_id = auth.uid()
    )
);

-- O convidado pode atualizar o status do convite (aceitar ou rejeitar)
CREATE POLICY "O convidado pode aceitar ou rejeitar"
ON public.pool_invitations FOR UPDATE
USING (
    auth.uid() = invitee_id
)
WITH CHECK (
    auth.uid() = invitee_id
);

-- O inviter pode cancelar o convite (deletar) antes de ser aceito
CREATE POLICY "Inviter pode deletar o convite"
ON public.pool_invitations FOR DELETE
USING (
    auth.uid() = inviter_id AND status = 'pending'
);
