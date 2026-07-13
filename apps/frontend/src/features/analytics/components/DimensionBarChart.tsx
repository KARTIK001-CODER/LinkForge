import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { BreakdownData } from '../api/useAnalyticsBreakdown';

interface DimensionBarChartProps {
  title: string;
  data?: BreakdownData[];
  isLoading: boolean;
  color?: string;
}

export const DimensionBarChart: React.FC<DimensionBarChartProps> = React.memo(({ title, data, isLoading, color = '#6366f1' }) => {
  if (isLoading || !data) {
    return <div className="h-80 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              stroke="#888888" 
              fontSize={12} 
              width={100}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }} 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="clicks" fill={color} radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
