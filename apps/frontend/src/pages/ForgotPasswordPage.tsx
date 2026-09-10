import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'>('idle');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('loading');
    try { await axios.post('/api/v1/auth/forgot-password', { email }); setStatus('success'); setMessage('If an account with that email exists, a reset link has been sent.'); }
    catch { setStatus('success'); setMessage('If an account with that email exists, a reset link has been sent.'); }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Link2 className="size-5" /></Link>
          <CardTitle>Forgot password?</CardTitle>
          <CardDescription>No worries, we'll send you reset instructions.</CardDescription>
        </CardHeader>
        <CardContent>
          {status==='success' ? (
            <div className="text-center py-4"><CheckCircle className="size-10 text-success mx-auto mb-3" /><p className="text-sm">{message}</p><Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Back to sign in</Link></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email address</label>
                <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input type="email" required value={email} onChange={e=> setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" /></div>
              </div>
              <Button type="submit" disabled={status==='loading'} className="w-full">{status==='loading'? 'Sending...':'Send reset link'}</Button>
            </form>
          )}
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to sign in</Link>
        </CardContent>
      </Card>
    </div>
  );
}
