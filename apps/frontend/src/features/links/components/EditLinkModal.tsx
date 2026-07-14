import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useEditLink } from '../api/useEditLink';
import { useGetCollections } from '../../collections/api/useGetCollections';
import type { LinkItem } from '../api/useGetLinks';

const editLinkSchema = z.object({
  destinationUrl: z.string().url("Must be a valid URL").max(2048, "URL too long"),
  title: z.string().max(100, "Title must be under 100 characters").optional(),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  isActive: z.boolean().optional(),
  tags: z.string().optional(), // We'll handle comma-separated tags
  collectionId: z.string().uuid().optional().nullable().or(z.literal('')),
});

type EditLinkFormValues = z.infer<typeof editLinkSchema>;

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkItem;
}

export function EditLinkModal({ isOpen, onClose, link }: EditLinkModalProps) {
  const { mutate, isPending, isError, error, isSuccess } = useEditLink(link.id);
  const { data: collectionsData } = useGetCollections();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditLinkFormValues>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      destinationUrl: link.destinationUrl,
      title: link.title || '',
      description: link.description || '',
      isActive: link.status === 'ACTIVE',
      tags: link.tags ? link.tags.join(', ') : '',
      collectionId: link.collectionId || '',
    },
  });

  // Reset form when link changes
  useEffect(() => {
    reset({
      destinationUrl: link.destinationUrl,
      title: link.title || '',
      description: link.description || '',
      isActive: link.status === 'ACTIVE',
      tags: link.tags ? link.tags.join(', ') : '',
      collectionId: link.collectionId || '',
    });
  }, [link, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: EditLinkFormValues) => {
    const payload = {
      destinationUrl: data.destinationUrl,
      title: data.title || null,
      description: data.description || null,
      isActive: data.isActive,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      collectionId: data.collectionId || null,
    };

    mutate(payload, {
      onSuccess: () => {
        setTimeout(() => {
          onClose();
        }, 1500); // Wait a bit to show success message
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg p-6 mx-auto bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Edit Smart Link</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
            Link updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isError && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                {error?.message || 'Failed to update link.'}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alias (Immutable)
              </label>
              <input
                type="text"
                value={link.alias}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                title="Alias cannot be changed to prevent broken links."
              />
              <p className="text-xs text-gray-500 mt-1">
                Aliases cannot be changed to ensure your shared links never break.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination URL *
              </label>
              <input
                type="url"
                {...register('destinationUrl')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.destinationUrl ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.destinationUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.destinationUrl.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                {...register('tags')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. marketing, summer-sale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
              <select
                {...register('collectionId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">None / Uncategorized</option>
                {collectionsData?.data?.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center mt-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                )}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Link is active
              </label>
            </div>

            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
// But we can't `npm i @hookform/resolvers` right now to be safe, unless it's already there.
// Let's assume `@hookform/resolvers/zod` might be missing or present, I'll use standard react-hook-form if I have to.
// I will rewrite this file in the next step if I need to adjust it for dependencies.
