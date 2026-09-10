import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../features/auth/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checks = { length: password.length>=8, upper:/[A-Z]/.test(password), lower:/[a-z]/.test(password), number:/[0-9]/.test(password) };
  const allPass = Object.values(checks).every(Boolean);

  const handleSubmit= async (e:React.FormEvent)=> {
    e.preventDefault(); if(!allPass) return; setError(''); setIsLoading(true);
    try { await register({ email, username, password, displayName: displayName || undefined }); }
    catch(err:any){ setError(err?.response?.data?.error?.message || 'Registration failed'); }
    finally{ setIsLoading(false); }
  };

  const Check=({pass,label}:{pass:boolean; label:string})=>(<span className={`inline-flex items-center gap-1 text-xs ${pass? "text-success":"text-muted-foreground"}`}>{pass? <CheckCircle className="size-3"/>:<span className="size-3 rounded-full border border-border inline-block"/>}{label}</span>);

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-[46%] flex-col justify-between border-r border-border bg-card p-10">
        <Link to="/" className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Link2 className="size-4" /></div><span className="text-sm font-semibold">LinkForge</span></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create your workspace</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Start forging smart links in minutes. Analytics, routing, and collaboration included.</p>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 LinkForge</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-[440px]">
          <CardHeader><CardTitle>Create account</CardTitle><CardDescription>Start forging smart links</CardDescription></CardHeader>
          <CardContent>
            {error && <div className="mb-4 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="size-4 shrink-0"/>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium">Email</label><Input type="email" required value={email} onChange={e=> setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" /></div>
              <div><label className="text-sm font-medium">Username</label><Input required value={username} onChange={e=> setUsername(e.target.value)} placeholder="your-username" className="mt-1.5" /></div>
              <div><label className="text-sm font-medium">Display name <span className="text-muted-foreground font-normal">(optional)</span></label><Input value={displayName} onChange={e=> setDisplayName(e.target.value)} placeholder="Your Name" className="mt-1.5" /></div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative mt-1.5"><Input type={showPassword?"text":"password"} required value={password} onChange={e=> setPassword(e.target.value)} placeholder="Create a strong password" className="pr-10" /><button type="button" onClick={()=> setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">{showPassword? <EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div>
                <div className="mt-2 flex flex-wrap gap-2"><Check pass={checks.length} label="8+ chars" /><Check pass={checks.upper} label="Upper" /><Check pass={checks.lower} label="Lower" /><Check pass={checks.number} label="Number" /></div>
              </div>
              <Button type="submit" disabled={isLoading || !allPass} className="w-full">{isLoading? "...":"Create account"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
