import axios from 'axios';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface RedirectRule { id: string; priority: number; destinationUrl: string; conditions: Array<{type:string; operator:string; value:string}> }

export function RulesManager({ linkId }: { linkId: string }) {
  const qc = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [type, setType] = useState('country');
  const [operator, setOperator] = useState('eq');
  const [value, setValue] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rules', linkId],
    queryFn: async () => { const r = await axios.get(`/api/v1/links/${linkId}/rules`); return r.data.data as RedirectRule[]; },
  });

  const createRule = useMutation({
    mutationFn: async (rule: { priority: number; destinationUrl: string; conditions: unknown[] }) => (await axios.post(`/api/v1/links/${linkId}/rules`, rule)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rules', linkId] }); setIsAdding(false); setDestinationUrl(''); setValue(''); },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => await axios.delete(`/api/v1/links/${linkId}/rules/${ruleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules', linkId] }),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError) return <Card className="p-6 text-sm text-destructive">Failed to load rules.</Card>;

  const rules = data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Zap className="size-4 text-primary" /> Smart Redirect Rules</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Route visitors based on country, device, and more.</p>
        </div>
        <Button size="sm" onClick={()=> setIsAdding(!isAdding)}><Plus className="size-4" /> Add Rule</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-medium">Create New Rule</p>
            {/* Visual rule builder */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-[10px]">IF</span> Condition</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select value={type} onChange={e=> setType(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm">
                  <option value="country">Country</option>
                  <option value="device">Device</option>
                  <option value="region">Region</option>
                  <option value="day_of_week">Day of Week</option>
                  <option value="browser">Browser</option>
                </select>
                <select value={operator} onChange={e=> setOperator(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm">
                  <option value="eq">is</option>
                  <option value="neq">is not</option>
                </select>
                <Input placeholder="e.g. IN, mobile, Chrome" value={value} onChange={e=> setValue(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-2"><span className="rounded bg-success px-1.5 py-0.5 text-white text-[10px]">THEN</span> Redirect to</div>
              <Input placeholder="https://example.com/target" value={destinationUrl} onChange={e=> setDestinationUrl(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={()=> setIsAdding(false)}>Cancel</Button>
              <Button size="sm" disabled={!value || !destinationUrl} onClick={()=> createRule.mutate({ priority: rules.length+1, destinationUrl, conditions: [{ type, operator, value }] })}>Save Rule</Button>
            </div>
          </div>
        )}

        {rules.length===0 && !isAdding ? (
          <EmptyState icon={Zap} title="No smart rules yet" description="Create your first rule to route visitors intelligently." />
        ) : (
          <div className="space-y-3">
            {rules.map((rule)=> (
              <div key={rule.id} className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-muted border border-border text-xs font-bold">{rule.priority}</span>
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.conditions.map((c,i)=> (
                        <Badge key={i} variant="secondary" className="font-mono text-xs">IF {c.type} {c.operator} {c.value}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm">→ <span className="font-medium font-mono text-primary">{rule.destinationUrl}</span></p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={()=> deleteRule.mutate(rule.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
