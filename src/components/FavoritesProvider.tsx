'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type SessionCustomer = { id: number; email: string; name: string }

type FavoritesContextValue = {
  customer: SessionCustomer | null
  favorites: number[]
  /** Полное число записей: `favorites` может быть длиннее или короче из-за пагинации */
  totalCount: number
  /** Пока идёт первичная загрузка, счётчик не мигает с 0 на N */
  ready: boolean
  isFavorite: (productId: number) => boolean
  toggleFavorite: (productId: number) => Promise<void>
  login: (name: string, email: string) => Promise<void>
  logout: () => Promise<void>
  /** Последняя ошибка API — показывается в шапке и на карточках */
  error: string
  clearError: () => void
  /** Товар, который сейчас в полёте, чтобы блокировать повторный клик */
  pending: number | null
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

/** Ключ в localStorage для синхронизации счётчика между вкладками. */
const FAVORITES_SYNC_KEY = 'brickstore.favorites.rev'

/** Сообщает другим вкладкам, что избранное изменилось. */
function notifyOtherTabs(): void {
  try {
    localStorage.setItem(FAVORITES_SYNC_KEY, String(Date.now()))
  } catch {
    // Приватный режим без localStorage — синхронизация просто не сработает.
  }
}

/** Ошибка API с HTTP-статусом: форме входа нужен 429, чтобы включить паузу. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

type ApiError = { error?: string }

async function readError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiError | null
  return body?.error || fallback
}

export function FavoritesProvider({
  initialCustomer,
  children,
}: {
  initialCustomer: SessionCustomer | null
  children: React.ReactNode
}) {
  const [customer, setCustomer] = useState<SessionCustomer | null>(initialCustomer)
  const [favorites, setFavorites] = useState<number[]>([])
  /** Полное число записей в избранном: `favorites` может быть усечён пачкой. */
  const [totalCount, setTotalCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  /**
   * Грузим ВСЕ страницы: сервер отдаёт максимум 100 записей за запрос,
   * и раньше счётчик в шапке упирался в 100, а лишнее избранное
   * оставалось недоступным (BUG-09).
   */
  const loadFavorites = useCallback(async () => {
    const ids: number[] = []
    let offset = 0
    let total = 0

    // Ограничение на число итераций — страховка от зацикливания
    // при рассогласовании `hasMore` и `nextOffset` на сервере.
    for (let guard = 0; guard < 100; guard += 1) {
      const response = await fetch(`/api/account/favorites?offset=${offset}`, { cache: 'no-store' })
      if (!response.ok) {
        // 401 здесь штатный: гость не имеет избранного
        if (guard === 0) {
          setFavorites([])
          setTotalCount(0)
        }
        return
      }

      const body = (await response.json()) as {
        productIds?: number[]
        totalDocs?: number
        hasMore?: boolean
        nextOffset?: number | null
      }

      if (Array.isArray(body.productIds)) ids.push(...body.productIds)
      if (typeof body.totalDocs === 'number') total = body.totalDocs

      if (!body.hasMore || typeof body.nextOffset !== 'number' || body.nextOffset <= offset) break
      offset = body.nextOffset
    }

    setFavorites(ids)
    setTotalCount(total > 0 ? total : ids.length)
  }, [])

  // Загружаем избранное после каждого входа и при первом монтировании
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (customer) {
        await loadFavorites()
      } else {
        setFavorites([])
      }
      if (alive) setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [customer, loadFavorites])

  // Другая вкладка изменила сессию или избранное — подтягиваем состояние,
  // иначе счётчик в шапке расходится с базой (BUG-05).
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === FAVORITES_SYNC_KEY && customer) void loadFavorites()
    }
    const onFocus = () => {
      if (customer && document.visibilityState === 'visible') void loadFavorites()
    }
    window.addEventListener('storage', sync)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', onFocus)
    }
  }, [customer, loadFavorites])

  const isFavorite = useCallback(
    (productId: number) => favorites.includes(productId),
    [favorites],
  )

  const login = useCallback(
    async (name: string, email: string) => {
      setError('')
      const response = await fetch('/api/account/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!response.ok) {
        throw new ApiRequestError(
          await readError(response, 'Не удалось выполнить вход'),
          response.status,
        )
      }
      const body = (await response.json()) as { customer: SessionCustomer }
      setCustomer(body.customer)
      // Серверная часть страницы (заявки) собрана под гостя —
      // обновляем маршрут, чтобы догрузить данные кабинета
      router.refresh()
    },
    [router],
  )

  const logout = useCallback(async () => {
    setError('')
    await fetch('/api/account/session', { method: 'DELETE' })
    setCustomer(null)
    setFavorites([])
    setTotalCount(0)
    // Тот же маршрут отрисован с заявками покупателя — перерисовываем гостем
    router.refresh()
  }, [router])

  const toggleFavorite = useCallback(
    async (productId: number) => {
      if (!customer) {
        setError('Войдите в кабинет, чтобы сохранять наборы в избранное')
        return
      }

      const wasFavorite = favorites.includes(productId)
      setPending(productId)
      setError('')

      // Оптимистичное обновление: счётчик меняется сразу, откат при ошибке
      setFavorites((current) =>
        wasFavorite ? current.filter((id) => id !== productId) : [...current, productId],
      )
      setTotalCount((current) => Math.max(0, current + (wasFavorite ? -1 : 1)))

      try {
        const response = wasFavorite
          ? await fetch(`/api/account/favorites?productId=${productId}`, { method: 'DELETE' })
          : await fetch('/api/account/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId }),
            })

        if (!response.ok) {
          throw new Error(await readError(response, 'Не удалось обновить избранное'))
        }
        // Сервер мог ответить `alreadyExists` — тогда счётчик не менялся,
        // но локальное состояние уже верное, синхронизируем число записей.
        await loadFavorites()
      } catch (toggleError) {
        setFavorites((current) =>
          wasFavorite
            ? current.includes(productId)
              ? current
              : [...current, productId]
            : current.filter((id) => id !== productId),
        )
        setTotalCount((current) => Math.max(0, current + (wasFavorite ? 1 : -1)))
        setError(toggleError instanceof Error ? toggleError.message : 'Ошибка сети')
      } finally {
        setPending(null)
        notifyOtherTabs()
      }
    },
    [customer, favorites, loadFavorites],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      customer,
      favorites,
      totalCount,
      ready,
      isFavorite,
      toggleFavorite,
      login,
      logout,
      error,
      clearError: () => setError(''),
      pending,
    }),
    [customer, favorites, totalCount, ready, isFavorite, toggleFavorite, login, logout, error, pending],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites должен вызываться внутри FavoritesProvider')
  return context
}
