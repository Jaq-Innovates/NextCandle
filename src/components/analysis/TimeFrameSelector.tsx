'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TimeFrameSelectorProps {
  selectedTimeFrame: string;
  onTimeFrameChange: (timeFrame: string) => void;
}

const timeFrameOptions = [
  {
    value: '1w',
    label: '1 Week'
  },
  {
    value: '2w',
    label: '2 Weeks'
  },
  {
    value: '3w',
    label: '3 Weeks'
  },
  {
    value: '4w',
    label: '4 Weeks'
  }
];

export const TimeFrameSelector = ({ selectedTimeFrame, onTimeFrameChange }: TimeFrameSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {timeFrameOptions.map((option) => {
        const isSelected = selectedTimeFrame === option.value;
        
        return (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
              isSelected
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                : 'hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onTimeFrameChange(option.value)}
            role="button"
            tabIndex={0}
            aria-label={`Select ${option.label} time frame`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTimeFrameChange(option.value);
              }
            }}
          >
            <CardContent className="p-2 text-center">
              <h3 className={`font-medium text-sm ${
                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
              }`}>
                {option.label}
              </h3>
              
              {isSelected && (
                <div className="mt-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
