import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCollection } from '../api/useCreateCollection';
import { useUpdateCollection } from '../api/useUpdateCollection';
import { useEffect } from 'react';
import type { Collection } from '../api/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

const schema = z.object({ name: z.string().min(1, 'Name is required').max(100), description: z.string().max(500).optional() });
type FormData = z.infer<typeof schema>;

export const CollectionModal = ({ isOpen, onClose, collection }: { isOpen: boolean; onClose: ()=>void; collection?: Collection | null }) => {
  const { register, handleSubmit, formState:{errors}, reset } = useHookForm<FormData>({ resolver: zodResolver(schema), defaultValues:{ name: collection?.name||'', description: collection?.description||'' } });
  const create = useCreateCollection();
  const update = useUpdateCollection();
  useEffect(()=> { if(isOpen) reset({ name: collection?.name||'', description: collection?.description||'' }); }, [isOpen, collection, reset]);

  const onSubmit = async (data: FormData) => {
    if (collection) await update.mutateAsync({ id: collection.id, ...data });
    else await create.mutateAsync(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection":"New Collection"}</DialogTitle>
          <DialogDescription>{collection? "Update collection details.":"Organize links into a collection."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input {...register('name')} placeholder="Marketing Campaign" className="mt-1.5" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea {...register('description')} rows={3} placeholder="Optional description" className="mt-1.5" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
          {(create.isError || update.isError) && <p className="text-sm text-destructive">{(create.error as Error)?.message || (update.error as Error)?.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>{create.isPending||update.isPending? "Saving...":"Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
