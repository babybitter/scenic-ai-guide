export type DateTimeValue = string | number | Date | null | undefined

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}

export function formatDateTime(
  value: DateTimeValue,
  locale?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_TIME_OPTIONS
): string {
  if (value === null || value === undefined || value === '') return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  try {
    return new Intl.DateTimeFormat(locale || undefined, options).format(date)
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(date)
  }
}
