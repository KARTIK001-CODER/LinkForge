import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { BreakdownData } from '../api/useAnalyticsBreakdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DimensionBarChart: React.FC<{ title: string; data?: BreakdownData[]; isLoading: boolean; color?: string }> = React.memo(({ title, data, isLoading, color = 'hsl(var(--primary))' }) => {
  if (isLoading || !data) return <Skeleton className="h-[320px] rounded-xl" />;
  if (data.length === 0) return <Card className="h-[320px] flex flex-col items-center justify-center p-6"><CardTitle className="text-sm mb-2">{title}</CardTitle><p className="text-xs text-muted-foreground">No data.</p></Card>;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[264px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0,6)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={90} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="clicks" fill={color} radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
