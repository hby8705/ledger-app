// ========== 记账记录 ==========
export interface Transaction {
  id?: number;
  type: 'expense' | 'income';
  amount: number;
  currency: string;                     // CNY, TWD...
  category: string;
  paymentMethod: 'cash' | 'credit';
  creditCard?: string;                  // 刷卡时的卡名
  billingPeriod?: 'current' | 'next';   // 刷卡时：本期/下期
  note?: string;
  date: string;                         // YYYY-MM-DD
  createdAt: number;                    // Date.now()
}

// ========== 信用卡配置 ==========
export interface CreditCard {
  id?: number;
  name: string;
  currency: string;
  totalLimit: number;
  beginningUsed: number;                // 期初已用额度
  statementDate: number;                // 账单结算日 1-28
  currentPeriodPaid: boolean;
}

// ========== 类别 ==========
export interface Category {
  id?: number;
  name: string;
  type: 'expense' | 'income';
  isPreset?: boolean;                   // 预设类别不可删除
}

// ========== 币种 ==========
export interface Currency {
  id?: number;
  code: string;                         // CNY, TWD
  symbol: string;                       // ¥, NT$
  name: string;                         // 人民币, 新台币
  isPreset?: boolean;
}

// ========== 用户偏好 ==========
export interface CurrencyPref {
  lastPaymentMethod: 'cash' | 'credit';
  lastCreditCard: string;
}

export interface UserPreferences {
  id?: number;
  defaultCurrency: string;
  currencyPrefs: Record<string, CurrencyPref>;
}

// ========== 预设数据 ==========
export const PRESET_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '饮食', type: 'expense', isPreset: true },
  { name: '交通', type: 'expense', isPreset: true },
  { name: '按摩', type: 'expense', isPreset: true },
  { name: '旅行/住/票/电影', type: 'expense', isPreset: true },
  { name: '医药体检', type: 'expense', isPreset: true },
  { name: '请客红包白包', type: 'expense', isPreset: true },
  { name: '商务Sales费用', type: 'expense', isPreset: true },
  { name: '杂支/打球', type: 'expense', isPreset: true },
  { name: '装发表', type: 'expense', isPreset: true },
  { name: 'Tel', type: 'expense', isPreset: true },
  { name: '网络水电气', type: 'expense', isPreset: true },
  { name: '家电', type: 'expense', isPreset: true },
  { name: '房租', type: 'expense', isPreset: true },
  { name: '机票', type: 'expense', isPreset: true },
  { name: '彩票', type: 'expense', isPreset: true },
];

export const PRESET_CURRENCIES: Omit<Currency, 'id'>[] = [
  { code: 'CNY', symbol: '¥', name: '人民币', isPreset: true },
  { code: 'TWD', symbol: 'NT$', name: '新台币', isPreset: true },
];

export const PRESET_CREDIT_CARDS: Omit<CreditCard, 'id'>[] = [
  { name: 'HSBC', currency: 'TWD', totalLimit: 0, beginningUsed: 0, statementDate: 1, currentPeriodPaid: false },
  { name: 'HN', currency: 'TWD', totalLimit: 0, beginningUsed: 0, statementDate: 1, currentPeriodPaid: false },
  { name: '招商银行', currency: 'CNY', totalLimit: 0, beginningUsed: 0, statementDate: 1, currentPeriodPaid: false },
];
