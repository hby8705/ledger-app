import { useState, useEffect } from 'react';
import { useLedgerStore } from '../store/useLedgerStore';
import type { CreditCard, Category, Currency } from '../store/types';
import { calcCardStats } from '../utils/creditCardCalc';

type SettingsTab = 'category' | 'currency' | 'creditcard';

export default function Settings() {
  const store = useLedgerStore();
  const {
    categories, creditCards, currencies, records,
    addCategory, updateCategory, deleteCategory, addCurrency, deleteCurrency,
    addCreditCard, updateCreditCard, deleteCreditCard,
    confirmRepayment, loadCreditCards, loadRecords,
  } = store;

  const [tab, setTab] = useState<SettingsTab>('category');

  // 类别管理
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // 币种管理
  const [newCurCode, setNewCurCode] = useState('');
  const [newCurSymbol, setNewCurSymbol] = useState('');
  const [newCurName, setNewCurName] = useState('');

  // 信用卡编辑
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [cardForm, setCardForm] = useState<Partial<CreditCard>>({});
  const [showCardForm, setShowCardForm] = useState(false);

  // 信用卡还款状态
  const [showRepayConfirm, setShowRepayConfirm] = useState<number | null>(null);

  useEffect(() => { loadCreditCards(); loadRecords(); }, [loadCreditCards, loadRecords]);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), type: 'expense' });
    setNewCatName('');
  };

  const handleAddCurrency = async () => {
    if (!newCurCode.trim() || !newCurSymbol.trim() || !newCurName.trim()) return;
    await addCurrency({
      code: newCurCode.trim().toUpperCase(),
      symbol: newCurSymbol.trim(),
      name: newCurName.trim(),
    });
    setNewCurCode('');
    setNewCurSymbol('');
    setNewCurName('');
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardForm({ ...card });
    setShowCardForm(true);
  };

  const handleSaveCard = async () => {
    if (!cardForm.name) return;
    if (editingCard?.id) {
      await updateCreditCard(editingCard.id, cardForm);
    } else {
      await addCreditCard(cardForm as Omit<CreditCard, 'id'>);
    }
    setShowCardForm(false);
    setEditingCard(null);
    setCardForm({});
  };

  const handleRepay = async (cardId: number) => {
    await confirmRepayment(cardId);
    setShowRepayConfirm(null);
  };

  // 获取信用卡即时统计
  const now = new Date();
  const [currentYear] = useState(now.getFullYear());
  const [currentMonth] = useState(now.getMonth() + 1);

  return (
    <div className="page">
      <div style={{
        padding: '12px 16px', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-lg)', fontWeight: 600,
      }}>
        设置
      </div>

      {/* 子Tab */}
      <div style={{
        display: 'flex', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {([
          ['category', '类别管理'],
          ['currency', '币种管理'],
          ['creditcard', '信用卡'],
        ] as [SettingsTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '12px 0', textAlign: 'center', fontSize: 14,
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scroll-container" style={{ padding: '12px 16px', paddingBottom: 'calc(var(--safe-area-bottom) + 80px)' }}>
        {/* ========== 类别管理 ========== */}
        {tab === 'category' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="新类别名称"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                }}
              />
              <button
                onClick={handleAddCategory}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff', whiteSpace: 'nowrap',
                }}
              >
                新增
              </button>
            </div>

            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  background: 'var(--color-surface)', borderRadius: 10, padding: '12px 14px',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {editingCatId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      autoFocus
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && editCatName.trim()) {
                          await updateCategory(cat.id!, { name: editCatName.trim() });
                          setEditingCatId(null);
                        }
                      }}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-primary)',
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (editCatName.trim()) {
                          await updateCategory(cat.id!, { name: editCatName.trim() });
                          setEditingCatId(null);
                        }
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-success)', color: '#fff', whiteSpace: 'nowrap',
                      }}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingCatId(null)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                      }}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{cat.name}</span>
                    <button
                      onClick={() => { setEditingCatId(cat.id!); setEditCatName(cat.name); }}
                      style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`确定删除分类「${cat.name}」？`)) {
                          deleteCategory(cat.id!);
                        }
                      }}
                      style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 12,
                        background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                      }}
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ========== 币种管理 ========== */}
        {tab === 'currency' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="代码 (如 USD)"
                value={newCurCode}
                onChange={e => setNewCurCode(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  marginBottom: 4,
                }}
              />
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <input
                  type="text"
                  placeholder="符号 (如 $)"
                  value={newCurSymbol}
                  onChange={e => setNewCurSymbol(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  }}
                />
                <input
                  type="text"
                  placeholder="名称 (如 美元)"
                  value={newCurName}
                  onChange={e => setNewCurName(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  }}
                />
              </div>
              <button
                onClick={handleAddCurrency}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff',
                }}
              >
                新增币种
              </button>
            </div>

            {currencies.map(cur => (
              <div
                key={cur.id}
                style={{
                  background: 'var(--color-surface)', borderRadius: 10, padding: '12px 14px',
                  marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{cur.symbol} {cur.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-hint)', marginLeft: 8 }}>({cur.code})</span>
                </div>
                {cur.isPreset ? (
                  <span style={{ fontSize: 11, color: 'var(--color-text-hint)' }}>预设</span>
                ) : (
                  <button
                    onClick={() => deleteCurrency(cur.id!)}
                    style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: 12,
                      background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                    }}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* ========== 信用卡管理 ========== */}
        {tab === 'creditcard' && (
          <>
            <button
              onClick={() => {
                setEditingCard(null);
                setCardForm({ name: '', currency: currencies[0]?.code || 'CNY', totalLimit: 0, beginningUsed: 0, statementDate: 1, currentPeriodPaid: false });
                setShowCardForm(true);
              }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 600,
                background: 'var(--color-primary)', color: '#fff', marginBottom: 16,
              }}
            >
              + 新增信用卡
            </button>

            {creditCards.map(card => (
              <div
                key={card.id}
                style={{
                  background: 'var(--color-surface)', borderRadius: 12, padding: 14,
                  marginBottom: 10, boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{card.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-hint)' }}>
                    {currencies.find(c => c.code === card.currency)?.symbol} {card.currency}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                  <div>总额度: {card.totalLimit.toLocaleString()}</div>
                  <div>期初已用: {card.beginningUsed.toLocaleString()}</div>
                  <div>账单结算日: 每月{card.statementDate}日</div>
                  <div>剩余额度: {(card.totalLimit - card.beginningUsed).toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => handleEditCard(card)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13,
                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                    }}
                  >
                    编辑
                  </button>
                  {!['HSBC', 'HN', '招商银行'].includes(card.name) && (
                    <button
                      onClick={() => deleteCreditCard(card.id!)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13,
                        background: 'var(--color-danger-light)', color: 'var(--color-danger)',
                      }}
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={() => setShowRepayConfirm(card.id!)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13,
                      background: 'var(--color-warning)', color: '#fff',
                    }}
                  >
                    确认已还款
                  </button>
                </div>

                {/* 还款确认 */}
                {showRepayConfirm === card.id && (
                  <div style={{
                    marginTop: 10, padding: 10, background: '#fff3cd',
                    borderRadius: 8, fontSize: 13,
                  }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>
                      确认已还清 {card.name} 本期账单？
                      <br />本期消费将清零，下期消费转入新本期。
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setShowRepayConfirm(null)}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 13,
                          background: 'var(--color-bg)',
                        }}
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleRepay(card.id!)}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 13,
                          background: 'var(--color-success)', color: '#fff',
                        }}
                      >
                        确认还款
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 信用卡编辑弹窗 */}
            {showCardForm && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }} onClick={() => setShowCardForm(false)}>
                <div style={{
                  background: 'var(--color-surface)', borderRadius: 16, padding: 20,
                  width: '100%', maxWidth: 380,
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                    {editingCard ? '编辑信用卡' : '新增信用卡'}
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>卡名称</label>
                    <input
                      type="text"
                      value={cardForm.name || ''}
                      onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        marginTop: 4,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>币种</label>
                    <select
                      value={cardForm.currency || ''}
                      onChange={e => setCardForm({ ...cardForm, currency: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        marginTop: 4,
                      }}
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>总额度</label>
                    <input
                      type="number"
                      value={cardForm.totalLimit || ''}
                      onChange={e => setCardForm({ ...cardForm, totalLimit: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        marginTop: 4,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>期初已用额度</label>
                    <input
                      type="number"
                      value={cardForm.beginningUsed || ''}
                      onChange={e => setCardForm({ ...cardForm, beginningUsed: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        marginTop: 4,
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>账单结算日 (每月几日)</label>
                    <select
                      value={cardForm.statementDate || 1}
                      onChange={e => setCardForm({ ...cardForm, statementDate: Number(e.target.value) })}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        marginTop: 4,
                      }}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>每月{d}日</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowCardForm(false)}
                      style={{
                        flex: 1, padding: '12px 0', borderRadius: 10, fontSize: 15,
                        background: 'var(--color-bg)', color: 'var(--color-text-secondary)',
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveCard}
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
          </>
        )}
      </div>
    </div>
  );
}
