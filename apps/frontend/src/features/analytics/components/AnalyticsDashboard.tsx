import React, { useState } from 'react';
import { useAnalyticsSummary } from '../api/useAnalyticsSummary';
import { useAnalyticsTimeseries } from '../api/useAnalyticsTimeseries';
import { useAnalyticsBreakdown } from '../api/useAnalyticsBreakdown';
import { SummaryCards } from './SummaryCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { DimensionBarChart } from './DimensionBarChart';

interface AnalyticsDashboardProps {
  linkId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ linkId }) => {
  // Using React Query hooks to fetch data
  const { data: summary, isLoading: isLoadingSummary } = useAnalyticsSummary(linkId);
  const { data: timeseriesData, isLoading: isLoadingTimeseries } = useAnalyticsTimeseries(linkId);
  
  const { data: countryBreakdown, isLoading: isLoadingCountry } = useAnalyticsBreakdown(linkId, 'country');
  const { data: browserBreakdown, isLoading: isLoadingBrowser } = useAnalyticsBreakdown(linkId, 'browser');
  const { data: deviceBreakdown, isLoading: isLoadingDevice } = useAnalyticsBreakdown(linkId, 'deviceType');
  const { data: referrerBreakdown, isLoading: isLoadingReferrer } = useAnalyticsBreakdown(linkId, 'referrer');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Analytics</h1>
        {/* Date Picker / Real-time toggle could go here in Phase E */}
      </div>

      <SummaryCards summary={summary} isLoading={isLoadingSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <TimeSeriesChart data={timeseriesData?.data} isLoading={isLoadingTimeseries} />
        </div>
        <div className="lg:col-span-1">
          <DimensionBarChart 
            title="Top Referrers" 
            data={referrerBreakdown?.data} 
            isLoading={isLoadingReferrer} 
            color="#ec4899" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <DimensionBarChart 
          title="Countries" 
          data={countryBreakdown?.data} 
          isLoading={isLoadingCountry} 
          color="#f97316" 
        />
        <DimensionBarChart 
          title="Browsers" 
          data={browserBreakdown?.data} 
          isLoading={isLoadingBrowser} 
          color="#3b82f6" 
        />
        <DimensionBarChart 
          title="Devices" 
          data={deviceBreakdown?.data} 
          isLoading={isLoadingDevice} 
          color="#8b5cf6" 
        />
      </div>
    </div>
  );
};
