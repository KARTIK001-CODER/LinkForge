import React from 'react';
import type { AnalyticsSummary } from '../api/useAnalyticsSummary';
import { MousePointerClick, Users, Globe, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SummaryCards: React.FC<{ summary?: AnalyticsSummary; isLoading: boolean }> = React.memo(({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }
  const cards = [
    { title: 'Total Clicks', value: summary.totalClicks, icon: MousePointerClick },
    { title: 'Unique Visitors', value: summary.uniqueVisitors, icon: Users },
    { title: 'Top Referrer', value: summary.topReferrer || "—", icon: ArrowUpRight },
    { title: 'Top Country', value: summary.topCountry || "—", icon: Globe },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{card.title}</p>
              <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted"><Icon className="size-3.5 text-muted-foreground" /></div>
            </div>
            <p className="mt-3 text-xl font-semibold tracking-tight truncate">{card.value}</p>
          </Card>
        );
      })}
    </div>
  );
});
