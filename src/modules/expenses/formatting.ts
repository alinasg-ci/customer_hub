/**
 * Pure formatting functions for currency display.
 * No side effects, no external dependencies — safe to unit test.
 */

import type { Currency } from '@/shared/types';

export function formatConvertedAmount(
  amountIls: number,
  originalAmount: number,
  originalCurrency: Currency,
  exchangeRate: number,
  exchangeRateDate: string
): string {
  const currencySymbol = originalCurrency === 'USD' ? '$' : '€';
  const ilsFormatted = `₪${amountIls.toLocaleString('en-IL', { minimumFractionDigits: 2 })}`;

  if (originalCurrency === 'ILS') return ilsFormatted;

  const dateFormatted = new Date(exchangeRateDate).toLocaleDateString('en-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `${ilsFormatted} (converted from ${currencySymbol}${originalAmount.toLocaleString('en-IL', { minimumFractionDigits: 2 })} at ${exchangeRate.toFixed(4)} on ${dateFormatted})`;
}
