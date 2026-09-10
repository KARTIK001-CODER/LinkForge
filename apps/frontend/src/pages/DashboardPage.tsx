import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetLinks } from '../features/links/api/useGetLinks';
import { ArrowUpRight, MousePointerClick, Link2, TrendingUp } from 'lucide-react';
import { useGetCollections } from '../features/collections/api/useGetCollections';
import { MetricCard } from '@/components/shared/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/api/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useGetLinks({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: collectionsData } = useGetCollections();

  // Real overview metrics from API (no filters)
  const links = data?.data?.items || [];
  const totalClicks = useMemo(()=> links.reduce((a,b)=> a + ( (b as any).clicks ?? 0), 0), [links]);
  const activeLinks = links.filter(l=> l.status==="ACTIVE").length;

  // Real chart data: top links by clicks
  const chartData = useMemo(()=> {
    if (links.length === 0) return [];
    const sorted = [...links].sort((a:any,b:any)=> (b.clicks??0)-(a.clicks??0)).slice(0,7);
    return sorted.map(l=> ({ name: (l.alias || '').slice(0,10) || 'link', clicks: (l as any).clicks ?? 0 }));
  }, [links])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold tracking-tight">
          {greeting()}, {user?.displayName?.split(" ")[0] || user?.username || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your links.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total Clicks" value={isLoading ? "—" : totalClicks.toLocaleString()} icon={MousePointerClick} />
        <MetricCard label="Active Links" value={isLoading ? "—" : String(activeLinks)} icon={Link2} />
        <MetricCard label="Total Links" value={isLoading ? "—" : String(data?.data?.meta.totalItems ?? links.length)} icon={Link2} />
        <MetricCard label="Collections" value={isLoading ? "—" : String(collectionsData?.data?.length ?? 0)} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Top Performing Links</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Real clicks per link</p>
            </div>
            <Link to="/links"><Button variant="outline" size="sm">View all links</Button></Link>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full" /> : chartData.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center">
                <MousePointerClick className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No clicks yet</p>
                <p className="text-xs text-muted-foreground">Share your links to see performance</p>
              </div>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={30} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">Top Links <Link to="/links" className="text-xs font-normal text-primary hover:underline inline-flex items-center gap-1">View all <ArrowUpRight className="size-3" /></Link></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? Array.from({length:3}).map((_,i)=> <Skeleton key={i} className="h-12" /> ) : links.slice(0,4).map(l=> (
                <Link key={l.id} to={`/links/${l.alias}`} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted border border-border"><Link2 className="size-4 text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">/{l.alias}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.destinationUrl}</p>
                  </div>
                  <span className="text-xs font-medium tabular-nums">{(l as any).clicks ?? 0}</span>
                </Link>
              ))}
              {!isLoading && links.length===0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link to="/create" className="rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted text-sm font-medium">Create link</Link>
              <Link to="/collections" className="rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted text-sm font-medium">New collection</Link>
              <Link to="/links" className="rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted text-sm font-medium">Manage links</Link>
              <Link to="/developer" className="rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted text-sm font-medium">API keys</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
