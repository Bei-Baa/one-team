-- ==============================================================================
-- ONE TEAM — MIGRATION 003: EMAIL-ONLY WORKSPACE INVITATIONS & NOTIFICATIONS
-- 1. Extend workspace_invitations table (status, invitee_name, lower email index)
-- 2. Update RLS policies on workspace_invitations to allow invitees to view pending invitations
-- 3. Update RLS policies on notifications so invited users can receive notifications
-- 4. Rewrite accept_workspace_invitation RPC to accept by invitation_id and verified auth email
-- 5. Add decline_workspace_invitation RPC
-- ==============================================================================

-- 1. EXTEND WORKSPACE_INVITATIONS TABLE
DO $$
BEGIN
  -- Add invitee_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workspace_invitations'
      AND column_name = 'invitee_name'
  ) THEN
    ALTER TABLE public.workspace_invitations ADD COLUMN invitee_name TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workspace_invitations'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.workspace_invitations
      ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));
  END IF;

  -- Ensure token_hash allows empty or null if old schema enforced NOT NULL
  ALTER TABLE public.workspace_invitations ALTER COLUMN token_hash DROP NOT NULL;
END $$;

-- 2. CREATE PERFORMANCE & INTEGRITY INDEXES
-- Partial unique index ensuring no duplicate pending invitations exist for same email in a workspace
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_pending_invitation
  ON public.workspace_invitations(workspace_id, lower(email))
  WHERE status = 'pending';

-- Index for fast recipient email lookup by lower(email)
CREATE INDEX IF NOT EXISTS idx_invitations_lower_email
  ON public.workspace_invitations(lower(email));

-- Index for querying invitations by status
CREATE INDEX IF NOT EXISTS idx_invitations_status
  ON public.workspace_invitations(status);

-- 3. REVISE RLS POLICIES ON WORKSPACE_INVITATIONS
-- Drop legacy policies
DROP POLICY IF EXISTS "invitations_select" ON public.workspace_invitations;
DROP POLICY IF EXISTS "invitations_insert" ON public.workspace_invitations;
DROP POLICY IF EXISTS "invitations_delete" ON public.workspace_invitations;
DROP POLICY IF EXISTS "invitations_update" ON public.workspace_invitations;

-- Allow workspace managers to view workspace invitations OR invitees to view their own pending/recent invitations
CREATE POLICY "invitations_select" ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (
    public.can_manage_workspace(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- Only workspace managers (owner or admin) can insert invitations, and role cannot be owner
CREATE POLICY "invitations_insert" ON public.workspace_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
    AND role IN ('admin', 'editor', 'viewer')
    AND invited_by = auth.uid()
  );

-- Workspace managers can delete (or cancel) invitations
CREATE POLICY "invitations_delete" ON public.workspace_invitations
  FOR DELETE TO authenticated
  USING (public.can_manage_workspace(workspace_id));

-- Workspace managers can update (or cancel) invitations
CREATE POLICY "invitations_update" ON public.workspace_invitations
  FOR UPDATE TO authenticated
  USING (
    public.can_manage_workspace(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- 4. REVISE RLS POLICIES ON NOTIFICATIONS
-- Allow recipient to see all their own notifications, even prior to active workspace membership
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    recipient_id = auth.uid()
    OR public.is_workspace_member(workspace_id)
  );

-- 5. ATOMIC ACCEPT_WORKSPACE_INVITATION RPC (BY INVITATION ID & VERIFIED USER)
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(
  invitation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  caller_name TEXT;
  inv RECORD;
  ws RECORD;
  is_already_member BOOLEAN;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Retrieve verified email and name from auth.users / jwt
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO caller_email, caller_name
  FROM auth.users
  WHERE id = caller_id;

  IF caller_email IS NULL THEN
    caller_email := auth.jwt() ->> 'email';
  END IF;

  IF caller_email IS NULL OR caller_email = '' THEN
    RAISE EXCEPTION 'Verified user email not found';
  END IF;

  caller_email := lower(trim(caller_email));

  -- 2. Lock and fetch pending invitation
  SELECT * INTO inv
  FROM public.workspace_invitations
  WHERE id = invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Приглашение не найдено';
  END IF;

  -- 3. Validate invitation belongs to caller's verified email
  IF lower(trim(inv.email)) <> caller_email THEN
    RAISE EXCEPTION 'Email приглашения не совпадает с вашим аккаунтом';
  END IF;

  -- 4. Check invitation status and expiration
  IF inv.status = 'accepted' THEN
    RAISE EXCEPTION 'Приглашение уже принято';
  ELSIF inv.status = 'declined' THEN
    RAISE EXCEPTION 'Приглашение было отклонено';
  ELSIF inv.status = 'cancelled' THEN
    RAISE EXCEPTION 'Приглашение было отозвано администратором';
  ELSIF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Приглашение недействительно';
  END IF;

  IF inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Срок действия приглашения истёк';
  END IF;

  -- 5. Check if caller is already an active member of the workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = inv.workspace_id
      AND user_id = caller_id
      AND status = 'active'
  ) INTO is_already_member;

  IF is_already_member THEN
    -- Mark invitation accepted to clean up state
    UPDATE public.workspace_invitations
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = inv.id;

    RETURN jsonb_build_object(
      'success', true,
      'workspace_id', inv.workspace_id,
      'role', inv.role,
      'message', 'Вы уже являетесь участником этого пространства'
    );
  END IF;

  -- Ensure profile exists for caller
  INSERT INTO public.profiles (id, full_name, email, avatar_url, position, department, is_online)
  VALUES (
    caller_id,
    COALESCE(caller_name, inv.invitee_name, split_part(caller_email, '@', 1)),
    caller_email,
    '',
    'Специалист',
    'Общий',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();

  -- 6. Add user to workspace_members with designated role (never owner)
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (
    inv.workspace_id,
    caller_id,
    inv.role,
    'active',
    now()
  )
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();

  -- 7. Update invitation status to accepted
  UPDATE public.workspace_invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = inv.id;

  -- 8. Fetch workspace details for notification
  SELECT * INTO ws FROM public.workspaces WHERE id = inv.workspace_id;

  -- 9. Send notification to the inviter
  INSERT INTO public.notifications (
    workspace_id,
    recipient_id,
    title,
    description,
    type,
    target_page,
    entity_id,
    is_read
  )
  VALUES (
    inv.workspace_id,
    inv.invited_by,
    'Приглашение принято',
    COALESCE(caller_name, inv.invitee_name, caller_email) || ' принял(а) приглашение в команду "' || COALESCE(ws.name, 'ONE TEAM') || '".',
    'team',
    'team',
    caller_id::text,
    false
  );

  -- 10. Record activity log
  INSERT INTO public.activity_logs (
    workspace_id,
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    inv.workspace_id,
    caller_id,
    COALESCE(caller_name, inv.invitee_name, caller_email),
    'member_joined',
    'workspace_member',
    caller_id::text,
    jsonb_build_object('role', inv.role, 'email', caller_email)
  );

  -- Return payload
  RETURN jsonb_build_object(
    'success', true,
    'workspace_id', inv.workspace_id,
    'workspace_name', COALESCE(ws.name, ''),
    'role', inv.role
  );
END;
$$;

-- 6. ATOMIC DECLINE_WORKSPACE_INVITATION RPC
CREATE OR REPLACE FUNCTION public.decline_workspace_invitation(
  invitation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  caller_name TEXT;
  inv RECORD;
  ws RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO caller_email, caller_name
  FROM auth.users
  WHERE id = caller_id;

  IF caller_email IS NULL THEN
    caller_email := auth.jwt() ->> 'email';
  END IF;

  IF caller_email IS NULL OR caller_email = '' THEN
    RAISE EXCEPTION 'Verified user email not found';
  END IF;

  caller_email := lower(trim(caller_email));

  -- Lock and fetch invitation
  SELECT * INTO inv
  FROM public.workspace_invitations
  WHERE id = invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Приглашение не найдено';
  END IF;

  IF lower(trim(inv.email)) <> caller_email THEN
    RAISE EXCEPTION 'Email приглашения не совпадает с вашим аккаунтом';
  END IF;

  IF inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Приглашение уже обработано или недействительно';
  END IF;

  -- Mark status as declined
  UPDATE public.workspace_invitations
  SET status = 'declined'
  WHERE id = inv.id;

  -- Fetch workspace name
  SELECT * INTO ws FROM public.workspaces WHERE id = inv.workspace_id;

  -- Notify inviter
  INSERT INTO public.notifications (
    workspace_id,
    recipient_id,
    title,
    description,
    type,
    target_page,
    entity_id,
    is_read
  )
  VALUES (
    inv.workspace_id,
    inv.invited_by,
    'Приглашение отклонено',
    COALESCE(caller_name, inv.invitee_name, caller_email) || ' отклонил(а) приглашение в команду "' || COALESCE(ws.name, 'ONE TEAM') || '".',
    'team',
    'team',
    caller_id::text,
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'workspace_id', inv.workspace_id,
    'status', 'declined'
  );
END;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
