'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useFavorites } from '@/components/FavoritesProvider'

type Props = {
  productId: number
  productTitle: string
}

type State = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Кнопка «Задать вопрос» и модальная форма.
 * Заявка уходит в Payload (`POST /api/inquiries`) и появляется в админке.
 */
export function AskQuestion({ productId, productTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const { customer } = useFavorites()

  // Покупателю из кабинета не нужно вводить имя и контакт
  const knownName = customer?.name ?? ''
  const knownContact = customer?.email ?? ''

  // Закрытие по Esc, возврат фокуса на кнопку и удержание фокуса внутри диалога
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      // Клавиатурная ловушка: иначе Tab уводит фокус на страницу под модалкой
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, textarea, [href], select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()

    // При закрытии возвращаем фокус на кнопку «Задать вопрос» (BUG-06)
    const trigger = triggerRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      trigger?.focus()
    }
  }, [open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setState('sending')
    setError('')

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          contact: data.get('contact'),
          message: data.get('message'),
          product: productId,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const message =
          body?.errors?.[0]?.message || body?.message || 'Не удалось отправить вопрос'
        throw new Error(message)
      }

      form.reset()
      setState('sent')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ошибка отправки')
      setState('error')
    }
  }

  function close() {
    setOpen(false)
    setState('idle')
    setError('')
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-outline btn-lg"
        onClick={() => setOpen(true)}
      >
        Задать вопрос
      </button>

      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            ref={dialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={close} aria-label="Закрыть">
              ✕
            </button>

            {state === 'sent' ? (
              <div className="modal-success">
                <span className="modal-icon" aria-hidden="true">✅</span>
                <h2 id={titleId}>Вопрос отправлен</h2>
                <p>
                  Мы ответим на указанный контакт в течение рабочего дня. Ваш вопрос по набору
                  «{productTitle}» уже в очереди.
                </p>
                <button type="button" className="btn btn-red" onClick={close}>
                  Готово
                </button>
              </div>
            ) : (
              <>
                <h2 id={titleId}>Вопрос по набору</h2>
                <p className="modal-subtitle">{productTitle}</p>

                <form className="modal-form" onSubmit={handleSubmit} noValidate>
                  {customer && (
                    <p className="modal-known">
                      Отвечаем вам, <strong>{customer.name}</strong> — на{' '}
                      <strong>{customer.email}</strong>. Заявка появится в{' '}
                      <a href="/account">личном кабинете</a>.
                    </p>
                  )}

                  <label>
                    <span>Как к вам обращаться</span>
                    <input
                      ref={firstFieldRef}
                      name="name"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Иван"
                      defaultValue={knownName}
                    />
                  </label>

                  <label>
                    <span>Телефон или e-mail</span>
                    <input
                      name="contact"
                      type="text"
                      required
                      maxLength={120}
                      autoComplete="tel"
                      placeholder="+7 900 000-00-00"
                      defaultValue={knownContact}
                    />
                  </label>

                  <label>
                    <span>Ваш вопрос</span>
                    <textarea
                      name="message"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      placeholder="Уточните наличие, комплектацию или срок доставки"
                    />
                  </label>

                  {state === 'error' && (
                    <p className="modal-error" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="modal-actions">
                    <button type="submit" className="btn btn-red" disabled={state === 'sending'}>
                      {state === 'sending' ? 'Отправляем…' : 'Отправить вопрос'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={close}>
                      Отмена
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
