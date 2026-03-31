// Public API for profitability module
export { ProfitabilityCard } from './components/ProfitabilityCard';
export {
  calculateProjectProfitability,
  calculateRetainerProfitability,
  calculateBankProfitability,
  calculateSubProjectProfitability,
  calculateConsumptionPercent,
} from './calculations';
export type {
  ProjectProfitability,
  RetainerProfitability,
  BankProfitability,
  SubProjectProfitability,
} from './types';
