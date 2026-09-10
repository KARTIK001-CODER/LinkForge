import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { TimeseriesData } from '../api/useAnalyticsTimeseries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TimeSeriesChart: React.FC<{ data?: TimeseriesData[]; isLoading: boolean }> = React.memo(({ data, isLoading }) => {
  if (isLoading || !data) return <Skeleton className="h-[320px] w-full rounded-xl" />;
  if (data.length === 0) return <Card className="h-[320px] flex items-center justify-center"><p className="text-sm text-muted-foreground">No data for this period.</p></Card>;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>Clicks Over Time</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[272px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(str)=> { const d=new Date(str); return `${d.getMonth()+1}/${d.getDate()}`}} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#lfGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
