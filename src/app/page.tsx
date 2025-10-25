import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3, Brain, Shield, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered
              <span className="text-blue-600 dark:text-blue-400"> Financial Analysis</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Enough with uncertain decision making, NextCandle's advanced AI that analyzes 
              historical trends, market sentiment, and real-time data guides your portfolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose NextCandle?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with comprehensive market analysis 
              to give you the edge you need in today's volatile markets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">AI-Powered Insights</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Advanced machine learning algorithms analyze market patterns and sentiment 
                  to provide actionable investment recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Historical Analysis</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Deep dive into historical stock performance and trends to identify 
                  patterns that could predict future movements.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Real-time Data</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Access live market data, news sentiment analysis, and real-time 
                  portfolio tracking with our comprehensive dashboard.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Risk Management</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Advanced risk assessment tools help you understand potential 
                  downsides and optimize your portfolio allocation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Lightning Fast</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Get instant analysis and recommendations with our optimized 
                  infrastructure designed for speed and reliability.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white">Community Driven</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Join a community of smart investors sharing insights, 
                  strategies, and market analysis to learn and grow together.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Investment Strategy?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who are already using NextCandle to make 
            smarter, data-driven investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600 dark:hover:text-blue-800">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}