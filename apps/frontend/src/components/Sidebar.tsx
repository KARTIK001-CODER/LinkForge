import { Link, useSearchParams } from 'react-router-dom';
import { Home, Star, Archive, Folder, Plus } from 'lucide-react';
import { useGetCollections } from '../features/collections/api/useGetCollections';
import { useState } from 'react';
import { CollectionModal } from '../features/collections/components/CollectionModal';

export const Sidebar = () => {
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useGetCollections();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentCollectionId = searchParams.get('collectionId');
  const isFavorite = searchParams.get('isFavorite') === 'true';
  const status = searchParams.get('status');
  
  const isAllLinks = !currentCollectionId && !isFavorite && !status;

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block overflow-y-auto">
        <div className="p-4">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Smart Views</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                    isAllLinks ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 mr-3" />
                  All Links
                </Link>
              </li>
              <li>
                <Link
                  to="/?isFavorite=true"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                    isFavorite ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4 mr-3" />
                  Favorites
                </Link>
              </li>
              <li>
                <Link
                  to="/?status=ARCHIVED"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                    status === 'ARCHIVED' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Archive className="w-4 h-4 mr-3" />
                  Archived
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collections</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="p-1 hover:bg-gray-100 rounded-md transition text-gray-500 hover:text-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-md"></div>)}
              </div>
            ) : (
              <ul className="space-y-1">
                {data?.data?.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      to={`/?collectionId=${collection.id}`}
                      className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition ${
                        currentCollectionId === collection.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Folder className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="truncate">{collection.name}</span>
                      </div>
                      <span className={`text-xs ${currentCollectionId === collection.id ? 'text-blue-500' : 'text-gray-400'}`}>
                        {collection._count?.links || 0}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <CollectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
