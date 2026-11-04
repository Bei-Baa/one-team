# ONE TEAM — Supabase PostgreSQL Cloud Platform

## 1. Архитектура и обзор
ONE TEAM переведён на облачную архитектуру с поддержкой Multi-Tenancy (рабочие пространства), разграничением доступа на уровне базы данных (PostgreSQL Row Level Security) и сессиями Supabase Auth:
- **Supabase Auth**: Регистрация, вход, восстановление паролей, подтверждение email, персистентность сессий.
- **Supabase PostgreSQL**: Единый источник истины для всех рабочих данных (все 9 модулей).
- **Multi-Tenancy Workspace Architecture**: Пользователи могут состоять в нескольких рабочих пространствах. Данные пространств изолированы через `workspace_id` и RLS.
- **Ролевая модель**: `Owner`, `Admin`, `Editor`, `Viewer`.
- **Защищённые приглашения**: Исключительно по email без публичных ссылок и токенов. Принятие через атомарные RPC с проверкой подтверждения email.
- **Денежные типы**: Финансовые показатели и сделки используют `NUMERIC(15, 2)` (KZT, USD, RUB).
- **IndexedDB & Offline**: IndexedDB сохранена для надёжного локального кэширования и безопасной миграции данных без потерь и дубликатов.

---

## 2. Развёртывание миграций в Supabase

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard).
2. Перейдите в раздел **SQL Editor**.
3. Применяйте миграции по порядку:

### Миграция 001: Базовая схема
- Файл: `supabase/migrations/001_cloud_platform_schema.sql`
- Создаёт 16 таблиц, базовые RLS-политики и функции `create_new_workspace`, `is_workspace_member`, `can_manage_workspace`.

### Миграция 002: Внешний ключ workspace_members -> profiles
- Файл: `supabase/migrations/002_workspace_members_profiles_fk.sql`
- Предотвращает ошибки `PGRST200`, добавляет внешний ключ `fk_workspace_members_profile`.

### Миграция 003: Приглашения по email и уведомления
- Файл: `supabase/migrations/003_email_invitations_and_notifications.sql`
- Добавляет поля и индексы в `workspace_invitations`, базовые RPC `accept_workspace_invitation` и `decline_workspace_invitation`.

### Миграция 004: Усиление безопасности приглашений и RLS (Additive)
- Файл: `supabase/migrations/004_invitation_security_hardening.sql`
- **Не деструктивна**: не удаляет существующие данные или таблицы.
- Блокирует возможность прямого `UPDATE` в таблице `workspace_invitations` через REST API (только менеджеры могут обновлять, приглашённые обязаны использовать RPC).
- Усиливает `accept_workspace_invitation`: требует подтверждённый email (`email_confirmed_at IS NOT NULL`), проверяет срок действия и права.
- Ограничивает создание уведомлений только менеджерами или RPC (`SECURITY DEFINER`).

Подробная инструкция по настройке Edge Function и Resend доступна в [docs/EMAIL_INVITATION_SETUP.md](docs/EMAIL_INVITATION_SETUP.md).

---

## 3. Переменные окружения

Файл `.env.local` или `.env` должен содержать:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
```
*Внимание:* Публичный ключ предназначен только для клиентской части. Секретный ключ (`service_role`) никогда не должен попадать в frontend-код или `.env.local`.

---

## 4. Запуск тестов и сборка

```bash
# Тесты системы приглашений и безопасности (20 сценариев)
npx tsx tests/emailInvitationsAndMembership.test.ts

# Тесты локального кэша и целостности
npx tsx tests/localFirst.test.ts

# Интеграционные облачные тесты
npx tsx tests/cloudPlatform.test.ts

# Проверка типов
npm run lint

# Сборка приложения
npm run build
```
