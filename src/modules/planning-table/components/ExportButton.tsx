'use client';

import { planningTableToCsv } from '../utils/exportCsv';
import { downloadCsv } from '@/shared/utils/downloadCsv';
import type { PlanningRow } from '../types';

type ExportButtonProps = {
  readonly rows: readonly PlanningRow[];
  readonly tableName: string;
};

export function ExportButton({ rows, tableName }: ExportButtonProps) {
  const handleExport = () => {
    const csv = planningTableToCsv(rows);
    const filename = `${tableName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'planning-table'}.csv`;
    downloadCsv(csv, filename);
  };

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
