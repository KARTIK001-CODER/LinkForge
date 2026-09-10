import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Link2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [error, setError] = useState('');
  const handleSubmit = async (e:React.FormEvent)=>{ e.preventDefault(); if(password.length<8) return; setStatus('loading'); setError(''); try{ await axios.post('/api/v1/auth/reset-password',{token,password}); setStatus('success');}catch(err:any){ setStatus('error'); setError(err?.response?.data?.error?.message||'Failed'); } };
  if (!token) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><AlertCircle className="size-10 text-destructive mx-auto mb-3" /><h2 className="font-bold">Invalid reset link</h2><Link to="/forgot-password" className="text-primary text-sm hover:underline">Request a new one</Link></div></div>;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center"><div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Link2 className="size-5" /></div><CardTitle>Reset your password</CardTitle></CardHeader>
        <CardContent>
          {status==='success' ? <div className="text-center py-4"><CheckCircle className="size-10 text-success mx-auto mb-3" /><p className="text-sm mb-4">You can now sign in with your new password.</p><Link to="/login"><Button>Sign in</Button></Link></div> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="size-4" />{error}</div>}
              <div>
                <label className="text-sm font-medium">New password</label>
                <div className="relative mt-1.5"><Input type={show?"text":"password"} required value={password} onChange={e=> setPassword(e.target.value)} placeholder="Enter new password" className="pr-10" /><button type="button" onClick={()=> setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">{show?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div>
                <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters.</p>
              </div>
              <Button type="submit" disabled={status==='loading'} className="w-full">{status==='loading'?'Resetting...':'Reset password'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
