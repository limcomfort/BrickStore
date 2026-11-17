import config from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import { getSessionCustomer } from '@/lib/customer-session'
import { AccountClient } from './AccountClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Личный кабинет — избранное и заявки',
  description:
    'Избранные наборы LEGO и история вопросов: сохраняйте товары и следите за ответами магазина.',
  robots: { index: false, follow: true },
}

type InquiryRow = {
  id: number
  message: string
  status: 'new' | 'in-progress' | 'answered'
  createdAt: string
  productTitle: string
  productSlug: string
}

const STATUS_LABEL: Record<InquiryRow['status'], string> = {
  new: 'Новая',
  'in-progress': 'В работе',
  answered: 'Отвечено',
}

/** Заявки текущего покупателя. Гость получает пустой список. */
async function loadInquiries(customerId: number): Promise<InquiryRow[]> {
  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'inquiries',
    where: { customer: { equals: customerId } },
    limit: 20,
    depth: 1,
    sort: '-createdAt',
    overrideAccess: true,
  })

  return found.docs.map((doc) => {
    const product = typeof doc.product === 'object' ? doc.product : null
    return {
      id: doc.id,
      message: doc.message,
      status: doc.status ?? 'new',
      createdAt: doc.createdAt,
      productTitle: product?.title ?? 'Товар удалён',
      productSlug: product?.slug ?? '',
    }
  })
}

export default async function AccountPage() {
  const payload = await getPayload({ config })
  const customer = await getSessionCustomer(payload)
  const inquiries = customer ? await loadInquiries(customer.id) : []

  return (
    <div className="wrap account-page">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Кабинет</span>
      </nav>

      <AccountClient
        customer={customer ? { id: customer.id, email: customer.email, name: customer.name } : null}
      >
        <section className="account-block" aria-labelledby="inquiries-heading">
          <h2 id="inquiries-heading">Мои вопросы</h2>

          {inquiries.length === 0 ? (
            <p className="account-empty">
              Здесь появятся вопросы, заданные со страницы набора. Пока их нет.
            </p>
          ) : (
            <ul className="inquiry-list">
              {inquiries.map((inquiry) => (
                <li className="inquiry-item" key={inquiry.id}>
                  <div className="inquiry-head">
                    {inquiry.productSlug ? (
                      <Link href={`/catalog/${inquiry.productSlug}`}>{inquiry.productTitle}</Link>
                    ) : (
                      <span>{inquiry.productTitle}</span>
                    )}
                    <span className={`inquiry-status inquiry-status-${inquiry.status}`}>
                      {STATUS_LABEL[inquiry.status]}
                    </span>
                  </div>
                  <p className="inquiry-message">{inquiry.message}</p>
                  <time className="inquiry-date" dateTime={inquiry.createdAt}>
                    {new Date(inquiry.createdAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AccountClient>
    </div>
  )
}
