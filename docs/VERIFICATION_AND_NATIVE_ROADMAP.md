# ONE TEAM — Отчёт о верификации системы приглашений и Инженерная дорожная карта Native Apps (Capacitor)

Документ фиксирует результаты комплексной проверки функционала приглашений и безопасности рабочих пространств, а также определяет пошаговую инженерную стратегию перехода ONE TEAM к нативным приложениям для iPadOS, iOS и Android.

---

## ЧАСТЬ 1. Результаты комплексной проверки (7 критериев)

### 1. Проверка приглашения с аккаунта Owner/Admin
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - На уровне клиента (`src/components/team/InviteMemberModal.tsx`): модальное окно блокирует вызов для ролей `editor` и `viewer`, выводя предупреждение. Валидация запрещает назначение роли `owner` через приглашение.
  - На уровне сервиса (`src/services/workspaceService.ts`): метод `inviteUser` запрашивает активное членство вызывающего в целевом пространстве и проверяет `['owner', 'admin'].includes(inviterMember.role)`.
  - На уровне базы данных (`supabase/migrations/004_invitation_security_hardening.sql`): политика RLS `invitations_insert` строго проверяет `public.can_manage_workspace(workspace_id) AND role IN ('admin', 'editor', 'viewer') AND invited_by = auth.uid()`.
  - Попытки пригласить самого себя или назначить роль `owner` вызывают исключения.
  - Автоматические тесты (сценарии 1, 2, 3, 4, 5, 8 в `tests/emailInvitationsAndMembership.test.ts`) успешно пройдены.

### 2. Проверка отправки и получения настоящего email
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - Edge Function `supabase/functions/send-invitation-email/index.ts` требует авторизованный Bearer JWT токен и проверяет его валидность через `supabaseUserClient.auth.getUser()`.
  - Функция проверяет права вызывающего в пространстве (`owner`/`admin`) и проверяет наличие аутентичной записи со статусом `pending` в таблице `workspace_invitations`.
  - Все пользовательские строки экранируются функцией `escapeHtml` перед подстановкой в HTML-шаблон для предотвращения XSS и HTML Injection.
  - Интеграция с Resend API (`https://api.resend.com/emails`) отправляет письмо с темой `Вас пригласили в команду «...» — ONE TEAM`.
  - При отсутствии секрета `RESEND_API_KEY` функция прозрачно возвращает `{ success: false, error: 'EMAIL_PROVIDER_UNCONFIGURED' }`. Система **не имитирует** успешную доставку: интерфейс честно информирует администратора о сохранении приглашения в БД и готовности к принятию в личном кабинете.
  - Автоматические тесты (сценарии 16, 17, 18, 20 в `tests/emailInvitationsAndMembership.test.ts`) успешно пройдены.

### 3. Проверка регистрации или входа приглашённого пользователя
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - Письмо не содержит открытых токенов или ссылок авторизации (строгая защита от перехвата и утечек).
  - Приглашённый переходит в ONE TEAM, проходит стандартную регистрацию или авторизацию по своему адресу электронной почты.
  - Проверка подтверждения почты: SQL RPC `accept_workspace_invitation` проверяет `email_confirmed_at IS NOT NULL` (или `auth.jwt() ->> 'email_confirmed_at' / email_verified`). Пользователи с неподтверждённым email не могут вступить в команду до подтверждения владения ящиком.
  - Автоматические тесты (сценарий 9 в `tests/emailInvitationsAndMembership.test.ts`) успешно пройдены.

### 4. Проверка принятия и отклонения приглашения
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - Принятие выполняется исключительно через атомарную SQL RPC `accept_workspace_invitation(invitation_id)`.
  - Прямой `UPDATE` таблицы `workspace_invitations` со стороны приглашённого заблокирован RLS-политикой `invitations_update` (доступен только менеджерам пространства).
  - RPC выполняет проверку блокировки строки (`FOR UPDATE`), срока действия (`expires_at > now()`), статуса (`status = 'pending'`), совпадения email (`lower(trim(inv.email)) = caller_email`).
  - RPC идемпотентна: если пользователь уже является активным участником пространства, статус обновляется до `accepted` без ошибок и дублирования.
  - Отклонение выполняется через RPC `decline_workspace_invitation(invitation_id)`, обновляя статус на `declined` и создавая уведомление автору приглашения.
  - Автоматические тесты (сценарии 10, 11, 12, 13, 14, 15, 19 в `tests/emailInvitationsAndMembership.test.ts`) успешно пройдены.

### 5. Появление участника в команде с правильной ролью
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - В транзакции `accept_workspace_invitation` атомарно выполняется:
    1. Создание/обновление профиля в `public.profiles` (`caller_id`, имя, email);
    2. Вставка строки в `public.workspace_members` с ролью `inv.role` и статусом `active`;
    3. Создание уведомления в `public.notifications` для создателя приглашения;
    4. Запись в `public.activity_logs` события `member_joined`.
  - Участник мгновенно отображается в списке команды с корректным бейджем роли (Владелец, Админ, Редактор, Наблюдатель). Приглашённый пользователь никогда не отображается в списке действующих членов до момента фактического принятия приглашения.
  - Клиентский интерфейс `InvitationsSection` сразу обновляет список доступных пространств и переключает активный контекст на новое пространство.
  - Тест сквозного сценария двух аккаунтов (Two-Account End-to-End) пройден без замечаний.

### 6. Изоляция рабочих пространств и RLS
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - Все запросы к таблицам (`projects`, `tasks`, `clients`, `transactions`, `notifications`, `activity_logs`) строго фильтруются по `workspace_id`.
  - RLS-политики базы данных (`001_cloud_platform_schema.sql` и `004_invitation_security_hardening.sql`) используют функции `is_workspace_member(workspace_id)` и `can_manage_workspace(workspace_id)` на основе `auth.uid()`.
  - Пользователь из `ws-1` не может прочитать, создать или изменить данные в `ws-other`.
  - Автоматические тесты `tests/supabaseLiveIntegration.test.ts` (16 таблиц) и `tests/cloudPlatform.test.ts` подтверждают строгую изоляцию.

### 7. Упрощённый интерфейс команды и приглашений
- **Статус**: ✅ ПОЛНОСТЬЮ ПОДТВЕРЖДЕНО.
- **Архитектурный анализ и проверки**:
  - В `InviteMemberModal.tsx` удалены избыточные поля ввода имени, телефона и заметок (имя определяется самим пользователем при регистрации в профиле).
  - Убраны ссылки с токенами и лишние копирования URL.
  - Модальное окно содержит только email и выбор роли (Editor / Admin / Viewer).
  - Карточки участников `TeamMemberCard.tsx` фокусируются на рабочих параметрах: роль, текущая загрузка (workload progress), активные задачи и проекты.
  - В выпадающем меню уведомлений (`NotificationsDropdown.tsx`) выделена вкладка «Приглашения» с бейджем количества, кнопками «Принять» и «Отклонить» и мгновенным фидбеком.

---

## ЧАСТЬ 2. Стратегия перехода к Native Apps (Capacitor)

Для охвата **iPadOS**, **iOS** и **Android** без дублирования бизнес-логики выбран стек **Capacitor 7 + существующий React/Vite проект + Supabase**.

### Почему Capacitor:
1. **100% переиспользование кодовой базы**: все 9 модулей, адаптивные layout-компоненты (iPad Mini, Air, Pro, смартфоны), Tailwind-стили, Supabase Auth/PostgreSQL и бизнес-сервисы переносятся напрямую.
2. **Адаптивность уже готова**: приложение валидировано на 12 вьюпортах (включая iPad 744px, 820px, 834px, 1032px и планшеты Android 800x1280).
3. **Безопасность**: изоляция Supabase JWT, поддержка нативных Secure Storage/Keychain, Face ID/Touch ID и системных Push-уведомлений (APNs/FCM).

---

## ЧАСТЬ 3. Подробные инженерные промпты для Jules по этапам

### ЭТАП 1: Инициализация Capacitor и Базовая Конфигурация Native Shell

#### Промпт для Jules:
```text
Задача: Инициализировать Capacitor в проекте ONE TEAM для платформ iOS, iPadOS и Android.

Контекст:
- Текущий стек: React 19, Vite, TypeScript, Tailwind CSS, Supabase.
- Выходная папка сборки: dist (vite build).
- Установка пакетов в проекте строго: npm install --legacy-peer-deps.

Что сделать:
1. Установить зависимости Capacitor:
   npm install --legacy-peer-deps @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
2. Инициализировать конфигурацию Capacitor (capacitor.config.ts):
   - appId: 'com.oneteam.app'
   - appName: 'ONE TEAM'
   - webDir: 'dist'
   - server.androidScheme: 'https'
   - Настроить backgroundColor: '#0B0F19'
3. Добавить в package.json вспомогательные скрипты:
   - "cap:sync": "cap sync"
   - "cap:build": "npm run build && npx cap sync"
4. Убедиться, что сборка проекта проходит без ошибок:
   npm run lint && npm run build
5. Сгенерировать базовые нативные директории:
   npx cap add ios
   npx cap add android
6. Проверить целостность конфигурации и закоммитить изменения.

Ограничения:
- Не изменять существующую бизнес-логику и сервисы в src/services/.
- Не удалять PWA-манифест и Service Worker public/sw.js.
- Не допускать изменения UUID и существующих таблиц Supabase.

Критерии приёмки:
- Файл capacitor.config.ts создан и валидирован TypeScript.
- npm run lint и npm run build завершаются с кодом 0.
- Все существующие тесты (npx tsx tests/emailInvitationsAndMembership.test.ts, tabletResponsive.test.ts и др.) проходят без ошибок.
```

---

### ЭТАП 2: Адаптация Native UI: Safe Area Insets, Status Bar, Keyboard & Splash Screen

#### Промпт для Jules:
```text
Задача: Интегрировать нативные плагины управления интерфейсом (Status Bar, Safe Area, Keyboard, SplashScreen) для iPadOS, iOS и Android.

Контекст:
- Брендовый цвет темы ONE TEAM: #0B0F19.
- В приложении уже используются классы pt-safe и pb-safe, а также адаптивные правила для мобильных и планшетных экранов.

Что сделать:
1. Установить официальные плагины:
   npm install --legacy-peer-deps @capacitor/status-bar @capacitor/keyboard @capacitor/splash-screen @capacitor/screen-orientation
2. Создать нативный сервис инициализации src/services/nativeService.ts:
   - Инициализировать StatusBar: стиль Dark (белый текст), фон #0B0F19, overlaysWebView: false.
   - Инициализировать SplashScreen: скрытие после загрузки приложения (hideWithDelay: 300ms).
   - Настроить Keyboard: режим изменения размера webview (KeyboardResize.Body), закрытие клавиатуры при скролле.
   - Поддержать ориентацию экрана: разблокировать поворот для планшетов (iPadOS/Android Tablet), зафиксировать портретную для смартфонов при необходимости.
3. Подключить nativeService.initialize() в точке входа App.tsx при старте.
4. Проверить отступы safe area в Header.tsx и MobileNav.tsx при работе внутри WebView.

Ограничения:
- При запуске в стандартном браузере (PWA / Web) методы плагинов должны корректно определять Capacitor.isNativePlatform() и не выбрасывать исключений.
- Сохранить полную работоспособность десктопной и веб-версий.

Критерии приёмки:
- Приложение не падает в браузере при обращении к плагинам Capacitor.
- npm run lint и npm run build проходят чисто.
- npx tsx tests/tabletResponsive.test.ts подтверждает отсутствие визуальных регрессий на всех 12 вьюпортах.
```

---

### ЭТАП 3: Нативная Биометрия (Face ID / Touch ID / BiometricPrompt) & Безопасное Хранилище Токенов

#### Промпт для Jules:
```text
Задача: Добавить опциональную нативную биометрическую аутентификацию и безопасное хранение refresh-токена сессии Supabase на устройствах iOS и Android.

Контекст:
- Supabase Auth хранит сессию в localStorage веб-хранилища.
- В нативных приложениях требуется защита сессии при перезапуске приложения через Secure Storage и биометрию (Face ID / Touch ID / Android Biometrics).

Что сделать:
1. Установить нативные плагины:
   npm install --legacy-peer-deps @aparajita/capacitor-biometric-auth (или официальный плагин сообщества) и @capacitor/preferences.
2. Создать сервис src/services/biometricService.ts:
   - Проверка доступности биометрии на устройстве (isAvailable).
   - Запрос подтверждения биометрии (verifyBiometricPrompt с сообщением «Подтвердите вход в ONE TEAM»).
   - Настройка в профиле пользователя: включение/отключение быстрого входа по биометрии.
3. Интегрировать проверку биометрии в AuthContext.tsx при восстановлении сессии на нативном устройстве.
4. Предусмотреть безопасный fallback: ввод пароля при неудачной биометрии.

Ограничения:
- Не ломать существующий вход по email/паролю и сброс пароля.
- В браузере (web/PWA) биометрический шаг пропускается автоматически.

Критерии приёмки:
- Покрытие юнит-тестами логики биометрического сервиса.
- npm run lint и npm run build завершаются успехом.
- npx tsx tests/authRateLimit.test.ts проходит без сбоев.
```

---

### ЭТАП 4: Нативные Push-Уведомления (APNs / FCM)

#### Промпт для Jules:
```text
Задача: Реализовать интеграцию с нативными Push-уведомлениями (@capacitor/push-notifications) для доставки оперативных событий команд и задач.

Контекст:
- В ONE TEAM уже функционирует централизованный сервис notificationService.ts и таблица notifications в Supabase PostgreSQL.
- Для нативных платформ токены устройств (APNs / FCM device tokens) должны регистрироваться в БД.

Что сделать:
1. Создать миграцию supabase/migrations/005_device_tokens.sql:
   - Таблица user_devices (id, user_id, device_token, platform: 'ios'|'android', last_seen_at).
   - RLS-политики: пользователи могут регистрировать и обновлять только свои токены.
2. Установить @capacitor/push-notifications:
   npm install --legacy-peer-deps @capacitor/push-notifications
3. Создать сервис src/services/nativePushService.ts:
   - Запрос разрешений на отправку пушей (PushNotifications.requestPermissions()).
   - Регистрация слушателей (registration, registrationError, pushNotificationReceived, pushNotificationActionPerformed).
   - Сохранение device_token в таблице user_devices.
   - Маршрутизация клика по пушу на соответствующую страницу (targetPage, entityId).
4. Протестировать корректную работу в web-окружении (graceful fallback).

Ограничения:
- Запрещено передавать в payload пуша конфиденциальные финансовые данные.
- Тело пуша должно быть кратким информационным тизером.

Критерии приёмки:
- Миграция 005 валидирована.
- Сервис корректно инициализируется только на нативных платформах.
- Сборка npm run build и lint проходят успешно.
```

---

### ЭТАП 5: Офлайн-кэш SQLite и Фоновая синхронизация (Local-First Native)

#### Промпт для Jules:
```text
Задача: Реализовать нативный слой локального хранения через SQLite (@capacitor-community/sqlite) с поддержкой бесшовного Local-First режима при отсутствии сети.

Контекст:
- Сейчас приложение использует LocalStorage и IndexedDB (storage.ts, indexedDb.ts).
- В нативных приложениях SQLite обеспечивает высокую скорость выборок, надёжность транзакций и устойчивость к принудительному сбросу web-кэша операционной системой.

Что сделать:
1. Установить плагин:
   npm install --legacy-peer-deps @capacitor-community/sqlite
2. Создать адаптер хранения данных src/services/nativeStorageAdapter.ts, реализующий единый интерфейс с indexedDb.ts.
3. Обеспечить очередь отложенных изменений (sync queue) для операций создания/редактирования задач и проектов при работе в авиарежиме.
4. При восстановлении сети отправлять накопленные изменения в Supabase с сохранением целостности UUID.

Ограничения:
- Сохранить полную совместимость с типами сущностей ONE TEAM.
- В веб-версии автоматически продолжать использовать IndexedDB.

Критерии приёмки:
- Все тесты Local-First (npx tsx tests/localFirst.test.ts) проходят без изменений в тестовых сценариях.
- npm run lint и npm run build завершаются без ошибок.
```
