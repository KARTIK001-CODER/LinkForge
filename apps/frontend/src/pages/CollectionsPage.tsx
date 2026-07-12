import { useGetCollections } from '../features/collections/api/useGetCollections';
import { useDeleteCollection } from '../features/collections/api/useDeleteCollection';
import { CollectionModal } from '../features/collections/components/CollectionModal';
import { Folder, Edit2, Trash, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Collection } from '../features/collections/api/types';

export default function CollectionsPage() {
  const { data, isLoading, isError, error } = useGetCollections();
  const deleteCollection = useDeleteCollection();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the collection "${name}"? Links will not be deleted.`)) {
      try {
        await deleteCollection.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 text-sm mt-1">Organize your Smart Links into logical groups.</p>
        </div>
        <button
          onClick={handleCreate}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </button>
      </div>

      {isError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">Error loading collections: {error?.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 h-32 animate-pulse"></div>
          ))}
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No collections</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new collection.</p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              New Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map(collection => (
            <div key={collection.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <Link to={`/?collectionId=${collection.id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition truncate block max-w-[150px]">
                        {collection.name}
                      </Link>
                      <p className="text-sm text-gray-500">{collection._count?.links || 0} links</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => handleEdit(collection)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(collection.id, collection.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {collection.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CollectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        collection={editingCollection}
      />
    </div>
  );
}
