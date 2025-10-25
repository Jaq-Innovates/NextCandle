// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stock types
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  industry: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  timestamp: Date;
  volume: number;
}

export interface StockHistoricalData {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Portfolio types
export interface Holding {
  id: string;
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  holdings: Holding[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analysis types
export interface AnalysisResult {
  id: string;
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  recommendation: 'buy' | 'sell' | 'hold';
  reasoning: string;
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// News types
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  source: string;
  publishedAt: Date;
  symbols: string[];
  url: string;
}

// Chart types
export interface ChartData {
  date: string;
  price: number;
  volume?: number;
}

export interface PerformanceData {
  period: string;
  return: number;
  benchmark: number;
  alpha: number;
  beta: number;
  sharpe: number;
  maxDrawdown: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface StockSearchForm {
  symbol: string;
}

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
  };
  sectors: string[];
  priceRange: {
    min: number;
    max: number;
  };
  sentiment: string[];
}
