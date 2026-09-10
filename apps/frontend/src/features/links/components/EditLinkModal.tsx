import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useEditLink } from '../api/useEditLink';
import { useGetCollections } from '../../collections/api/useGetCollections';
import type { LinkItem } from '../api/useGetLinks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const schema = z.object({
  destinationUrl: z.string().url("Must be a valid URL").max(2048),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  tags: z.string().optional(),
  collectionId: z.string().optional().nullable().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function EditLinkModal({ isOpen, onClose, link }: { isOpen: boolean; onClose: ()=>void; link: LinkItem }) {
  const { mutate, isPending, isError, error, isSuccess } = useEditLink(link.id);
  const { data: collectionsData } = useGetCollections();
  const { register, handleSubmit, control, reset, formState:{errors} } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationUrl: link.destinationUrl, title: link.title||'', description: link.description||'', isActive: link.status==='ACTIVE', tags: link.tags?.join(', ')||'', collectionId: link.collectionId||'' },
  });
  useEffect(()=> { reset({ destinationUrl: link.destinationUrl, title: link.title||'', description: link.description||'', isActive: link.status==='ACTIVE', tags: link.tags?.join(', ')||'', collectionId: link.collectionId||'' }); }, [link, reset]);

  const onSubmit=(data:FormValues)=>{
    mutate({ destinationUrl: data.destinationUrl, title: data.title||null, description: data.description||null, isActive: data.isActive, tags: data.tags? data.tags.split(',').map(t=> t.trim()).filter(Boolean):[], collectionId: data.collectionId||null } as any, { onSuccess: ()=> setTimeout(onClose, 1200)});
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Smart Link</DialogTitle><DialogDescription>Update destination and metadata. Alias cannot be changed.</DialogDescription></DialogHeader>
        {isSuccess ? <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">Link updated successfully!</div> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isError && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{(error as any)?.message || 'Failed'}</div>}
            <div>
              <label className="text-sm font-medium">Alias (immutable)</label>
              <Input value={link.alias} disabled className="mt-1.5 bg-muted" />
            </div>
            <div>
              <label className="text-sm font-medium">Destination URL *</label>
              <Input {...register('destinationUrl')} className="mt-1.5" />
              {errors.destinationUrl && <p className="text-xs text-destructive mt-1">{errors.destinationUrl.message}</p>}
            </div>
            <div><label className="text-sm font-medium">Title</label><Input {...register('title')} className="mt-1.5" /></div>
            <div><label className="text-sm font-medium">Description</label><Textarea {...register('description')} rows={2} className="mt-1.5" /></div>
            <div><label className="text-sm font-medium">Tags</label><Input {...register('tags')} placeholder="marketing, summer" className="mt-1.5" /></div>
            <div><label className="text-sm font-medium">Collection</label>
              <select {...register('collectionId')} className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-card px-3 text-sm">
                <option value="">None</option>
                {collectionsData?.data?.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Controller name="isActive" control={control} render={({field})=> <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
              <label className="text-sm">Link is active</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="size-4 animate-spin"/>Saving...</> : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
