/**
 * Поиск по каталогу.
 *
 * Оператор `like` в SQLite через Payload не подходит для пользовательского поиска:
 * - для кириллицы сравнение идёт по байтам, поэтому «кран» не находит «Кран-гигант»;
 * - символы `%` и `_` работают как шаблон и совпадают с любым текстом.
 *
 * Поэтому выборка делается целиком, а сопоставление — здесь, по подстроке без учёта регистра.
 */

/** Нормализует строку для сравнения: нижний регистр, схлопнутые пробелы, «ё» → «е». */
export function normalize(value: string): string {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()
}

/** Возвращает true, если `value` содержит `query` без учёта регистра. Пустой запрос не совпадает. */
export function matchesQuery(value: string | null | undefined, query: string): boolean {
  const needle = normalize(query)
  if (!needle) return false
  return normalize(value ?? '').includes(needle)
}
