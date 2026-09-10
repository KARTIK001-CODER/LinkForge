import { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateLinkFormData } from '../schemas/createLinkSchema';
import { createLinkSchema } from '../schemas/createLinkSchema';
import { useCreateLink } from '../api/useCreateLink';
import { useGetCollections } from '../../collections/api/useGetCollections';
import { Settings, CheckCircle2, AlertCircle, Link2, Copy, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

export function CreateLinkForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { mutateAsync, isPending, error, data } = useCreateLink();
  const { data: collectionsData } = useGetCollections();
  
  const { register, handleSubmit, formState: { errors } } = useRHForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  const onSubmit = async (formData: CreateLinkFormData) => {
    const payload = {
      destinationUrl: formData.destinationUrl,
      customAlias: formData.customAlias || undefined,
      password: formData.password || undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      collectionId: formData.collectionId || undefined,
    };
    await mutateAsync(payload);
  };

  if (data?.success) {
    return (
      <div className="mx-auto max-w-[560px]">
        <Card className="text-center p-8">
          <CheckCircle2 className="mx-auto size-12 text-success mb-4" />
          <h2 className="text-xl font-semibold">Smart Link Created</h2>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted p-3">
            <span className="flex-1 truncate font-mono text-sm">{data.data.shortUrl}</span>
            <Button size="sm" onClick={()=> navigator.clipboard.writeText(data.data.shortUrl)}><Copy className="size-4" /> Copy</Button>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Link to={`/links/${data.data.alias}`}><Button variant="outline" size="sm">View Link <ArrowRight className="size-4" /></Button></Link>
            <Button size="sm" onClick={()=> window.location.reload()}>Create Another</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Smart Link</h1>
        <p className="text-sm text-muted-foreground mt-1">Shorten your URL and add powerful routing rules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="size-4 text-primary" /> Destination</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label className="text-sm font-medium">Destination URL *</label>
              <Input {...register('destinationUrl')} placeholder="https://example.com/very-long-url..." className="mt-1.5" />
              {errors.destinationUrl && <p className="text-xs text-destructive mt-1">{errors.destinationUrl.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Custom Alias</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">/ </span>
                  <Input {...register('customAlias')} placeholder="my-campaign" />
                </div>
                {errors.customAlias && <p className="text-xs text-destructive mt-1">{errors.customAlias.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Collection</label>
                <select {...register('collectionId')} className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-card px-3 text-sm">
                  <option value="">None</option>
                  {collectionsData?.data?.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <button type="button" onClick={()=> setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <Settings className="size-4" /> {showAdvanced ? "Hide advanced" : "Show advanced"} <span className="text-xs rounded bg-muted px-1.5 py-0.5 border border-border">optional</span>
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input {...register('password')} type="password" placeholder="Protect link" className="mt-1.5" />
                    {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiration</label>
                    <Input {...register('expiresAt')} type="datetime-local" className="mt-1.5" />
                    {errors.expiresAt && <p className="text-xs text-destructive mt-1">{errors.expiresAt.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input {...register('tags')} placeholder="marketing, social, q4" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Comma separated</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" /> {(error as any).message}
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Forging link…" : "Create Smart Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
