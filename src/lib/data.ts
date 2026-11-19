import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { Category, Setting } from '@/payload-types'

let cached: Payload | null = null

export async function getBrickPayload(): Promise<Payload> {
  if (!cached) {
    cached = await getPayload({ config })
  }
  return cached
}

/**
 * Ошибку данных не глотаем молча: если запрос упал (нет БД, битый конфиг),
 * в лог попадает причина, иначе витрина просто отдаёт «пустой магазин» с 200.
 * Fallback остаётся для честно пустой базы.
 */
function reportDataError(scope: string, error: unknown): void {
  console.error(`[data] Не удалось получить ${scope}:`, error)
}

export async function getSettings(): Promise<Setting | null> {
  try {
    const payload = await getBrickPayload()
    return await payload.findGlobal({ slug: 'settings', depth: 0 })
  } catch (error) {
    reportDataError('настройки сайта', error)
    return null
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const payload = await getBrickPayload()
    const { docs } = await payload.find({
      collection: 'categories',
      depth: 0,
      sort: 'createdAt',
      limit: 50,
    })
    return docs
  } catch (error) {
    reportDataError('категории', error)
    return []
  }
}
