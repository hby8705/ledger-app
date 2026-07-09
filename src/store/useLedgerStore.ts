import { create } from 'zustand';
import { db, initPresetData } from '../db';
import type { Transaction, CreditCard, Category, Currency, UserPreferences, CurrencyPref } from './types';

interface LedgerState {
  // 初始化
  initialized: boolean;
  init: () => Promise<void>;

  // 偏好
  preferences: UserPreferences | null;
  loadPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateCurrencyPref: (currency: string, pref: Partial<CurrencyPref>) => Promise<void>;

  // 记录
  records: Transaction[];
  loadRecords: () => Promise<void>;
  addRecord: (r: Omit<Transaction, 'id' | 'createdAt'>) => Promise<number>;
  updateRecord: (id: number, r: Partial<Transaction>) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  getRecordsByMonth: (year: number, month: number, currency?: string) => Promise<Transaction[]>;

  // 类别
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<number>;
  updateCategory: (id: number, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // 币种
  currencies: Currency[];
  loadCurrencies: () => Promise<void>;
  addCurrency: (c: Omit<Currency, 'id'>) => Promise<number>;
  deleteCurrency: (id: number) => Promise<void>;

  // 信用卡
  creditCards: CreditCard[];
  loadCreditCards: () => Promise<void>;
  addCreditCard: (c: Omit<CreditCard, 'id'>) => Promise<number>;
  updateCreditCard: (id: number, c: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: number) => Promise<void>;
  confirmRepayment: (cardId: number) => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  initialized: false,
  init: async () => {
    await initPresetData();
    await Promise.all([
      get().loadPreferences(),
      get().loadCategories(),
      get().loadCurrencies(),
      get().loadCreditCards(),
      get().loadRecords(),
    ]);
    set({ initialized: true });
  },

  // ========== 偏好 ==========
  preferences: null,
  loadPreferences: async () => {
    const prefs = await db.preferences.toCollection().first();
    set({ preferences: prefs || null });
  },
  updatePreferences: async (partial) => {
    const current = get().preferences;
    if (!current) return;
    const updated = { ...current, ...partial };
    await db.preferences.update(current.id!, updated);
    set({ preferences: updated });
  },
  updateCurrencyPref: async (currency, partial) => {
    const current = get().preferences;
    if (!current) return;
    const currencyPrefs = { ...current.currencyPrefs };
    currencyPrefs[currency] = { ...currencyPrefs[currency], ...partial };
    await get().updatePreferences({ currencyPrefs });
  },

  // ========== 记录 ==========
  records: [],
  loadRecords: async () => {
    const all = await db.records.orderBy('createdAt').reverse().toArray();
    set({ records: all });
  },
  addRecord: async (r) => {
    const id = await db.records.add({
      ...r,
      createdAt: Date.now(),
    });
    await get().loadRecords();
    return id as number;
  },
  updateRecord: async (id, r) => {
    await db.records.update(id, r);
    await get().loadRecords();
  },
  deleteRecord: async (id) => {
    await db.records.delete(id);
    await get().loadRecords();
  },
  getRecordsByMonth: async (year, month, currency?) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    let collection = db.records.where('date').between(startDate, endDate, true, true);
    if (currency) {
      collection = collection.and(r => r.currency === currency);
    }
    return collection.toArray();
  },

  // ========== 类别 ==========
  categories: [],
  loadCategories: async () => {
    const all = await db.categories.toArray();
    set({ categories: all });
  },
  addCategory: async (c) => {
    const id = await db.categories.add(c);
    await get().loadCategories();
    return id as number;
  },
  updateCategory: async (id, c) => {
    await db.categories.update(id, c);
    await get().loadCategories();
  },
  deleteCategory: async (id) => {
    await db.categories.delete(id);
    await get().loadCategories();
  },

  // ========== 币种 ==========
  currencies: [],
  loadCurrencies: async () => {
    const all = await db.currencies.toArray();
    set({ currencies: all });
  },
  addCurrency: async (c) => {
    const id = await db.currencies.add(c);
    await get().loadCurrencies();
    return id as number;
  },
  deleteCurrency: async (id) => {
    await db.currencies.delete(id);
    await get().loadCurrencies();
  },

  // ========== 信用卡 ==========
  creditCards: [],
  loadCreditCards: async () => {
    const all = await db.creditCards.toArray();
    set({ creditCards: all });
  },
  addCreditCard: async (c) => {
    const id = await db.creditCards.add(c);
    await get().loadCreditCards();
    return id as number;
  },
  updateCreditCard: async (id, c) => {
    await db.creditCards.update(id, c);
    await get().loadCreditCards();
  },
  deleteCreditCard: async (id) => {
    await db.creditCards.delete(id);
    await get().loadCreditCards();
  },
  confirmRepayment: async (cardId) => {
    const card = await db.creditCards.get(cardId);
    if (!card) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    // 本期归属消费总额
    const currentRecords = await db.records
      .where('date').between(startDate, endDate, true, true)
      .and(r => r.creditCard === card.name && r.billingPeriod === 'current')
      .toArray();
    const currentTotal = currentRecords.reduce((sum, r) => sum + r.amount, 0);

    // 下期归属消费 → 转为本期
    const nextRecords = await db.records
      .where('date').between(startDate, endDate, true, true)
      .and(r => r.creditCard === card.name && r.billingPeriod === 'next')
      .toArray();

    // 更新期初已用额度 = 下期消费转入新本期
    const newBeginningUsed = nextRecords.reduce((sum, r) => sum + r.amount, 0);

    // 更新信用卡
    await db.creditCards.update(cardId, {
      beginningUsed: newBeginningUsed,
      currentPeriodPaid: true,
    });

    // 将下期记录更新为本期
    for (const r of nextRecords) {
      await db.records.update(r.id!, { billingPeriod: 'current' });
    }

    await get().loadCreditCards();
    await get().loadRecords();
  },
}));
