import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import { getBrickPayload, getCategories } from '@/lib/data'
import { matchesQuery } from '@/lib/search'
import { ProductCard } from '@/components/ProductCard'
import type { Category, Product } from '@/payload-types'

/** Next.js отдаёт повторяющийся параметр массивом: `/catalog?q=лего&q=город`. */
type Param = string | string[] | undefined

type SearchParams = {
  category?: Param
  sort?: Param
  q?: Param
  page?: Param
}

/** Первое значение параметра — повторяющиеся ключи не ломают типы и запрос. */
function first(value: Param): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Нормализованные параметры: массивы сведены к строке. */
type FlatParams = { category?: string; sort?: string; q?: string; page?: string }

function flatten(params: SearchParams): FlatParams {
  return {
    category: first(params.category),
    sort: first(params.sort),
    q: first(params.q),
    page: first(params.page),
  }
}

const SORTS: { value: string; label: string }[] = [
  { value: 'featured', label: 'Популярное' },
  { value: 'new', label: 'Новинки' },
  { value: 'price-asc', label: 'Сначала дешёвые' },
  { value: 'price-desc', label: 'Сначала дорогие' },
]

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = flatten(await searchParams)
  const query = params.q?.trim()
  const categories = await getCategories()
  const category = categories.find((c: Category) => c.slug === params.category)

  if (query) {
    return {
      title: `Поиск: «${query}» — BrickStore`,
      description: `Результаты поиска «${query}» по каталогу наборов LEGO.`,
      robots: { index: false, follow: true },
    }
  }

  if (category) {
    return {
      title: `${category.title} — каталог LEGO — BrickStore`,
      description: category.description || `Наборы LEGO серии ${category.title} в BrickStore.`,
    }
  }

  return {
    title: 'Каталог наборов LEGO — BrickStore',
    description: 'Все наборы LEGO в наличии: фильтры по темам, поиск и сортировка по цене.',
  }
}

function buildUrl(params: FlatParams, patch: Partial<FlatParams>): string {
  const search = new URLSearchParams()
  const merged = { ...params, ...patch }
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return `/catalog${qs ? `?${qs}` : ''}`
}

/** Товары каталога. Сбой БД не роняет страницу: она покажет пустую выдачу с логом. */
async function findProducts(args: {
  where: Where
  sort: string
  limit: number
  page: number
}): Promise<{ docs: Product[]; totalDocs: number; totalPages: number; currentPage: number }> {
  try {
    const payload = await getBrickPayload()
    const result = await payload.find({
      collection: 'products',
      depth: 1,
      where: args.where,
      sort: args.sort,
      limit: args.limit,
      page: args.page,
    })
    return {
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page ?? 1,
    }
  } catch (error) {
    // Раньше здесь падала и сборка, и страница сырым SQLITE_ERROR (N1)
    console.error('[catalog] Не удалось получить товары:', error)
    return { docs: [], totalDocs: 0, totalPages: 0, currentPage: 1 }
  }
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = flatten(await searchParams)
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

  const page = Math.max(1, Number.parseInt(params.page ?? '', 10) || 1)

  const query = params.q?.trim() ?? ''

  const hasQuery = query.length > 0

  const where: Where = {}
  if (activeCategory) where.category = { equals: activeCategory.id }

  const { docs, totalDocs, totalPages, currentPage } = await findProducts({
    where,
    sort,
    limit: hasQuery ? 200 : 9,
    page: hasQuery ? 1 : page,
  })

  // Поиск выполняется в памяти: `like` в SQLite регистрозависим для кириллицы и не ищет
  // по подстроке, поэтому фильтруем сами и игнорируем `%`/`_` как спецсимволы.
  const matched = hasQuery
    ? docs.filter((product) => {
        const category = product.category as { title?: string } | null
        return (
          matchesQuery(product.title, query) ||
          matchesQuery(product.summary, query) ||
          matchesQuery(category?.title, query)
        )
      })
    : docs

  const effectiveTotal = hasQuery ? matched.length : totalDocs
  const effectivePages = hasQuery ? 1 : totalPages
  const effectivePage = hasQuery ? 1 : currentPage

  // Страница за пределами диапазона при корректном номере страницы — это 404, а не «ничего не найдено»
  if (!hasQuery && totalDocs > 0 && page > totalPages) notFound()

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
        <small className="result-count">
          {hasQuery
            ? `Найдено: ${effectiveTotal}`
            : `Найдено: ${effectiveTotal} · показано ${docs.length}`}
        </small>
      </div>

      <div className="toolbar">
        <div className="chips" aria-label="Фильтр по теме">
          <Link
            className={`chip ${!activeCategory ? 'is-active' : ''}`}
            href={buildUrl(params, { category: undefined, page: undefined })}
            aria-current={!activeCategory ? 'page' : undefined}
          >
            Все
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              className={`chip ${activeCategory?.id === cat.id ? 'is-active' : ''}`}
              href={buildUrl(params, { category: cat.slug, page: undefined })}
              aria-current={activeCategory?.id === cat.id ? 'page' : undefined}
            >
              {cat.title}
            </Link>
          ))}
        </div>

        <form className="search" action="/catalog" method="get">
          {activeCategory && <input type="hidden" name="category" value={activeCategory.slug} />}
          {params.sort && <input type="hidden" name="sort" value={params.sort} />}
          <input type="search" name="q" placeholder="Найти набор…" defaultValue={query} aria-label="Поиск по каталогу" />
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
            aria-current={(params.sort || 'featured') === item.value ? 'true' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {matched.length > 0 ? (
        <>
          <h2 className="visually-hidden">Результаты каталога</h2>
          {hasQuery && (
            <p className="search-hint">
              Совпадения по названию, описанию и теме набора. Найдено по запросу «{query}»: {effectiveTotal}.
            </p>
          )}
          <div className="product-grid">
            {matched.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-brick" aria-hidden="true">🧱</span>
          <h2>Ничего не нашлось</h2>
          <p>
            {hasQuery
              ? `По запросу «${query}» товаров нет. Проверьте написание или выберите другую тему.`
              : 'В этой теме пока нет товаров. Загляните позже или сбросьте фильтры.'}
          </p>
          <Link className="btn btn-red" href="/catalog">
            Сбросить фильтры
          </Link>
        </div>
      )}

      {effectivePages > 1 && (
        <nav className="pager" aria-label="Страницы каталога">
          {effectivePage > 1 && (
            <Link className="btn btn-sm btn-outline" href={buildUrl(params, { page: String(effectivePage - 1) })}>
              ← Назад
            </Link>
          )}
          <span className="muted">
            Страница {effectivePage} из {effectivePages}
          </span>
          {effectivePage < effectivePages && (
            <Link className="btn btn-sm btn-outline" href={buildUrl(params, { page: String(effectivePage + 1) })}>
              Вперёд →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
