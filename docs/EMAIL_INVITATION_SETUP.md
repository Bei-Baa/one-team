# Настройка Email-уведомлений о приглашениях в ONE TEAM

В ONE TEAM реализована система приглашений, основанная исключительно на email-адресе пользователя:
- Никаких секретных ссылок, magic links или публичных токенов в письмах.
- Письмо содержит официальное уведомление и инструкцию войти или зарегистрироваться в ONE TEAM с приглашённым email.
- Принятие приглашения доступно только авторизованному владельцу подтверждённого email внутри приложения ONE TEAM.

---

## 1. Архитектура отправки писем

Отправка уведомлений о приглашениях выполняется через Supabase Edge Function:
`supabase/functions/send-invitation-email/index.ts`

Функция принимает параметры:
- `workspaceName`: Название рабочего пространства
- `inviterName`: Имя пригласившего сотрудника
- `inviteeName`: Имя и фамилия приглашаемого
- `inviteeEmail`: Email приглашаемого
- `role`: Назначаемая роль (`admin`, `editor`, `viewer`)

---

## 2. Настройка провайдера (Resend или SMTP)

### Вариант А: Resend API (Рекомендуемый)
1. Зарегистрируйтесь на [resend.com](https://resend.com) и добавьте ваш домен.
2. Получите API ключ в личном кабинете Resend (`re_...`).
3. В Supabase Dashboard перейдите в **Project Settings -> Edge Functions -> Secrets** (или через CLI: `supabase secrets set`):
   ```bash
   RESEND_API_KEY=re_123456789...
   SENDER_EMAIL="ONE TEAM <notifications@yourcompany.com>"
   ```

### Вариант Б: Supabase Custom SMTP
Если вы используете собственный SMTP сервер (SendGrid, Mailgun, Postmark, Яндекс 360, Google Workspace):
1. В Supabase Dashboard откройте **Authentication -> Email Settings -> SMTP Settings**.
2. Включите **Enable Custom SMTP**.
3. Укажите:
   - Host: `smtp.yourprovider.com`
   - Port: `587` (или `465`)
   - Username: `<smtp-user>`
   - Password: `<smtp-password>`
   - Sender Email: `notifications@yourcompany.com`

---

## 3. Деплой Edge Function в Supabase

Для публикации функции в вашем проекте Supabase выполните:

```bash
# 1. Авторизация в Supabase CLI
supabase login

# 2. Привязка проекта
supabase link --project-ref dshlppccurayjfusbcqf

# 3. Установка секретов
supabase secrets set RESEND_API_KEY="re_..." SENDER_EMAIL="ONE TEAM <notifications@yourcompany.com>"

# 4. Деплой функции
supabase functions deploy send-invitation-email --no-verify-jwt
```

---

## 4. Поведение при отсутствии настроенного провайдера

Если `RESEND_API_KEY` или SMTP не настроены в переменных окружения Supabase:
- Функция возвращает статус `{ success: false, error: 'EMAIL_PROVIDER_UNCONFIGURED' }`.
- Система **не имитирует** успешную отправку письма: в интерфейсе отображается понятное уведомление администратору о том, что приглашение надёжно сохранено в базе данных и ожидает пользователя в приложении, но отправка email требует настройки провайдера в Supabase Dashboard.
- Приглашённый пользователь, войдя или зарегистрировавшись с этим email, сразу увидит приглашение в разделе «Приглашения» центра уведомлений.
