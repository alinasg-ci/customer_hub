export type ProjectProfitability = {
  readonly projectValue: number;
  readonly actualHours: number;
  readonly actualIncome: number;
  readonly effectiveRate: number;
  readonly totalExpenses: number;
  readonly netIncome: number;
  readonly profitMargin: number;
  readonly unbilledHours: number;
  readonly unbilledCost: number;
  readonly overBudget: boolean;
};

export type RetainerProfitability = {
  readonly retainerFee: number;
  readonly periodExpenses: number;
  readonly actualHours: number;
  readonly efficiency: number; // effective hourly rate
};

export type BankProfitability = {
  readonly bankValue: number;
  readonly totalConsumed: number;
  readonly remainingHours: number;
  readonly totalExpenses: number;
  readonly netBankIncome: number;
  readonly consumptionPercent: number;
};

export type SubProjectProfitability = {
  readonly billedHours: number;
  readonly actualHours: number;
  readonly effectiveness: number; // percentage
  readonly effectiveRate: number;
  readonly subProjectExpenses: number;
};
