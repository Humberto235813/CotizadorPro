/**
 * Shared formatting and calculation utilities.
 * Single source of truth — imported everywhere instead of redefined per file.
 */

export const formatCurrency = (
  amount: number,
  currency: 'MXN' | 'USD' = 'MXN'
): string =>
  new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatDate = (
  dateStr: string,
  locale: string = 'es-MX'
): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateShort = (
  dateStr: string,
  locale: string = 'es-MX'
): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(locale);
};

export const formatPercent = (value: number): string =>
  `${Math.round(value)}%`;

export const classNames = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

/**
 * Compute line-item total considering discount type.
 */
export const computeLineTotal = (
  quantity: number,
  price: number,
  discountType?: 'percent' | 'amount',
  discountValue?: number
): number => {
  const lineBase = (quantity * price) || 0;
  let discount = 0;
  if (discountType === 'percent' && discountValue) {
    discount = lineBase * (discountValue / 100);
  } else if (discountType === 'amount' && discountValue) {
    discount = discountValue;
  }
  return Math.max(0, lineBase - discount);
};

/**
 * Compute subtotal, tax, and total for a list of items.
 */
export const computeQuoteTotals = (
  items: Array<{
    quantity: number;
    price: number;
    discountType?: 'percent' | 'amount';
    discountValue?: number;
    discount?: number;
  }>,
  taxRate: number = 0.16
): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((acc, it) => {
    if (it.discountType) {
      return acc + computeLineTotal(it.quantity, it.price, it.discountType, it.discountValue);
    }
    // Legacy discount field (percent only)
    const lineTotal = it.quantity * it.price;
    const discount = it.discount || 0;
    return acc + lineTotal * (1 - discount / 100);
  }, 0);

  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { subtotal, tax, total };
};

/**
 * Generate sequential quote number.
 */
export const generateQuoteNumber = (
  existingNumbers: string[],
  prefix: string = 'Q-'
): string => {
  const numbers = existingNumbers
    .filter(n => n?.startsWith(prefix))
    .map(n => parseInt(n.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return prefix + next.toString().padStart(4, '0');
};

/**
 * Check if a date is today.
 */
export const isToday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
};

/**
 * Check if a date is in the past.
 */
export const isPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};
