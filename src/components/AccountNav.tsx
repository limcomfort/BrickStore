'use client'

import Link from 'next/link'
import { useFavorites } from '@/components/FavoritesProvider'

/**
 * Счётчик избранного и вход в кабинет.
 * Отдельный клиентский компонент, чтобы `Header` остался серверным.
 */
export function AccountNav() {
  const { customer, favorites, ready } = useFavorites()
  const count = favorites.length

  return (
    <div className="account-nav">
      <Link className="account-link" href="/account">
        <span aria-hidden="true">⭐</span>
        <span className="account-link-text">Избранное</span>
        {/* Счётчик держим в aria-label, чтобы скринридер читал «3 набора» */}
        <span
          className={`account-count${count === 0 ? ' account-count-empty' : ''}`}
          aria-label={`В избранном ${count}`}
          hidden={!ready && count === 0}
        >
          {ready ? count : '·'}
        </span>
      </Link>

      {customer ? (
        <Link className="account-name" href="/account">
          {customer.name}
        </Link>
      ) : (
        <Link className="btn btn-sm btn-outline" href="/account?login=1">
          Войти
        </Link>
      )}
    </div>
  )
}
