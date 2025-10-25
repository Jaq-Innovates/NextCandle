import { API_BASE_URL } from '@/constants';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Stock endpoints
  async getStock(symbol: string) {
    return this.request(`/stocks/${symbol}`);
  }

  async getStockHistory(symbol: string, period: string) {
    return this.request(`/stocks/${symbol}/history?period=${period}`);
  }

  async searchStocks(query: string, limit = 20) {
    return this.request(`/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getStockSuggestions(query: string) {
    return this.request(`/stocks/suggestions?q=${encodeURIComponent(query)}`);
  }


  // Analysis endpoints
  async getAnalysis(symbol: string) {
    return this.request(`/analysis/${symbol}`);
  }

  async createAnalysis(symbol: string, timeFrame: string) {
    return this.request(`/analysis`, {
      method: 'POST',
      body: JSON.stringify({ symbol, timeFrame }),
    });
  }

  async getAnalysisHistory(userId: string) {
    return this.request(`/analysis/history/${userId}`);
  }

  async getAnalysisResult(analysisId: string) {
    return this.request(`/analysis/result/${analysisId}`);
  }

  // News endpoints
  async getNews(symbol?: string, limit = 20) {
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    params.append('limit', limit.toString());
    
    return this.request(`/news?${params.toString()}`);
  }

  async getNewsSentiment(articleId: string) {
    return this.request(`/news/${articleId}/sentiment`);
  }

  // User endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Comprehensive Analysis Methods
  async createComprehensiveAnalysis(symbol: string, startDate: string, endDate: string) {
    return this.request('/analysis/comprehensive', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        startDate,
        endDate
      }),
    });
  }

  async getComprehensiveAnalysis(analysisId: string) {
    return this.request(`/analysis/comprehensive/${analysisId}`);
  }

  async getMonitoringAlerts() {
    return this.request('/analysis/monitoring/alerts');
  }

  async updateMonitoringSettings(analysisId: string, settings: any) {
    return this.request(`/analysis/monitoring/${analysisId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
