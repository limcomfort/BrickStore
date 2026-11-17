'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type SessionCustomer = { id: number; email: string; name: string }

type FavoritesContextValue = {
  customer: SessionCustomer | null
  favorites: number[]
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
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadFavorites = useCallback(async () => {
    const response = await fetch('/api/account/favorites', { cache: 'no-store' })
    if (!response.ok) {
      // 401 здесь штатный: гость не имеет избранного
      setFavorites([])
      return
    }
    const body = (await response.json()) as { productIds?: number[] }
    setFavorites(Array.isArray(body.productIds) ? body.productIds : [])
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
        throw new Error(await readError(response, 'Не удалось выполнить вход'))
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
      } catch (toggleError) {
        setFavorites((current) =>
          wasFavorite
            ? current.includes(productId)
              ? current
              : [...current, productId]
            : current.filter((id) => id !== productId),
        )
        setError(toggleError instanceof Error ? toggleError.message : 'Ошибка сети')
      } finally {
        setPending(null)
      }
    },
    [customer, favorites],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      customer,
      favorites,
      ready,
      isFavorite,
      toggleFavorite,
      login,
      logout,
      error,
      clearError: () => setError(''),
      pending,
    }),
    [customer, favorites, ready, isFavorite, toggleFavorite, login, logout, error, pending],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites должен вызываться внутри FavoritesProvider')
  return context
}
