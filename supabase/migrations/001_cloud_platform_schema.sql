-- ==============================================================================
-- ONE TEAM — CLOUD PLATFORM SCHEMA & ROW LEVEL SECURITY (RLS)
-- Multi-Tenancy via Workspaces, Granular Role-Based Access Control,
-- Complete Coverage for all 9 Modules
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked directly to auth.users.id)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  position TEXT DEFAULT 'Специалист',
  department TEXT DEFAULT 'Общий',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 2. WORKSPACES & MEMBERS TABLE
-- Roles: owner, admin, editor, viewer
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '⚡',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- Workspace Invitations (Stores hashed token only)
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.workspace_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON public.workspace_invitations(workspace_id);

-- Workspace Settings (Scoped per workspace)
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  default_currency TEXT NOT NULL DEFAULT 'KZT' CHECK (default_currency IN ('KZT', 'USD', 'RUB')),
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_config JSONB NOT NULL DEFAULT '{"taskNotifications":true,"projectNotifications":true,"teamNotifications":true,"clientNotifications":true,"financeNotifications":true,"strategyNotifications":true,"deadlineReminders":true,"browserNotifications":true}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. CORE BUSINESS TABLES
-- ==============================================================================

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE NOT NULL,
  category TEXT DEFAULT 'Общий',
  client_id UUID,
  client_name TEXT DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'negotiation', 'active', 'completed', 'archived')),
  deal_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  deal_currency TEXT NOT NULL DEFAULT 'KZT' CHECK (deal_currency IN ('KZT', 'USD', 'RUB')),
  associated_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  last_interaction DATE NOT NULL DEFAULT CURRENT_DATE,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  interactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clients_workspace ON public.clients(workspace_id);

-- Transactions (Finance with precise NUMERIC amount)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'KZT' CHECK (currency IN ('KZT', 'USD', 'RUB')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL CHECK (category IN ('salaries', 'software', 'marketing', 'infrastructure', 'operations', 'client_payment', 'other')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'planned')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_workspace ON public.transactions(workspace_id);

-- Strategy Missions
CREATE TABLE IF NOT EXISTS public.strategy_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  statement TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  customer_value TEXT NOT NULL DEFAULT '',
  principles JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT DEFAULT '',
  revisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_strategy_missions_workspace ON public.strategy_missions(workspace_id);

-- Strategy Visions
CREATE TABLE IF NOT EXISTS public.strategy_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  statement TEXT NOT NULL DEFAULT '',
  desired_state TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT '',
  target_horizon TEXT NOT NULL DEFAULT '3_years' CHECK (target_horizon IN ('1_year', '3_years', '5_years')),
  expected_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT DEFAULT '',
  revisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_strategy_visions_workspace ON public.strategy_visions(workspace_id);

-- Strategic Goals
CREATE TABLE IF NOT EXISTS public.strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Развитие',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT DEFAULT '',
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'paused', 'completed', 'cancelled')),
  related_project_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  success_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_strategic_goals_workspace ON public.strategic_goals(workspace_id);

-- Strategic Priorities
CREATE TABLE IF NOT EXISTS public.strategic_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('critical', 'high', 'medium', 'low')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT DEFAULT '',
  expected_result TEXT DEFAULT '',
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  related_goal_id UUID REFERENCES public.strategic_goals(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_strategic_priorities_workspace ON public.strategic_priorities(workspace_id);

-- Strategic Development Plans
CREATE TABLE IF NOT EXISTS public.strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_period TEXT NOT NULL,
  quarter TEXT NOT NULL,
  month TEXT DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  related_goal_id UUID REFERENCES public.strategic_goals(id) ON DELETE SET NULL,
  expected_outcome TEXT DEFAULT '',
  deadline DATE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_strategic_plans_workspace ON public.strategic_plans(workspace_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  entity_id TEXT DEFAULT '',
  target_page TEXT DEFAULT 'dashboard',
  fingerprint TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON public.notifications(workspace_id);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON public.activity_logs(workspace_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS (SECURITY DEFINER)
-- Prevents RLS recursion when checking workspace_members
-- ==============================================================================

-- Check whether auth.uid() belongs to workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Get role of auth.uid() in workspace
CREATE OR REPLACE FUNCTION public.get_workspace_role(ws_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

-- Check whether auth.uid() is at least editor (owner, admin, or editor)
CREATE OR REPLACE FUNCTION public.can_edit_in_workspace(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin', 'editor')
  );
$$;

-- Check whether auth.uid() is admin or owner
CREATE OR REPLACE FUNCTION public.can_manage_workspace(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  );
$$;

-- ==============================================================================
-- 5. ATOMIC WORKSPACE CREATION RPC
-- Creates workspace and sets creator as Owner atomically
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_new_workspace(
  ws_name TEXT,
  ws_description TEXT DEFAULT '',
  ws_avatar TEXT DEFAULT '⚡'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_ws_id UUID;
  ws_slug TEXT;
  created_ws RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  ws_slug := lower(regexp_replace(ws_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  INSERT INTO public.workspaces (name, slug, description, avatar, created_by)
  VALUES (ws_name, ws_slug, ws_description, ws_avatar, auth.uid())
  RETURNING id, name, slug, description, avatar, created_at INTO created_ws;

  new_ws_id := created_ws.id;

  -- Add caller as Owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (new_ws_id, auth.uid(), 'owner', 'active');

  -- Initialize default settings
  INSERT INTO public.workspace_settings (workspace_id, default_currency, theme)
  VALUES (new_ws_id, 'KZT', 'dark');

  RETURN to_jsonb(created_ws);
END;
$$;

-- ==============================================================================
-- 6. ATOMIC INVITATION ACCEPTANCE RPC
-- Validates token and user email securely
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.accept_workspace_invitation(
  raw_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  hash_val TEXT;
  inv RECORD;
  user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current user email from auth.jwt
  user_email := lower(auth.jwt() ->> 'email');
  hash_val := encode(digest(raw_token, 'sha256'), 'hex');

  SELECT * INTO inv FROM public.workspace_invitations
  WHERE token_hash = hash_val
    AND expires_at > now()
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation invalid or expired';
  END IF;

  IF lower(inv.email) <> user_email THEN
    RAISE EXCEPTION 'Invitation email does not match authenticated user email';
  END IF;

  -- Add or update member
  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (inv.workspace_id, auth.uid(), inv.role, 'active')
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now();

  -- Mark invitation accepted
  UPDATE public.workspace_invitations
  SET accepted_at = now()
  WHERE id = inv.id;

  RETURN jsonb_build_object('workspace_id', inv.workspace_id, 'role', inv.role, 'success', true);
END;
$$;

-- ==============================================================================
-- 7. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. DEFINE STRICT RLS POLICIES
-- ==============================================================================

-- Profiles: Anyone authenticated can view profiles; only self can update
CREATE POLICY "profiles_select_auth" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Workspaces: Members can select; creators can insert; only owner/admin can update/delete
CREATE POLICY "workspaces_select_member" ON public.workspaces
  FOR SELECT TO authenticated USING (public.is_workspace_member(id));

CREATE POLICY "workspaces_insert_auth" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "workspaces_update_manage" ON public.workspaces
  FOR UPDATE TO authenticated USING (public.can_manage_workspace(id));

CREATE POLICY "workspaces_delete_owner" ON public.workspaces
  FOR DELETE TO authenticated USING (public.get_workspace_role(id) = 'owner');

-- Workspace Members: Members can view each other; only owner/admin can invite/update/delete
CREATE POLICY "members_select_workspace" ON public.workspace_members
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "members_insert_manage" ON public.workspace_members
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_workspace(workspace_id) OR user_id = auth.uid());

CREATE POLICY "members_update_manage" ON public.workspace_members
  FOR UPDATE TO authenticated USING (public.can_manage_workspace(workspace_id));

CREATE POLICY "members_delete_manage" ON public.workspace_members
  FOR DELETE TO authenticated USING (
    (public.can_manage_workspace(workspace_id) AND role <> 'owner')
    OR (user_id = auth.uid() AND role <> 'owner')
  );

-- Workspace Invitations: Viewable and manageable by admin/owner
CREATE POLICY "invitations_select" ON public.workspace_invitations
  FOR SELECT TO authenticated USING (public.can_manage_workspace(workspace_id));

CREATE POLICY "invitations_insert" ON public.workspace_invitations
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_workspace(workspace_id));

CREATE POLICY "invitations_delete" ON public.workspace_invitations
  FOR DELETE TO authenticated USING (public.can_manage_workspace(workspace_id));

-- Workspace Settings
CREATE POLICY "settings_select" ON public.workspace_settings
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "settings_update" ON public.workspace_settings
  FOR UPDATE TO authenticated USING (public.can_manage_workspace(workspace_id));

CREATE POLICY "settings_insert" ON public.workspace_settings
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_workspace(workspace_id));

-- Projects
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated USING (public.can_manage_workspace(workspace_id));

-- Tasks
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE TO authenticated USING (public.can_edit_in_workspace(workspace_id));

-- Clients
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE TO authenticated USING (public.can_manage_workspace(workspace_id));

-- Transactions (Finance)
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE TO authenticated USING (public.can_manage_workspace(workspace_id));

-- Strategy (Missions, Visions, Goals, Priorities, Plans)
CREATE POLICY "strategy_missions_select" ON public.strategy_missions
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "strategy_missions_write" ON public.strategy_missions
  FOR ALL TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "strategy_visions_select" ON public.strategy_visions
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "strategy_visions_write" ON public.strategy_visions
  FOR ALL TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "strategic_goals_select" ON public.strategic_goals
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "strategic_goals_write" ON public.strategic_goals
  FOR ALL TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "strategic_priorities_select" ON public.strategic_priorities
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "strategic_priorities_write" ON public.strategic_priorities
  FOR ALL TO authenticated USING (public.can_edit_in_workspace(workspace_id));

CREATE POLICY "strategic_plans_select" ON public.strategic_plans
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "strategic_plans_write" ON public.strategic_plans
  FOR ALL TO authenticated USING (public.can_edit_in_workspace(workspace_id));

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid() AND public.is_workspace_member(workspace_id));
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id));

-- Activity Logs
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id));

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
