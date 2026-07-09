import type { Transaction, CreditCard } from '../store/types';
import { db } from '../db';

/** 月度信用卡统计数据 */
export interface CardMonthStats {
  cardName: string;
  currentTotal: number;     // 本期归属合计
  nextTotal: number;        // 下期归属合计
  consumedTotal: number;    // 已消费总额 = 本期 + 下期
  remaining: number;        // 剩余额度
  dueAmount: number;        // 本期应还款 = 期初已用 + 本期消费
}

/**
 * 计算某张信用卡的月度统计
 */
export async function calcCardStats(
  card: CreditCard,
  year: number,
  month: number,
): Promise<CardMonthStats> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const records = await db.records
    .where('date').between(startDate, endDate, true, true)
    .and(r => r.creditCard === card.name)
    .toArray();

  const currentTotal = records
    .filter(r => r.billingPeriod === 'current')
    .reduce((sum, r) => sum + r.amount, 0);
  const nextTotal = records
    .filter(r => r.billingPeriod === 'next')
    .reduce((sum, r) => sum + r.amount, 0);
  const consumedTotal = currentTotal + nextTotal;
  const remaining = card.totalLimit - consumedTotal;
  const dueAmount = card.beginningUsed + currentTotal;

  return {
    cardName: card.name,
    currentTotal,
    nextTotal,
    consumedTotal,
    remaining,
    dueAmount,
  };
}

/**
 * 获取指定月份所有使用过的信用卡列表（用于在统计中展示）
 */
export function getMonthCreditCards(
  records: Transaction[],
  currency?: string,
): string[] {
  const cardSet = new Set<string>();
  for (const r of records) {
    if (r.paymentMethod === 'credit' && r.creditCard) {
      if (!currency || r.currency === currency) {
        cardSet.add(r.creditCard);
      }
    }
  }
  return Array.from(cardSet);
}
