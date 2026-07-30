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

/**
 * Formats a date string to include 2-digit day, short month, 4-digit YEAR, and time (e.g. "26 Jun 2026 08:00").
 */
export function fmtDateWithYear(dateStr?: string, includeTime: boolean = true): string {
  if (!dateStr) return '—';
  try {
    const formatted = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(formatted);
    if (isNaN(d.getTime())) return dateStr;

    const dayMonthYear = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (!includeTime) return dayMonthYear;

    const timeStr = d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${dayMonthYear} ${timeStr}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats duration in minutes into days (d), hours (h), and minutes (m).
 * E.g. 49607 mins (826h 47m) -> "34d 10h 47m"
 * E.g. 1590 mins (26h 30m) -> "1d 2h 30m"
 * E.g. 860 mins (14h 20m) -> "14h 20m"
 */
export function formatTimeDuration(totalMinutesInput: number): string {
  const absMinutes = Math.abs(Math.floor(totalMinutesInput));
  const days = Math.floor(absMinutes / (24 * 60));
  const remainingHours = Math.floor((absMinutes % (24 * 60)) / 60);
  const remainingMins = absMinutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMins}m`;
  }
  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMins}m`;
  }
  return `${remainingMins}m`;
}
