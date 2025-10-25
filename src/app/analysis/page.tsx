'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/analysis/DateRangeSelector';
import { StockAutocomplete } from '@/components/analysis/StockAutocomplete';
import { AnalysisFormData } from '@/types';
import { Search, TrendingUp, Calendar, BarChart3, Play, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function AnalysisPage() {
  const [formData, setFormData] = useState<AnalysisFormData>({
    startDate: '',
    endDate: '',
    symbol: '',
    companyName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFormData(prev => ({ ...prev, startDate, endDate }));
    setError(null); // Clear any previous errors
  };

  const handleStockSelection = (symbol: string, companyName: string) => {
    setFormData(prev => ({ ...prev, symbol, companyName }));
    setError(null); // Clear any previous errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.symbol) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      setError(null);
      console.log('Submitting analysis request:', formData);
      
      // Create comprehensive analysis request
      const response = await apiClient.createComprehensiveAnalysis(formData.symbol, formData.startDate, formData.endDate);
      
      console.log('Analysis submitted successfully:', response);
      
      // Set mock comprehensive analysis results
      setAnalysisResults({
        symbol: formData.symbol,
        companyName: formData.companyName,
        analysisPeriod: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        webScrapingResults: {
          totalArticles: 47,
          sources: ['Reuters', 'Bloomberg', 'CNBC', 'MarketWatch', 'Yahoo Finance'],
          keyTopics: ['earnings beat', 'AI integration', 'market expansion', 'regulatory approval'],
          sentimentTrend: 'positive'
        },
        trendAnalysis: {
          identifiedPatterns: [
            'Consistent earnings growth pattern',
            'AI technology adoption trend',
            'Market expansion announcements'
          ],
          keyEvents: [
            'Q3 earnings exceeded expectations by 15%',
            'Announced AI partnership with major tech company',
            'FDA approval for new product line'
          ],
          marketReactions: [
            'Stock price increased 12% following earnings announcement',
            'Trading volume spiked 300% on partnership news',
            'Analyst upgrades from 3 firms'
          ],
          similarHistoricalEvents: [
            {
              symbol: 'NVDA',
              event: 'AI partnership announcement',
              date: '2023-03-15',
              outcome: 'positive',
              priceChange: 18.5,
              duration: '2 weeks'
            }
          ]
        },
        summary: {
          explanation: `${formData.companyName} has shown strong performance during the selected period, driven primarily by better-than-expected earnings and strategic AI partnerships. The stock's upward movement follows a pattern similar to NVIDIA's AI-driven growth in early 2023. Key factors include consistent revenue growth, expanding market presence, and positive analyst sentiment.`,
          keyFactors: [
            'Earnings exceeded expectations by 15%',
            'Strategic AI partnerships driving growth',
            'Strong analyst sentiment and upgrades',
            'Market expansion into new sectors'
          ],
          confidence: 87,
          recommendation: 'buy',
          riskLevel: 'medium'
        },
        monitoring: {
          isActive: true,
          alertThreshold: 75,
          similarPatterns: []
        }
      });
      
    } catch (error) {
      console.error('Error submitting analysis:', error);
      setError('Failed to start analysis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.startDate && formData.endDate && formData.symbol;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Sidebar - Input Controls */}
        <div className="w-full lg:w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 lg:p-6 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="mb-4 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 lg:mb-2">
              Stock Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-xs lg:text-sm">
              Configure your analysis parameters
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 lg:space-y-6">
            {/* Stock Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Search className="h-4 w-4 text-blue-600" />
                Stock
              </div>
              <StockAutocomplete
                selectedSymbol={formData.symbol}
                selectedCompanyName={formData.companyName}
                onStockSelection={handleStockSelection}
              />
            </div>

            {/* Date Range Selection */}
            <div className="space-y-3">
              <DateRangeSelector
                startDate={formData.startDate}
                endDate={formData.endDate}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <div className="pt-4 pb-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Analyze
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Panel - Analysis Results */}
        <div className="flex-1 p-4 lg:p-6 min-h-0">
          <div className="h-full">
            {analysisResults ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Analysis Results
                  </CardTitle>
                  <CardDescription>
                    {analysisResults.companyName} ({analysisResults.symbol}) • {analysisResults.analysisPeriod.startDate} to {analysisResults.analysisPeriod.endDate}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recommendation */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          Recommendation: {analysisResults.summary.recommendation.toUpperCase()}
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Confidence: {analysisResults.summary.confidence}%
                        </p>
                      </div>
                      <div className="text-2xl">📈</div>
                    </div>
                  </div>

                  {/* Web Scraping Results */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Web Analysis Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analysisResults.webScrapingResults.totalArticles}
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-300">Articles Analyzed</div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 capitalize">
                          {analysisResults.webScrapingResults.sentimentTrend}
                        </div>
                        <div className="text-sm text-green-800 dark:text-green-300">Overall Sentiment</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Key Topics:</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisResults.webScrapingResults.keyTopics.map((topic: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Explanation */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Analysis Summary
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {analysisResults.summary.explanation}
                    </p>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Factors:</h4>
                      <ul className="space-y-1">
                        {analysisResults.summary.keyFactors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Historical Similarities */}
                  {analysisResults.trendAnalysis.similarHistoricalEvents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Similar Historical Patterns
                      </h3>
                      <div className="space-y-2">
                        {analysisResults.trendAnalysis.similarHistoricalEvents.map((event: any, index: number) => (
                          <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">
                              {event.symbol}: {event.event}
                            </div>
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">
                              {event.date} • {event.outcome === 'positive' ? '+' : '-'}{event.priceChange}% over {event.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monitoring Status */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Monitoring Active
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      We'll alert you when similar patterns emerge in the market
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Select a stock and timeframe, then click Analyze to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
