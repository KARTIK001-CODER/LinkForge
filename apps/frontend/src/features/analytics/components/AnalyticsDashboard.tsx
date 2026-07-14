import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAnalyticsSummary } from '../api/useAnalyticsSummary';
import { useAnalyticsTimeseries } from '../api/useAnalyticsTimeseries';
import { useAnalyticsBreakdown } from '../api/useAnalyticsBreakdown';
import { SummaryCards } from './SummaryCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { DimensionBarChart } from './DimensionBarChart';

import { Download, Activity } from 'lucide-react';
import axios from 'axios';

interface AnalyticsDashboardProps {
  linkId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ linkId }) => {
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isRealtime, setIsRealtime] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useAnalyticsSummary(linkId, isRealtime);
  const { data: timeseriesData, isLoading: isLoadingTimeseries } = useAnalyticsTimeseries(linkId, undefined, undefined, isRealtime);
  const { data: countryBreakdown, isLoading: isLoadingCountry } = useAnalyticsBreakdown(linkId, 'country', isRealtime);
  const { data: browserBreakdown, isLoading: isLoadingBrowser } = useAnalyticsBreakdown(linkId, 'browser', isRealtime);
  const { data: deviceBreakdown, isLoading: isLoadingDevice } = useAnalyticsBreakdown(linkId, 'deviceType', isRealtime);
  const { data: referrerBreakdown, isLoading: isLoadingReferrer } = useAnalyticsBreakdown(linkId, 'referrer', isRealtime);

  useEffect(() => {
    if (!isRealtime) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource(`/api/v1/analytics/links/${linkId}/realtime`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'summary') {
          refetchSummary();
        }
      } catch {}
    };

    es.addEventListener('summary', () => {
      refetchSummary();
    });

    es.onerror = () => {
      // Will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isRealtime, linkId, refetchSummary]);

  const handleExport = useCallback(async () => {
    try {
      setExportStatus('loading');
      const res = await axios.post(`/api/v1/analytics/links/${linkId}/export`);
      console.log('Export Job started:', res.data.jobId);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (e) {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  }, [linkId]);

  const handleRealtimeToggle = useCallback(() => {
    setIsRealtime(prev => !prev);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Analytics</h1>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleRealtimeToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isRealtime ? 'Real-time On' : 'Real-time Off'}</span>
          </button>

          <button 
            onClick={handleExport}
            disabled={exportStatus === 'loading'}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{exportStatus === 'loading' ? 'Exporting...' : exportStatus === 'success' ? 'Started!' : 'Export CSV'}</span>
          </button>
        </div>
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
