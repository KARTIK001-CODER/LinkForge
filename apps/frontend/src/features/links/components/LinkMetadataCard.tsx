import { format } from 'date-fns';
import { ExternalLink, Lock, Globe, Clock, Tag } from 'lucide-react';
import type { LinkItem } from '../api/useGetLinks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LinkMetadataCard({ link }: { link: LinkItem & { updatedAt?: string } }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border"><CardTitle>Link Configuration</CardTitle></CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h4 className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><ExternalLink className="size-4" /> Destination URL</h4>
          <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="break-all text-sm font-medium hover:text-primary">{link.destinationUrl}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">{link.hasPassword ? <Lock className="size-4 text-warning" /> : <Globe className="size-4 text-success" />} Security</h4>
            <Badge variant={link.hasPassword ? "warning":"success"}>{link.hasPassword ? 'Password Protected' : 'Public'}</Badge>
          </div>
          <div>
            <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Clock className="size-4" /> Expiration</h4>
            <span className="text-sm font-medium">{link.expiresAt ? format(new Date(link.expiresAt), 'MMM d, yyyy, h:mm a') : 'Never'}</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Tag className="size-4" /> Tags</h4>
          {link.tags?.length ? <div className="flex flex-wrap gap-2">{link.tags.map((t,i)=> <span key={i} className="rounded-md border border-border bg-muted px-2.5 py-0.5 text-xs">{t}</span>)}</div> : <span className="text-sm italic text-muted-foreground">No tags applied</span>}
        </div>
        <div className="pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div><span className="block font-medium text-foreground">Created</span>{format(new Date(link.createdAt), 'MMM d, yyyy')}</div>
          {link.updatedAt && <div><span className="block font-medium text-foreground">Last Updated</span>{format(new Date(link.updatedAt), 'MMM d, yyyy')}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
