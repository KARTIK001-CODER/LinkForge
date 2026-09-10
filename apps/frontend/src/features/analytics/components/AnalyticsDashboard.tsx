import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAnalyticsSummary } from '../api/useAnalyticsSummary';
import { useAnalyticsTimeseries } from '../api/useAnalyticsTimeseries';
import { useAnalyticsBreakdown } from '../api/useAnalyticsBreakdown';
import { SummaryCards } from './SummaryCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { DimensionBarChart } from './DimensionBarChart';
import { Download, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export const AnalyticsDashboard: React.FC<{ linkId: string }> = ({ linkId }) => {
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
    if (!isRealtime) { if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current=null; } return; }
    const es = new EventSource(`/api/v1/analytics/links/${linkId}/realtime`);
    eventSourceRef.current = es;
    es.onmessage = (event) => { try { const p=JSON.parse(event.data); if(p.type==='summary') refetchSummary(); } catch {} };
    es.addEventListener('summary', ()=> refetchSummary());
    return () => { es.close(); eventSourceRef.current=null; };
  }, [isRealtime, linkId, refetchSummary]);

  const handleExport = useCallback(async () => {
    try { setExportStatus('loading'); await axios.post(`/api/v1/analytics/links/${linkId}/export`); setExportStatus('success'); setTimeout(()=> setExportStatus('idle'), 3000); }
    catch { setExportStatus('error'); setTimeout(()=> setExportStatus('idle'), 3000); }
  }, [linkId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Link Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">Understand how your link performs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isRealtime ? "default":"outline"} size="sm" onClick={()=> setIsRealtime(v=>!v)}>
            <Activity className="size-4" /> {isRealtime ? "Live" : "Live off"}
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exportStatus==='loading'}>
            <Download className="size-4" /> {exportStatus==='loading'?"Exporting...": exportStatus==='success'?"Queued":"Export CSV"}
          </Button>
        </div>
      </div>

      <SummaryCards summary={summary} isLoading={isLoadingSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><TimeSeriesChart data={timeseriesData?.data} isLoading={isLoadingTimeseries} /></div>
        <DimensionBarChart title="Top Referrers" data={referrerBreakdown?.data} isLoading={isLoadingReferrer} color="hsl(var(--primary))" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DimensionBarChart title="Countries" data={countryBreakdown?.data} isLoading={isLoadingCountry} color="#f59e0b" />
        <DimensionBarChart title="Browsers" data={browserBreakdown?.data} isLoading={isLoadingBrowser} color="#22c55e" />
        <DimensionBarChart title="Devices" data={deviceBreakdown?.data} isLoading={isLoadingDevice} color="#8b5cf6" />
      </div>
    </div>
  );
};
