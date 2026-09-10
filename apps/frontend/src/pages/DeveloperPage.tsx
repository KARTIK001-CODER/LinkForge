import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Key, Webhook, Copy } from 'lucide-react';

export default function DeveloperPage(){
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Code2 className="size-6 text-primary" /> Developer</h1>
        <p className="text-sm text-muted-foreground mt-1">API keys & webhooks for LinkForge.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="size-4" /> API Keys</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted p-4 font-mono text-xs">Authorization: Bearer lf_live_••••••••••••</div>
          <div className="flex gap-2"><Button size="sm" variant="outline"><Copy className="size-4" /> Copy example</Button><Button size="sm">Create key</Button></div>
          <p className="text-xs text-muted-foreground">Use the LinkForge API to create links, manage collections and fetch analytics programmatically.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="size-4" /> Webhooks</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Receive events for link clicks, expirations and more.</p>
          <Button size="sm" variant="outline" className="mt-3">Add webhook</Button>
        </CardContent>
      </Card>
    </div>
  )
}
