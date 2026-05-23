import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-sm mb-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-gray-800">Progress</span>
        </div>
        <span className="font-medium text-gray-700">
          {completed} / {total} tasks
        </span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse-slow" />
          </div>
        </div>
        
        {/* Percentage badge */}
        {percentage > 0 && (
          <div 
            className="absolute top-0 h-4 flex items-center transition-all duration-500"
            style={{ left: `${Math.min(percentage, 95)}%` }}
          >
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg ml-2 whitespace-nowrap">
              {percentage.toFixed(0)}%
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center mt-3">
        {percentage === 100 ? (
          <span className="text-green-600 font-semibold flex items-center justify-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All tasks completed!
          </span>
        ) : percentage > 0 ? (
          <span className="text-blue-600 font-medium">
            {percentage.toFixed(0)}% Complete
          </span>
        ) : (
          <span className="text-gray-500 font-medium">
            Waiting to start...
          </span>
        )}
      </div>
    </div>
  );
}

// Made with Bob
