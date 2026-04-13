import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertToIls } from '@/modules/expenses/currency';

// Mock supabase
vi.mock('@/shared/hooks/useSupabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
          }),
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

// Mock fetch for the /api/currency/rate endpoint
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('convertToIls', () => {
  it('should return amount unchanged when currency is ILS', async () => {
    const result = await convertToIls(12400, 'ILS', '2026-03-15');
    expect(result.amountIls).toBe(12400);
    expect(result.exchangeRate).toBe(1);
    expect(result.exchangeRateDate).toBe('2026-03-15');
  });

  it('should return ILS amount for zero value in ILS', async () => {
    const result = await convertToIls(0, 'ILS', '2026-03-15');
    expect(result.amountIls).toBe(0);
  });

  it('should convert USD to ILS using fetched rate', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: { rate: 3.65, date: '2026-03-15' },
        error: null,
      }),
    });

    const result = await convertToIls(750, 'USD', '2026-03-15');
    expect(result.amountIls).toBe(2737.5); // 750 * 3.65 = 2737.5
    expect(result.exchangeRate).toBe(3.65);
    expect(result.exchangeRateDate).toBe('2026-03-15');
  });

  it('should convert EUR to ILS with proper rounding', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: { rate: 4.23, date: '2026-03-14' },
        error: null,
      }),
    });

    const result = await convertToIls(1000, 'EUR', '2026-03-15');
    // 1000 * 4.23 = 4230.00 (rounds to 2 decimal places)
    expect(result.amountIls).toBe(4230);
    expect(result.exchangeRate).toBe(4.23);
  });

  it('should round to 2 decimal places for non-round amounts', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: { rate: 3.6789, date: '2026-03-15' },
        error: null,
      }),
    });

    // 47.5 * 3.6789 = 174.74775 → should round to 174.75
    const result = await convertToIls(47.5, 'USD', '2026-03-15');
    expect(result.amountIls).toBe(174.75);
  });

  it('should throw when rate fetch fails and no cached fallback exists', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        data: null,
        error: { code: 'RATE_NOT_FOUND', message: 'Exchange rate not available' },
      }),
    });

    await expect(convertToIls(100, 'USD', '2026-03-15'))
      .rejects.toThrow('Exchange rate not available');
  });
});
