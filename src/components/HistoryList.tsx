import { useState, useMemo, useEffect } from 'react';
import { useLedgerStore } from '../store/useLedgerStore';
import type { Transaction } from '../store/types';

export default function HistoryList() {
  const store = useLedgerStore();
  const { records, categories, currencies, loadRecords, updateRecord, deleteRecord } = store;

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const now = new Date();
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  // 可用年份
  const years = useMemo(() => {
    const ys = new Set<number>();
    records.forEach(r => { const y = parseInt(r.date.slice(0, 4), 10); if (!isNaN(y)) ys.add(y); });
    if (ys.size === 0) ys.add(now.getFullYear());
    return Array.from(ys).sort((a, b) => b - a);
  }, [records]);

  // 筛选后的记录
  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (filterYear) result = result.filter(r => r.date.startsWith(`${filterYear}-`));
    if (filterMonth) result = result.filter(r => r.date.startsWith(`${filterYear}-${String(filterMonth).padStart(2, '0')}`));
    if (filterCategory) result = result.filter(r => r.category === filterCategory);
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(r =>
        r.category.toLowerCase().includes(s) ||
        (r.note && r.note.toLowerCase().includes(s)) ||
        r.currency.toLowerCase().includes(s) ||
        (r.creditCard && r.creditCard.toLowerCase().includes(s))
      );
    }
    return result.slice(0, 100); // 最多100条
  }, [records, filterYear, filterMonth, filterCategory, searchText]);

  // 按月分组
  const groupedRecords = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredRecords.forEach(r => {
      const label = r.date.slice(0, 7); // YYYY-MM
      if (!groups[label]) groups[label] = [];
      groups[label].push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredRecords]);

  const handleEdit = (r: Transaction) => {
    setEditingId(r.id!);
    setEditForm({ ...r });
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    await updateRecord(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定删除这条记录吗？')) {
      await deleteRecord(id);
    }
  };

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  return (
    <div className="page">
      <div style={{
        padding: '12px 16px', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-lg)', fontWeight: 600,
      }}>
        历史账单
      </div>

      <div className="scroll-container" style={{ padding: '12px 16px', paddingBottom: 'calc(var(--safe-area-bottom) + 80px)' }}>
        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索类别、备注、币种..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            marginBottom: 10,
          }}
        />

        {/* 筛选 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select
            value={filterYear || ''}
            onChange={e => { setFilterYear(e.target.value ? Number(e.target.value) : null); setFilterMonth(null); }}
            style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            }}
          >
            <option value="">全部年份</option>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          {filterYear && (
            <select
              value={filterMonth || ''}
              onChange={e => setFilterMonth(e.target.value ? Number(e.target.value) : null)}
              style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              }}
            >
              <option value="">全部月份</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          )}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            }}
          >
            <option value="">全部分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 记录列表 */}
        {groupedRecords.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 14 }}>暂无记录</div>
          </div>
        ) : (
          groupedRecords.map(([monthLabel, items]) => (
            <div key={monthLabel} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)',
                marginBottom: 8, paddingLeft: 4,
              }}>
                {monthLabel}
              </div>
              {items.map(r => (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--color-surface)', borderRadius: 10, padding: 12,
                    marginBottom: 6, boxShadow: 'var(--shadow-sm)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  {/* 类别标签 */}
                  <div style={{
                    background: r.type === 'expense' ? 'var(--color-danger-light)' : '#e6f4ea',
                    color: r.type === 'expense' ? 'var(--color-danger)' : 'var(--color-success)',
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    {r.category}
                  </div>

                  {/* 详情 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>
                        {r.type === 'income' ? '+' : '-'}{getCurrencySymbol(r.currency)}{r.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>{r.date.slice(5)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {r.paymentMethod === 'cash' ? '现金' : `💳 ${r.creditCard || ''} · ${r.billingPeriod === 'current' ? '本期' : '下期'}`}
                      {r.note && <span style={{ marginLeft: 6, color: 'var(--color-text-hint)' }}>{r.note}</span>}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(r)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(r.id!)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* 编辑弹窗 */}
        {editingId != null && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
            onClick={() => setEditingId(null)}
          >
            <div style={{
              background: 'var(--color-surface)', borderRadius: 16, padding: 20,
              width: '100%', maxWidth: 380,
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>编辑记录</div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>金额</label>
                <input
                  type="number"
                  value={editForm.amount || ''}
                  onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 16,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)', marginTop: 4,
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>分类</label>
                <select
                  value={editForm.category || ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)', marginTop: 4,
                  }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>日期</label>
                <input
                  type="date"
                  value={editForm.date || ''}
                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)', marginTop: 4,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>备注</label>
                <input
                  type="text"
                  value={editForm.note || ''}
                  onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)', marginTop: 4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setEditingId(null)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 15,
                    background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 15,
                    background: 'var(--color-primary)', color: '#fff',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
