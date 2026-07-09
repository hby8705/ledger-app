import Dexie, { type Table } from 'dexie';
import type { Transaction, CreditCard, Category, Currency, UserPreferences } from '../store/types';
import { PRESET_CATEGORIES, PRESET_CURRENCIES, PRESET_CREDIT_CARDS } from '../store/types';

class LedgerDB extends Dexie {
  records!: Table<Transaction, number>;
  creditCards!: Table<CreditCard, number>;
  categories!: Table<Category, number>;
  currencies!: Table<Currency, number>;
  preferences!: Table<UserPreferences, number>;

  constructor() {
    super('LedgerDB');
    this.version(1).stores({
      records: '++id, type, currency, category, paymentMethod, creditCard, date, createdAt',
      creditCards: '++id, name, currency',
      categories: '++id, name, type',
      currencies: '++id, code',
      preferences: '++id',
    });
  }
}

export const db = new LedgerDB();

let initPromise: Promise<void> | null = null;

// 初始化预设数据（防竞态：多次调用共享同一个 Promise）
export async function initPresetData(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await db.transaction('rw', db.categories, db.currencies, db.creditCards, db.preferences, async () => {
      // 初始化分类
      const catCount = await db.categories.count();
      if (catCount === 0) {
        await db.categories.bulkAdd(PRESET_CATEGORIES as Category[]);
      }

      // 初始化币种
      const curCount = await db.currencies.count();
      if (curCount === 0) {
        await db.currencies.bulkAdd(PRESET_CURRENCIES as Currency[]);
      }

      // 初始化信用卡
      const ccCount = await db.creditCards.count();
      if (ccCount === 0) {
        await db.creditCards.bulkAdd(PRESET_CREDIT_CARDS as CreditCard[]);
      }

      // 初始化偏好
      const prefCount = await db.preferences.count();
      if (prefCount === 0) {
        await db.preferences.add({
          language: 'zh-CN',
          defaultCurrency: 'CNY',
          currencyPrefs: {
            CNY: { lastPaymentMethod: 'credit', lastCreditCard: '招商银行' },
            TWD: { lastPaymentMethod: 'credit', lastCreditCard: 'HSBC' },
          },
        });
      } else {
        // 给旧用户补上 language 字段
        const pref = await db.preferences.toCollection().first();
        if (pref && !pref.language) {
          await db.preferences.update(pref.id!, { language: 'zh-CN' });
        }
      }
    });
  })();

  return initPromise;
}
