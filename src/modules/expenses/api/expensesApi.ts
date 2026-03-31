import { supabase } from '@/shared/hooks/useSupabase';
import { convertToIls } from '../currency';
import type { Expense, CreateExpenseInput } from '../types';

export async function fetchExpenses(projectId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as Expense[];
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const currency = input.currency ?? 'ILS';

  // Convert to ILS using Bank of Israel rates
  const conversion = await convertToIls(input.amount, currency, input.date);

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      project_id: input.project_id,
      phase_id: input.phase_id ?? null,
      sub_project_id: input.sub_project_id ?? null,
      description: input.description,
      amount: input.amount,
      currency,
      exchange_rate_used: currency === 'ILS' ? null : conversion.exchangeRate,
      exchange_rate_date: currency === 'ILS' ? null : conversion.exchangeRateDate,
      amount_ils: conversion.amountIls,
      date: input.date,
      category: input.category,
      attachment_link: input.attachment_link ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
