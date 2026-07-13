import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useGetLink } from '../features/links/api/useGetLink';
import { AnalyticsDashboard } from '../features/analytics/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  const { alias } = useParams<{ alias: string }>();
  const { data, isLoading, isError } = useGetLink(alias || '');

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading analytics engine...</div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Analytics</h2>
        <p className="text-gray-500 mb-4">Could not find link data for /{alias}</p>
        <Link to="/" className="text-blue-500 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
        <Link to={`/links/${alias}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Link Details ({alias})
        </Link>
      </div>
      
      {/* The Dashboard Component handles its own max-width and layout */}
      <AnalyticsDashboard linkId={data.data.id} />
    </div>
  );
}
