'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export const DateRangeSelector = ({ startDate, endDate, onDateRangeChange }: DateRangeSelectorProps) => {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  const handleStartDateChange = (date: string) => {
    setLocalStartDate(date);
    onDateRangeChange(date, localEndDate);
  };

  const handleEndDateChange = (date: string) => {
    setLocalEndDate(date);
    onDateRangeChange(localStartDate, date);
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      {/* Custom Date Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Calendar className="h-4 w-4 text-blue-600" />
          Analysis Period
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              max={getToday()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={localEndDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              max={getToday()}
              min={localStartDate}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
