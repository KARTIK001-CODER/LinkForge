import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCollection } from '../api/useCreateCollection';
import { useUpdateCollection } from '../api/useUpdateCollection';
import { useEffect } from 'react';
import type { Collection } from '../api/types';
import { X } from 'lucide-react';

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection | null;
}

export const CollectionModal = ({ isOpen, onClose, collection }: Props) => {
  const { register, handleSubmit, formState: { errors }, reset } = useHookForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
    }
  });

  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  useEffect(() => {
    if (isOpen) {
      reset({
        name: collection?.name || '',
        description: collection?.description || '',
      });
    }
  }, [isOpen, collection, reset]);

  const onSubmit = async (data: CollectionFormData) => {
    try {
      if (collection) {
        await updateCollection.mutateAsync({ id: collection.id, ...data });
      } else {
        await createCollection.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="Marketing Campaign"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              {...register('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              rows={3}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {(createCollection.isError || updateCollection.isError) && (
            <p className="text-sm text-red-600">
              {(createCollection.error as Error)?.message || (updateCollection.error as Error)?.message || 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCollection.isPending || updateCollection.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {createCollection.isPending || updateCollection.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
