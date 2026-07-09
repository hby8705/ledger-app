import { useState, useEffect } from 'react';
import { useLedgerStore } from './store/useLedgerStore';
import { useI18n } from './i18n/useI18n';
import AddRecord from './components/AddRecord';
import MonthlyStats from './components/MonthlyStats';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';

type Tab = 'add' | 'stats' | 'history' | 'settings';

export default function App() {
  const { initialized, init } = useLedgerStore();
  const [tab, setTab] = useState<Tab>('add');
  const { t } = useI18n();

  useEffect(() => { init(); }, [init]);

  if (!initialized) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#9aa0a6', fontSize: 16,
      }}>
        {t('加载中...')}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 页面内容 */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {tab === 'add' && <AddRecord onTabChange={setTab} />}
        {tab === 'stats' && <MonthlyStats />}
        {tab === 'history' && <HistoryList />}
        {tab === 'settings' && <Settings />}
      </div>

      {/* 底部导航栏 */}
      <div className="nav-bar">
        <div className={`nav-item ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          {t('记账')}
        </div>
        <div className={`nav-item ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          {t('统计')}
        </div>
        <div className={`nav-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          {t('历史')}
        </div>
        <div className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          {t('设置')}
        </div>
      </div>
    </div>
  );
}
