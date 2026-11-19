'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ApiRequestError, useFavorites } from '@/components/FavoritesProvider'
import { ProductCard } from '@/components/ProductCard'
import type { SessionCustomer } from '@/lib/customer-session'
import type { Product } from '@/payload-types'

type Props = {
  customer: SessionCustomer | null
  children: React.ReactNode
}

/**
 * Клиентская часть кабинета: вход, список избранного, выход.
 * Заявки приходят готовой разметкой из серверного компонента.
 */
export function AccountClient({ customer, children }: Props) {
  const { login, logout, error, clearError, favorites } = useFavorites()
  const searchParams = useSearchParams()
  const loginFormRef = useRef<HTMLFormElement>(null)
  const focusedOnce = useRef(false)
  const formTitleId = useId()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  // Секунды до конца паузы после 429: пока > 0, форма не отправляется (BUG-04)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((left) => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // `?login=1` из шапки открывает форму с фокусом на имени
  useEffect(() => {
    if (customer || focusedOnce.current || searchParams.get('login') !== '1') return
    focusedOnce.current = true
    loginFormRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
  }, [customer, searchParams])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (cooldown > 0) return
    setSubmitting(true)
    setFormError('')
    clearError()
    try {
      await login(name, email)
      setName('')
      setEmail('')
    } catch (loginError) {
      setFormError(loginError instanceof Error ? loginError.message : 'Не удалось войти')
      // 429 — сервер уже решает, когда пускать: держим кнопку неактивной,
      // иначе пользователь бесконечно повторяет заведомо отклоняемую попытку.
      if (loginError instanceof ApiRequestError && loginError.status === 429) {
        const seconds = Number(loginError.message.match(/(\d+)\s*с/)?.[1] ?? 60)
        setCooldown(Number.isFinite(seconds) && seconds > 0 ? seconds : 60)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!customer) {
    return (
      <div className="account-guest">
        <h1>Личный кабинет</h1>
        <p className="account-lead">
          Пароль не нужен: укажите имя и e-mail — мы запомним их в этом браузере.
          После входа можно сохранять наборы в избранное и видеть ответы на свои вопросы.
        </p>

        <form className="account-form" onSubmit={handleLogin} aria-labelledby={formTitleId} ref={loginFormRef}>
          <h2 id={formTitleId}>Войти</h2>

          <label>
            <span>Как к вам обращаться</span>
            <input
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Иван"
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ivan@example.com"
            />
          </label>

          {(formError || error) && (
            <p className="modal-error" role="alert">
              {formError || error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-red"
            disabled={submitting || cooldown > 0}
            aria-describedby={cooldown > 0 ? 'login-cooldown' : undefined}
          >
            {submitting
              ? 'Входим…'
              : cooldown > 0
                ? `Повторить через ${cooldown} с`
                : 'Войти'}
          </button>
          {cooldown > 0 && (
            <p id="login-cooldown" className="account-empty" aria-live="polite">
              Слишком много попыток. Форма разблокируется автоматически.
            </p>
          )}
        </form>
      </div>
    )
  }

  return (
    <>
      <header className="account-header">
        <div>
          <h1>Личный кабинет</h1>
          <p className="account-lead">
            {customer.name}, вы вошли как <strong>{customer.email}</strong>
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void logout()}>
          Выйти
        </button>
      </header>

      {error && (
        <p className="modal-error" role="alert">
          {error}
        </p>
      )}

      <section className="account-block" aria-labelledby="favorites-heading">
        <h2 id="favorites-heading">
          Избранное <span className="account-count">{favorites.length}</span>
        </h2>
        <FavoritesGrid />
      </section>

      {children}
    </>
  )
}

/** Сетка избранного: данные подтягиваются по id из общего контекста. */
function FavoritesGrid() {
  const { favorites, ready } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const key = favorites.join(',')

  useEffect(() => {
    let alive = true

    ;(async () => {
      if (!ready) return
      setLoading(true)
      if (favorites.length === 0) {
        setProducts([])
        setTotal(0)
        setHasMore(false)
        setLoading(false)
        return
      }

      // Сервер отдаёт список пачками; `hasMore` показывает, что показана не вся выборка.
      const response = await fetch('/api/account/favorites?format=full', { cache: 'no-store' })
      if (!response.ok) {
        if (alive) {
          setProducts([])
          setLoading(false)
        }
        return
      }

      const body = (await response.json()) as {
        products?: Product[]
        totalDocs?: number
        hasMore?: boolean
      }
      if (!alive) return

      setProducts(Array.isArray(body.products) ? body.products : [])
      setTotal(typeof body.totalDocs === 'number' ? body.totalDocs : favorites.length)
      setHasMore(Boolean(body.hasMore))
      setLoading(false)
    })()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready])

  if (!ready || loading) return <p className="account-empty">Загружаем избранное…</p>

  if (favorites.length === 0) {
    return (
      <p className="account-empty">
        Пока пусто. Откройте <Link href="/catalog">каталог</Link> и нажмите «♡ В избранное»
        на подходящем наборе.
      </p>
    )
  }

  return (
    <>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} headingLevel={2} />
        ))}
      </div>
      {hasMore && (
        <p className="account-empty" role="status">
          Показаны последние {products.length} из {total} наборов. Остальные появятся
          в списке по мере удаления.
        </p>
      )}
    </>
  )
}
