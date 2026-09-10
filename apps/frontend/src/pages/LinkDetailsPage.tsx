import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetLink } from '../features/links/api/useGetLink';
import { ArrowLeft, Copy, QrCode, Link2, Shield, ExternalLink, BarChart3, Settings2, Zap, Split } from 'lucide-react';
import { FavoriteButton } from '../features/links/components/FavoriteButton';
import { RulesManager } from '../features/links/components/RulesManager';
import { TrafficManager } from '../features/links/components/TrafficManager';
import { QRCodeModal } from '../features/links/components/QRCodeModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function LinkDetailsPage() {
  const { alias } = useParams<{ alias: string }>();
  const [isQRModalOpen, setQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("overview");

  const { data, isLoading, isError, error } = useGetLink(alias || '');

  const handleCopy = () => {
    if (data?.data.shortUrl) {
      navigator.clipboard.writeText(data.data.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">{(error as any)?.message || "Link not found"}</p>
        <Link to="/"><Button>Back to Dashboard</Button></Link>
      </div>
    );
  }

  const link = data.data;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight truncate">/{link.alias}</h1>
            <FavoriteButton link={link} />
            <Badge variant={link.status==="ACTIVE"?"success":"secondary"}>{link.status.toLowerCase()}</Badge>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Link2 className="size-4 text-muted-foreground" />
            <a href={link.shortUrl} target="_blank" rel="noreferrer" className="font-mono text-primary hover:underline truncate">{link.shortUrl}</a>
            <Button variant="ghost" size="icon-xs" onClick={handleCopy}>{copied ? "✓" : <Copy className="size-3.5" />}</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/links/${alias}/analytics`}><Button variant="outline" size="sm"><BarChart3 className="size-4" /> Analytics</Button></Link>
          <Button variant="outline" size="sm" onClick={()=> setQRModalOpen(true)}><QrCode className="size-4" /> QR</Button>
          <Button size="sm" onClick={handleCopy}><Copy className="size-4" /> {copied?"Copied":"Copy URL"}</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="rules">Smart Rules</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Routing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-muted-foreground">Total Clicks</p><p className="text-2xl font-semibold mt-1">{(link as any).clicks ?? 0}</p></Card>
            <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-muted-foreground">Status</p><p className="text-sm font-medium mt-1 capitalize">{link.status.toLowerCase()}</p></Card>
            <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-muted-foreground">Created</p><p className="text-sm font-medium mt-1">{format(new Date(link.createdAt), 'MMM d, yyyy')}</p></Card>
            <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-muted-foreground">Security</p><p className="text-sm font-medium mt-1 flex items-center gap-1">{link.hasPassword ? <><Shield className="size-3" /> Protected</> : "Public"}</p></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Destination & Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><ExternalLink className="size-3" /> Destination URL</p>
                  <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm hover:text-primary">{link.destinationUrl}</a>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Expires</p><p className="font-medium">{link.expiresAt ? format(new Date(link.expiresAt), 'PPp') : "Never"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tags</p><div className="flex flex-wrap gap-1 mt-1">{link.tags.length ? link.tags.map(t=> <span key={t} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs">{t}</span>) : <span className="text-muted-foreground text-xs">None</span>}</div></div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {link.hasPassword && <Badge variant="warning">Password</Badge>}
                  {link.expiresAt && <Badge variant="secondary">Expiring</Badge>}
                  {link.trafficVariants?.length ? <Badge variant="default">A/B routing</Badge> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleCopy}><Copy className="size-4" /> Copy short link</Button>
                <Button variant="outline" className="w-full justify-start" onClick={()=> setTab("rules")}><Zap className="size-4" /> Add smart rule</Button>
                <Button variant="outline" className="w-full justify-start" onClick={()=> setTab("traffic")}><Split className="size-4" /> Configure routing</Button>
                <Link to={`/links/${alias}/analytics`} className="block"><Button variant="outline" className="w-full justify-start"><BarChart3 className="size-4" /> View analytics</Button></Link>
              </CardContent>
            </Card>
          </div>

          {/* Also show traffic/rules inline in overview for premium feel */}
          <TrafficManager linkId={link.id} initialVariants={link.trafficVariants} />
          <RulesManager linkId={link.id} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-8 text-center">
            <BarChart3 className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Detailed analytics</p>
            <p className="text-xs text-muted-foreground mt-1">Open full analytics page for in-depth insights.</p>
            <Link to={`/links/${alias}/analytics`} className="inline-block mt-4"><Button size="sm">Open Analytics</Button></Link>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <RulesManager linkId={link.id} />
        </TabsContent>

        <TabsContent value="traffic">
          <TrafficManager linkId={link.id} initialVariants={link.trafficVariants} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="size-4" /> Link Settings</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Edit destination, password, expiration and collection from the link management menu. Dangerous actions (archive/delete) are available in the dashboard table.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <QRCodeModal isOpen={isQRModalOpen} onClose={()=> setQRModalOpen(false)} url={link.shortUrl} alias={link.alias} />
    </div>
  );
}
