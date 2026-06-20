'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'fa';
export const LOCALE_KEY = 'coachg.locale';

type Dict = Record<string, string>;

const en: Dict = {
  // common
  'common.signOut': 'Sign out',
  'common.save': 'Save changes',
  'common.saved': 'Saved',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading…',
  'common.none': 'None yet.',
  'common.search': 'Search',
  'common.back': 'Back',
  'common.theme': 'Theme',
  'common.language': 'Language',
  // nav
  'nav.workspace': 'Workspace',
  'nav.clients': 'Clients',
  'nav.overview': 'Overview',
  'nav.library': 'Exercise Library',
  'nav.settings': 'Settings',
  // landing
  'landing.badge': 'AI-powered coaching platform',
  'landing.title': 'Coaching that’s {h}, scaled by AI.',
  'landing.titleHighlight': 'grounded in science',
  'landing.subtitle':
    'Generate personalized training programs, nutrition plans, recovery protocols, and premium athlete reports — automatically. The training logic is deterministic; AI only personalizes and explains.',
  'landing.getStarted': 'Get started',
  'landing.docs': 'Documentation',
  'landing.login': 'Coach Login',
  'landing.featuresTitle': 'Everything a coaching business needs',
  'landing.featuresSubtitle': 'Deterministic engines do the work. AI makes it personal. You sell the result.',
  // login
  'login.title': 'Coach{q}G{q} Login',
  'login.welcome': 'Welcome back',
  'login.subtitle': 'Sign in to your coach workspace.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.signIn': 'Sign in',
  'login.demo': 'Demo',
  'login.backHome': 'Back to home',
  'login.panelTitle': 'Generate a complete coaching program in seconds.',
  // dashboard
  'dash.workspace': 'Coach workspace',
  'dash.clients': 'Clients',
  'dash.clientsSubtitle': 'Manage athletes and generate their plans.',
  'dash.addClient': 'Add client',
  'dash.totalClients': 'Total clients',
  'dash.addedThisWeek': 'Added this week',
  'dash.activePrograms': 'Active programs',
  'dash.allClients': 'All clients',
  'dash.noClients': 'No clients yet',
  // overview
  'overview.title': 'Overview',
  'overview.subtitle': 'Your roster and generated plans at a glance.',
  'overview.clientGrowth': 'Client growth',
  // library
  'library.title': 'Exercise Library',
  'library.subtitle': 'The deterministic catalog the program engine selects from. AI never invents exercises.',
  // settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Your business profile and report branding.',
  // client portal
  'client.welcome': 'Welcome back',
  'client.yourPlan': 'Your plan',
  'client.subtitle': 'Your training, nutrition, recovery, and progress in one place.',
  'client.program': 'Program',
  'client.dailyCalories': 'Daily calories',
  'client.recovery': 'Recovery',
  'client.trainingProgram': 'Training program',
  'client.progress': 'Progress',
  'tabs.messages': 'Messages',
  'tabs.bloodwork': 'Bloodwork',
  'tabs.documents': 'Documents',
  'tabs.notes': 'Notes',
  // admin
  'admin.platform': 'Platform',
  'admin.title': 'Admin overview',
  'admin.subtitle': 'System-wide metrics and coach management.',
  'admin.coaches': 'Coaches',
  'admin.clients': 'Clients',
  'admin.programs': 'Programs',
  'admin.activeUsers': 'Active users',
};

const fa: Dict = {
  'common.signOut': 'خروج',
  'common.save': 'ذخیره تغییرات',
  'common.saved': 'ذخیره شد',
  'common.cancel': 'انصراف',
  'common.loading': 'در حال بارگذاری…',
  'common.none': 'هنوز موردی نیست.',
  'common.search': 'جستجو',
  'common.back': 'بازگشت',
  'common.theme': 'پوسته',
  'common.language': 'زبان',
  'nav.workspace': 'فضای کاری',
  'nav.clients': 'مراجعان',
  'nav.overview': 'نمای کلی',
  'nav.library': 'کتابخانه تمرین',
  'nav.settings': 'تنظیمات',
  'landing.badge': 'پلتفرم مربیگری مبتنی بر هوش مصنوعی',
  'landing.title': 'مربیگری {h}، مقیاس‌پذیر با هوش مصنوعی.',
  'landing.titleHighlight': 'مبتنی بر علم',
  'landing.subtitle':
    'برنامه‌های تمرینی شخصی‌سازی‌شده، برنامه‌های تغذیه، پروتکل‌های ریکاوری و گزارش‌های حرفه‌ای ورزشکار را به‌صورت خودکار تولید کنید. منطق تمرین قطعی است؛ هوش مصنوعی فقط شخصی‌سازی و توضیح می‌دهد.',
  'landing.getStarted': 'شروع کنید',
  'landing.docs': 'مستندات',
  'landing.login': 'ورود مربی',
  'landing.featuresTitle': 'هر آنچه یک کسب‌وکار مربیگری نیاز دارد',
  'landing.featuresSubtitle': 'موتورهای قطعی کار را انجام می‌دهند. هوش مصنوعی آن را شخصی می‌کند. شما نتیجه را می‌فروشید.',
  'login.title': 'ورود به کوچ‌جی',
  'login.welcome': 'خوش آمدید',
  'login.subtitle': 'به فضای کاری مربی خود وارد شوید.',
  'login.email': 'ایمیل',
  'login.password': 'رمز عبور',
  'login.signIn': 'ورود',
  'login.demo': 'نمونه',
  'login.backHome': 'بازگشت به خانه',
  'login.panelTitle': 'یک برنامه مربیگری کامل را در چند ثانیه بسازید.',
  'dash.workspace': 'فضای کاری مربی',
  'dash.clients': 'مراجعان',
  'dash.clientsSubtitle': 'ورزشکاران را مدیریت کنید و برنامه‌هایشان را بسازید.',
  'dash.addClient': 'افزودن مراجع',
  'dash.totalClients': 'کل مراجعان',
  'dash.addedThisWeek': 'افزوده‌شده این هفته',
  'dash.activePrograms': 'برنامه‌های فعال',
  'dash.allClients': 'همه مراجعان',
  'dash.noClients': 'هنوز مراجعی نیست',
  'overview.title': 'نمای کلی',
  'overview.subtitle': 'فهرست مراجعان و برنامه‌های تولیدشده در یک نگاه.',
  'overview.clientGrowth': 'رشد مراجعان',
  'library.title': 'کتابخانه تمرین',
  'library.subtitle': 'کاتالوگ قطعی که موتور برنامه از آن انتخاب می‌کند. هوش مصنوعی هرگز تمرین نمی‌سازد.',
  'settings.title': 'تنظیمات',
  'settings.subtitle': 'پروفایل کسب‌وکار و برندینگ گزارش شما.',
  'client.welcome': 'خوش آمدید',
  'client.yourPlan': 'برنامه شما',
  'client.subtitle': 'تمرین، تغذیه، ریکاوری و پیشرفت شما در یک جا.',
  'client.program': 'برنامه',
  'client.dailyCalories': 'کالری روزانه',
  'client.recovery': 'ریکاوری',
  'client.trainingProgram': 'برنامه تمرینی',
  'client.progress': 'پیشرفت',
  'tabs.messages': 'پیام‌ها',
  'tabs.bloodwork': 'آزمایش خون',
  'tabs.documents': 'اسناد',
  'tabs.notes': 'یادداشت‌ها',
  'admin.platform': 'پلتفرم',
  'admin.title': 'نمای کلی مدیر',
  'admin.subtitle': 'معیارهای کل سیستم و مدیریت مربیان.',
  'admin.coaches': 'مربیان',
  'admin.clients': 'مراجعان',
  'admin.programs': 'برنامه‌ها',
  'admin.activeUsers': 'کاربران فعال',
};

const DICTS: Record<Locale, Dict> = { en, fa };

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nState | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem(LOCALE_KEY)) as Locale | null;
    if (stored === 'en' || stored === 'fa') setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = (l: Locale) => {
    window.localStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  };

  const t = (key: string, vars?: Record<string, string>) => {
    let str = DICTS[locale][key] ?? DICTS.en[key] ?? key;
    // Built-in placeholder for the literal quote used in the brand name.
    str = str.replace(/\{q\}/g, '"');
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    return str;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: locale === 'fa' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within LanguageProvider');
  return ctx;
}
