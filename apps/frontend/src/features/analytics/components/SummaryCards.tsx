import React from 'react';
import type { AnalyticsSummary } from '../api/useAnalyticsSummary';
import { MousePointerClick, Users, Globe, ArrowUpRight } from 'lucide-react';

interface SummaryCardsProps {
  summary?: AnalyticsSummary;
  isLoading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    { title: 'Total Clicks', value: summary.totalClicks, icon: MousePointerClick, color: 'text-blue-500' },
    { title: 'Unique Visitors', value: summary.uniqueVisitors, icon: Users, color: 'text-indigo-500' },
    { title: 'Top Referrer', value: summary.topReferrer, icon: ArrowUpRight, color: 'text-green-500' },
    { title: 'Top Country', value: summary.topCountry, icon: Globe, color: 'text-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">{card.title}</h3>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white truncate">
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
