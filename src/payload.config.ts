import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { Customers } from './collections/Customers'
import { Favorites } from './collections/Favorites'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Пустой секрет делает сессии Payload предсказуемыми — падаем сразу, а не в проде
function resolveSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAYLOAD_SECRET не задан. Добавьте его в переменные окружения.')
  }
  return 'dev-only-secret-do-not-use-in-production'
}

// Список origin'ов для мобильного клиента и локальной разработки.
// В проде задаётся через переменную окружения CORS_ORIGINS (через запятую).
function resolveCors(): string[] {
  const fromEnv = process.env.CORS_ORIGINS
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGINS не задан. Перечислите разрешённые источники через запятую.')
  }
  return ['http://localhost:3000']
}

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · BrickStore',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Мобильное приложение шлёт запросы с другого origin (не с этого домена),
  // поэтому Payload должен явно разрешить его заголовки и источники.
  cors: resolveCors(),
  csrf: resolveCors(),
  collections: [Products, Categories, Media, Users, Inquiries, Customers, Favorites],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: resolveSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./brickstore.db',
    },
  }),
  sharp,
  plugins: [],
})
