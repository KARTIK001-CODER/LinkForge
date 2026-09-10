import { Card } from '@/components/ui/card';
import { Activity, Link2, Archive, Zap, Clock } from 'lucide-react';
import { useGetLinks } from '@/features/links/api/useGetLinks';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function ActivityPage(){
  const { data, isLoading } = useGetLinks({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' } as any);

  if (isLoading) return <div className="space-y-4 max-w-2xl"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const links = data?.data?.items || [];

  // Real activity derived from actual links
  const activities = links.slice(0, 10).map(l => ({
    id: l.id,
    alias: l.alias,
    destinationUrl: l.destinationUrl,
    createdAt: l.createdAt,
    status: l.status,
    hasPassword: (l as any).hasPassword,
    isFavorite: (l as any).isFavorite,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Real activity from your links — created directly from API.</p>
      </div>
      <Card className="p-6">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="size-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first link to see activity here.</p>
            <Link to="/create" className="mt-4 text-sm text-primary hover:underline">Create link</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent links</p>
            {activities.map((it)=> {
              const isArchived = it.status === 'ARCHIVED';
              const Icon = isArchived ? Archive : it.hasPassword ? Zap : Link2;
              const color = isArchived ? "bg-muted text-muted-foreground" : it.hasPassword ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary";
              let timeAgo = "—";
              try { timeAgo = formatDistanceToNow(new Date(it.createdAt), { addSuffix: true }); } catch {}
              return (
                <div key={it.id} className="flex gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-lg border border-border ${color}`}><Icon className="size-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span>{isArchived ? "Archived link" : "Created link"}</span>
                      <Link to={`/links/${it.alias}`} className="font-mono text-primary hover:underline truncate">/{it.alias}</Link>
                      {it.status !== 'ACTIVE' && <span className="text-xs px-1.5 py-0.5 rounded bg-muted border border-border">{it.status.toLowerCase()}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Clock className="size-3" />{timeAgo} · {it.destinationUrl.slice(0,50)}</p>
                  </div>
                </div>
              );
            })}
            {links.length === 0 && <p className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="size-4" />No activity yet.</p>}
          </div>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">Showing {activities.length} of {data?.data?.meta.totalItems ?? 0} links. Data is live from <code className="px-1 py-0.5 rounded bg-muted border border-border">/api/v1/links</code></p>
    </div>
  )
}
