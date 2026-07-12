import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, Save } from 'lucide-react';

interface TrafficVariant {
  url: string;
  weight: number;
}

export function TrafficManager({ linkId, initialVariants }: { linkId: string, initialVariants?: TrafficVariant[] | null }) {
  const queryClient = useQueryClient();
  const [variants, setVariants] = useState<TrafficVariant[]>(
    initialVariants && initialVariants.length > 0 
      ? initialVariants 
      : [{ url: '', weight: 50 }, { url: '', weight: 50 }]
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if external data changes
  useEffect(() => {
    if (initialVariants && initialVariants.length > 0) {
      setVariants(initialVariants);
    }
  }, [initialVariants]);

  const updateVariants = useMutation({
    mutationFn: async (data: TrafficVariant[]) => {
      const res = await fetch(`/api/v1/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trafficVariants: data })
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update traffic rules');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['link', linkId] }); // Assuming parent query key is ['link', alias] or id
      setIsEditing(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    }
  });

  const handleWeightChange = (index: number, newWeight: number) => {
    if (newWeight < 1 || newWeight > 99) return;
    
    // Auto-balance the other variant (since we strictly support 2 variants for V1)
    const newVariants = [...variants];
    newVariants[index].weight = newWeight;
    const otherIndex = index === 0 ? 1 : 0;
    newVariants[otherIndex].weight = 100 - newWeight;
    
    setVariants(newVariants);
  };

  const handleUrlChange = (index: number, url: string) => {
    const newVariants = [...variants];
    newVariants[index].url = url;
    setVariants(newVariants);
  };

  const handleSave = () => {
    if (!variants[0].url || !variants[1].url) {
      setError('Both variants must have a valid URL.');
      return;
    }
    updateVariants.mutate(variants);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8 border border-purple-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <Percent className="w-5 h-5 mr-2 text-purple-500" /> 
            Traffic Distribution
          </h3>
          <p className="text-sm text-gray-500 mt-1">Split traffic for A/B testing and rollouts.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-purple-600 hover:text-purple-500"
          >
            {initialVariants && initialVariants.length > 0 ? 'Edit' : 'Configure'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      {!isEditing && initialVariants && initialVariants.length > 0 ? (
        <div className="space-y-4">
          {initialVariants.map((v, i) => (
            <div key={i} className="flex items-center">
              <div className="w-16 text-xl font-bold text-gray-700">{v.weight}%</div>
              <div className="flex-1 bg-gray-100 rounded-md p-3 text-sm text-gray-600 break-all border-l-4 border-purple-400">
                {v.url}
              </div>
            </div>
          ))}
        </div>
      ) : isEditing ? (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded p-4 text-xs text-purple-800">
            <strong>Note:</strong> Traffic is split deterministically using the visitor's IP and Device. The same user will always see the same variant.
          </div>
          
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 sm:col-span-9">
              <label className="block text-xs font-medium text-gray-700 mb-1">Variant A URL</label>
              <input type="text" value={variants[0].url} onChange={e => handleUrlChange(0, e.target.value)} placeholder="https://" className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
            </div>
            <div className="col-span-12 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Weight (%)</label>
              <input type="number" min="1" max="99" value={variants[0].weight} onChange={e => handleWeightChange(0, parseInt(e.target.value))} className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-12 sm:col-span-9">
              <label className="block text-xs font-medium text-gray-700 mb-1">Variant B URL</label>
              <input type="text" value={variants[1].url} onChange={e => handleUrlChange(1, e.target.value)} placeholder="https://" className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
            </div>
            <div className="col-span-12 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Weight (%)</label>
              <input type="number" min="1" max="99" value={variants[1].weight} onChange={e => handleWeightChange(1, parseInt(e.target.value))} className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                if (initialVariants) setVariants(initialVariants);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateVariants.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Config
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No traffic distribution configured. 100% of traffic goes to the default link destination.</div>
      )}
    </div>
  );
}
