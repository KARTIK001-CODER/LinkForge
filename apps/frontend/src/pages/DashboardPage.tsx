import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetLinks } from '../features/links/api/useGetLinks';
import { DashboardTable } from '../features/links/components/DashboardTable';
import { Search, Filter, Folder, Trash, Edit2 } from 'lucide-react';
import { useGetCollection } from '../features/collections/api/useGetCollection';
import { useDeleteCollection } from '../features/collections/api/useDeleteCollection';
import { CollectionModal } from '../features/collections/components/CollectionModal';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
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

  const { data, isLoading, isError, error } = useGetLinks({
    page,
    limit,
    search,
    status,
    tags,
    isFavorite,
    collectionId,
    sortBy,
    sortOrder,
  });

  const { data: collectionData } = useGetCollection(collectionId ?? null);
  const deleteCollection = useDeleteCollection();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: '1' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateParams({ sortBy: column, sortOrder: 'desc' });
    }
  };

  const handleDeleteCollection = async () => {
    if (confirm('Are you sure you want to delete this collection? Links will not be deleted.')) {
      try {
        if (!collectionId) return;
        await deleteCollection.mutateAsync(collectionId);
        navigate('/');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const collection = collectionData?.data;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          {collectionId && collection ? (
            <div className="flex items-center gap-3">
              <Folder className="w-8 h-8 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
              <div className="flex gap-2 ml-4">
                <button onClick={() => setIsEditModalOpen(true)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={handleDeleteCollection} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">
              {isFavorite === 'true' ? 'Favorite Links' : status === 'ARCHIVED' ? 'Archived Links' : 'All Links'}
            </h1>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {collection?.description || 'Manage and track all your forged links.'}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by alias or URL..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
            className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses (excluding Archived)</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="DISABLED">Disabled</option>
            <option value="ARCHIVED">Archived (Only)</option>
          </select>
          <button
            onClick={() => updateParams({ isFavorite: isFavorite === 'true' ? '' : 'true', page: '1' })}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isFavorite === 'true' 
                ? 'bg-yellow-50 border-yellow-400 text-yellow-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Favorites Only
          </button>
          <div className="relative flex-1 sm:w-48">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tags..."
              value={tags}
              onChange={(e) => updateParams({ tags: e.target.value, page: '1' })}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">Error loading links: {error?.message}</p>
        </div>
      )}

      <DashboardTable 
        links={data?.data?.items || []} 
        isLoading={isLoading} 
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      {data?.data?.meta && data.data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white text-gray-900 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= data.data.meta.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white text-gray-900 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, data.data.meta.totalItems)}</span> of{' '}
                <span className="font-medium">{data.data.meta.totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => updateParams({ page: String(page - 1) })}
                  disabled={page <= 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                <button
                  onClick={() => updateParams({ page: String(page + 1) })}
                  disabled={page >= data.data.meta.totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {collection && (
        <CollectionModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          collection={collection}
        />
      )}
    </div>
  );
}
