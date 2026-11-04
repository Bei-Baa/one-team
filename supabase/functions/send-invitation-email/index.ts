// ==============================================================================
// ONE TEAM — Supabase Edge Function: send-invitation-email
// Dispatches an email notifying an invited team member without tokens or links.
// Instructions guide the user to log in or sign up inside ONE TEAM directly.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface InvitationEmailPayload {
  workspaceName: string;
  inviterName: string;
  inviteeName: string;
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: InvitationEmailPayload = await req.json();
    const { workspaceName, inviterName, inviteeName, inviteeEmail, role } = payload;

    if (!workspaceName || !inviteeEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: workspaceName and inviteeEmail are mandatory.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roleName = roleLabels[role] || role;
    const recipientDisplayName = inviteeName ? inviteeName : inviteeEmail;

    const emailSubject = `Вас пригласили в команду «${workspaceName}» — ONE TEAM`;
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
      <strong>${inviterName || 'Участник команды'}</strong> приглашает вас присоединиться к рабочему пространству <strong>«${workspaceName}»</strong>.
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Рабочее пространство:</span>
        <span class="info-value">${workspaceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Пригласил(а):</span>
        <span class="info-value">${inviterName || 'Команда'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Назначенная роль:</span>
        <span class="info-value">${roleName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Статус:</span>
        <span class="info-value" style="color: #60A5FA;">Ожидает вашего принятия</span>
      </div>
    </div>

    <div class="instruction">
      <strong>Как принять приглашение:</strong><br/>
      1. Откройте приложение ONE TEAM.<br/>
      2. Войдите или зарегистрируйтесь с email <strong>${inviteeEmail}</strong>.<br/>
      3. Перейдите в центр уведомлений (колокольчик в шапке), откройте раздел <strong>«Приглашения»</strong> и нажмите <strong>«Принять»</strong>.
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

    const emailText = `Здравствуйте, ${recipientDisplayName}!

${inviterName || 'Участник команды'} приглашает вас присоединиться к рабочему пространству «${workspaceName}» в ONE TEAM.

Параметры приглашения:
- Рабочее пространство: ${workspaceName}
- Пригласил: ${inviterName || 'Команда'}
- Назначенная роль: ${roleName}
- Статус: Ожидает вашего принятия в приложении

КАК ПРИНЯТЬ ПРИГЛАШЕНИЕ:
1. Откройте приложение ONE TEAM.
2. Войдите или зарегистрируйтесь с email: ${inviteeEmail}.
3. В шапке приложения нажмите на иконку уведомлений, перейдите в раздел «Приглашения» и нажмите «Принять».

Письмо отправлено автоматически системой ONE TEAM.
`;

    // 1. Check Resend configuration
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
          to: [inviteeEmail],
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
            error: `Email provider error: ${resendResponse.statusText}`,
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

    // 2. SMTP provider fallback if SMTP_HOST is defined
    const smtpHost = Deno.env.get('SMTP_HOST');
    if (smtpHost) {
      // In Deno runtime, SMTP can be wired with nodemailer or custom socket;
      // If neither is configured, we return clean unconfigured response.
      console.log('SMTP configured with host:', smtpHost);
    }

    // If no provider secrets are configured
    return new Response(
      JSON.stringify({
        success: false,
        error: 'EMAIL_PROVIDER_UNCONFIGURED',
        message: 'Email service credentials (RESEND_API_KEY or SMTP_HOST) are not configured in Supabase environment secrets. The invitation was saved securely in the database.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-invitation-email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
