# ONE TEAM — Supabase PostgreSQL Cloud Platform

## 1. Архитектура и обзор
ONE TEAM переведён на облачную архитектуру с поддержкой Multi-Tenancy (рабочие пространства), разграничением доступа на уровне базы данных (PostgreSQL Row Level Security) и сессиями Supabase Auth:
- **Supabase Auth**: Регистрация, вход, восстановление паролей, подтверждение email, персистентность сессий.
- **Supabase PostgreSQL**: Единый источник истины для всех рабочих данных (все 9 модулей).
- **Multi-Tenancy Workspace Architecture**: Пользователи могут состоять в нескольких рабочих пространствах. Данные пространств изолированы через `workspace_id` и RLS.
- **Ролевая модель**: `Owner`, `Admin`, `Editor`, `Viewer`.
- **Хеширование приглашений**: Токены приглашений хранятся в PostgreSQL исключительно в виде SHA-256 хешей.
- **Денежные типы**: Финансовые показатели и сделки используют `NUMERIC(15, 2)` (KZT, USD, RUB).
- **IndexedDB & Offline**: IndexedDB сохранена для надёжного локального кэширования и безопасной миграции данных без потерь и дубликатов.

---

## 2. Развёртывание миграций в Supabase

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard).
2. Перейдите в раздел **SQL Editor**.
3. Откройте файл `supabase/migrations/001_cloud_platform_schema.sql` из репозитория.
4. Вставьте его содержимое в SQL Editor и нажмите **Run**.
5. Миграция создаст:
   - 16 таблиц (profiles, workspaces, workspace_members, workspace_invitations, workspace_settings, projects, tasks, clients, transactions, strategic_goals, strategic_priorities, strategic_plans, strategy_missions, strategy_visions, notifications, activity_logs);
   - Хранимые функции (`create_new_workspace`, `accept_workspace_invitation`, `handle_new_user`);
   - Функции безопасности RLS (`is_workspace_member`, `can_edit_in_workspace`, `can_manage_workspace`, `get_workspace_role`);
   - Политики Row Level Security на всех таблицах.

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
# Запуск интеграционных облачных тестов
npx tsx tests/cloudPlatform.test.ts

# Запуск тестов локального кэша и целостности
npx tsx tests/localFirst.test.ts

# Проверка типов
npm run lint

# Сборка приложения
npm run build
```
