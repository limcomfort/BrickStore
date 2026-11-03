import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'
import { getBrickPayload, getCategories } from '@/lib/data'
import { ProductCard } from '@/components/ProductCard'
import type { Category } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Каталог наборов LEGO — BrickStore',
  description: 'Все наборы LEGO в наличии: фильтры по темам, поиск и сортировка по цене.',
}

type SearchParams = {
  category?: string
  sort?: string
  q?: string
  page?: string
}

const SORTS: { value: string; label: string }[] = [
  { value: 'featured', label: 'Популярное' },
  { value: 'new', label: 'Новинки' },
  { value: 'price-asc', label: 'Сначала дешёвые' },
  { value: 'price-desc', label: 'Сначала дорогие' },
]

function buildUrl(params: SearchParams, patch: Partial<SearchParams>): string {
  const search = new URLSearchParams()
  const merged = { ...params, ...patch }
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return `/catalog${qs ? `?${qs}` : ''}`
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const payload = await getBrickPayload()
  const categories = await getCategories()

  const activeCategory = params.category
    ? categories.find((c: Category) => c.slug === params.category)
    : undefined

  const sort =
    params.sort === 'price-asc'
      ? 'price'
      : params.sort === 'price-desc'
        ? '-price'
        : params.sort === 'new'
          ? '-createdAt'
          : '-featured'

  const page = Math.max(1, Number(params.page) || 1)

  const where: Where = {}
  if (activeCategory) where.category = { equals: activeCategory.id }
  if (params.q) where.title = { like: params.q }

  const { docs, totalDocs, totalPages, page: currentPage = 1 } = await payload.find({
    collection: 'products',
    depth: 1,
    where,
    sort,
    limit: 9,
    page,
  })

  return (
    <div className="wrap page">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/">Главная</Link>
        <span>/</span>
        <span>Каталог</span>
        {activeCategory && (
          <>
            <span>/</span>
            <span>{activeCategory.title}</span>
          </>
        )}
      </nav>

      <div className="page-head">
        <div>
          <h1>{activeCategory ? activeCategory.title : 'Каталог наборов'}</h1>
          <p className="muted">
            {activeCategory?.description || 'Выберите тему и соберите свою коллекцию LEGO.'}
          </p>
        </div>
        <small className="result-count">Найдено: {totalDocs}</small>
      </div>

      <div className="toolbar">
        <div className="chips" aria-label="Фильтр по теме">
          <Link className={`chip ${!activeCategory ? 'is-active' : ''}`} href={buildUrl(params, { category: undefined, page: undefined })}>
            Все
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              className={`chip ${activeCategory?.id === cat.id ? 'is-active' : ''}`}
              href={buildUrl(params, { category: cat.slug, page: undefined })}
            >
              {cat.title}
            </Link>
          ))}
        </div>

        <form className="search" action="/catalog" method="get">
          {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
          {params.sort && <input type="hidden" name="sort" value={params.sort} />}
          <input type="search" name="q" placeholder="Найти набор…" defaultValue={params.q || ''} aria-label="Поиск по каталогу" />
          <button type="submit" className="btn btn-sm btn-dark">
            Найти
          </button>
        </form>
      </div>

      <div className="sort-row">
        <span className="muted small">Сортировка:</span>
        {SORTS.map((item) => (
          <Link
            key={item.value}
            className={`sort-link ${(params.sort || 'featured') === item.value ? 'is-active' : ''}`}
            href={buildUrl(params, { sort: item.value, page: undefined })}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {docs.length > 0 ? (
        <div className="product-grid">
          {docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-brick" aria-hidden="true">🧱</span>
          <h2>Ничего не нашлось</h2>
          <p>Попробуйте изменить запрос или выбрать другую тему.</p>
          <Link className="btn btn-red" href="/catalog">
            Сбросить фильтры
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pager" aria-label="Страницы каталога">
          {currentPage > 1 && (
            <Link className="btn btn-sm btn-outline" href={buildUrl(params, { page: String(currentPage - 1) })}>
              ← Назад
            </Link>
          )}
          <span className="muted">
            Страница {currentPage} из {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link className="btn btn-sm btn-outline" href={buildUrl(params, { page: String(currentPage + 1) })}>
              Вперёд →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
