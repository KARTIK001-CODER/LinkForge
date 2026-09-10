import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetLink } from '../features/links/api/useGetLink';
import { AnalyticsDashboard } from '../features/analytics/components/AnalyticsDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const { alias } = useParams<{ alias: string }>();
  const { data, isLoading, isError } = useGetLink(alias || '');

  if (isLoading) return <div className="space-y-3 p-4"><Skeleton className="h-10 w-40" /><Skeleton className="h-64 w-full" /></div>;

  if (isError || !data?.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">Could not find link /{alias}</p>
        <Link to="/" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to={`/links/${alias}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {alias}
      </Link>
      <AnalyticsDashboard linkId={data.data.id} />
    </div>
  );
}
