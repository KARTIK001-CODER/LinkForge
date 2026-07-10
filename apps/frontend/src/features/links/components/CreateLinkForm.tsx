import { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateLinkFormData } from '../schemas/createLinkSchema';
import { createLinkSchema } from '../schemas/createLinkSchema';
import { useCreateLink } from '../api/useCreateLink';
import { Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CreateLinkForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { mutateAsync, isPending, error, data } = useCreateLink();
  
  const { register, handleSubmit, formState: { errors } } = useRHForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  const onSubmit = async (formData: CreateLinkFormData) => {
    try {
      const payload = {
        destinationUrl: formData.destinationUrl,
        customAlias: formData.customAlias || undefined,
        password: formData.password || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      };
      await mutateAsync(payload);
    } catch (err) {
      console.error(err);
    }
  };

  if (data?.success) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl w-full mx-auto text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Smart Link Created!</h2>
        <div className="bg-gray-50 p-4 rounded-lg my-6 flex items-center justify-between border border-gray-200">
          <span className="text-gray-800 font-mono text-lg">{data.data.shortUrl}</span>
          <button 
            onClick={() => navigator.clipboard.writeText(data.data.shortUrl)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Copy
          </button>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 font-medium hover:underline"
        >
          Create another link
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Smart Link</h1>
        <p className="text-gray-500 mt-2">Shorten your URL and add powerful routing rules.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL *</label>
          <input
            {...register('destinationUrl')}
            type="url"
            placeholder="https://example.com/very-long-url..."
            className={`w-full px-4 py-3 rounded-lg border ${errors.destinationUrl ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none transition`}
          />
          {errors.destinationUrl && <p className="text-red-500 text-sm mt-1">{errors.destinationUrl.message}</p>}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-5 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Alias</label>
                  <input
                    {...register('customAlias')}
                    type="text"
                    placeholder="my-campaign"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.customAlias ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                  {errors.customAlias && <p className="text-red-500 text-sm mt-1">{errors.customAlias.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Protection</label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Enter password..."
                    className={`w-full px-4 py-2 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                  <input
                    {...register('expiresAt')}
                    type="datetime-local"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.expiresAt ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                  {errors.expiresAt && <p className="text-red-500 text-sm mt-1">{errors.expiresAt.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    {...register('tags')}
                    type="text"
                    placeholder="marketing, social, q4"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Forging Link...' : 'Create Smart Link'}
        </button>
      </form>
    </div>
  );
}
