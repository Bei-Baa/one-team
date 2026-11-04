# ONE TEAM — Архитектурная подготовка к будущим Native Apps (iOS & Android)

## 1. Контекст и Текущая Стратегия
Развитие ONE TEAM идёт по трёхэтапной стратегии:
1. **Responsive Web UI** (экраны 320px–1024px+, поддержка iOS Safe Area, адаптивная нижняя панель и шторка навигации).
2. **PWA Standalone** (`manifest.webmanifest`, безопасный Service Worker `sw.js` со строгим запретом кеширования приватных данных Supabase/финансов, иконки 192x192 и 512x512).
3. **Нативные приложения iOS / Android** (следующий отдельный этап после стабилизации веб-платформы).

## 2. Изоляция Бизнес-Логики и Сервисов
Все сервисы ONE TEAM вынесены в слой `src/services/` и полностью отвязаны от DOM и специфичных браузерных API:
- `authService.ts`: Управление сессиями и Supabase Auth (легко переносится в React Native / Capacitor).
- `cloudDataService.ts`: Абстракция CRUD над Supabase PostgreSQL с поддержкой UUID и multi-workspace изоляции.
- `reminderService.ts`: Планировщик напоминаний о дедлайнах. В будущем подключается к `expo-notifications` или `UNUserNotificationCenter` / `Android NotificationManager`.
- `storage.ts` & `indexedDb.ts`: Локальное хранилище данных. В будущем нативном этапе заменяется или дополняется SQLite (`react-native-quick-sqlite` / `@capacitor-community/sqlite`).
- `workspaceService.ts`: Логика изоляции данных арендаторов и переключения пространств.

## 3. Точки Интеграции для Нативных Приложений (iOS & Android)

### А. Push-уведомления (APNs / FCM)
- **Текущее состояние**: Внутренние уведомления приложения (`notificationService.ts`) + Notification API в браузере.
- **Будущая нативная интеграция**:
  - iOS: Интеграция с Apple Push Notification service (APNs).
  - Android: Firebase Cloud Messaging (FCM).
  - Supabase Edge Functions для отправки пушей при назначении задач или наступлении дедлайнов.

### Б. Биометрическая аутентификация
- **Текущее состояние**: Email / Пароль через Supabase Auth с синхронными ref-замками и обработкой 429 rate limit.
- **Будущая нативная интеграция**:
  - Face ID / Touch ID (iOS `LocalAuthentication`).
  - BiometricPrompt API (Android).
  - Хранение refresh-токена Supabase в iOS Keychain / Android Keystore.

### В. Офлайн-хранилище и фоновая синхронизация
- **Текущее состояние**: IndexedDB + LocalStorage (Local-First fallback) с запретом кеширования приватных данных в публичный Service Worker cache.
- **Будущая нативная интеграция**:
  - Локальная база SQLite с репликацией через Supabase Realtime Channels.
  - Background Fetch API для фоновой проверки обновлений.

### Г. Haptics и системные жесты
- Нативная тактильная отдача (UIImpactFeedbackGenerator на iOS / HapticFeedback на Android) при смене статуса задачи в Канбане и отметке «Выполнено».

## 4. Ограничения и Запреты Текущего Этапа
- Запрещено добавление Capacitor или React Native до отдельного согласования.
- Сохранена полная совместимость с десктопной версией браузера без регрессий.
- Все UUID и схемы PostgreSQL строго сохранены.
