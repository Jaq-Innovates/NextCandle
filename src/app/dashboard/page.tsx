'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Star, 
  Plus, 
  Eye, 
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface UserAnalysis {
  id: string;
  symbol: string;
  companyName: string;
  analysisDate: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: 67;
  summary: {
    recommendation?: string;
    confidence?: number;
    explanation?: string;
    keyFactors?: string[];
  };
  keyFactors: string[];
  isFavorite: boolean;
}

interface UserFavorite {
  id: string;
  symbol: string;
  companyName: string;
  addedDate: string;
  analysisCount: number;
  lastAnalyzed?: string;
}

interface DashboardStats {
  totalAnalyses: number;
  favoriteStocks: number;
  averageConfidence: number;
  mostAnalyzedStock: string;
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<UserAnalysis[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    favoriteStocks: 0,
    averageConfidence: 0,
    mostAnalyzedStock: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Temporary mock data (you can remove once backend endpoints for analyses are live)
        //const mockAnalyses: UserAnalysis[] = [/* ... keep your mock analyses here ... */];
        const mockFavorites: UserFavorite[] = [/* ... keep your mock favorites here ... */];
  
        //setAnalyses(mockAnalyses);
        setFavorites(mockFavorites);

        // ✅ Fetch actual recent analyses
        const analysesRes = await fetch("http://localhost:8000/analysis/recent");
        const recentAnalyses = await analysesRes.json();
        setAnalyses(recentAnalyses);
  
        // ✅ Fetch live stats from backend
        const res = await fetch("http://localhost:8000/analysis/stats");
        const statsData = await res.json();
  
        // ✅ Combine live stats with your existing structure
        setStats({
          totalAnalyses: statsData.totalAnalyses || 0,
          favoriteStocks: statsData.favoriteStocks || 0,
          averageConfidence: 84,        // keep mock or compute later
          mostAnalyzedStock: 'AAPL',    // placeholder for now
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadDashboardData();
  }, []);
  

  const handleToggleFavorite = async (analysisId: string, symbol: string) => {
    try {
      // Toggle favorite status
      setAnalyses(prev => prev.map(analysis => 
        analysis.id === analysisId 
          ? { ...analysis, isFavorite: !analysis.isFavorite }
          : analysis
      ));

      // Update favorites list
      const analysis = analyses.find(a => a.id === analysisId);
      if (analysis?.isFavorite) {
        // Remove from favorites
        setFavorites(prev => prev.filter(fav => fav.symbol !== symbol));
      } else {
        // Add to favorites
        /*
        const newFavorite: FavoriteStock = {
          id: Date.now().toString(),
          symbol,
          companyName: analysis?.companyName || '',
          addedDate: new Date().toISOString(),
          analysisCount: 1,
          lastAnalyzed: analysis?.analysisDate
        };
        setFavorites(prev => [...prev, newFavorite]);
        */
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'sell':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your personalized financial analysis hub
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Analyses</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAnalyses}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Favorite Stocks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.favoriteStocks}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/analysis">
                  <Button className="w-full justify-start" size="lg">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Start New Analysis
                  </Button>
                </Link>
                <Link href="/news">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Eye className="h-5 w-5 mr-2" />
                    View Market News
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Recent Analyses
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Favorites
            </button>
          </div>
        </div>

        {/* Recent Analyses */}
        {activeTab === 'recent' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Analyses
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            {analyses.length === 0 ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No analyses yet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Start your first analysis to see your insights here
                  </p>
                  <Link href="/analysis">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <Card key={analysis.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {analysis.symbol}
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {analysis.companyName}
                            </span>
                            <button
                              onClick={() => handleToggleFavorite(analysis.id, analysis.symbol)}
                              className={`p-1 rounded-full transition-colors ${
                                analysis.isFavorite
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-gray-400 hover:text-yellow-500'
                              }`}
                            >
                              <Star className={`h-4 w-4 ${analysis.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {analysis.summary.explanation || "No summary available."}
                          </p>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(analysis.recommendation)}`}>
                              {analysis.recommendation.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {analysis.confidence}% confidence
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(analysis.analysisDate), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {(analysis.keyFactors || []).map((factor, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Favorite Stocks
              </h2>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            {favorites.length === 0 ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Mark stocks as favorites to quickly access them here
                  </p>
                  <Link href="/analysis">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {favorite.symbol}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {favorite.companyName}
                          </p>
                        </div>
                        <button className="text-yellow-500 hover:text-yellow-600">
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Analyses</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {favorite.analysisCount}
                          </span>
                        </div>
                        {favorite.lastAnalyzed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Last analyzed</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDistanceToNow(new Date(favorite.lastAnalyzed), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href="/analysis" className="flex-1">
                          <Button className="w-full" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Analyze
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
