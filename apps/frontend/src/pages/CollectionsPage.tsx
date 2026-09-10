import { useGetCollections } from '../features/collections/api/useGetCollections';
import { useDeleteCollection } from '../features/collections/api/useDeleteCollection';
import { CollectionModal } from '../features/collections/components/CollectionModal';
import { FolderKanban, Edit2, Trash, Plus, Link2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Collection } from '../features/collections/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function CollectionsPage() {
  const { data, isLoading, isError, error } = useGetCollections();
  const deleteCollection = useDeleteCollection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const handleEdit = (c: Collection) => { setEditingCollection(c); setIsModalOpen(true); };
  const handleCreate = () => { setEditingCollection(null); setIsModalOpen(true); };
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? Links will not be deleted.`)) { await deleteCollection.mutateAsync(id); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Collections" description="Organize your smart links into logical groups." actions={<Button onClick={handleCreate}><Plus className="size-4" /> New Collection</Button>} />

      {isError && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{(error as any)?.message}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i=> <Skeleton key={i} className="h-32" />)}
        </div>
      ) : !data?.data || data.data.length===0 ? (
        <EmptyState icon={FolderKanban} title="No collections yet" description="Create collections to keep related links together." actionLabel="New Collection" onAction={handleCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map(c=> (
            <Card key={c.id} className="group hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted shrink-0"><FolderKanban className="size-5 text-muted-foreground" /></div>
                    <div className="min-w-0">
                      <Link to={`/links?collectionId=${c.id}`} className="font-semibold text-sm hover:text-primary truncate block">{c.name}</Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="size-3" /> {c._count?.links ?? 0} links</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button variant="ghost" size="icon-xs" onClick={()=> handleEdit(c)}><Edit2 className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={()=> handleDelete(c.id, c.name)} className="text-destructive hover:bg-destructive/10"><Trash className="size-3.5" /></Button>
                  </div>
                </div>
                {c.description && <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">{c.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CollectionModal isOpen={isModalOpen} onClose={()=> setIsModalOpen(false)} collection={editingCollection} />
    </div>
  );
}
