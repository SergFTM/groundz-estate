// Lightweight, dependency-free i18n foundation (RU + EN).
// Locale resolved server-side from the `locale` cookie (see +layout.server.ts),
// switched client-side via setLocale() in $lib/stores/locale.
// NOTE: currently covers shared chrome (nav/footer/common). Page-level string
// extraction is the remaining R6 work — add keys here and use t() in components.

export type Locale = 'en' | 'ru';
export const LOCALES: Locale[] = ['en', 'ru'];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'ru';
}

type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.knowledge': 'Knowledge Base',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.pools': 'Investment Pools',
  'nav.pricing': 'Membership & Pricing',
  'nav.howItWorks': 'How It Works',
  'nav.protections': 'Investor Protections',
  'nav.apply': 'Apply as Investor',
  'nav.invest': 'Invest',
  'nav.cabinet': 'Cabinet',
  'nav.login': 'Login',
  'common.browsePools': 'Browse pools',
};

const ru: Dict = {
  'nav.home': 'Главная',
  'nav.projects': 'Проекты',
  'nav.knowledge': 'База знаний',
  'nav.about': 'О нас',
  'nav.contact': 'Контакты',
  'nav.pools': 'Инвест-пулы',
  'nav.pricing': 'Участие и тарифы',
  'nav.howItWorks': 'Как это работает',
  'nav.protections': 'Защита инвестора',
  'nav.apply': 'Подать заявку',
  'nav.invest': 'Инвестировать',
  'nav.cabinet': 'Кабинет',
  'nav.login': 'Войти',
  'common.browsePools': 'Смотреть пулы',
};

const dict: Record<Locale, Dict> = { en, ru };

export function t(locale: Locale, key: string): string {
  return dict[locale]?.[key] ?? dict[DEFAULT_LOCALE][key] ?? key;
}
