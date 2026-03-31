/**
 * Profitability calculation functions — pure, no side effects.
 * These are the highest-priority unit test targets in the project.
 *
 * All monetary values are in ILS (already converted).
 */

import type {
  ProjectProfitability,
  RetainerProfitability,
  BankProfitability,
  SubProjectProfitability,
} from './types';

// --- Project type ---

export function calculateProjectProfitability(
  ratePerHourIls: number,
  totalScopedHours: number,
  actualHours: number,
  totalExpensesIls: number
): ProjectProfitability {
  const projectValue = ratePerHourIls * totalScopedHours;

  const actualIncome = actualHours <= totalScopedHours
    ? actualHours * ratePerHourIls
    : projectValue; // Capped at project value

  const effectiveRate = actualHours > 0
    ? actualIncome / actualHours
    : ratePerHourIls;

  const netIncome = actualIncome - totalExpensesIls;

  const profitMargin = projectValue > 0
    ? (netIncome / projectValue) * 100
    : 0;

  const unbilledHours = Math.max(0, actualHours - totalScopedHours);
  const unbilledCost = unbilledHours * ratePerHourIls;

  return {
    projectValue,
    actualHours,
    actualIncome,
    effectiveRate,
    totalExpenses: totalExpensesIls,
    netIncome,
    profitMargin,
    unbilledHours,
    unbilledCost,
    overBudget: actualHours > totalScopedHours,
  };
}

// --- Retainer type ---

export function calculateRetainerProfitability(
  retainerFeeIls: number,
  periodExpensesIls: number,
  actualHoursInPeriod: number
): RetainerProfitability {
  const efficiency = actualHoursInPeriod > 0
    ? (retainerFeeIls - periodExpensesIls) / actualHoursInPeriod
    : 0;

  return {
    retainerFee: retainerFeeIls,
    periodExpenses: periodExpensesIls,
    actualHours: actualHoursInPeriod,
    efficiency,
  };
}

// --- Hour bank — bank level ---

export function calculateBankProfitability(
  ratePerHourIls: number,
  totalBankHours: number,
  totalConsumedHours: number,
  totalExpensesIls: number
): BankProfitability {
  const bankValue = ratePerHourIls * totalBankHours;
  const remainingHours = totalBankHours - totalConsumedHours;
  const netBankIncome = bankValue - totalExpensesIls;

  const consumptionPercent = totalBankHours > 0
    ? (totalConsumedHours / totalBankHours) * 100
    : 0;

  return {
    bankValue,
    totalConsumed: totalConsumedHours,
    remainingHours,
    totalExpenses: totalExpensesIls,
    netBankIncome,
    consumptionPercent,
  };
}

// --- Hour bank — sub-project level ---

export function calculateSubProjectProfitability(
  billedHours: number,
  actualHours: number,
  bankRatePerHourIls: number,
  subProjectExpensesIls: number
): SubProjectProfitability {
  const effectiveness = actualHours > 0
    ? (billedHours / actualHours) * 100
    : 0;

  const effectiveRate = actualHours > 0
    ? (billedHours * bankRatePerHourIls - subProjectExpensesIls) / actualHours
    : 0;

  return {
    billedHours,
    actualHours,
    effectiveness,
    effectiveRate,
    subProjectExpenses: subProjectExpensesIls,
  };
}

// --- Budget consumption (used by notifications) ---

export function calculateConsumptionPercent(
  actualHours: number,
  budgetHours: number
): number {
  if (budgetHours <= 0) return 0;
  return (actualHours / budgetHours) * 100;
}
