import { describe, it, expect } from 'vitest';
import { formatConvertedAmount } from '@/modules/expenses/formatting';

describe('formatConvertedAmount', () => {
  it('should format ILS amount without conversion info', () => {
    const result = formatConvertedAmount(2700, 2700, 'ILS', 1, '2026-03-15');
    expect(result).toBe('₪2,700.00');
  });

  it('should format USD conversion with rate and date', () => {
    const result = formatConvertedAmount(2700, 750, 'USD', 3.6, '2026-03-15');
    expect(result).toContain('₪2,700.00');
    expect(result).toContain('$750.00');
    expect(result).toContain('3.6000');
    expect(result).toContain('March');
    expect(result).toContain('2026');
  });

  it('should format EUR conversion', () => {
    const result = formatConvertedAmount(4200, 1000, 'EUR', 4.2, '2026-01-10');
    expect(result).toContain('₪4,200.00');
    expect(result).toContain('€1,000.00');
    expect(result).toContain('4.2000');
  });

  it('should handle small amounts correctly', () => {
    const result = formatConvertedAmount(36.50, 10, 'USD', 3.65, '2026-06-01');
    expect(result).toContain('₪36.50');
    expect(result).toContain('$10.00');
  });
});
