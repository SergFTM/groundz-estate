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
  'pricing.title': 'Membership tiers',
  'pricing.subtitle': 'Choose the access level that matches your investment ambition. Tokenized pools, transparent terms.',
  'pricing.empty': 'Membership tiers are being finalized.',
  'pricing.popular': 'Most popular',
  'pricing.ticket': 'Ticket',
  'pricing.cta': 'Get started',
  'home.heroTag': 'Premium Real Estate — Limassol, Cyprus',
  'home.heroHeading': 'Transparency in every brick we lay.',
  'home.heroSubtitle': 'A digital platform for mindful real estate investment. From first inquiry to key handover — we guide every step.',
  'home.ctaProjects': 'View Projects',
  'home.ctaRoi': 'Calculate ROI',
  'home.statYield': 'Avg. Annual Yield',
  'home.statProjects': 'Completed Projects',
  'home.statClients': 'Clients Served',
  'home.statThreshold': 'PR Investment Threshold',
  'pools.title': 'Investment Opportunities',
  'pools.heroTitlePre': 'Access Curated',
  'pools.heroTitleEm': 'Development Pools',
  'pools.heroSub': 'Structured yields, milestone tracking, and transparent governance — co-invest in premium developments across Cyprus and beyond.',
  'pools.ctaExplore': 'Explore Pools',
  'pools.ctaTeam': 'Talk to Our Team',
  'pools.trustAum': 'Total AUM',
  'pools.trustRaised': 'Capital Raised',
  'pools.trustInvestors': 'Active Investors',
  'pools.trustIrr': 'Avg. Target IRR',
  'pools.trustTerm': 'Avg. Term',
  'pools.trustTicket': 'Min. Ticket',
  'pools.all': 'All',
  'pools.filterCountry': 'Country:',
  'pools.compare': '⇄ Compare pools side-by-side',
  'pools.empty': 'No pools match the selected filters.',
  'pools.reset': 'Reset filters',
  'pools.metricIrr': 'Target IRR',
  'pools.metricPref': 'Pref. Return',
  'pools.metricTerm': 'Term',
  'pools.metricTicket': 'Min. Ticket',
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
  'pricing.title': 'Уровни участия',
  'pricing.subtitle': 'Выберите уровень доступа под ваши инвест-амбиции. Токенизированные пулы, прозрачные условия.',
  'pricing.empty': 'Тарифы в процессе финализации.',
  'pricing.popular': 'Популярный',
  'pricing.ticket': 'Тикет',
  'pricing.cta': 'Начать',
  'home.heroTag': 'Премиальная недвижимость — Лимассол, Кипр',
  'home.heroHeading': 'Прозрачность в каждом кирпиче.',
  'home.heroSubtitle': 'Цифровая платформа для осознанных инвестиций в недвижимость. От первой заявки до передачи ключей — сопровождаем на каждом шаге.',
  'home.ctaProjects': 'Смотреть проекты',
  'home.ctaRoi': 'Рассчитать доходность',
  'home.statYield': 'Средняя годовая доходность',
  'home.statProjects': 'Завершённых проектов',
  'home.statClients': 'Клиентов обслужено',
  'home.statThreshold': 'Порог для ВНЖ',
  'pools.title': 'Инвест-возможности',
  'pools.heroTitlePre': 'Доступ к отобранным',
  'pools.heroTitleEm': 'девелопмент-пулам',
  'pools.heroSub': 'Структурированная доходность, контроль этапов и прозрачное управление — со-инвестируйте в премиальные проекты на Кипре и за его пределами.',
  'pools.ctaExplore': 'Смотреть пулы',
  'pools.ctaTeam': 'Связаться с командой',
  'pools.trustAum': 'Активы под управлением',
  'pools.trustRaised': 'Привлечено капитала',
  'pools.trustInvestors': 'Активных инвесторов',
  'pools.trustIrr': 'Средний целевой IRR',
  'pools.trustTerm': 'Средний срок',
  'pools.trustTicket': 'Мин. тикет',
  'pools.all': 'Все',
  'pools.filterCountry': 'Страна:',
  'pools.compare': '⇄ Сравнить пулы',
  'pools.empty': 'Нет пулов по выбранным фильтрам.',
  'pools.reset': 'Сбросить фильтры',
  'pools.metricIrr': 'Целевой IRR',
  'pools.metricPref': 'Преф. доходность',
  'pools.metricTerm': 'Срок',
  'pools.metricTicket': 'Мин. тикет',
};

const dict: Record<Locale, Dict> = { en, ru };

export function t(locale: Locale, key: string): string {
  return dict[locale]?.[key] ?? dict[DEFAULT_LOCALE][key] ?? key;
}
