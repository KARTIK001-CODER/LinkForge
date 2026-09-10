import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../features/auth/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try { await login(email, password, rememberMe); }
    catch (err: any) { setError(err?.response?.data?.error?.message || 'Invalid email or password'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex w-[46%] flex-col justify-between border-r border-border bg-card p-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Link2 className="size-4" /></div>
          <span className="text-sm font-semibold">LinkForge</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Powerful link infrastructure, made simple.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Create smart links with custom aliases, password protection, A/B routing and real-time analytics — trusted by product & marketing teams.</p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-muted p-4"><p className="text-lg font-semibold">10M+</p><p className="text-xs text-muted-foreground">clicks tracked</p></div>
            <div className="rounded-xl border border-border bg-muted p-4"><p className="text-lg font-semibold">99.9%</p><p className="text-xs text-muted-foreground">uptime</p></div>
            <div className="rounded-xl border border-border bg-muted p-4"><p className="text-lg font-semibold">&lt;30ms</p><p className="text-xs text-muted-foreground">redirect</p></div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 LinkForge</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-[420px] border-border">
          <CardHeader>
            <div className="lg:hidden flex items-center gap-2 mb-2"><div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Link2 className="size-4" /></div><span className="font-semibold">LinkForge</span></div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="size-4 shrink-0 mt-0.5" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={email} onChange={e=> setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="relative mt-1.5">
                  <Input type={showPassword ? "text":"password"} required value={password} onChange={e=> setPassword(e.target.value)} placeholder="Enter password" className="pr-10" />
                  <button type="button" onClick={()=> setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"><span className="sr-only">toggle</span>{showPassword ? <EyeOff className="size-4"/>:<Eye className="size-4"/>}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rememberMe} onChange={e=> setRememberMe(e.target.checked)} className="rounded border-border" /> Remember me</label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? "..." : "Sign in"}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
