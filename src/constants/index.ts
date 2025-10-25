// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// App Configuration
export const APP_NAME = 'NextCandle';
export const APP_DESCRIPTION = 'AI-Powered Financial Analysis Platform';
export const APP_VERSION = '1.0.0';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ANALYSIS: '/analysis',
  PORTFOLIO: '/portfolio',
  NEWS: '/news',
  SETTINGS: '/settings',
} as const;

// Stock Market Configuration
export const MARKET_HOURS = {
  OPEN: '09:30',
  CLOSE: '16:00',
  TIMEZONE: 'America/New_York',
} as const;

export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Discretionary',
  'Consumer Staples',
  'Energy',
  'Industrials',
  'Materials',
  'Real Estate',
  'Utilities',
  'Communication Services',
] as const;

// Chart Configuration
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  NEUTRAL: '#6b7280',
} as const;

export const CHART_PERIODS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'all' },
] as const;

// Sentiment Configuration
export const SENTIMENT_LABELS = {
  BULLISH: 'Bullish',
  BEARISH: 'Bearish',
  NEUTRAL: 'Neutral',
} as const;

export const SENTIMENT_COLORS = {
  BULLISH: '#10b981',
  BEARISH: '#ef4444',
  NEUTRAL: '#6b7280',
} as const;

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'nextcandle_user',
  THEME: 'nextcandle_theme',
  SIDEBAR_STATE: 'nextcandle_sidebar',
  FILTERS: 'nextcandle_filters',
} as const;

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;
