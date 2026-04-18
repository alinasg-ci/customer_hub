export type TintColor = 'matcha' | 'slushie' | 'lemon' | 'ube' | 'pomegranate';

export type PortfolioClient = {
  readonly id: string;
  readonly name: string;
  readonly handle: string;
  readonly color: TintColor;
  readonly status: 'active';
  readonly tag: 'Retainer' | 'Project' | 'Hour bank';
  readonly mtdIls: number;
  readonly retainerCap: number | null;
  readonly retainerUsed: number | null;
  readonly margin: number;
  readonly score: string;
  readonly activeProjects: number;
  readonly alert: string | null;
  readonly region: string;
};

export type KpiTileData = {
  readonly label: string;
  readonly val: string;
  readonly unit?: string;
  readonly delta: string;
  readonly up?: boolean;
  readonly tint: TintColor;
  readonly spark: readonly number[];
};

export type TodayItem = {
  readonly time: string;
  readonly label: string;
  readonly color: TintColor;
  readonly done: boolean;
};

export type FeedItem = {
  readonly when: string;
  readonly who: string;
  readonly what: string;
  readonly tag: string;
};

export type PortfolioStats = {
  readonly mtdTotal: number;
  readonly retainerHoursUsed: number;
  readonly retainerHoursCap: number;
  readonly retainerPct: number;
  readonly activeCount: number;
  readonly pendingCount: number;
  readonly pausedCount: number;
  readonly projectsCount: number;
  readonly avgMargin: string;
  readonly alertsCount: number;
};

export const PORTFOLIO_CLIENTS: readonly PortfolioClient[] = [
  { id: 'halva', name: 'Halva Studio', handle: 'halva.studio', color: 'matcha', status: 'active', tag: 'Retainer', mtdIls: 22200, retainerCap: 60, retainerUsed: 47.5, margin: 41.8, score: 'A+', activeProjects: 3, alert: null, region: 'TLV' },
  { id: 'kava', name: 'Kava & Co', handle: 'kavaco', color: 'slushie', status: 'active', tag: 'Retainer', mtdIls: 14000, retainerCap: 40, retainerUsed: 38, margin: 38.4, score: 'A', activeProjects: 2, alert: '95% cap', region: 'TLV' },
  { id: 'oro', name: 'Oro Bakery', handle: 'oro.bakery', color: 'lemon', status: 'active', tag: 'Project', mtdIls: 11800, retainerCap: null, retainerUsed: null, margin: 44.1, score: 'A+', activeProjects: 1, alert: null, region: 'JRS' },
  { id: 'north', name: 'Northwind Labs', handle: 'northwind', color: 'ube', status: 'active', tag: 'Hour bank', mtdIls: 9200, retainerCap: 200, retainerUsed: 142, margin: 29.2, score: 'B', activeProjects: 4, alert: 'Margin slipping', region: 'BER' },
  { id: 'figtree', name: 'Fig Tree Press', handle: 'figtree', color: 'pomegranate', status: 'active', tag: 'Retainer', mtdIls: 8000, retainerCap: 30, retainerUsed: 29, margin: 42.0, score: 'A', activeProjects: 1, alert: null, region: 'TLV' },
  { id: 'ember', name: 'Ember Collective', handle: 'ember.co', color: 'matcha', status: 'active', tag: 'Project', mtdIls: 6400, retainerCap: null, retainerUsed: null, margin: 39.8, score: 'A', activeProjects: 1, alert: null, region: 'NYC' },
  { id: 'paloma', name: 'Paloma Hotels', handle: 'paloma', color: 'slushie', status: 'active', tag: 'Retainer', mtdIls: 15500, retainerCap: 50, retainerUsed: 22, margin: 36.2, score: 'B+', activeProjects: 2, alert: null, region: 'MAD' },
  { id: 'mira', name: 'Mira Apparel', handle: 'mira.wear', color: 'pomegranate', status: 'active', tag: 'Retainer', mtdIls: 7500, retainerCap: 25, retainerUsed: 25, margin: 22.5, score: 'C', activeProjects: 2, alert: 'Over retainer', region: 'TLV' },
];

export const PORTFOLIO_STATS: PortfolioStats = {
  mtdTotal: 94600,
  retainerHoursUsed: 303.5,
  retainerHoursCap: 405,
  retainerPct: 75,
  activeCount: 11,
  pendingCount: 1,
  pausedCount: 1,
  projectsCount: 18,
  avgMargin: '36.7',
  alertsCount: 3,
};

export const TODAY_ITEMS: readonly TodayItem[] = [
  { time: '09:00', label: 'Retainer sync · Halva', color: 'matcha', done: true },
  { time: '11:30', label: 'Invoice run · Oro, Kava, Fig Tree', color: 'lemon', done: false },
  { time: '14:00', label: 'Design review · Autumn Campaign', color: 'matcha', done: false },
  { time: '16:30', label: 'Onboarding call · Ember', color: 'slushie', done: false },
];

export const FEED_ITEMS: readonly FeedItem[] = [
  { when: '12m', who: 'You', what: 'Logged 2.5h on Autumn Campaign', tag: 'Halva' },
  { when: '1h', who: 'Toggl', what: 'Synced 6.2h across 3 clients', tag: 'System' },
  { when: '2h', who: 'You', what: 'Marked Concept deck complete', tag: 'Halva' },
  { when: '4h', who: 'Stripe', what: 'Fig Tree invoice paid (₪8,000)', tag: 'Fig Tree' },
];

export const KPI_TILES: readonly KpiTileData[] = [
  { label: 'MTD revenue', val: '₪94.6k', delta: '+12.4% vs. September', up: true, tint: 'matcha', spark: [3, 5, 4, 6, 7, 6, 8, 9] },
  { label: 'Retainer capacity', val: '75', unit: '%', delta: '303/405h · on pace', tint: 'lemon', spark: [4, 4, 5, 6, 7, 7, 8, 9] },
  { label: 'Active clients', val: '11', delta: '1 pending · 1 paused', tint: 'slushie', spark: [6, 6, 7, 7, 8, 8, 9, 9] },
  { label: 'Avg margin', val: '36.7', unit: '%', delta: '−1.2pts vs. September', up: false, tint: 'ube', spark: [8, 7, 7, 6, 6, 5, 5, 5] },
];

export const STICKY_NOTE = {
  body: 'Noa mentioned she wants a mood-board call before we start the packaging photography. Check calendar Fri morning.',
  sig: 'added by you · Apr 15',
};
