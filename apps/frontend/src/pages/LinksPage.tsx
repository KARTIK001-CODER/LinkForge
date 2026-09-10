import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useGetLinks } from '../features/links/api/useGetLinks';
import { DashboardTable } from '../features/links/components/DashboardTable';
import { Search, Filter } from 'lucide-react';
import { useGetCollection } from '../features/collections/api/useGetCollection';
import { useDeleteCollection } from '../features/collections/api/useDeleteCollection';
import { CollectionModal } from '../features/collections/components/CollectionModal';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LinksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const tags = searchParams.get('tags') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const isFavorite = searchParams.get('isFavorite') || '';
  const collectionId = searchParams.get('collectionId') || undefined;

  const [searchInput, setSearchInput] = useState(search);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useGetLinks({ page, limit, search, status, tags, isFavorite, collectionId, sortBy, sortOrder });
  const { data: collectionData } = useGetCollection(collectionId ?? null);
  const deleteCollection = useDeleteCollection();

  useEffect(() => {
    const timer = setTimeout(() => { if (searchInput !== search) updateParams({ search: searchInput, page: '1' }); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => { if (value) newParams.set(key, value); else newParams.delete(key); });
    setSearchParams(newParams);
  };
  const handleSortChange = (column: string) => {
    if (sortBy === column) updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    else updateParams({ sortBy: column, sortOrder: 'desc' });
  };
  const handleDeleteCollection = async () => {
    if (confirm('Delete this collection? Links will remain.')) {
      if (!collectionId) return;
      await deleteCollection.mutateAsync(collectionId);
      navigate('/links');
    }
  };
  const collection = collectionData?.data;
  const isCollectionView = !!collectionId && !!collection;
  const isFavView = isFavorite === 'true';
  const isArchivedView = status === 'ARCHIVED';

  const getTitle = () => {
    if (isCollectionView) return collection!.name;
    if (isFavView) return 'Favorites';
    if (isArchivedView) return 'Archived';
    return 'Links';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collection?.description || (isCollectionView ? `${data?.data?.meta.totalItems ?? 0} links in this collection` : isFavView ? 'Your starred links' : isArchivedView ? 'Hidden from dashboard but still routing' : 'Manage all your smart links.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCollectionView && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteCollection} className="text-destructive hover:bg-destructive/10">Delete</Button>
            </>
          )}
          <Link to="/create"><Button size="sm">Create Link</Button></Link>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by alias or URL…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: '1' })} className="h-9 rounded-lg border border-border bg-card px-3 text-sm">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="DISABLED">Disabled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <Button variant={isFavorite === 'true' ? 'default' : 'outline'} size="sm" onClick={() => updateParams({ isFavorite: isFavorite === 'true' ? '' : 'true', page: '1' })}>Favorites</Button>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input placeholder="Tags" value={tags} onChange={(e) => updateParams({ tags: e.target.value, page: '1' })} className="h-9 rounded-lg border border-border bg-card pl-8 pr-3 text-sm w-[140px]" />
            </div>
          </div>
        </div>
      </Card>

      {isError && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">Error: {(error as any)?.message}</div>}

      <DashboardTable links={data?.data?.items || []} isLoading={isLoading} sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />

      {data?.data?.meta && data.data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.data.meta.totalItems)} of {data.data.meta.totalItems}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.data.meta.totalPages} onClick={() => updateParams({ page: String(page + 1) })}>Next</Button>
          </div>
        </div>
      )}

      {collection && <CollectionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} collection={collection} />}
    </div>
  );
}
