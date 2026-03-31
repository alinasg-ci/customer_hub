// Public API for comparison module
export { ComparisonPanel } from './components/ComparisonPanel';
export { SummaryBar } from './components/SummaryBar';
export { useComparison } from './hooks/useComparison';
export { buildComparisonRows, buildComparisonSummary, autoGeneratePhaseLinks } from './utils/calculations';
export type {
  PhaseLink,
  ComparisonRowData,
  ComparisonSummary,
  CreatePhaseLinkInput,
  UpdatePhaseLinkInput,
} from './types';
