/**
 * Currency conversion logic.
 * Source: Bank of Israel daily rates.
 * Pure conversion functions + rate fetching with cache.
 */

import { supabase } from '@/shared/hooks/useSupabase';
import type { Currency } from '@/shared/types';

export type ConversionResult = {
  readonly amountIls: number;
  readonly exchangeRate: number;
  readonly exchangeRateDate: string;
};

/**
 * Convert a foreign amount to ILS.
 * If currency is ILS, returns the amount unchanged.
 */
export async function convertToIls(
  amount: number,
  currency: Currency,
  date: string
): Promise<ConversionResult> {
  if (currency === 'ILS') {
    return { amountIls: amount, exchangeRate: 1, exchangeRateDate: date };
  }

  const rate = await getRate(currency, date);
  const amountIls = Math.round(amount * rate.rate * 100) / 100;

  return {
    amountIls,
    exchangeRate: rate.rate,
    exchangeRateDate: rate.date,
  };
}

/**
 * Get exchange rate for a currency on a date.
 * Falls back to most recent available rate if exact date not found (weekend/holiday).
 */
async function getRate(
  currency: 'USD' | 'EUR',
  date: string
): Promise<{ rate: number; date: string }> {
  // Check cache first
  const cached = await getCachedRate(currency, date);
  if (cached) return cached;

  // Fetch from BOI API via server-side route
  const response = await fetch('/api/currency/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, date }),
  });

  const result = await response.json();
  if (result.error) {
    // Try fallback to most recent cached rate
    const fallback = await getMostRecentCachedRate(currency, date);
    if (fallback) return fallback;
    throw new Error(result.error.message);
  }

  return { rate: result.data.rate, date: result.data.date };
}

async function getCachedRate(
  currency: string,
  date: string
): Promise<{ rate: number; date: string } | null> {
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate_to_ils, date')
    .eq('currency', currency)
    .eq('date', date)
    .maybeSingle();

  if (data) return { rate: Number(data.rate_to_ils), date: data.date };
  return null;
}

async function getMostRecentCachedRate(
  currency: string,
  beforeDate: string
): Promise<{ rate: number; date: string } | null> {
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate_to_ils, date')
    .eq('currency', currency)
    .lte('date', beforeDate)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return { rate: Number(data.rate_to_ils), date: data.date };
  return null;
}

// Re-export pure formatting from separate file (no Supabase dependency)
export { formatConvertedAmount } from './formatting';
