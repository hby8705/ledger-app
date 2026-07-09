import { useState, useMemo, useEffect } from 'react';
import { useLedgerStore } from '../store/useLedgerStore';
import { useI18n } from '../i18n/useI18n';
import { calcStatsByCurrency, getAvailableYears, type StatsResult } from '../utils/statsCalc';

type ViewMode = 'all' | 'cash' | 'credit';

export default function MonthlyStats() {
  const store = useLedgerStore();
  const { records, currencies, loadRecords } = store;
  const { t } = useI18n();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]?.code || 'CNY');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const availableYears = useMemo(() => getAvailableYears(records), [records]);

  const monthRecords = useMemo(() => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  }, [records, year, month]);

  const stats: StatsResult = useMemo(
    () => calcStatsByCurrency(monthRecords, selectedCurrency),
    [monthRecords, selectedCurrency],
  );

  const currencyList = useMemo(() => {
    const codes = new Set(monthRecords.filter(r => r.type === 'expense').map(r => r.currency));
    return currencies.filter(c => codes.has(c.code));
  }, [monthRecords, currencies]);

  // 根据 viewMode 计算展示金额和总额
  const displayTotal = viewMode === 'all' ? stats.totalExpense
    : stats.byCategory.reduce((sum, c) => sum + (viewMode === 'cash' ? c.cash : c.credit), 0);

  // 过滤并排序分类（排除当前视图下金额为0的）
  const displayCategories = useMemo(() => {
    return stats.byCategory
      .map(c => ({
        category: c.category,
        amount: viewMode === 'all' ? c.total : (viewMode === 'cash' ? c.cash : c.credit),
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [stats, viewMode]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentCurrency = currencies.find(c => c.code === selectedCurrency);
  const sym = currentCurrency?.symbol || '';

  return (
    <div className="page">
      <div style={{
        padding: '12px 16px', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-lg)', fontWeight: 600,
      }}>
        {t('月度统计')}
      </div>

      <div className="scroll-container" style={{ padding: '10px 12px', paddingBottom: 'calc(var(--safe-area-bottom) + 80px)' }}>
        {/* 年月选择 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            {availableYears.map(y => <option key={y} value={y}>{y}{t('年')}</option>)}
          </select>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            {months.map(m => <option key={m} value={m}>{m}{t('月')}</option>)}
          </select>
        </div>

        {/* 币种切换 */}
        {currencyList.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {currencies.map(c => (
              <button key={c.code} onClick={() => setSelectedCurrency(c.code)}
                className={`chip ${selectedCurrency === c.code ? 'chip-selected' : 'chip-unselected'}`}
                style={{ padding: '8px 16px', fontSize: 13 }}>
                {c.symbol} {t(c.name)}
              </button>
            ))}
          </div>
        )}

        {/* 总金额 */}
        <div style={{ background: 'var(--color-primary)', borderRadius: 16, padding: 20, marginBottom: 14, color: '#fff' }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
            {sym} {selectedCurrency} · {viewMode === 'cash' ? t('现金') : viewMode === 'credit' ? t('信用卡') : t('当月支出')}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {sym} {displayTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {stats.totalIncome > 0 && (
            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.85 }}>
              {t('收入')}: {sym} {stats.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {/* 合计 | 现金 | 信用卡 三个按钮 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['all', 'cash', 'credit'] as ViewMode[]).map(mode => {
            const label = mode === 'all' ? t('合计') : mode === 'cash' ? t('现金') : t('信用卡');
            return (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: viewMode === mode ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: viewMode === mode ? '#fff' : 'var(--color-text-secondary)',
                  border: viewMode === mode ? 'none' : '1px solid var(--color-border)',
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* 分类明细列表 */}
        {displayCategories.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-hint)' }}>
              {monthRecords.length === 0 ? t('本月暂无记录') : t('暂无记录')}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
              {t('按类别')}
            </div>
            {displayCategories.map(item => (
              <div key={item.category}
                style={{
                  background: 'var(--color-surface)', borderRadius: 12, padding: 14,
                  marginBottom: 8, boxShadow: 'var(--shadow-sm)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{t(item.category)}</span>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>
                    {sym} {item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-bg)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${displayTotal > 0 ? (item.amount / displayTotal) * 100 : 0}%`,
                    background: 'var(--color-primary)',
                  }} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
