import { describe, it, expect } from 'vitest';
import {
  calculateProjectProfitability,
  calculateRetainerProfitability,
  calculateBankProfitability,
  calculateSubProjectProfitability,
  calculateConsumptionPercent,
} from '@/modules/profitability/calculations';

describe('calculateProjectProfitability', () => {
  it('should calculate correctly when under budget (40hrs of 50hrs at ₪200/hr)', () => {
    const result = calculateProjectProfitability(200, 50, 40, 0);

    expect(result.projectValue).toBe(10000);
    expect(result.actualIncome).toBe(8000);
    expect(result.effectiveRate).toBe(200);
    expect(result.netIncome).toBe(8000);
    expect(result.profitMargin).toBe(80);
    expect(result.unbilledHours).toBe(0);
    expect(result.unbilledCost).toBe(0);
    expect(result.overBudget).toBe(false);
  });

  it('should cap income at project value when over budget (60hrs of 50hrs at ₪200/hr)', () => {
    const result = calculateProjectProfitability(200, 50, 60, 0);

    expect(result.projectValue).toBe(10000);
    expect(result.actualIncome).toBe(10000); // Capped
    expect(result.effectiveRate).toBeCloseTo(166.67, 1);
    expect(result.unbilledHours).toBe(10);
    expect(result.unbilledCost).toBe(2000);
    expect(result.overBudget).toBe(true);
  });

  it('should subtract expenses from net income', () => {
    const result = calculateProjectProfitability(200, 50, 40, 1500);

    expect(result.actualIncome).toBe(8000);
    expect(result.netIncome).toBe(6500);
    expect(result.profitMargin).toBe(65);
  });

  it('should handle realistic numbers (47.5hrs at ₪180/hr with ₪2,400 expenses)', () => {
    const result = calculateProjectProfitability(180, 60, 47.5, 2400);

    expect(result.projectValue).toBe(10800);
    expect(result.actualIncome).toBe(8550);
    expect(result.effectiveRate).toBe(180);
    expect(result.netIncome).toBe(6150);
    expect(result.profitMargin).toBeCloseTo(56.94, 1);
    expect(result.overBudget).toBe(false);
  });

  it('should handle zero hours', () => {
    const result = calculateProjectProfitability(200, 50, 0, 0);

    expect(result.actualIncome).toBe(0);
    expect(result.effectiveRate).toBe(200); // Falls back to rate
    expect(result.profitMargin).toBe(0);
    expect(result.overBudget).toBe(false);
  });

  it('should handle zero scoped hours', () => {
    const result = calculateProjectProfitability(200, 0, 10, 0);

    expect(result.projectValue).toBe(0);
    expect(result.actualIncome).toBe(0); // Capped at 0
    expect(result.profitMargin).toBe(0);
  });

  it('should handle exactly at budget (50hrs of 50hrs)', () => {
    const result = calculateProjectProfitability(200, 50, 50, 0);

    expect(result.actualIncome).toBe(10000);
    expect(result.effectiveRate).toBe(200);
    expect(result.unbilledHours).toBe(0);
    expect(result.overBudget).toBe(false);
  });
});

describe('calculateRetainerProfitability', () => {
  it('should calculate efficiency at ₪200/hr (₪8,000 fee / 40hrs)', () => {
    const result = calculateRetainerProfitability(8000, 0, 40);

    expect(result.efficiency).toBe(200);
  });

  it('should show lower efficiency with more hours (₪8,000 fee / 80hrs)', () => {
    const result = calculateRetainerProfitability(8000, 0, 80);

    expect(result.efficiency).toBe(100);
  });

  it('should subtract expenses before calculating efficiency', () => {
    const result = calculateRetainerProfitability(8000, 1000, 40);

    expect(result.efficiency).toBe(175); // (8000 - 1000) / 40
  });

  it('should handle zero hours', () => {
    const result = calculateRetainerProfitability(8000, 0, 0);

    expect(result.efficiency).toBe(0);
  });

  it('should handle realistic numbers (₪12,400 fee, ₪800 expenses, 52.5hrs)', () => {
    const result = calculateRetainerProfitability(12400, 800, 52.5);

    expect(result.efficiency).toBeCloseTo(220.95, 1);
  });
});

describe('calculateBankProfitability', () => {
  it('should calculate bank-level metrics (80hrs at ₪180/hr, 45hrs consumed)', () => {
    const result = calculateBankProfitability(180, 80, 45, 0);

    expect(result.bankValue).toBe(14400);
    expect(result.totalConsumed).toBe(45);
    expect(result.remainingHours).toBe(35);
    expect(result.netBankIncome).toBe(14400);
    expect(result.consumptionPercent).toBeCloseTo(56.25);
  });

  it('should show negative remaining when overdrawn', () => {
    const result = calculateBankProfitability(180, 80, 90, 0);

    expect(result.remainingHours).toBe(-10);
    expect(result.consumptionPercent).toBeCloseTo(112.5);
  });

  it('should subtract expenses from net income', () => {
    const result = calculateBankProfitability(180, 80, 45, 2000);

    expect(result.netBankIncome).toBe(12400);
  });

  it('should handle zero bank hours', () => {
    const result = calculateBankProfitability(180, 0, 0, 0);

    expect(result.bankValue).toBe(0);
    expect(result.consumptionPercent).toBe(0);
  });
});

describe('calculateSubProjectProfitability', () => {
  it('should show 150% effectiveness (30hrs billed, 20hrs actual)', () => {
    const result = calculateSubProjectProfitability(30, 20, 180, 0);

    expect(result.effectiveness).toBe(150);
    expect(result.effectiveRate).toBe(270); // (30 * 180) / 20
  });

  it('should show 67% effectiveness (30hrs billed, 45hrs actual)', () => {
    const result = calculateSubProjectProfitability(30, 45, 180, 0);

    expect(result.effectiveness).toBeCloseTo(66.67, 1);
    expect(result.effectiveRate).toBe(120); // (30 * 180) / 45
  });

  it('should subtract sub-project expenses from effective rate', () => {
    const result = calculateSubProjectProfitability(30, 20, 180, 500);

    expect(result.effectiveRate).toBe(245); // (30 * 180 - 500) / 20
  });

  it('should handle zero actual hours', () => {
    const result = calculateSubProjectProfitability(30, 0, 180, 0);

    expect(result.effectiveness).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });
});

describe('calculateConsumptionPercent', () => {
  it('should return 80% for 40 of 50 hours', () => {
    expect(calculateConsumptionPercent(40, 50)).toBe(80);
  });

  it('should return 100% for exact match', () => {
    expect(calculateConsumptionPercent(50, 50)).toBe(100);
  });

  it('should return 120% when over budget', () => {
    expect(calculateConsumptionPercent(60, 50)).toBe(120);
  });

  it('should return 0% for zero budget hours', () => {
    expect(calculateConsumptionPercent(10, 0)).toBe(0);
  });

  it('should handle realistic consumption (83%)', () => {
    expect(calculateConsumptionPercent(41.5, 50)).toBe(83);
  });
});
