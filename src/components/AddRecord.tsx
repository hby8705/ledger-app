import { useState, useEffect, useMemo } from 'react';
import { useLedgerStore } from '../store/useLedgerStore';
import { useI18n } from '../i18n/useI18n';
import type { CurrencyPref } from '../store/types';

interface Props {
  onTabChange: (tab: 'history') => void;
}

export default function AddRecord({ onTabChange }: Props) {
  const store = useLedgerStore();
  const { preferences, categories, currencies, creditCards, addRecord, updateCurrencyPref } = store;
  const { t } = useI18n();

  // 当前币种
  const [currency, setCurrency] = useState(() => preferences?.defaultCurrency || 'CNY');

  // 当前币种的偏好
  const currentPref: CurrencyPref = preferences?.currencyPrefs?.[currency] || {
    lastPaymentMethod: 'credit',
    lastCreditCard: '',
  };

  // 表单状态
  const [amount, setAmount] = useState('');
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>(currentPref.lastPaymentMethod);
  const [creditCard, setCreditCard] = useState(currentPref.lastCreditCard);
  const [billingPeriod, setBillingPeriod] = useState<'current' | 'next'>('current');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  // 根据币种过滤的信用卡
  const currencyCards = useMemo(
    () => creditCards.filter(c => c.currency === currency),
    [creditCards, currency],
  );

  // 切换币种时恢复该币种的上次偏好
  useEffect(() => {
    const pref = preferences?.currencyPrefs?.[currency];
    if (pref) {
      setPaymentMethod(pref.lastPaymentMethod);
      setCreditCard(pref.lastCreditCard || (currencyCards[0]?.name || ''));
    } else {
      setPaymentMethod('credit');
      setCreditCard(currencyCards[0]?.name || '');
    }
  }, [currency, preferences, currencyCards]);

  // 支出分类
  const expenseCats = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories],
  );

  // 保存
  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (!category) return;

    await addRecord({
      type: recordType,
      amount: amt,
      currency,
      category,
      paymentMethod,
      creditCard: paymentMethod === 'credit' ? creditCard : undefined,
      billingPeriod: paymentMethod === 'credit' ? billingPeriod : undefined,
      note: note || undefined,
      date,
    });

    // 记忆币种偏好
    await updateCurrencyPref(currency, {
      lastPaymentMethod: paymentMethod,
      lastCreditCard: creditCard,
    });

    // 重置表单
    setAmount('');
    setNote('');
    setCategory('');
    // 保持币种、支付方式、信用卡的选择（记忆功能）
  };

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <div className="page">
      <div style={{
        padding: '12px 16px 8px',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{t('记账')}</span>
        <button
          onClick={() => onTabChange('history')}
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-primary)',
            padding: '4px 12px',
          }}
        >
          {t('历史记录')}
        </button>
      </div>

      <div className="scroll-container" style={{ padding: '10px 12px', paddingBottom: 'calc(var(--safe-area-bottom) + 80px)' }}>
        {/* 支出/收入 + 币种 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', flex: 1, background: 'var(--color-bg)' }}>
            <button
              onClick={() => setRecordType('expense')}
              style={{
                flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 15,
                fontWeight: 600, transition: 'all 0.15s',
                background: recordType === 'expense' ? 'var(--color-danger)' : 'transparent',
                color: recordType === 'expense' ? '#fff' : 'var(--color-text-secondary)',
                borderRadius: 8,
              }}
            >
              支出
            </button>
            <button
              onClick={() => setRecordType('income')}
              style={{
                flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 15,
                fontWeight: 600, transition: 'all 0.15s',
                background: recordType === 'income' ? 'var(--color-success)' : 'transparent',
                color: recordType === 'income' ? '#fff' : 'var(--color-text-secondary)',
                borderRadius: 8,
              }}
            >
              {t('收入')}
            </button>
          </div>

          {/* 币种选择 */}
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--color-bg)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', minWidth: 80,
            }}
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
            ))}
          </select>
        </div>

        {/* 金额输入 */}
        <div style={{
          marginBottom: 12, display: 'flex', alignItems: 'center',
          background: 'var(--color-surface)', borderRadius: 12, padding: '8px 16px',
          border: '2px solid var(--color-border)',
        }}>
          <span style={{ fontSize: 28, fontWeight: 300, color: 'var(--color-text-hint)', marginRight: 8 }}>
            {currentCurrency?.symbol || '¥'}
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            autoFocus
            style={{
              flex: 1, fontSize: 32, fontWeight: 500, padding: '8px 0',
              color: recordType === 'expense' ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          />
        </div>

        {/* 支付方式 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`chip ${paymentMethod === 'cash' ? 'chip-selected' : 'chip-unselected'}`}
            style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontSize: 14 }}
          >
            {t('现金')}
          </button>
          <button
            onClick={() => setPaymentMethod('credit')}
            className={`chip ${paymentMethod === 'credit' ? 'chip-selected' : 'chip-unselected'}`}
            style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontSize: 14 }}
          >
            {t('信用卡')}
          </button>
        </div>

        {/* 信用卡选择 + 归属期（仅刷卡时显示） */}
        {paymentMethod === 'credit' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select
              value={creditCard}
              onChange={e => setCreditCard(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 14,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              }}
            >
              {currencyCards.length === 0 && <option value="">{t('请先配置信用卡')}</option>}
              {currencyCards.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', background: 'var(--color-bg)' }}>
              <button
                onClick={() => setBillingPeriod('current')}
                style={{
                  padding: '10px 14px', fontSize: 13, fontWeight: 500,
                  background: billingPeriod === 'current' ? 'var(--color-primary)' : 'transparent',
                  color: billingPeriod === 'current' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {t('本期')}
              </button>
              <button
                onClick={() => setBillingPeriod('next')}
                style={{
                  padding: '10px 14px', fontSize: 13, fontWeight: 500,
                  background: billingPeriod === 'next' ? 'var(--color-primary)' : 'transparent',
                  color: billingPeriod === 'next' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {t('下期')}
              </button>
            </div>
          </div>
        )}

        {/* 日期 */}
        <div style={{ marginBottom: 8 }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            }}
          />
        </div>

        {/* 备注 */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder={t('添加备注')}
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            }}
          />
        </div>

        {/* 分类选择 - 文字网格 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>
            {t('选择分类')}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          }}>
            {expenseCats.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                style={{
                  padding: '14px 4px', borderRadius: 8, fontSize: 13,
                  minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', fontWeight: 500,
                  lineHeight: 1.2, wordBreak: 'break-all',
                  background: category === cat.name ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: category === cat.name ? '#fff' : 'var(--color-text)',
                  border: category === cat.name ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {t(cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={!amount || !category}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            fontSize: 18, fontWeight: 600, textAlign: 'center',
            background: amount && category ? 'var(--color-primary)' : 'var(--color-border)',
            color: amount && category ? '#fff' : 'var(--color-text-hint)',
            transition: 'all 0.2s',
          }}
        >
          {t('保存')}
        </button>
      </div>
    </div>
  );
}
