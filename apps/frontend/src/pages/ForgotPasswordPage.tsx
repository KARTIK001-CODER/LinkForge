import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('/api/v1/auth/forgot-password', { email });
      setStatus('success');
      setMessage('If an account with that email exists, a reset link has been sent.');
    } catch {
      setStatus('success');
      setMessage('If an account with that email exists, a reset link has been sent.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <LinkIcon className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-bold text-gray-900">Forgot password?</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          {status === 'success' ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-6">{message}</p>
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="you@example.com" />
                </div>
              </div>

              <button type="submit" disabled={status === 'loading'}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition">
                {status === 'loading' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
