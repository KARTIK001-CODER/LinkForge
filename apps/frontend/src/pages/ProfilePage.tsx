import { useState } from 'react';
import { useAuth } from '../features/auth/api/auth';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit= async (e:React.FormEvent)=>{
    e.preventDefault(); setStatus('loading');
    try { const r= await axios.patch('/api/v1/auth/profile', { displayName, username }); updateUser(r.data); setStatus('success'); setMessage('Profile updated'); setTimeout(()=> setStatus('idle'),3000); }
    catch(err:any){ setStatus('error'); setMessage(err?.response?.data?.error?.message || 'Failed'); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 pb-6 border-b border-border mb-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">{(user?.displayName||user?.email||'U')[0].toUpperCase()}</div>
            <div>
              <p className="font-semibold">{user?.displayName || user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant={user?.isVerified ? "success":"warning"} className="mt-1">{user?.isVerified? "Verified":"Not verified"}</Badge>
            </div>
          </div>

          {status!=='idle' && <div className={`mb-4 flex gap-2 rounded-lg border p-3 text-sm ${status==='success' ? "bg-success/10 border-success/20 text-success":"bg-destructive/10 border-destructive/20 text-destructive"}`}>{status==='success'? <CheckCircle className="size-4"/>:<AlertCircle className="size-4"/>}{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium">Email</label><Input value={user?.email||''} disabled className="mt-1.5 bg-muted" /><p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p></div>
            <div><label className="text-sm font-medium">Username</label><Input value={username} onChange={e=> setUsername(e.target.value)} className="mt-1.5" /></div>
            <div><label className="text-sm font-medium">Display name</label><Input value={displayName} onChange={e=> setDisplayName(e.target.value)} className="mt-1.5" /></div>
            <Button type="submit" disabled={status==='loading'}><Save className="size-4" /> {status==='loading'?"Saving...":"Save changes"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
