'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Globe, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { finnhubAPI, FinnhubNews, FinnhubQuote } from '@/lib/finnhub';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedSymbols: string[];
  image?: string;
}

export default function NewsPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load real data from Finnhub API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load market data for major stocks
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
        const quotes = await finnhubAPI.getMultipleQuotes(symbols);
        
        // Get company profiles for additional data
        const marketDataPromises = symbols.map(async (symbol) => {
          try {
            const quote = quotes[symbol];
            const profile = await finnhubAPI.getCompanyProfile(symbol);
            
            if (quote && profile) {
              return {
                symbol,
                name: profile.name,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                volume: 0, // Volume not available in basic quote
                marketCap: profile.marketCapitalization || 0
              };
            }
            return null;
          } catch (error) {
            console.error(`Error loading data for ${symbol}:`, error);
            return null;
          }
        });

        const marketResults = await Promise.all(marketDataPromises);
        const validMarketData = marketResults.filter((data): data is MarketData => data !== null);
        setMarketData(validMarketData);

        // Load general financial news
        const news = await finnhubAPI.getGeneralNews('general');
        const formattedNews: NewsArticle[] = news.slice(0, 10).map((article: FinnhubNews) => ({
          id: article.id.toString(),
          title: article.headline,
          summary: article.summary,
          source: article.source,
          publishedAt: new Date(article.datetime * 1000).toISOString(),
          url: article.url,
          sentiment: 'neutral', // Finnhub doesn't provide sentiment, defaulting to neutral
          relatedSymbols: article.related ? article.related.split(',').map(s => s.trim()) : [],
          image: article.image
        }));

        setNewsArticles(formattedNews);
        setLastUpdated(new Date());
      } catch (error) {
        setError('Failed to load market data and news');
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        setIsRefreshing(true);
        // Reload data
        const loadData = async () => {
          try {
            const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
            const quotes = await finnhubAPI.getMultipleQuotes(symbols);
            
            const marketDataPromises = symbols.map(async (symbol) => {
              try {
                const quote = quotes[symbol];
                const profile = await finnhubAPI.getCompanyProfile(symbol);
                
                if (quote && profile) {
                  return {
                    symbol,
                    name: profile.name,
                    price: quote.c,
                    change: quote.d,
                    changePercent: quote.dp,
                    volume: 0,
                    marketCap: profile.marketCapitalization || 0
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error loading data for ${symbol}:`, error);
                return null;
              }
            });

            const marketResults = await Promise.all(marketDataPromises);
            const validMarketData = marketResults.filter((data): data is MarketData => data !== null);
            setMarketData(validMarketData);
            setLastUpdated(new Date());
          } catch (error) {
            console.error('Error refreshing data:', error);
          } finally {
            setIsRefreshing(false);
          }
        };

        loadData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoading, isRefreshing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
      const quotes = await finnhubAPI.getMultipleQuotes(symbols);
      
      const marketDataPromises = symbols.map(async (symbol) => {
        try {
          const quote = quotes[symbol];
          const profile = await finnhubAPI.getCompanyProfile(symbol);
          
          if (quote && profile) {
            return {
              symbol,
              name: profile.name,
              price: quote.c,
              change: quote.d,
              changePercent: quote.dp,
              volume: 0,
              marketCap: profile.marketCapitalization || 0
            };
          }
          return null;
        } catch (error) {
          console.error(`Error loading data for ${symbol}:`, error);
          return null;
        }
      });

      const marketResults = await Promise.all(marketDataPromises);
      const validMarketData = marketResults.filter((data): data is MarketData => data !== null);
      setMarketData(validMarketData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    }
    return `$${marketCap}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'negative':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInMinutes = Math.floor((now.getTime() - published.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading market data and news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex h-screen">
        {/* Left Sidebar - News */}
        <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* News Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Financial News
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Latest market updates and analysis
            </p>
          </div>

          {/* News List */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {newsArticles.map((article) => (
                  <Card
                    key={article.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getSentimentBg(article.sentiment)}`}
                    onClick={() => window.open(article.url, '_blank')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {article.source}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
                            {article.sentiment}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(article.publishedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Live Market */}
        <div className="flex-1 p-6 min-h-0">
          <div className="h-full flex flex-col">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-6 w-6 text-blue-600" />
                      Live Market Data
                    </CardTitle>
                    <CardDescription>
                      Real-time stock prices and market movements
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {lastUpdated && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {formatTimeAgo(lastUpdated.toISOString())}
                      </span>
                    )}
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto min-h-0">
                {error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    {marketData.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {stock.symbol}
                              </h3>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {stock.name}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${formatPrice(stock.price)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`flex items-center gap-1 text-lg font-semibold ${
                              stock.change >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {stock.change >= 0 ? (
                                <TrendingUp className="h-5 w-5" />
                              ) : (
                                <TrendingDown className="h-5 w-5" />
                              )}
                              {formatChange(stock.change)}
                            </div>
                            <div className={`text-sm ${
                              stock.change >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatChangePercent(stock.changePercent)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Volume</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatVolume(stock.volume)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Market Cap</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatMarketCap(stock.marketCap)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
