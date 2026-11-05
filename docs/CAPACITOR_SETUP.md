# ONE TEAM — Руководство по интеграции и запуску Capacitor (Stage 1)

> **Статус:** Завершён (Stage 1: Capacitor Integration)
> **Идентификаторы приложения:**
> - **App Name:** `ONE TEAM`
> - **iOS Bundle Identifier:** `kz.oneteam.app`
> - **Android Application ID:** `kz.oneteam.app`
> - **Тема / Фоновый цвет:** `#0B0F19`
> - **WebDir:** `dist`

---

## 1. Обзор архитектурных решений

Интеграция Capacitor выполнена поверх существующей кодовой базы React 19 + Vite 8 + TypeScript без переписывания приложения и без вмешательства в существующую бизнес-логику и сервисы Supabase.

### Ключевые изменения:
1. **Установлены стабильные Capacitor зависимости:**
   - `@capacitor/core`: `^8.6.0`
   - `@capacitor/ios`: `^8.6.0`
   - `@capacitor/android`: `^8.6.0`
   - `@capacitor/app`: `^8.1.2`
   - `@capacitor/cli`: `^8.6.0` (devDependencies)
2. **Конфигурация `capacitor.config.ts`:**
   - Идентификаторы согласованы с `docs/NATIVE_APP_ARCHITECTURE.md`: `kz.oneteam.app`.
   - Имя приложения: `ONE TEAM`.
   - `webDir: 'dist'`.
   - Схемы серверов: `androidScheme: 'https'`, `iosScheme: 'capacitor'`.
3. **Изоляция Service Worker (PWA):**
   - В `src/main.tsx` регистрация `/sw.js` дополнена условием `!Capacitor.isNativePlatform()`.
   - Это исключает конфликты и сбои кэширования внутри нативных контейнеров iOS (WKWebView) и Android WebView, сохраняя 100% функциональность PWA в стандартных веб-браузерах.
4. **Генерация нативных платформ:**
   - Сформирован проект `ios/` (Xcode, Swift Package Manager / CapApp-SPM).
   - Сформирован проект `android/` (Gradle, Android Studio).
5. **Сохранение Supabase Auth и архитектуры данных:**
   - Все 9 модулей, RLS, Edge Functions, схемы PostgreSQL и Local-First StorageService остались неизменными.

---

## 2. Добавленные npm-скрипты

В `package.json` добавлены следующие команды:

```bash
npm run build:native  # Сборка веб-приложения (Vite) и синхронизация ассетов с нативными проектами (cap sync)
npm run cap:sync      # Синхронизация собранного dist с нативными платформами ios/ и android/
npm run cap:ios       # Открытие проекта iOS в Xcode
npm run cap:android   # Открытие проекта Android в Android Studio
npm run cap           # Вызов Capacitor CLI
```

---

## 3. Инструкции по запуску на устройствах

### 3.1 Android (Android Studio / Эмулятор / Физическое устройство)

#### Требования к окружению:
- JDK 17 или 21 (`java -version`).
- Android SDK (платформы Android 34/35, Command-line Tools, Build-tools).
- Переменная среды `ANDROID_HOME` (или `ANDROID_SDK_ROOT`), указывающая на путь к SDK.

#### Шаги запуска:
1. Собрать веб-ассеты и выполнить синхронизацию:
   ```bash
   npm run build:native
   ```
2. Открыть проект в Android Studio:
   ```bash
   npm run cap:android
   ```
   *Либо открыть директорию `android/` непосредственно в Android Studio.*
3. Запустить сборку через Gradle в терминале (Debug APK):
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   Собранный файл будет доступен по пути: `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Установить на подключенное устройство или запущенный эмулятор:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

### 3.2 iOS / iPadOS (Xcode / Симулятор / Физическое устройство)

> **Статус проверки в текущей Linux-среде:** `BLOCKED` (отсутствует macOS и `xcodebuild`). Конфигурация проекта, Package.swift и `Info.plist` проверены валидатором Capacitor Doctor.

#### Требования к окружению:
- Рабочая станция с macOS (macOS 14+ Sonoma или macOS 15+ Sequoia).
- Xcode 16+.
- CocoaPods или Swift Package Manager (Capacitor 7/8 нативно поддерживает SPM).

#### Шаги запуска на macOS:
1. Склонировать репозиторий и установить зависимости:
   ```bash
   npm install --legacy-peer-deps
   npm run build:native
   ```
2. Открыть проект в Xcode:
   ```bash
   npm run cap:ios
   # Либо открыть ios/App/App.xcodeproj в Xcode
   ```
3. В настройках проекта `App` в Xcode:
   - Перейти во вкладку **Signing & Capabilities**.
   - Выбрать Development Team для подписи.
   - Проверить Bundle Identifier: `kz.oneteam.app`.
4. Выбрать целевое устройство (iPhone 16 / iPad Pro / подключенный реальный iPhone/iPad).
5. Нажать кнопку **Run** (`Cmd + R`).

---

## 4. Результаты проверок и верификации

| Проверка | Команда / Метод | Результат | Примечание |
|---|---|---|---|
| **TypeScript (lint)** | `npm run lint` (`tsc --noEmit`) | **PASSED** | Ошибок типизации нет |
| **Production Web Build** | `npm run build` (`vite build`) | **PASSED** | Сборка в `dist/` без ошибок |
| **Capacitor Sync** | `npx cap sync` | **PASSED** | Копирование ассетов и плагинов выполнено |
| **Android Build** | `cd android && ./gradlew assembleDebug` | **PASSED** | `app-debug.apk` (9.0 MB) успешно скомпилирован |
| **Capacitor Doctor** | `npx cap doctor` | **Android: PASSED**, **iOS: BLOCKED (No macOS/Xcode)** | Android готов; сборка iOS требует macOS |
| **Local-First Tests** | `npx tsx tests/localFirst.test.ts` | **PASSED (9/9)** | Регрессий в StorageService нет |
| **Security & Invitations** | `npx tsx tests/emailInvitationsAndMembership.test.ts` | **PASSED (20/20)** | Полная изоляция тенантов и безопасность сохранены |
| **Member Profiles & Fallbacks** | `npx tsx tests/imageAndWorkspaceMembers.test.ts` | **PASSED** | Пакетные запросы и защита от race conditions работают |
| **Tablet & Mobile Viewports** | `npx tsx tests/tabletResponsive.test.ts` | **PASSED (12/12)** | Все 12 разрешений (iPad, Android Tablet, Phone, Desktop) без оверфлоу |

---

## 5. Ограничения и оставшиеся задачи (Roadmap)

В соответствии с ограничениями задачи на этапе Stage 1 не подключались биометрия, пуш-уведомления и нативные хранилища токенов. Переход к следующим этапам выполняется последовательно:

1. **Stage 2: Адаптация Native UI & Plugins**
   - `@capacitor/status-bar`: управление стилем и темной темой `#0B0F19`.
   - `@capacitor/splash-screen`: управление временем показа сплэш-экрана.
   - `@capacitor/keyboard`: предотвращение перекрытия полей ввода клавиатурой.
   - Обработка аппаратной кнопки «Назад» на Android (`App.addListener('backButton')`).
2. **Stage 3: Безопасное хранение токенов и биометрия**
   - Переход с `localStorage` на iOS Keychain и Android EncryptedSharedPreferences (через `@capacitor/preferences` с отдельным планом и обоснованием).
   - Биометрический экран разблокировки (Face ID / Touch ID / BiometricPrompt).
3. **Stage 4: Системные уведомления**
   - Подключение APNs (iOS) и FCM (Android) с миграцией таблицы `user_devices` в Supabase.
4. **Stage 5: Офлайн-кэш SQLite**
   - Локальная база SQLite (`@capacitor-community/sqlite`) для надежного Local-First оффлайн-режима.
