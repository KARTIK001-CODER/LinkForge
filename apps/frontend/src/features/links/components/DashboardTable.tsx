import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Lock, ExternalLink, Archive, RefreshCw, Edit2, Trash2, MoreHorizontal, Copy, BarChart3, Star } from 'lucide-react';
import type { LinkItem } from '../api/useGetLinks';
import { EditLinkModal } from './EditLinkModal';
import { useArchiveLink } from '../api/useArchiveLink';
import { useRestoreLink } from '../api/useRestoreLink';
import { useDeleteLink } from '../api/useDeleteLink';
import { FavoriteButton } from './FavoriteButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Props {
  links: LinkItem[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: string;
  onSortChange: (c: string)=>void;
}

function SortHead({ label, column, sortBy, sortOrder, onSortChange }: any) {
  const active = sortBy===column;
  return (
    <button onClick={()=> onSortChange(column)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {label} <span className={active ? "text-primary" : "text-muted-foreground/40"}>{active ? (sortOrder==="asc"?"↑":"↓") : "↕"}</span>
    </button>
  )
}

export function DashboardTable({ links, isLoading, sortBy, sortOrder, onSortChange }: Props) {
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [archivingLink, setArchivingLink] = useState<LinkItem | null>(null);
  const [restoringLink, setRestoringLink] = useState<LinkItem | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const archiveMutation = useArchiveLink(archivingLink?.id || '');
  const restoreMutation = useRestoreLink(restoringLink?.id || '');
  const deleteMutation = useDeleteLink(deletingLink?.id || '');

  const handleCopy = (url: string, id: string) => { navigator.clipboard.writeText(url); setCopied(id); setTimeout(()=> setCopied(null), 1500) }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({length:5}).map((_,i)=> <Skeleton key={i} className="h-[64px] w-full" />)}
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return <EmptyState icon={Star} title="No links found" description="Try adjusting your filters or create a new smart link." actionLabel="Create Link" onAction={()=> window.location.href="/create"} />
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium"><SortHead label="Link" column="alias" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} /></th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium hidden lg:table-cell">Destination</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium hidden sm:table-cell"><SortHead label="Created" column="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} /></th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((link)=> (
                <tr key={link.id} className="group hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FavoriteButton link={link} />
                      <div className="min-w-0">
                        <Link to={`/links/${link.alias}`} className="flex items-center gap-1.5 font-medium hover:text-primary">
                          <span className="truncate">/{link.alias}</span>
                          {link.hasPassword && <Lock className="size-3 text-muted-foreground" />}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate max-w-[220px]">{link.destinationUrl}</span>
                          <button onClick={()=> handleCopy(link.shortUrl, link.id)} className="text-muted-foreground hover:text-foreground"><Copy className="size-3" /></button>
                          {copied===link.id && <span className="text-xs text-success">Copied</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-[260px]">
                      <span className="truncate">{link.destinationUrl}</span><ExternalLink className="size-3 shrink-0" />
                    </a>
                    <div className="flex gap-1 mt-1">
                      {link.tags.slice(0,2).map((t,i)=> <span key={i} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px]">{t}</span>)}
                      {link.tags.length>2 && <span className="text-[11px] text-muted-foreground">+{link.tags.length-2}</span>}
                      {link.trafficVariants && link.trafficVariants.length>0 && <span className="rounded-md bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[11px]">A/B</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={link.status==="ACTIVE" ? "success" : link.status==="ARCHIVED" ? "archived" : link.status==="EXPIRED" ? "destructive":"secondary"}>
                      {link.status.toLowerCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1 tabular-nums">{(link as any).clicks ?? 0} clicks</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{format(new Date(link.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-1">
                      <Link to={`/links/${link.alias}`}><Button variant="ghost" size="icon-xs" title="Analytics"><BarChart3 className="size-3.5" /></Button></Link>
                      {link.status!=="ARCHIVED" ? (
                        <>
                          <Button variant="ghost" size="icon-xs" onClick={()=> setEditingLink(link)}><Edit2 className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={()=> setArchivingLink(link)}><Archive className="size-3.5" /></Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon-xs" onClick={()=> setRestoringLink(link)}><RefreshCw className="size-3.5" /></Button>
                      )}
                      <Button variant="ghost" size="icon-xs" onClick={()=> setDeletingLink(link)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {links.map((link)=> (
          <div key={link.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/links/${link.alias}`} className="font-medium text-sm truncate">/{link.alias}</Link>
              <Badge variant={link.status==="ACTIVE" ? "success":"secondary"}>{link.status.toLowerCase()}</Badge>
            </div>
            <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
              {link.destinationUrl} <ExternalLink className="size-3" />
            </a>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{format(new Date(link.createdAt), 'MMM d')}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={()=> setEditingLink(link)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={()=> setDeletingLink(link)} className="text-destructive">Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingLink && <EditLinkModal isOpen={true} onClose={()=> setEditingLink(null)} link={editingLink} />}

      <Dialog open={!!archivingLink} onOpenChange={(o)=> !o && setArchivingLink(null)}>
        <DialogContent onClose={()=> setArchivingLink(null)}>
          <DialogHeader><DialogTitle>Archive Link</DialogTitle><DialogDescription>/{archivingLink?.alias} will be hidden but keep routing.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setArchivingLink(null)}>Cancel</Button>
            <Button onClick={()=> archiveMutation.mutate(undefined,{onSuccess:()=> setArchivingLink(null)})} disabled={archiveMutation.isPending}>{archiveMutation.isPending?"Archiving...":"Archive"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!restoringLink} onOpenChange={(o)=> !o && setRestoringLink(null)}>
        <DialogContent onClose={()=> setRestoringLink(null)}>
          <DialogHeader><DialogTitle>Restore Link</DialogTitle><DialogDescription>/{restoringLink?.alias} will reappear.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setRestoringLink(null)}>Cancel</Button>
            <Button onClick={()=> restoreMutation.mutate(undefined,{onSuccess:()=> setRestoringLink(null)})}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingLink} onOpenChange={(o)=> !o && setDeletingLink(null)}>
        <DialogContent onClose={()=> setDeletingLink(null)}>
          <DialogHeader><DialogTitle>Delete Smart Link?</DialogTitle><DialogDescription>This will permanently delete /{deletingLink?.alias}. Historical analytics will be preserved.</DialogDescription></DialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">Type <span className="font-mono font-semibold">{deletingLink?.alias}</span> to confirm.</div>
          <DialogFooter>
            <Button variant="outline" onClick={()=> setDeletingLink(null)}>Cancel</Button>
            <Button variant="destructive" onClick={()=> deleteMutation.mutate(undefined,{onSuccess:()=> setDeletingLink(null)})} disabled={deleteMutation.isPending}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
