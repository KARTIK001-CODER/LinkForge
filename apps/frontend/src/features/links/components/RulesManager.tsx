import axios from 'axios';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface RedirectRule {
  id: string;
  priority: number;
  destinationUrl: string;
  conditions: any[];
}

export function RulesManager({ linkId }: { linkId: string }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  
  // Basic form state
  const [destinationUrl, setDestinationUrl] = useState('');
  const [type, setType] = useState('country');
  const [operator, setOperator] = useState('eq');
  const [value, setValue] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rules', linkId],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/links/${linkId}/rules`);
      const json = await res.json();
      return json.data as RedirectRule[];
    }
  });

  const createRule = useMutation({
    mutationFn: async (rule: any) => {
      const res = await axios.post(`/api/v1/links/${linkId}/rules`, rule);
      if (!res.ok) throw new Error('Failed to create rule');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', linkId] });
      setIsAdding(false);
      setDestinationUrl('');
      setValue('');
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await axios.delete(`/api/v1/links/${linkId}/rules/${ruleId}`);
      if (!res.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', linkId] });
    }
  });

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;
  if (isError) return <div className="text-red-500">Failed to load rules.</div>;

  const rules = data || [];

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Smart Redirect Rules</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Rule
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Rule</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="country">Country</option>
                <option value="device">Device</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Operator</label>
              <select value={operator} onChange={e => setOperator(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                <option value="eq">Equals (=)</option>
                <option value="neq">Not Equals (!=)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Value (e.g. US, mobile)</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Destination URL</label>
              <input type="text" value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                createRule.mutate({
                  priority: rules.length + 1,
                  destinationUrl,
                  conditions: [{ type, operator, value }]
                });
              }}
              disabled={!value || !destinationUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 && !isAdding ? (
        <div className="text-center py-6 text-gray-500 text-sm">No rules configured yet.</div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
              <div className="flex items-center">
                <div className="flex flex-col items-center mr-4">
                  <button className="text-gray-400 hover:text-gray-600"><ArrowUp className="w-4 h-4" /></button>
                  <span className="text-xs font-bold">{rule.priority}</span>
                  <button className="text-gray-400 hover:text-gray-600"><ArrowDown className="w-4 h-4" /></button>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {rule.conditions.map((c: any, i: number) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {c.type} {c.operator} {c.value}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Redirects to: <span className="font-medium text-gray-900">{rule.destinationUrl}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteRule.mutate(rule.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
