/**
 * Common Date & Currency Formatting Utilities
 */

export function formatDate(date: string | Date, locale: string = 'es-ES'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'es-ES'): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
