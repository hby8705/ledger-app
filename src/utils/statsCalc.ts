import type { Transaction } from '../store/types';

export interface CategoryStats {
  category: string;
  total: number;
  cash: number;
  credit: number;
  byCard: Record<string, number>;   // 各卡消费明细
}

export interface StatsResult {
  currency: string;
  totalExpense: number;
  totalIncome: number;
  byCategory: CategoryStats[];
}

/**
 * 按币种统计月度数据
 */
export function calcStatsByCurrency(
  records: Transaction[],
  currency: string,
): StatsResult {
  const filtered = records.filter(r => r.currency === currency);
  const expenseRecords = filtered.filter(r => r.type === 'expense');
  const incomeRecords = filtered.filter(r => r.type === 'income');

  const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);

  // 按类别汇总支出
  const catMap = new Map<string, { cash: number; credit: number; byCard: Record<string, number> }>();
  for (const r of expenseRecords) {
    if (!catMap.has(r.category)) {
      catMap.set(r.category, { cash: 0, credit: 0, byCard: {} });
    }
    const entry = catMap.get(r.category)!;
    if (r.paymentMethod === 'cash') {
      entry.cash += r.amount;
    } else {
      entry.credit += r.amount;
      const card = r.creditCard || '未知';
      entry.byCard[card] = (entry.byCard[card] || 0) + r.amount;
    }
  }

  const byCategory: CategoryStats[] = Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.cash + data.credit,
      cash: data.cash,
      credit: data.credit,
      byCard: data.byCard,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    currency,
    totalExpense,
    totalIncome,
    byCategory,
  };
}

/**
 * 从记录中提取所有出现过的年份
 */
export function getAvailableYears(records: Transaction[]): number[] {
  const years = new Set<number>();
  for (const r of records) {
    const y = parseInt(r.date.slice(0, 4), 10);
    if (!isNaN(y)) years.add(y);
  }
  if (years.size === 0) years.add(new Date().getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}
