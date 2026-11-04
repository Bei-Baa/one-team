# ONE TEAM — iPad & Tablet Responsive Adaptation

Этот документ описывает реализованную архитектуру адаптивности веб-приложения ONE TEAM для планшетных устройств, поддерживаемые разрешения, поведение компонентов навигации, результаты автоматизированного тестирования Playwright и рекомендации по физической валидации на реальных устройствах.

---

## 1. Концепция и цели адаптации

Целью являлась адаптация интерфейса ONE TEAM под планшеты:
- **Apple iPad Mini**, **iPad Air**, **iPad Pro 11"**, **iPad Pro 13"** (как в книжной Portrait, так и в альбомной Landscape ориентациях);
- **Android Tablets** (800×1280 и другие соотношения сторон);
- Сохранение полной функциональности и эргономики интерфейса для смартфонов (320–743px) и Desktop (от 1024px/1440px+);
- Предотвращение растягивания пустых блоков или чрезмерного сжатия контента.

Все изменения выполнены поверх существующей архитектуры React 19 + TypeScript + Tailwind CSS без нарушения бизнес-логики, Supabase Auth, RLS и моделей данных.

---

## 2. Реализованные Breakpoints и поведение навигации

| Диапазон ширины | Устройства | Поведение Sidebar | Поведение MobileNav | Header / Меню |
|---|---|---|---|---|
| **< 744px** (320–743px) | Смартфоны (iPhone SE, 13/14/15, Android) | Скрыт (`tablet-hidden`) | Отображается внизу экрана (`tablet-hidden`) с кнопкой «Ещё» | Кнопка Hamburger открывает мобильный drawer |
| **744px – 1023px** | Планшеты Portrait (iPad Mini 744px, Android 800px, iPad Air 820px, iPad Pro 11 834px) | Отображается в компактном **icon rail** (`w-20`), освобождая рабочее пространство | Скрыт (`tablet-hidden`) | Доступно переключение между всеми 9 модулями и WorkspaceSwitcher |
| **>= 1024px** | Планшеты Landscape (iPad Pro, iPad Air Landscape) и Desktop | Развёрнутый Sidebar (`w-64`) с возможностью ручного сворачивания (`w-20`) | Скрыт (`tablet-hidden`) | Полное рабочее окружение |

### Причина и решение проблемы на 744px:
В Tailwind CSS v4 произвольные классы `@theme` или селекторы без явного импорта утилит могут не генерировать media query для префикса. Были внедрены строгие CSS-классы `.tablet-flex` (`@media (min-width: 744px) { display: flex !important; }`), `.tablet-hidden` (`@media (min-width: 744px) { display: none !important; }`) и `.tablet-pb-7`, а также директива `@custom-variant tablet (@media (min-width: 744px));`, которые гарантируют корректное поведение на уровне стандартных media queries CSS без зависимости от User-Agent.

---

## 3. Адаптация всех 9 модулей

1. **Dashboard (Главная):**
   - KPI-карточки (`KpiCards`) перестраиваются в адаптивную сетку (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
   - Виджеты задач и прогресса команды масштабируются без урезания графиков.
   - Полоса быстрых ссылок на смежные модули аккуратно переносится на две колонки.

2. **Workspace (Рабочее пространство):**
   - **Kanban-доска:** адаптивная сетка `sm:grid-cols-2 xl:grid-cols-4` с минимальной высотой колонок (min-h-[460px]), карточки не сжимаются.
   - **Карточки задач (TaskCard):** интерактивные touch targets увеличены (минимум 32–44px), кнопка перевода статуса доступна при касании без необходимости mouse hover.
   - **Таблица задач (TaskListView):** чекбоксы и кнопки имеют увеличенную область касания, поддерживается плавный горизонтальный скролл без деформации таблицы.

3. **Projects (Проекты):**
   - Панель фильтров и поиск адаптированы для планшетов (`flex-col lg:flex-row`), чипсы статусов имеют `min-h-[38px]`.
   - Сетка проектов перестраивается в 2 колонки на планшетах и 3 колонки на Desktop.

4. **Strategy (Стратегия):**
   - Все 6 вкладок («Обзор», «Миссия», «Видение», «Цели», «Приоритеты», «План») масштабируются для планшетного экрана, блоки 12-колоночной сетки адаптированы для portrait/landscape.

5. **Team (Команда):**
   - Сетка карточек сотрудников адаптирована: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`. На портретных планшетах 744–834px карточки отображаются в 2 колонки вместо сжатия в 4.

6. **Analytics (Аналитика):**
   - Блоки метрик и диаграммы перестраиваются адаптивно (`grid-cols-1 md:grid-cols-2 lg:grid-cols-12`).

7. **Finance (Финансы):**
   - Карточки финансового баланса и фильтры операций масштабируются без горизонтального переполнения страницы.

8. **Clients (Клиенты):**
   - Таблица клиентов оснащена защитой от переполнения с прокруткой контента, фильтры статусов оптимизированы для сенсорных экранов.

9. **Settings (Настройки):**
   - Навигация по вкладкам настроек адаптирована под сенсорный ввод, формы и кнопки сохранения защищены от обрезания.

---

## 4. Drawers, модальные окна и Safe Area

- **TaskDetailDrawer** и **ClientDetailDrawer**: на планшетах занимают `tablet:max-w-lg lg:max-w-xl` с отступом `tablet:pl-10`, оставляя видимым фоновый контекст страницы. Внутренний скролл предотвращает перекрытие полей и кнопок экранной клавиатурой iPad.
- **Modal** и **InviteMemberModal**: модальные окна центрируются на экране с ограничением `max-h-[85vh]`–`max-h-[90vh]` и прокруткой содержимого.
- **Safe Area**: применены классы `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` с переменными `env(safe-area-inset-*)` для корректной работы при горизонтальной ориентации iPad и вырезах экрана.

---

## 5. Результаты автоматизированного тестирования Playwright

Запуск тестов: `npx tsx tests/tabletResponsive.test.ts`.

| № | Устройство / Viewport | Разрешение | Ориентация | Sidebar | MobileNav | Overflow | Статус |
|---|---|---|---|---|---|---|---|
| 1 | iPad Mini | 744 × 1133 | Portrait | Icon rail (80px) | Hidden | 0px | **PASS** |
| 2 | iPad Mini | 1133 × 744 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |
| 3 | iPad Air | 820 × 1180 | Portrait | Icon rail (80px) | Hidden | 0px | **PASS** |
| 4 | iPad Air | 1180 × 820 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |
| 5 | iPad Pro 11 | 834 × 1194 | Portrait | Icon rail (80px) | Hidden | 0px | **PASS** |
| 6 | iPad Pro 11 | 1194 × 834 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |
| 7 | iPad Pro 13 | 1032 × 1376 | Portrait | Expanded (256px) | Hidden | 0px | **PASS** |
| 8 | iPad Pro 13 | 1376 × 1032 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |
| 9 | Android Tablet | 800 × 1280 | Portrait | Icon rail (80px) | Hidden | 0px | **PASS** |
| 10 | Android Tablet | 1280 × 800 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |
| 11 | Smartphone Regression | 390 × 844 | Portrait | Hidden | Visible | 0px | **PASS** |
| 12 | Desktop Regression | 1440 × 900 | Landscape | Expanded (256px) | Hidden | 0px | **PASS** |

Все 12 конфигураций успешно прошли автоматизированную валидацию без горизонтального переполнения (`scrollWidth === clientWidth`) и без ошибок в консоли браузера.

---

## 6. Скриншоты верификации

В каталоге `screenshots/` сохранены актуальные снимки экрана:
- `ipad-mini-portrait.png`
- `ipad-mini-landscape.png`
- `ipad-air-portrait.png`
- `ipad-air-landscape.png`
- `ipad-pro-11-portrait.png`
- `ipad-pro-11-landscape.png`
- `ipad-pro-13-portrait.png`
- `ipad-pro-13-landscape.png`
- `android-tablet-portrait.png`
- `android-tablet-landscape.png`
- `smartphone-regression.png`
- `desktop-regression.png`

---

## 7. Ограничения и рекомендации для физических устройств

- **Эмуляция Playwright/Chromium** выполняет проверку геометрии вьюпортов, CSS media queries, scrollWidth и DOM-структуры, однако **не заменяет физического тестирования на iPad**:
  - Аппаратная экранная клавиатура iPadOS и предиктивная строка QuickType могут уменьшать фактическую видимую высоту браузера (window.visualViewport);
  - Жесты многозадачности iPadOS (Split View, Slide Over, Stage Manager) требуют динамической адаптации при ручном изменении размера окна пользователем;
  - Поведение Apple Pencil при рукописном вводе (Scribble) в текстовые поля форм рекомендуется проверить на физическом iPad с iPadOS 17/18.
