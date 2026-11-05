# ONE TEAM — Архитектурный аудит нативного фундамента (Stage 0: Native Foundation Architecture Audit)

> **Статус документа:** Завершён
> **Целевые платформы:** iPadOS, iOS, Android
> **Базовый фреймворк интеграции:** Capacitor (переиспользование React 19 + TypeScript + Vite + Tailwind CSS v4)
> **Версия:** 1.0.0
> **Ветка аудита:** `feat/native-foundation-audit`

---

## 1. Текущая архитектура

ONE TEAM представляет собой SaaS-платформу и PWA-приложение для командной работы, управления проектами, задачами, стратегией, финансами и клиентами.

### 1.1 Технологический стек
- **UI / Frontend Runtime:** React 19.0.1, React DOM 19.0.1.
- **Язык и типизация:** TypeScript 7.0.2 (строгий режим `noEmit` для линтинга).
- **Сборщик и Dev-окружение:** Vite 8.3.0 (`@vitejs/plugin-react` 6.1.1), сборка в директорию `dist/`.
- **Стилизация и темы:** Tailwind CSS 4.3.3 (`@tailwindcss/vite`), CSS Custom Variants (`@custom-variant tablet`, `@custom-variant dark`), адаптивные CSS-классы (`pt-safe`, `pb-safe`, `pl-safe`, `pr-safe`, `touch-target`).
- **Анимации и интерфейсные переходы:** Motion 12.23.24.
- **Иконки:** Lucide React 0.546.0.
- **Backend / Cloud Platform:** Supabase (PostgreSQL 15+, Supabase Auth GoTrue, Row Level Security, Realtime, Deno Edge Functions).
- **Локальное хранение (Local-First Fallback):** StorageService (LocalStorage) + IndexedDB Engine (`idb-keyval` / нативный IndexedDB API).
- **PWA:** `manifest.webmanifest`, безопасный Service Worker (`public/sw.js`) с политикой `oneteam-shell-v3` (строгий запрет кэширования авторизационных данных, токенов и REST/RPC запросов).

### 1.2 Структура модулей и исходного кода (`src/`)
- `src/main.tsx` — точка монтирования DOM (`#root`), регистрация PWA Service Worker при `NODE_ENV === 'production'`.
- `src/App.tsx` — корневой компонент приложения, `AuthProvider`, `AppProvider`, `RootNavigator`, `MainLayout`, поддержка перехвата `window.__TEST_BYPASS_AUTH__`.
- `src/context/`:
  - `AuthContext.tsx` — состояние пользователя (`User`), сессии (`Session`), профиля (`UserProfile`), списка доступных пространств (`workspaces`), активного пространства (`currentWorkspace`) и роли (`currentRole`).
  - `AppContext.tsx` — состояние активной страницы (`activePage`), глобального поиска, коллекций сущностей (задачи, проекты, участники, клиенты, финансы, стратегия), модальных окон.
- `src/services/`:
  - `supabaseClient.ts` — синглтон клиента Supabase с динамическим чтением URL/AnonKey (`getIsSupabaseConfigured()`) и хранилищем сессий `localStorage`.
  - `authService.ts` — фасад методов регистрации, авторизации, сброса пароля, профилей с локализацией ошибок (включая HTTP 429).
  - `cloudDataService.ts` — двунаправленная синхронизация 12 сущностей с Supabase PostgreSQL, пакетная выборка профилей для исключения `PGRST200`, строгая валидация UUID v4.
  - `workspaceService.ts` — управление тенантами, переключение контекста, приглашения (`inviteUser`, `acceptInvitation`, `declineInvitation`).
  - `storage.ts` & `indexedDb.ts` — локальное кэширование и Local-First движок с пустыми коллекциями по умолчанию.
  - `reminderService.ts` & `notificationService.ts` — диспетчер напоминаний и уведомлений.
- `src/components/layout/`:
  - `Sidebar.tsx` — боковая панель с поддержкой двух состояний: развёрнутый вид (256px) для Desktop / iPad Landscape и компактный icon rail (80px) для планшетов Portrait.
  - `Header.tsx` — глобальный заголовок с поиском, аватарами присутствия, колокольчиком уведомлений и кнопкой создания.
  - `MobileNav.tsx` — мобильная нижняя панель навигации для смартфонов (320–743px).
- `src/pages/` — 9 функциональных экранов: Dashboard, Workspace (Канбан/Список), Projects, Strategy (6 вкладок), Team, Analytics, Finance, Clients, Settings.

### 1.3 Текущая модель навигации
В приложении используется **State-based Page Routing** через хук `useApp()` и union-тип:
```typescript
export type PageId =
  | 'dashboard'
  | 'workspace'
  | 'projects'
  | 'strategy'
  | 'team'
  | 'analytics'
  | 'finance'
  | 'clients'
  | 'settings';
```
Приложение не зависит от классического `react-router-dom` или `window.history.pushState()`, что упрощает работу в изолированном WebView, однако требует системного маппинга для Deep Links и кнопки «Назад» в Android.

---

## 2. Результаты аудита совместимости с Capacitor

| Компонент / Механизм | Текущая реализация | Совместимость с Capacitor | Оценка |
|---|---|---|---|
| **Vite build & Production Assets** | Сборка в `dist/`, абсолютные пути `/assets/...`, `/favicon.svg`, `/sw.js` | В Capacitor WebView (iOS `capacitor://localhost`, Android `https://localhost`) абсолютные пути без явного базового пути могут приводить к 404 при открытии через кастомные протоколы | **ТРЕБУЕТ ВНИМАНИЯ** |
| **Маршрутизация и Deep Links** | `useState<PageId>('dashboard')` без URL pathname | В нативном приложении отсутствуют URL-пути. При переходе по Universal Links / App Links требуется нативный слушатель `App.addListener('appUrlOpen')` с переводом в `setActivePage()` | **ТРЕБУЕТ ВНИМАНИЯ** |
| **Авторизация и сессии** | `supabase.auth.getSession()` с хранением в `window.localStorage` | `localStorage` в мобильных WebViews (особенно iOS WKWebView) подвержен принудительной очистке ОС при нехватке памяти | **ТРЕБУЕТ ДОРАБОТКИ** |
| **Безопасное хранение токенов** | Открытый текст в `localStorage` (браузерный режим) | На нативных платформах требуется хранение refresh-токена в iOS Keychain и Android EncryptedSharedPreferences | **ТРЕБУЕТ ДОРАБОТКИ** |
| **Запросы к Supabase (CORS / HTTP)** | Браузерный `fetch` через `@supabase/supabase-js` | Capacitor 7 по умолчанию использует `https://localhost` на Android и `capacitor://localhost` на iOS. Supabase CORS разрешает запросы с мобильных origins или требует добавления в Redirect URLs | **СОВМЕСТИМО** |
| **Загрузка файлов и аватарок** | `<input type="file" />` с чтением через Base64 FileReader | Работает в WebView, но на iOS и Android 13+ стандартный input часто блокируется политиками прав без плагина `@capacitor/camera` | **ТРЕБУЕТ ВНИМАНИЯ** |
| **Обработка Offline / Online** | Локальный `storageService` + IndexedDB + событие `window.addEventListener('online')` | Требуется интеграция с `@capacitor/network` для надёжного определения статуса соединения и отсутствия ложных срабатываний в спящем режиме | **СОВМЕСТИМО** |
| **Service Worker внутри WebView** | Регистрация `/sw.js` в `src/main.tsx` при `NODE_ENV === 'production'` | В iOS WKWebView Service Workers по умолчанию **не поддерживаются** или работают нестабильно с протоколом `capacitor://`. На Android в WebView Service Worker может дублировать нативный кэш | **КРИТИЧНО** |
| **Safe Area Insets** | `index.css`: `var(--sat: env(safe-area-inset-top))` + классы `pt-safe`, `pb-safe` | CSS-переменные `env()` работают в WKWebView, но требуют корректного viewport-fit=cover и плагина `@capacitor/status-bar` для исключения перекрытия status bar контентом | **СОВМЕСТИМО** |
| **Системная кнопка "Назад" (Android)** | Отсутствует обработка hardware back button | Пользователь при нажатии на системную кнопку «Назад» на Android закрывает всё приложение вместо закрытия модалки, drawer или перехода на Dashboard | **ТРЕБУЕТ ДОРАБОТКИ** |

---

## 3. Выявленные проблемы и несоответствия в коде

### Проблема 1. Безусловная регистрация Service Worker в нативном окружении
- **Файл:** `src/main.tsx`, строки 8–31.
- **Суть проблемы:** Service Worker регистрируется исключительно по условию `'serviceWorker' in navigator && process.env.NODE_ENV === 'production'`. При сборке под Capacitor (где `NODE_ENV === 'production'`) WebView попытается зарегистрировать `/sw.js`. На iOS в WKWebView схема `capacitor://` вызовет SecurityError или тихий сбой при попытке кэширования. Кроме того, кэширование PWA-шелла внутри нативного пакета бессмысленно, так как assets уже физически лежат внутри бинарного файла приложения.
- **Решение:** Проверять платформу перед регистрацией SW:
  ```typescript
  import { Capacitor } from '@capacitor/core';
  if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') { ... }
  ```

### Проблема 2. Хранение сессионных токенов Supabase в незащищённом `window.localStorage`
- **Файл:** `src/services/supabaseClient.ts`, строки 31–37.
- **Суть проблемы:** Supabase-клиент сконфигурирован с `storage: typeof window !== 'undefined' ? window.localStorage : undefined`. В мобильных операционных системах WebView `localStorage` не шифруется и может быть очищен операционной системой в фоновом режиме для освобождения дискового пространства. В результате сессия пользователя будет сбрасываться.
- **Решение:** Создать кастомный адаптер `CapacitorSecureStorageAdapter`, который на нативных устройствах использует плагин `@capacitor/preferences` (или `@aparajita/capacitor-biometric-auth`), а в браузере сохраняет обратную совместимость с `window.localStorage`.

### Проблема 3. Ссылки на хостовые Redirect URLs при сбросе пароля
- **Файл:** `src/services/authService.ts`, строки 137–139.
- **Суть проблемы:** Метод `resetPassword` формирует параметр:
  `redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined`.
  Внутри Capacitor `window.location.origin` равен `capacitor://localhost` (iOS) или `https://localhost` (Android). Письмо со сбросом пароля отправит пользователю ссылку на `https://localhost/#reset-password`, которая не откроется из почтового клиента на ПК или внешнем браузере смартфона.
- **Решение:** Вынести настраиваемый `AUTH_REDIRECT_URL` (например, `https://app.oneteam.kz/#reset-password` или зарегистрированную кастомную deep-link схему `oneteam://auth/reset-password`).

### Проблема 4. Предупреждение Vite о `__dirname` в ESM-конфигурации
- **Файл:** `vite.config.ts`, строки 11–12.
- **Суть проблемы:** При запуске `npm run build` выводится предупреждение:
  `Your Vite config uses features that are unsupported by configLoader: 'native': __dirname. Use import.meta.dirname instead`.
  В будущих версиях Vite 8+ сборка может завершаться ошибкой.
- **Решение:** Внести исправление в `vite.config.ts`, заменив `__dirname` на `import.meta.dirname` или `fileURLToPath(new URL('.', import.meta.url))`.

### Проблема 5. Тест `authRateLimit.test.ts` падает из-за валидации email внешним Supabase
- **Файл:** `tests/authRateLimit.test.ts`, строка 67.
- **Суть проблемы:** Тест 3 отправляет запрос регистрации `rate_limit_probe@test.com`. Облачный сервис Supabase возвращает `HTTP 400 (code: email_address_invalid)`, так как тестовый домен `@test.com` отклонён валидатором Disposable/Fake emails в GoTrue. Тест ожидает `status === 429` и завершается исключением `AssertionError`.
- **Решение:** Тест требует обновления под допустимый тестовый email или мокирование сетевого слоя без нарушения логики продакшн-сервиса.

---

## 4. Необходимые изменения для нативной поддержки

1. **Изоляция Service Worker:**
   Внедрение фасадной проверки среды запуска. SW должен работать только в браузере и PWA, отключаясь в среде Capacitor WebView.
2. **Абстракция хранилища сессий (Native Secure Storage):**
   Реализация безопасного слоя хранения refresh-токенов с прозрачным переключением: Secure Keychain/Keystore на мобильных ОС и `localStorage` на Web/PWA.
3. **Обработка Deep Links и App URL Open:**
   Добавление единого диспетчера глубоких ссылок (Universal Links на iOS, App Links на Android) для обработки приглашений в рабочие пространства и авторизационных коллбэков.
4. **Адаптация навигации под Android Hardware Back Button:**
   Регистрация слушателя `App.addListener('backButton')`:
   - Если открыто модальное окно или drawer — закрывать его.
   - Если активна не главная страница — выполнять переход на `dashboard`.
   - Если пользователь уже на `dashboard` — сворачивать приложение (`App.exitApp()`).
5. **Настройка Status Bar и Keyboard:**
   - Темная тема Status Bar с фоновым цветом `#0B0F19`.
   - Конфигурация поведения виртуальной клавиатуры (KeyboardResize.Body), предотвращающая перекрытие кнопок сохранения и модальных окон.

---

## 5. Предлагаемая структура Capacitor

При интеграции Capacitor на последующих этапах структура проекта расширится следующими артефактами без нарушения веб-компонентов:

```
├── capacitor.config.ts         # Основная конфигурация Capacitor
├── android/                    # Сгенерированный нативный проект Android Studio (Gradle, Kotlin/Java)
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   └── src/main/res/
│   └── build.gradle
├── ios/                        # Сгенерированный нативный проект Xcode (Swift/Obj-C, CocoaPods/SPM)
│   ├── App/
│   │   ├── App/Info.plist
│   │   └── App/AppDelegate.swift
│   └── App.xcworkspace
├── src/
│   └── services/
│       ├── native/             # Изолированный слой нативных сервисов
│       │   ├── nativeBridge.ts     # Определение платформы и доступности плагинов
│       │   ├── secureStorage.ts    # Адаптер безопасного хранилища токенов
│       │   ├── pushService.ts      # APNs / FCM регистратор и роутер уведомлений
│       │   ├── biometricService.ts # Face ID / Touch ID / BiometricPrompt
│       │   └── backButtonHandler.ts# Обработчик системной кнопки "Назад" (Android)
```

### Предварительный проект `capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.oneteam.app',
  appName: 'ONE TEAM',
  webDir: 'dist',
  backgroundColor: '#0B0F19',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0B0F19',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0F19',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

---

## 6. Архитектура iOS / iPadOS / Android

### 6.1 iPhone Layout (iOS)
- **Ориентация:** Фиксация вертикальной ориентации (`portrait`) для экранов шириной до 743px.
- **Навигация:** Нижняя панель `MobileNav.tsx` (4 ключевых таба + меню «Ещё»).
- **Safe Area:** Учёт `env(safe-area-inset-top)` (Dynamic Island / Notch) и `env(safe-area-inset-bottom)` (Home Indicator).
- **Клавиатура:** Автоматический скролл активного поля ввода при фокусе, закрытие клавиатуры свайпом вниз.
- **Haptics:** Тактильный отклик (`@capacitor/haptics`) при переключении статусов задач, удалении элементов и подтверждении операций.

### 6.2 iPad & iPadOS Layout
- **Ориентация:** Свободная ориентация (поддержка Portrait и Landscape) со свободным поворотом.
- **Навигация:**
  - Portrait (744px – 1023px): Компактный Sidebar (icon rail, ширина 80px) без нижней панели.
  - Landscape (1024px+): Полноразмерный Sidebar (ширина 256px) с быстрым переключением между всеми 9 модулями.
- **Многозадачность (iPadOS):**
  - Поддержка Split View (50/50, 70/30), Slide Over и Stage Manager. Интерфейс динамически переключается между компактным и полным режимом на основе `window.innerWidth`.
- **Периферия:**
  - Поддержка аппаратной клавиатуры (Smart Keyboard / Magic Keyboard) и трекпада.
  - Поддержка стилуса Apple Pencil (Scribble в полях заметок клиентов и задач).

### 6.3 Android Layout (Смартфоны и Планшеты)
- **Навигация и системные жесты:**
  - Обработка аппаратной кнопки «Назад» и жеста свайпа от края экрана (`App.addListener('backButton')`).
- **Status Bar и Navigation Bar:**
  - Настройка прозрачности системной навигационной панели Android через системный оверлей или цвет `#0B0F19`.
- **Разрешения (Runtime Permissions):**
  - Запрос разрешений в момент обращения: `POST_NOTIFICATIONS` (Android 13+), `CAMERA` и `READ_MEDIA_IMAGES`.

---

## 7. Безопасность и хранение сессий

1. **Уровни хранения данных:**
   - **Уровень 1 (Критичный — JWT и Refresh Token):** Хранятся в нативном защищённом хранилище:
     - iOS: **Keychain Services** (защита аппаратным Secure Enclave).
     - Android: **EncryptedSharedPreferences** с ключами в **Android KeyStore**.
   - **Уровень 2 (Пользовательские настройки и кэш метаданных):** LocalStorage / IndexedDB (идентификаторы последнего активного воркспейса, тема, фильтры).
   - **Уровень 3 (Приватный оффлайн-кэш бизнес-данных):** Зашифрованная локальная база SQLite (при реализации Stage 5) с привязкой ключа к биометрии.
2. **Биометрическая аутентификация:**
   - Подключение плагина `@aparajita/capacitor-biometric-auth`.
   - Защита сессии при возвращении приложения из фонового режима (App Resume) спустя заданный таймаут (например, 5 минут неактивности).
   - Поддержка безопасного fallback на пароль при невозможности биометрии.
3. **Безопасность сетевого слоя:**
   - TLS 1.3 / HTTPS для всех запросов к Supabase.
   - Запрет небезопасного HTTP-трафика в `AndroidManifest.xml` (`android:usesCleartextTraffic="false"`).

---

## 8. Offline-стратегия (Local-First Native)

1. **Двухуровневый кэш данных:**
   - **Web / PWA:** Существующая связка `storageService` + `IndexedDB` (полная обратная совместимость).
   - **Capacitor Native:** Использование SQLite (`@capacitor-community/sqlite`) для высокопроизводительных выборок большого объёма задач, клиентов и транзакций без риска вытеснения ОС.
2. **Очередь отложенных изменений (Mutation Queue):**
   - Все операции создания, изменения и удаления помечаются флагом `sync_status: 'synced' | 'pending' | 'conflict'`.
   - При отсутствии сети запись сразу сохраняется в локальное хранилище с присвоением валидного `crypto.randomUUID()`.
3. **Фоновая синхронизация при восстановлении соединения:**
   - Мониторинг статуса сети через `@capacitor/network`.
   - При появлении сети очередь отложенных операций пачками отправляется в Supabase с проверкой версионности (`updated_at`).
   - Разрешение конфликтов по стратегии Last-Write-Wins (LWW) на основе метки времени сервера.

---

## 9. Список необходимых плагинов Capacitor

| Плагин | Назначение | Платформы | Необходимость |
|---|---|---|---|
| `@capacitor/core` | Ядро Capacitor и JavaScript-мост к нативному API | iOS, Android, Web | Обязательно (Этап 1) |
| `@capacitor/cli` | Инструменты командной строки и сборки | Инструмент разработки | Обязательно (Этап 1) |
| `@capacitor/ios` | Нативная платформа iOS / iPadOS | iOS, iPadOS | Обязательно (Этап 1) |
| `@capacitor/android` | Нативная платформа Android | Android | Обязательно (Этап 1) |
| `@capacitor/app` | Обработка жизненного цикла приложения, Deep Links, Back Button | iOS, Android | Обязательно (Этап 1) |
| `@capacitor/status-bar` | Управление стилем и цветом статус-бара | iOS, Android | Обязательно (Этап 2) |
| `@capacitor/splash-screen`| Управление нативным экраном загрузки (Splash Screen) | iOS, Android | Обязательно (Этап 2) |
| `@capacitor/keyboard` | Управление виртуальной клавиатурой и предотвращение наложения | iOS, Android | Обязательно (Этап 2) |
| `@capacitor/screen-orientation` | Блокировка/разблокировка ориентации (смартфон vs планшет) | iOS, Android | Обязательно (Этап 2) |
| `@capacitor/preferences` | Защищённое хранилище настроек и токенов сессий | iOS, Android, Web | Обязательно (Этап 3) |
| `@aparajita/capacitor-biometric-auth` | Биометрический вход (Face ID, Touch ID, BiometricPrompt) | iOS, Android | Этап 3 |
| `@capacitor/push-notifications` | Системные пуш-уведомления (APNs и FCM) | iOS, Android | Этап 4 |
| `@capacitor/local-notifications` | Локальные уведомления о дедлайнах и задачах без интернета | iOS, Android | Этап 4 |
| `@capacitor-community/sqlite` | Нативная локальная база данных для надежного Local-First оффлайн-режима | iOS, Android | Этап 5 |
| `@capacitor/camera` | Съемка фото и выбор аватарок/документов из галереи | iOS, Android | Этап 6 |
| `@capacitor/haptics` | Нативный виброотклик интерфейса | iOS, Android | Этап 6 |
| `@capacitor/network` | Надежный мониторинг статуса сети | iOS, Android, Web | Этап 5 |

---

## 10. Идентификаторы приложений и конфигурация

### 10.1 Идентификаторы
- **Название приложения:** `ONE TEAM` (сокращённо: `ONE TEAM`)
- **iOS Bundle ID:** `kz.oneteam.app`
- **Android Application ID:** `kz.oneteam.app`

### 10.2 Структура иконок и Splash Screen
- Генерация ассетов выполняется через инструмент `@capacitor/assets`:
  - `assets/logo.png` — векторный или мастер-логотип 1024×1024px (квадратный, без скруглений).
  - `assets/logo-dark.png` — версия логотипа для тёмной темы.
  - `assets/icon.png` — адаптивная иконка (Foreground + Background).
  - `assets/splash.png` — экран запуска 2732×2732px с центрированным брендовым логотипом на фоне `#0B0F19`.

### 10.3 Разделение конфигураций по средам

| Параметр | Development (dev) | Staging | Production (prod) |
|---|---|---|---|
| **App Name** | `ONE TEAM Dev` | `ONE TEAM Stage` | `ONE TEAM` |
| **App ID / Bundle ID** | `kz.oneteam.app.dev` | `kz.oneteam.app.stage` | `kz.oneteam.app` |
| **Supabase URL** | Dev Instance / Local | Staging Project | Production Project |
| **Deep Link Scheme** | `oneteam-dev://` | `oneteam-stage://` | `oneteam://` |
| **Universal Links Domain** | `dev.oneteam.kz` | `stage.oneteam.kz` | `app.oneteam.kz` |

---

## 11. Пошаговый план реализации (Roadmap)

### Этап 0: Архитектурный аудит нативного фундамента (Текущий этап)
- [x] Аудит текущей кодовой базы, сборки и совместимости.
- [x] Выявление критических точек адаптации (Service Worker, LocalStorage, Back Button).
- [x] Разработка детального архитектурного документа `docs/NATIVE_APP_ARCHITECTURE.md`.
- [x] Проверка работоспособности веб-версии и запуск тестов.

### Этап 1: Инициализация Capacitor и Базовая Конфигурация Native Shell
- [ ] Установка `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- [ ] Создание `capacitor.config.ts`.
- [ ] Изоляция Service Worker в `src/main.tsx` для нативных платформ.
- [ ] Генерация нативных каталогов `ios/` и `android/`.
- [ ] Проверка сборки `npm run build && npx cap sync`.

### Этап 2: Адаптация Native UI: Safe Area, Status Bar, Keyboard & Back Button
- [ ] Установка плагинов `@capacitor/status-bar`, `@capacitor/keyboard`, `@capacitor/splash-screen`, `@capacitor/app`.
- [ ] Создание сервиса `src/services/native/nativeService.ts`.
- [ ] Настройка системной кнопки «Назад» для Android.
- [ ] Проверка всех 12 вьюпортов на отсутствие визуальных регрессий.

### Этап 3: Нативная Биометрия & Безопасное Хранилище Токенов
- [ ] Установка `@capacitor/preferences` и `@aparajita/capacitor-biometric-auth`.
- [ ] Реализация адаптера сессий Supabase в `src/services/native/secureStorage.ts`.
- [ ] Добавление биометрического экрана разблокировки при возобновлении сессии.

### Этап 4: Нативные Push-Уведомления и Локальные напоминания
- [ ] Миграция БД для хранения device tokens (`user_devices`).
- [ ] Интеграция `@capacitor/push-notifications` (APNs для iOS, FCM для Android).
- [ ] Интеграция `@capacitor/local-notifications` для напоминаний о дедлайнах офлайн.

### Этап 5: Офлайн-кэш SQLite и Фоновая синхронизация
- [ ] Установка `@capacitor-community/sqlite` и `@capacitor/network`.
- [ ] Создание адаптера нативного хранения и очереди отложенных транзакций.
- [ ] Валидация работы Local-First в авиарежиме.

### Этап 6: Мультимедиа, Камера и Haptics
- [ ] Интеграция `@capacitor/camera` для загрузки аватарок профилей и пространств.
- [ ] Интеграция `@capacitor/haptics` для тактильного отклика на жесты в Канбане.

---

## 12. Риски и ограничения

1. **Политики App Store Review Guidelines (Apple):**
   - **Пункт 4.2 (Minimum Functionality):** Приложения, представляющие собой простую обёртку сайта («repackaged website»), отклоняются модерацией Apple. ONE TEAM необходимо явно задействовать нативные возможности: Push-уведомления, Face ID, оффлайн-кэш, тактильную отдачу и нативную камеру.
2. **Ограничения фонового выполнения на iOS:**
   - iOS жестко ограничивает фоновые процессы. Синхронизация данных в фоне должна использовать Background Fetch или инициироваться тихими Push-уведомлениями (Silent APNs).
3. **Обновления PWA vs Нативные релизы:**
   - При использовании Capacitor обновления веб-части могут доставляться через Live Updates (Capacitor Live Updates / Ionic Deploy) без прохождения полного ревью сторов при условии, что бизнес-модель приложения не меняется. Нативные изменения (плагины, манифесты) требуют стандартной сборки IPA/AAB.
4. **Конфликты Service Worker и Capacitor:**
   - Настоятельно рекомендуется полностью отключить Service Worker в нативных сборках во избежание десинхронизации кэшированного кода с локальными нативными ассетами.

---

## 13. Критерии готовности к переходу на Stage 1

1. **Архитектурный отчёт утверждён:** документ `docs/NATIVE_APP_ARCHITECTURE.md` согласован.
2. **Веб-версия стабильна:** `npm run build` и `npm run lint` выполняются с кодом 0.
3. **Регрессионные тесты пройдены:** планшетная адаптивность (12 вьюпортов Playwright) и интеграционные тесты Supabase / Local-First успешно выполняются.
4. **План изменений зафиксирован:** определены точные точки модификации кода для отключения Service Worker в нативных сборках.
5. **Инструментарий готов:** рабочее окружение подготовлено к установке зависимостей через `npm install --legacy-peer-deps`.
