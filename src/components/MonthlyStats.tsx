import { useState, useMemo, useEffect } from 'react';
import { useLedgerStore } from '../store/useLedgerStore';
import { calcStatsByCurrency, getAvailableYears, type StatsResult } from '../utils/statsCalc';

export default function MonthlyStats() {
  const store = useLedgerStore();
  const { records, currencies, creditCards, loadRecords } = store;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]?.code || 'CNY');

  // 每次进入页面刷新数据
  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 可用年份
  const availableYears = useMemo(() => getAvailableYears(records), [records]);

  // 该月记录
  const monthRecords = useMemo(() => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  }, [records, year, month]);

  // 按币种统计
  const stats: StatsResult = useMemo(
    () => calcStatsByCurrency(monthRecords, selectedCurrency),
    [monthRecords, selectedCurrency],
  );

  // 币种列表
  const currencyList = useMemo(() => {
    const codes = new Set(monthRecords.filter(r => r.type === 'expense').map(r => r.currency));
    return currencies.filter(c => codes.has(c.code));
  }, [monthRecords, currencies]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  return (
    <div className="page">
      <div style={{
        padding: '12px 16px', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-lg)', fontWeight: 600,
      }}>
        月度统计
      </div>

      <div className="scroll-container" style={{ padding: '12px 16px', paddingBottom: 'calc(var(--safe-area-bottom) + 80px)' }}>
        {/* 年月选择器 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{
              padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)', flex: 1,
            }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{
              padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)', flex: 1,
            }}
          >
            {months.map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>

        {/* 币种切换 Tab */}
        {currencyList.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {currencies.map(c => (
              <button
                key={c.code}
                onClick={() => setSelectedCurrency(c.code)}
                className={`chip ${selectedCurrency === c.code ? 'chip-selected' : 'chip-unselected'}`}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                {c.symbol} {c.name}
              </button>
            ))}
          </div>
        )}

        {/* 总览 */}
        <div style={{ background: 'var(--color-primary)', borderRadius: 16, padding: 20, marginBottom: 16, color: '#fff' }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>
            {currentCurrency?.symbol || ''} {selectedCurrency} · 当月支出
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {currentCurrency?.symbol || ''} {stats.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {stats.totalIncome > 0 && (
            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.85 }}>
              收入: {currentCurrency?.symbol || ''} {stats.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        {stats.byCategory.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-hint)' }}>
              {monthRecords.length === 0 ? '本月暂无记录' : `暂无${selectedCurrency}支出记录`}
            </div>
          </div>
        ) : (
          <>
            {/* 按类别统计 */}
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
              按类别
            </div>
            {stats.byCategory.map(item => (
              <div
                key={item.category}
                style={{
                  background: 'var(--color-surface)', borderRadius: 12, padding: 14,
                  marginBottom: 8, boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{item.category}</span>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>
                    {currentCurrency?.symbol} {item.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 进度条 */}
                <div style={{
                  height: 6, borderRadius: 3, background: 'var(--color-bg)',
                  marginBottom: 8, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(item.total / stats.totalExpense) * 100}%`,
                    background: 'var(--color-primary)',
                  }} />
                </div>

                {/* 现金 + 信用卡细分 */}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {item.cash > 0 && (
                    <span>💰 现金: {currentCurrency?.symbol} {item.cash.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                  {item.credit > 0 && (
                    <span>💳 刷卡: {currentCurrency?.symbol} {item.credit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  )}
                </div>

                {/* 信用卡按卡别明细 */}
                {Object.keys(item.byCard).length > 0 && (
                  <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid var(--color-border)' }}>
                    {Object.entries(item.byCard).map(([card, cardTotal]) => (
                      <div key={card} style={{ fontSize: 12, color: 'var(--color-text-hint)', marginTop: 2 }}>
                        └ {card}: {currentCurrency?.symbol} {cardTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 各卡汇总 */}
            {(() => {
              const cardTotals: Record<string, number> = {};
              stats.byCategory.forEach(item => {
                Object.entries(item.byCard).forEach(([card, total]) => {
                  cardTotals[card] = (cardTotals[card] || 0) + total;
                });
              });
              if (Object.keys(cardTotals).length === 0) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                    按信用卡
                  </div>
                  <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
                    {Object.entries(cardTotals).map(([card, total]) => {
                      const cc = creditCards.find(c => c.name === card);
                      const pct = (total / stats.totalExpense) * 100;
                      return (
                        <div key={card} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '6px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 14,
                        }}>
                          <span>{card}</span>
                          <span style={{ fontWeight: 600 }}>
                            {currentCurrency?.symbol} {total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span style={{ fontSize: 11, color: 'var(--color-text-hint)', marginLeft: 6 }}>
                              ({pct.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
