import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/api/auth';
import { Shield, Smartphone, Trash2, LogOut, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

interface Session { id:string; deviceInfo:string|null; ipAddress:string|null; createdAt:string; expiresAt:string; isCurrent:boolean; }

export default function SecurityPage(){
  const { logoutAll } = useAuth();
  const [sessions,setSessions]=useState<Session[]>([]);
  const [loading,setLoading]=useState(true);
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [show,setShow]=useState(false);
  const [status,setStatus]=useState<'idle'|'loading'|'success'|'error'>('idle');
  const [msg,setMsg]=useState('');

  useEffect(()=>{ (async()=>{ try{ const r=await axios.get('/api/v1/auth/sessions'); setSessions(r.data.sessions);} finally{ setLoading(false);} })(); }, []);

  const handleChange=async(e:React.FormEvent)=>{ e.preventDefault(); setStatus('loading'); try{ await axios.post('/api/v1/auth/change-password',{currentPassword,newPassword}); setStatus('success'); setMsg('Password changed'); setCurrentPassword(''); setNewPassword('');} catch(err:any){ setStatus('error'); setMsg(err?.response?.data?.error?.message||'Failed'); } };

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Security</h1><p className="text-sm text-muted-foreground mt-1">Manage password and sessions.</p></div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-5 text-primary" /> Change Password</CardTitle></CardHeader>
        <CardContent>
          {status!=='idle' && <div className={`mb-4 rounded-lg border p-3 text-sm ${status==='success' ? "bg-success/10 border-success/20 text-success":"bg-destructive/10 border-destructive/20 text-destructive"}`}>{msg}</div>}
          <form onSubmit={handleChange} className="space-y-4">
            <div><label className="text-sm font-medium">Current password</label><Input type={show?"text":"password"} value={currentPassword} onChange={e=> setCurrentPassword(e.target.value)} required className="mt-1.5" /></div>
            <div>
              <label className="text-sm font-medium">New password</label>
              <div className="relative mt-1.5"><Input type={show?"text":"password"} value={newPassword} onChange={e=> setNewPassword(e.target.value)} required minLength={8} className="pr-10" /><button type="button" onClick={()=> setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">{show?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div>
            </div>
            <Button type="submit" disabled={status==='loading'}>{status==='loading'?"Changing...":"Change password"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Smartphone className="size-5 text-primary" /> Active Sessions</CardTitle>
          {sessions.length>0 && <Button variant="ghost" size="sm" onClick={async()=> {await logoutAll(); setSessions([]);}} className="text-destructive"><LogOut className="size-4" /> Log out all</Button>}
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{[1,2].map(i=> <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div> : sessions.length===0 ? <p className="text-sm text-muted-foreground">No active sessions.</p> : (
            <div className="space-y-2">
              {sessions.map(s=> (
                <div key={s.id} className={`flex items-center justify-between rounded-xl border p-3 ${s.isCurrent ? "border-primary/20 bg-primary/5":"border-border"}`}>
                  <div><p className="text-sm font-medium truncate">{s.deviceInfo||'Unknown device'} {s.isCurrent && <span className="text-xs text-primary">· Current</span>}</p><p className="text-xs text-muted-foreground">{s.ipAddress||'Unknown IP'} · {new Date(s.createdAt).toLocaleDateString()}</p></div>
                  {!s.isCurrent && <Button variant="ghost" size="icon-xs" onClick={async()=> {await axios.delete(`/api/v1/auth/sessions/${s.id}`); setSessions(prev=> prev.filter(x=> x.id!==s.id));}}><Trash2 className="size-4" /></Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
