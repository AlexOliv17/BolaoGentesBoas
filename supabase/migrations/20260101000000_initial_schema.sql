-- Migration: Initial Schema for BolaoGB
-- Description: Creates tables, RLS policies, and triggers for auto-creating profiles.

-- ==========================================
-- 1. TABLES CREATION
-- ==========================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- FRIEND INVITE CODES
CREATE TABLE IF NOT EXISTS public.friend_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POOLS
CREATE TABLE IF NOT EXISTS public.pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- POOL MEMBERS
CREATE TABLE IF NOT EXISTS public.pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pool_id, user_id)
);

-- MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id BIGINT PRIMARY KEY, -- Uses ID from football-data.org
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_guess INTEGER NOT NULL CHECK (home_guess >= 0),
  away_guess INTEGER NOT NULL CHECK (away_guess >= 0),
  points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pool_id, user_id, match_id)
);

-- NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type, reference_id)
);

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- FRIENDSHIPS
CREATE POLICY "Users can view their friendships" 
  ON public.friendships FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can insert friendships where they are requester" 
  ON public.friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships where they are addressee" 
  ON public.friendships FOR UPDATE 
  USING (auth.uid() = addressee_id);

-- FRIEND INVITE CODES
CREATE POLICY "Users can manage their invite codes" 
  ON public.friend_invite_codes FOR ALL 
  USING (auth.uid() = owner_id);
CREATE POLICY "Anyone can read an active invite code" 
  ON public.friend_invite_codes FOR SELECT 
  USING (expires_at > NOW());

-- POOLS
CREATE POLICY "Pools are viewable by members or by everyone (if public)" 
  ON public.pools FOR SELECT 
  USING (true); -- Usually pools have public metadata (name, rules). 

CREATE POLICY "Only owner can update pool" 
  ON public.pools FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Only owner can insert pool" 
  ON public.pools FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- POOL MEMBERS
CREATE POLICY "Pool members are viewable by everyone" 
  ON public.pool_members FOR SELECT 
  USING (true); -- Safe to see who is in which pool

CREATE POLICY "Users can join a pool" 
  ON public.pool_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- MATCHES
CREATE POLICY "Matches are viewable by everyone" 
  ON public.matches FOR SELECT 
  USING (true);

-- PREDICTIONS
CREATE POLICY "Predictions are viewable by everyone" 
  ON public.predictions FOR SELECT 
  USING (true); -- Often needed for rankings. We can restrict if needed later.

CREATE POLICY "Users can insert their own predictions" 
  ON public.predictions FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    pool_id IN (SELECT pool_id FROM public.pool_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own predictions" 
  ON public.predictions FOR UPDATE 
  USING (auth.uid() = user_id);

-- NOTIFICATIONS LOG
CREATE POLICY "Users can view their own notification logs" 
  ON public.notifications_log FOR SELECT 
  USING (auth.uid() = user_id);


-- ==========================================
-- 4. TRIGGERS (AUTO-CREATE PROFILE)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nickname, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
