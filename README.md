# BrickStore 🧱

Интернет-магазин конструкторов LEGO: SSR-витрина на Next.js (App Router) + Headless CMS Payload 3 в одном приложении.

Один dev-сервер обслуживает и сайт, и админку: контент (товары, категории, настройки главной) редактируется в Payload Admin на `/admin`, а витрина читает его через Local API прямо на сервере — без промежуточных HTTP-запросов.

## Стек

| Слой | Технология |
| --- | --- |
| Фронтенд | Next.js 16 (App Router, SSR), React 19 |
| CMS | Payload CMS 3 (встроена в Next.js) |
| База данных | SQLite (через `@payloadcms/db-sqlite`, без внешнего сервера) |
| Редактор контента | Lexical (Rich Text) |
| Стили | Чистый CSS, адаптивная вёрстка |
| Язык | TypeScript |

## Возможности

- **SSR-витрина** — главная, каталог с фильтрами/поиском/сортировкой, карточка товара, кастомная 404.
- **Headless CMS** — коллекции `products`, `categories`, `media`, `users` и глобальные `settings`.
- **Управление контентом** — цены, скидки, наличие, галереи, описания (Rich Text) и тексты главной меняются в админке без правок кода.
- **Каталог** — фильтр по теме, поиск по названию, сортировка по цене/новизне, пагинация.
- **Медиа** — загрузка изображений в CMS, оптимизация через `next/image`.
- **SEO** — метаданные страниц и товаров генерируются из CMS.
- **Сид-скрипт** — 6 категорий, 12 товаров и демо-иллюстрации одной командой.

## Быстрый старт

```bash
# 1. Зависимости
npm install

# 2. Переменные окружения
cp .env.example .env        # Windows: copy .env.example .env

# 3. Наполнить базу демо-данными (создаст админа, категории, товары)
npm run seed

# 4. Запуск
npm run dev
```

- Витрина — http://localhost:3000
- Админка — http://localhost:3000/admin
- REST API — http://localhost:3000/api/products
- GraphQL — http://localhost:3000/api/graphql

Данные администратора по умолчанию берутся из `.env`:

```
ADMIN_EMAIL=admin@brickstore.dev
ADMIN_PASSWORD=BrickStore2026!
```

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `PAYLOAD_SECRET` | Секрет для подписи токенов Payload |
| `DATABASE_URI` | Строка подключения SQLite, по умолчанию `file:./brickstore.db` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Учётная запись, создаваемая сидом |
| `NEXT_PUBLIC_SERVER_URL` | Публичный адрес сайта |

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер (сайт + админка) |
| `npm run build` | Production-сборка |
| `npm start` | Запуск production-сборки |
| `npm run seed` | Пересоздать демо-контент |
| `npm run generate:types` | Перегенерировать `src/payload-types.ts` |
| `npm run generate:importmap` | Перегенерировать import map админки |
| `npm run lint` | ESLint |

## Структура

```
src/
├─ app/
│  ├─ (frontend)/          # публичная витрина (SSR)
│  │  ├─ page.tsx          # главная: hero, темы, хиты
│  │  ├─ catalog/          # каталог + [slug] карточка товара
│  │  ├─ not-found.tsx     # 404
│  │  └─ styles.css        # дизайн-система витрины
│  └─ (payload)/           # админка и REST/GraphQL API
├─ collections/            # Products, Categories, Media, Users
├─ globals/Settings.ts     # тексты главной и контакты
├─ components/             # Header, Footer, ProductCard, BrickLogo
├─ lib/                    # хелперы Payload и форматирования
├─ seed.ts                 # демо-данные и SVG-иллюстрации
└─ payload.config.ts       # конфигурация CMS
```

## Как устроена интеграция с CMS

Страницы — серверные компоненты Next.js. Они получают экземпляр Payload через `getPayload({ config })` (`src/lib/data.ts`) и читают данные Local API:

```ts
const payload = await getBrickPayload()
const { docs } = await payload.find({
  collection: 'products',
  where: { featured: { equals: true } },
  depth: 1,
})
```

Изменения в админке сразу отражаются на витрине при следующем запросе. Публичный доступ к чтению открыт для `products`, `categories` и `settings`; запись — только для авторизованных пользователей.

## Лицензия

MIT. LEGO® — торговая марка LEGO Group; проект не связан с LEGO Group.
