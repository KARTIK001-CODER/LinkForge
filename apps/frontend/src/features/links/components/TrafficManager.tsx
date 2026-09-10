import axios from 'axios';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Split, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

interface TrafficVariant { url: string; weight: number; }

export function TrafficManager({ linkId, initialVariants }: { linkId: string; initialVariants?: TrafficVariant[] | null }) {
  const qc = useQueryClient();
  const [variants, setVariants] = useState<TrafficVariant[]>(
    initialVariants && initialVariants.length > 0 ? initialVariants : [{ url: '', weight: 70 }, { url: '', weight: 30 }],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=> { if (initialVariants && initialVariants.length>0) setVariants(initialVariants); }, [initialVariants]);

  const updateVariants = useMutation({
    mutationFn: async (data: TrafficVariant[]) => (await axios.patch(`/api/v1/links/${linkId}`, { trafficVariants: data })).data,
    onSuccess: ()=> { qc.invalidateQueries({ queryKey:['link'] }); setIsEditing(false); setError(null); },
    onError: (err:any)=> setError(err?.response?.data?.error?.message || err.message || 'Failed'),
  });

  const handleWeightChange = (idx:number, w:number)=> {
    if(w<1||w>99) return;
    const nv=[...variants]; nv[idx].weight=w; nv[idx===0?1:0].weight=100-w; setVariants(nv);
  };
  const handleUrlChange=(idx:number, url:string)=> { const nv=[...variants]; nv[idx].url=url; setVariants(nv); }

  const handleSave=()=>{
    if(!variants[0].url || !variants[1].url) { setError('Both variants need a URL.'); return; }
    if(variants[0].weight + variants[1].weight !== 100) { setError('Total must be 100%'); return; }
    updateVariants.mutate(variants);
  };

  const hasConfig = initialVariants && initialVariants.length>0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2"><Split className="size-4 text-primary" /> Traffic Routing</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Split visitors between destinations. Total must equal 100%.</p>
        </div>
        {!isEditing && <Button variant="outline" size="sm" onClick={()=> setIsEditing(true)}>{hasConfig? "Edit":"Configure"}</Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {!isEditing && hasConfig ? (
          <div className="space-y-4">
            {initialVariants!.map((v,i)=> (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Variant {String.fromCharCode(65+i)}</span>
                  <span className="text-sm font-bold tabular-nums">{v.weight}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${v.weight}%` }} />
                </div>
                <p className="break-all rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs">{v.url}</p>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">Total</span><span className="font-bold">100%</span>
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-5">
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Traffic is split deterministically by IP + device. Same visitor always sees same variant.</div>
            {variants.map((v,i)=> (
              <div key={i} className="space-y-2 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variant {String.fromCharCode(65+i)}</span>
                  <span className="text-xs text-muted-foreground">{v.weight}%</span>
                </div>
                <Input placeholder="https://example.com/variant" value={v.url} onChange={e=> handleUrlChange(i, e.target.value)} />
                <div className="flex items-center gap-3">
                  <input type="range" min={1} max={99} value={v.weight} onChange={e=> handleWeightChange(i, parseInt(e.target.value))} className="flex-1 accent-primary" />
                  <Input type="number" min={1} max={99} value={v.weight} onChange={e=> handleWeightChange(i, parseInt(e.target.value)||0)} className="w-20" />
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${v.weight}%` }} /></div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={()=> { setIsEditing(false); if(initialVariants) setVariants(initialVariants); setError(null); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={updateVariants.isPending}><Save className="size-4" /> Save</Button>
            </div>
          </div>
        ) : (
          <EmptyState icon={Split} title="No traffic routing" description="100% of traffic goes to the default destination. Configure A/B variants to split." />
        )}
      </CardContent>
    </Card>
  );
}
