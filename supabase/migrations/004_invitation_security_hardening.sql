-- ==============================================================================
-- ONE TEAM — MIGRATION 004: INVITATION SECURITY HARDENING & RPC ENHANCEMENTS
-- Additive & non-destructive migration:
-- 1. Tighten RLS UPDATE policy on workspace_invitations (strictly workspace managers only;
--    invitees CANNOT update status directly via REST API and must use atomic RPCs).
-- 2. Tighten RLS INSERT policy on notifications (only workspace managers or self-recipient).
-- 3. Enhance accept_workspace_invitation RPC:
--    - Verify caller authentication.
--    - Verify email is confirmed (email_confirmed_at IS NOT NULL).
--    - Verify caller email matches invitation email.
--    - Verify pending status and expiration.
--    - Idempotently handle if caller is already active member.
--    - Atomically insert member, update invitation to accepted, send system notification,
--      and write activity log.
-- 4. Enhance decline_workspace_invitation RPC:
--    - Verify caller email matches invitation.
--    - Mark invitation declined and notify inviter.
-- ==============================================================================

-- 1. TIGHTEN RLS ON WORKSPACE_INVITATIONS (UPDATE)
-- Invitees should only be able to SELECT invitations addressed to them.
-- They CANNOT directly perform UPDATE to set status = 'accepted' and bypass the RPC.
DROP POLICY IF EXISTS "invitations_update" ON public.workspace_invitations;

CREATE POLICY "invitations_update" ON public.workspace_invitations
  FOR UPDATE TO authenticated
  USING (
    public.can_manage_workspace(workspace_id)
  )
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
  );

-- Ensure SELECT and INSERT policies are properly enforced
DROP POLICY IF EXISTS "invitations_select" ON public.workspace_invitations;
CREATE POLICY "invitations_select" ON public.workspace_invitations
  FOR SELECT TO authenticated
  USING (
    public.can_manage_workspace(workspace_id)
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "invitations_insert" ON public.workspace_invitations;
CREATE POLICY "invitations_insert" ON public.workspace_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_workspace(workspace_id)
    AND role IN ('admin', 'editor', 'viewer')
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "invitations_delete" ON public.workspace_invitations;
CREATE POLICY "invitations_delete" ON public.workspace_invitations
  FOR DELETE TO authenticated
  USING (public.can_manage_workspace(workspace_id));

-- 2. TIGHTEN NOTIFICATIONS RLS POLICIES
-- Regular members cannot forge arbitrary notifications to other users.
-- Only managers or RPCs (running as SECURITY DEFINER) can dispatch workspace notifications.
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    recipient_id = auth.uid()
    OR public.can_manage_workspace(workspace_id)
  );

-- 3. HARDENED ATOMIC ACCEPT_WORKSPACE_INVITATION RPC
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
  email_confirmed TIMESTAMP WITH TIME ZONE;
  inv RECORD;
  ws RECORD;
  is_already_member BOOLEAN;
BEGIN
  -- 1. Check authentication
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Fetch caller email, confirmation timestamp, and name from auth.users
  SELECT
    email,
    email_confirmed_at,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO
    caller_email,
    email_confirmed,
    caller_name
  FROM auth.users
  WHERE id = caller_id;

  IF caller_email IS NULL THEN
    caller_email := auth.jwt() ->> 'email';
  END IF;

  IF caller_email IS NULL OR caller_email = '' THEN
    RAISE EXCEPTION 'Verified user email not found';
  END IF;

  -- Check email confirmation requirement
  IF email_confirmed IS NULL THEN
    -- Fallback check for JWT email_verified or confirmed_at
    IF (auth.jwt() ->> 'email_confirmed_at') IS NULL AND (auth.jwt() ->> 'email_verified') <> 'true' THEN
      RAISE EXCEPTION 'Email не подтверждён. Пожалуйста, подтвердите ваш email перед принятием приглашения.';
    END IF;
  END IF;

  caller_email := lower(trim(caller_email));

  -- 3. Row lock and fetch pending invitation
  SELECT * INTO inv
  FROM public.workspace_invitations
  WHERE id = invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Приглашение не найдено';
  END IF;

  -- 4. Check email match
  IF lower(trim(inv.email)) <> caller_email THEN
    RAISE EXCEPTION 'Email приглашения не совпадает с вашим аккаунтом';
  END IF;

  -- 5. Check invitation status and expiration
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

  -- 6. Check if caller is already an active member of the workspace
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

  -- 7. Ensure profile exists for caller
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

  -- 8. Add user to workspace_members with designated role (never owner)
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

  -- 9. Update invitation status to accepted
  UPDATE public.workspace_invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = inv.id;

  -- 10. Fetch workspace details for notification
  SELECT * INTO ws FROM public.workspaces WHERE id = inv.workspace_id;

  -- 11. Send notification to the inviter
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

  -- 12. Record activity log
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

-- 4. HARDENED DECLINE_WORKSPACE_INVITATION RPC
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

-- Reload schema
NOTIFY pgrst, 'reload schema';
