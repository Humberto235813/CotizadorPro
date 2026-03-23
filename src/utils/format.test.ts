import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  classNames,
  computeLineTotal,
  computeQuoteTotals,
  generateQuoteNumber,
  isToday,
  isPast,
} from './format';

describe('formatCurrency', () => {
  it('formats MXN by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('formats USD', () => {
    const result = formatCurrency(1234.56, 'USD');
    expect(result).toContain('1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0.00');
  });
});

describe('formatDate', () => {
  it('formats a date string', () => {
    const result = formatDate('2026-01-15');
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});

describe('formatPercent', () => {
  it('rounds and adds percent sign', () => {
    expect(formatPercent(75.4)).toBe('75%');
    expect(formatPercent(100)).toBe('100%');
  });
});

describe('classNames', () => {
  it('joins truthy class names', () => {
    expect(classNames('a', 'b', false, null, 'c')).toBe('a b c');
  });

  it('returns empty string for no truthy values', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });
});

describe('computeLineTotal', () => {
  it('computes base total without discount', () => {
    expect(computeLineTotal(2, 100)).toBe(200);
  });

  it('applies percent discount', () => {
    expect(computeLineTotal(2, 100, 'percent', 10)).toBe(180);
  });

  it('applies amount discount', () => {
    expect(computeLineTotal(2, 100, 'amount', 50)).toBe(150);
  });

  it('never returns negative', () => {
    expect(computeLineTotal(1, 10, 'amount', 999)).toBe(0);
  });
});

describe('computeQuoteTotals', () => {
  it('calculates subtotal, tax, and total', () => {
    const items = [
      { quantity: 2, price: 100 },
      { quantity: 1, price: 50 },
    ];
    const result = computeQuoteTotals(items);
    expect(result.subtotal).toBe(250);
    expect(result.tax).toBe(40); // 250 * 0.16
    expect(result.total).toBe(290);
  });

  it('handles empty items', () => {
    const result = computeQuoteTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it('uses custom tax rate', () => {
    const items = [{ quantity: 1, price: 100 }];
    const result = computeQuoteTotals(items, 0.08);
    expect(result.tax).toBe(8);
    expect(result.total).toBe(108);
  });

  it('handles legacy percent discount field', () => {
    const items = [{ quantity: 1, price: 100, discount: 10 }];
    const result = computeQuoteTotals(items);
    expect(result.subtotal).toBe(90);
  });

  it('handles new discount type field', () => {
    const items = [{ quantity: 1, price: 100, discountType: 'percent' as const, discountValue: 20 }];
    const result = computeQuoteTotals(items);
    expect(result.subtotal).toBe(80);
  });
});

describe('generateQuoteNumber', () => {
  it('generates Q-0001 when no existing numbers', () => {
    expect(generateQuoteNumber([])).toBe('Q-0001');
  });

  it('increments from existing numbers', () => {
    expect(generateQuoteNumber(['Q-0005', 'Q-0003'])).toBe('Q-0006');
  });

  it('handles invalid entries', () => {
    expect(generateQuoteNumber(['Q-abc', 'not-a-quote'])).toBe('Q-0001');
  });

  it('supports custom prefix', () => {
    expect(generateQuoteNumber([], 'COT-')).toBe('COT-0001');
  });
});

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(new Date().toISOString())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday.toISOString())).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isToday('')).toBe(false);
  });
});

describe('isPast', () => {
  it('returns true for past dates', () => {
    expect(isPast('2020-01-01')).toBe(true);
  });

  it('returns false for future dates', () => {
    expect(isPast('2099-12-31')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isPast('')).toBe(false);
  });
});
