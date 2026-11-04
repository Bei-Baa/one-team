-- ==============================================================================
-- ONE TEAM — MIGRATION 002: RESTORE WORKSPACE MEMBERS TO PROFILES RELATIONSHIP
-- Fixes PGRST200 "Could not find a relationship between 'workspace_members' and 'profiles'"
-- ==============================================================================

-- 1. Ensure any existing workspace members have a corresponding profile entry
-- in case an auth user was added without a profile record.
INSERT INTO public.profiles (id, full_name, email, avatar_url, position, department, is_online)
SELECT
  wm.user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Участник'),
  COALESCE(u.email, 'member@oneteam.internal'),
  COALESCE(u.raw_user_meta_data->>'avatar_url', ''),
  'Специалист',
  'Общий',
  false
FROM public.workspace_members wm
LEFT JOIN auth.users u ON u.id = wm.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = wm.user_id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Add Foreign Key constraint linking workspace_members.user_id to public.profiles(id)
-- Using DO block to ensure idempotent application without error if constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'workspace_members'
      AND constraint_name = 'fk_workspace_members_profile'
  ) THEN
    ALTER TABLE public.workspace_members
      ADD CONSTRAINT fk_workspace_members_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Ensure index exists for joining performance on user_id
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_fk
  ON public.workspace_members(user_id);

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
