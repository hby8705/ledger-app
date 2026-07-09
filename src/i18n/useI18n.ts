import { useLedgerStore } from '../store/useLedgerStore';
import { translate, type Lang } from './translations';

export function useI18n() {
  const lang: Lang = useLedgerStore(s => s.preferences?.language || 'zh-CN');

  function t(text: string): string {
    return translate(text, lang);
  }

  function tl(texts: Record<Lang, string>): string {
    return texts[lang] || texts['zh-CN'];
  }

  return { lang, t, tl };
}
