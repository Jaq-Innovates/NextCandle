const FINNHUB_API_KEY = 'd3u7t89r01qvr0dlsiegd3u7t89r01qvr0dlsif0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // timestamp
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubCompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

class FinnhubAPI {
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
    url.searchParams.append('token', FINNHUB_API_KEY);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get real-time quote
  async getQuote(symbol: string): Promise<FinnhubQuote> {
    return this.request<FinnhubQuote>(`/quote`, { symbol });
  }

  // Get company profile
  async getCompanyProfile(symbol: string): Promise<FinnhubCompanyProfile> {
    return this.request<FinnhubCompanyProfile>(`/stock/profile2`, { symbol });
  }

  // Get company news
  async getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubNews[]> {
    return this.request<FinnhubNews[]>(`/company-news`, { 
      symbol, 
      from, 
      to 
    });
  }

  // Get general market news
  async getGeneralNews(category: string = 'general'): Promise<FinnhubNews[]> {
    return this.request<FinnhubNews[]>(`/news`, { category });
  }

  // Get crypto news
  async getCryptoNews(): Promise<FinnhubNews[]> {
    return this.request<FinnhubNews[]>(`/news`, { category: 'crypto' });
  }

  // Get forex news
  async getForexNews(): Promise<FinnhubNews[]> {
    return this.request<FinnhubNews[]>(`/news`, { category: 'forex' });
  }

  // Get merger and acquisition news
  async getMergerNews(): Promise<FinnhubNews[]> {
    return this.request<FinnhubNews[]>(`/news`, { category: 'merger' });
  }

  // Get multiple quotes at once
  async getMultipleQuotes(symbols: string[]): Promise<Record<string, FinnhubQuote>> {
    const promises = symbols.map(async (symbol) => {
      try {
        const quote = await this.getQuote(symbol);
        return { symbol, quote };
      } catch (error) {
        console.error(`Failed to get quote for ${symbol}:`, error);
        return { symbol, quote: null };
      }
    });

    const results = await Promise.all(promises);
    const quotes: Record<string, FinnhubQuote> = {};
    
    results.forEach(({ symbol, quote }) => {
      if (quote) {
        quotes[symbol] = quote;
      }
    });

    return quotes;
  }

  // Get market status
  async getMarketStatus(): Promise<{ isOpen: boolean; session: string }> {
    try {
      // This is a mock implementation since Finnhub doesn't have a direct market status endpoint
      // In a real implementation, you'd check against market hours
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      
      // Simple market hours check (9:30 AM - 4:00 PM ET, Monday-Friday)
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = hour >= 9 && hour < 16;
      
      return {
        isOpen: isWeekday && isMarketHours,
        session: isWeekday && isMarketHours ? 'regular' : 'closed'
      };
    } catch (error) {
      console.error('Error checking market status:', error);
      return { isOpen: false, session: 'unknown' };
    }
  }
}

export const finnhubAPI = new FinnhubAPI();
