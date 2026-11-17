'use client'

import { useFavorites } from '@/components/FavoritesProvider'
import { useRouter } from 'next/navigation'

/**
 * Кнопка-сердечко на карточке товара.
 * Состояние берётся из общего контекста, поэтому счётчик в шапке
 * обновляется без перезагрузки страницы.
 */
export function FavoriteButton({
  productId,
  productTitle,
}: {
  productId: number
  productTitle: string
}) {
  const { isFavorite, toggleFavorite, pending, ready, customer } = useFavorites()
  const router = useRouter()
  const active = isFavorite(productId)
  const busy = pending === productId

  // Гостя не заставляем ловить ошибку 401 — ведём сразу на форму входа
  function handleClick() {
    if (!customer) {
      router.push('/account?login=1')
      return
    }
    void toggleFavorite(productId)
  }

  return (
    <button
      type="button"
      className={`favorite-btn${active ? ' favorite-btn-active' : ''}`}
      aria-pressed={active}
      aria-label={
        active
          ? `Убрать «${productTitle}» из избранного`
          : `Добавить «${productTitle}» в избранное`
      }
      // До первичной загрузки кнопка неактивна: иначе гость нажмёт
      // и получит отказ, хотя товар уже был в списке
      disabled={busy || !ready}
      onClick={handleClick}
    >
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
      <span className="favorite-btn-text">
        {active ? 'В избранном' : 'В избранное'}
      </span>
    </button>
  )
}
