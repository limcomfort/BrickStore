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

export async function getSettings(): Promise<Setting | null> {
  try {
    const payload = await getBrickPayload()
    return await payload.findGlobal({ slug: 'settings', depth: 0 })
  } catch (_error) {
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
  } catch (_error) {
    return []
  }
}
