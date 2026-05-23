import React from 'react';
import { useTokenMonitor } from '../hooks/useTokenMonitor';

interface TokenMonitorProps {
  projectId: string;
}

export function TokenMonitor({ projectId }: TokenMonitorProps) {
  const { tokens, cost, limit, percentage, alerts } = useTokenMonitor(projectId);

  // Ensure percentage is always a number
  const safePercentage = percentage ?? 0;

  const getProgressColor = () => {
    if (safePercentage > 95) return 'from-red-500 to-red-600';
    if (safePercentage > 80) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-600';
  };

  const getProgressBg = () => {
    if (safePercentage > 95) return 'bg-red-50';
    if (safePercentage > 80) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 sticky top-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Token Usage</h3>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-3">
          <span className="font-semibold text-gray-700">Tokens Used</span>
          <span className="font-medium text-gray-600">
            {tokens.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressColor()} relative overflow-hidden`}
              style={{ width: `${Math.min(safePercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`${getProgressBg()} rounded-xl p-4 border-2 ${percentage > 95 ? 'border-red-200' : percentage > 80 ? 'border-yellow-200' : 'border-green-200'}`}>
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-semibold text-gray-700">Total Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${cost.toFixed(4)}</p>
        </div>
        <div className={`${getProgressBg()} rounded-xl p-4 border-2 ${safePercentage > 95 ? 'border-red-200' : safePercentage > 80 ? 'border-yellow-200' : 'border-green-200'}`}>
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-gray-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-semibold text-gray-700">Usage</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{safePercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h4 className="text-sm font-semibold text-gray-700">Alerts</h4>
          </div>
          {alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-xl border-2 ${
                alert.level === 'critical' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : alert.level === 'warning' 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {alerts.length === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">
              Token usage is being monitored in real-time. You'll be notified if you approach your limits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
