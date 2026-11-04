// ==============================================================================
// ONE TEAM — Supabase Edge Function: send-invitation-email
// Dispatches an email notifying an invited team member without tokens or links.
// Hardened with caller authentication, permission checks, and DB verification.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

interface InvitationEmailPayload {
  invitationId?: string;
  workspaceId: string;
  workspaceName?: string;
  inviterName?: string;
  inviteeName?: string;
  inviteeEmail: string;
  role: 'admin' | 'editor' | 'viewer';
}

const roleLabels: Record<string, string> = {
  admin: 'Администратор (Admin)',
  editor: 'Редактор (Editor)',
  viewer: 'Наблюдатель (Viewer)',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Escape HTML to prevent HTML injection in emails
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Verify Authorization Header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: SUPABASE_URL missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate caller authentication token using Supabase client
    const clientKey = supabaseAnonKey || supabaseServiceKey || '';
    const supabaseUserClient = createClient(supabaseUrl, clientKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired caller session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and validate request payload
    let payload: InvitationEmailPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { workspaceId, invitationId, inviteeEmail, role } = payload;

    if (!workspaceId || !inviteeEmail || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: workspaceId, inviteeEmail, and role are mandatory.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = inviteeEmail.trim().toLowerCase();

    // Prevent inviting self
    if (caller.email && caller.email.trim().toLowerCase() === normalizedEmail) {
      return new Response(
        JSON.stringify({ error: 'Cannot send invitation to yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for secure server-side verification without frontend trust
    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
      : supabaseUserClient;

    // 4. Verify caller permissions: Must be owner or admin of workspaceId
    const { data: callerMember, error: permError } = await adminClient
      .from('workspace_members')
      .select('role, status')
      .eq('workspace_id', workspaceId)
      .eq('user_id', caller.id)
      .eq('status', 'active')
      .maybeSingle();

    if (permError || !callerMember || !['owner', 'admin'].includes(callerMember.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have permission to invite members to this workspace' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verify that an authentic, pending invitation exists in PostgreSQL matching parameters
    let invQuery = adminClient
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .ilike('email', normalizedEmail)
      .eq('status', 'pending');

    if (invitationId) {
      invQuery = invQuery.eq('id', invitationId);
    }

    const { data: dbInv, error: invError } = await invQuery.maybeSingle();

    if (invError || !dbInv) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: No matching pending invitation found. Arbitrary email dispatch is prohibited.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify invitation parameters match database record
    if (dbInv.role !== role) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Role mismatch with invitation record.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(dbInv.expires_at).getTime() <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'Invitation has expired.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Fetch workspace details for email template
    const { data: wsRecord } = await adminClient
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .maybeSingle();

    const actualWorkspaceName = wsRecord?.name || payload.workspaceName || 'ONE TEAM';
    const inviterName =
      caller.user_metadata?.full_name ||
      caller.user_metadata?.name ||
      caller.email?.split('@')[0] ||
      payload.inviterName ||
      'Коллега';

    const rawRecipientName = dbInv.invitee_name || payload.inviteeName || normalizedEmail;
    const recipientDisplayName = escapeHtml(rawRecipientName);
    const escapedWorkspaceName = escapeHtml(actualWorkspaceName);
    const escapedInviterName = escapeHtml(inviterName);
    const escapedRoleName = escapeHtml(roleLabels[role] || role);

    const emailSubject = `Вас пригласили в команду «${actualWorkspaceName}» — ONE TEAM`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Приглашение в ONE TEAM</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F1F5F9; margin: 0; padding: 32px 16px; }
    .card { max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #3B82F6; }
    h1 { font-size: 18px; font-weight: 700; margin: 0 0 16px; color: #FFFFFF; }
    p { font-size: 14px; line-height: 1.6; color: #94A3B8; margin: 0 0 16px; }
    .info-box { background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .info-label { color: #64748B; font-weight: 500; }
    .info-value { color: #E2E8F0; font-weight: 600; }
    .instruction { font-size: 13px; color: #CBD5E1; line-height: 1.6; border-left: 3px solid #3B82F6; padding-left: 12px; margin: 20px 0; }
    .footer { font-size: 11px; color: #475569; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">⚡ ONE TEAM</div>
    </div>
    <h1>Здравствуйте, ${recipientDisplayName}!</h1>
    <p>
      <strong>${escapedInviterName}</strong> приглашает вас присоединиться к рабочему пространству <strong>«${escapedWorkspaceName}»</strong>.
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Рабочее пространство:</span>
        <span class="info-value">${escapedWorkspaceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Пригласил(а):</span>
        <span class="info-value">${escapedInviterName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Назначенная роль:</span>
        <span class="info-value">${escapedRoleName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Статус:</span>
        <span class="info-value" style="color: #60A5FA;">Ожидает вашего принятия</span>
      </div>
    </div>

    <div class="instruction">
      <strong>Как принять приглашение:</strong><br/>
      1. Откройте приложение ONE TEAM.<br/>
      2. Войдите или зарегистрируйтесь с email <strong>${escapeHtml(normalizedEmail)}</strong>.<br/>
      3. Подтвердите email в вашем аккаунте.<br/>
      4. Перейдите в центр уведомлений (колокольчик в шапке), откройте раздел <strong>«Приглашения»</strong> и нажмите <strong>«Принять»</strong>.
    </div>

    <p style="font-size: 12px; color: #64748B;">
      В целях вашей безопасности письмо не содержит ссылок с токенами или паролями. Принятие выполняется исключительно внутри авторизованного личного кабинета ONE TEAM.
    </p>

    <div class="footer">
      © ${new Date().getFullYear()} ONE TEAM. Все права защищены.
    </div>
  </div>
</body>
</html>
`;

    const emailText = `Здравствуйте, ${rawRecipientName}!

${inviterName} приглашает вас присоединиться к рабочему пространству «${actualWorkspaceName}» в ONE TEAM.

Параметры приглашения:
- Рабочее пространство: ${actualWorkspaceName}
- Пригласил: ${inviterName}
- Назначенная роль: ${roleLabels[role] || role}
- Статус: Ожидает вашего принятия в приложении

КАК ПРИНЯТЬ ПРИГЛАШЕНИЕ:
1. Откройте приложение ONE TEAM.
2. Войдите или зарегистрируйтесь с email: ${normalizedEmail}.
3. Подтвердите ваш email при регистрации.
4. В шапке приложения откройте центр уведомлений, перейдите в раздел «Приглашения» и нажмите «Принять».

Письмо отправлено автоматически системой ONE TEAM.
`;

    // 7. Check Resend configuration
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const senderEmail = Deno.env.get('SENDER_EMAIL') || 'notifications@oneteam.io';

    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [normalizedEmail],
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('Resend delivery failed:', errorText);
        return new Response(
          JSON.stringify({
            success: false,
            provider: 'resend',
            error: 'Resend delivery failed',
            details: errorText,
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const resendData = await resendResponse.json();
      return new Response(
        JSON.stringify({ success: true, provider: 'resend', messageId: resendData.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. If Resend provider secret is not configured
    return new Response(
      JSON.stringify({
        success: false,
        error: 'EMAIL_PROVIDER_UNCONFIGURED',
        message:
          'Email provider (RESEND_API_KEY) is not configured in Supabase environment secrets. The invitation was saved securely in the database.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-invitation-email unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
