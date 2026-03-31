'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchExpenses, createExpense, deleteExpense } from '../api/expensesApi';
import type { Expense, CreateExpenseInput } from '../types';

export function useExpenses(projectId: string) {
  const [expenses, setExpenses] = useState<readonly Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses(projectId);
      setExpenses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (input: CreateExpenseInput) => {
    const created = await createExpense(input);
    setExpenses((prev) => [created, ...prev]);
    return created;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const totalIls = expenses.reduce((sum, e) => sum + e.amount_ils, 0);

  return { expenses, loading, error, add, remove, totalIls, reload: load };
}
