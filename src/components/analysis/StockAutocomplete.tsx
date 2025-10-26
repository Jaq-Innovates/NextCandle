'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp, Building2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { StockSearchResult } from '@/types';
import { apiClient } from '@/lib/api';

interface StockAutocompleteProps {
  selectedSymbol: string;
  selectedCompanyName: string;
  onStockSelection: (symbol: string, companyName: string) => void;
}

// Mock stock data - in a real app, this would come from an API
const mockStockData: StockSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', type: 'Common Stock' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', type: 'Common Stock' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', type: 'Common Stock' }
];

export const StockAutocomplete = ({ 
  selectedSymbol, 
  selectedCompanyName, 
  onStockSelection 
}: StockAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<StockSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Filter stocks based on search query
  useEffect(() => {
    // 🛑 Don’t re-search if a stock is already selected
    if (selectedSymbol) {
      setFilteredStocks([]);
      setIsOpen(false);
      return;
    }
  
    if (!debouncedQuery.trim()) {
      setFilteredStocks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const searchStocks = async () => {
      try {
        // Try to use real API first, fallback to mock data
        const response = await apiClient.searchStocks(debouncedQuery, 20);
        console.log("📦 API Response:", response);

        setFilteredStocks(response); // ✅ already StockSearchResult[]
        setIsOpen(true);


      } catch (error) {
        console.warn('API search failed, using mock data:', error);
        // Fallback to mock data
        const filtered = mockStockData.filter(stock =>
          stock.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        setFilteredStocks(filtered);
      } finally {
        setIsLoading(false);
      }
    };

    searchStocks();
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    // Clear selection if user starts typing
    if (selectedSymbol && value !== selectedCompanyName) {
      onStockSelection('', '');
    }
  };

  const handleStockSelect = (stock: StockSearchResult) => {
    onStockSelection(stock.symbol, stock.name);
    setQuery(stock.name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    onStockSelection('', '');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredStocks.length) {
            handleStockSelect(filteredStocks[selectedIndex]);
          } else if (query.trim()) {
            onStockSelection(query.toUpperCase(), query);
            setIsOpen(false);
          }
          break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };  

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search for a company (e.g., Apple, Microsoft, Tesla)"
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          aria-label="Search for a stock"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Selected Stock Display */}
      {selectedSymbol && selectedCompanyName && (
        <Card className="mt-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedCompanyName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedSymbol} • Selected for Analysis
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : filteredStocks.length > 0 ? (
            filteredStocks.map((stock, index) => (
              <div
                key={stock.symbol}
                className={`p-4 cursor-pointer transition-colors duration-150 ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onMouseDown={() => handleStockSelect(stock)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {stock.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {stock.symbol} • {stock.exchange}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No companies found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
