import { MousePointerClick } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function LinkQuickStats({ clicks }: { clicks: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border"><CardTitle>Quick Stats</CardTitle></CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground"><MousePointerClick className="size-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Lifetime Clicks</p>
            <p className="text-3xl font-bold tracking-tight">{clicks.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Detailed timeseries analytics will be available in a future update.</p>
        </div>
      </CardContent>
    </Card>
  );
}
