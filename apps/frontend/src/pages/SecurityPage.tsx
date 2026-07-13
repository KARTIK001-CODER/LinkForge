import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/api/auth';
import { Eye, EyeOff, Shield, Smartphone, Trash2, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import axios from 'axios';

interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const { user, logoutAll } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await axios.get('/api/v1/auth/sessions');
      setSessions(response.data.sessions);
    } catch {
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus('loading');
    try {
      await axios.post('/api/v1/auth/change-password', { currentPassword, newPassword });
      setPasswordStatus('success');
      setPasswordMessage('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordStatus('idle'), 5000);
    } catch (err: any) {
      setPasswordStatus('error');
      setPasswordMessage(err?.response?.data?.error?.message || 'Failed to change password');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await axios.delete(`/api/v1/auth/sessions/${sessionId}`);
      loadSessions();
    } catch {}
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    setSessions([]);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Security Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Change Password
        </h2>

        {passwordStatus !== 'idle' && (
          <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
            passwordStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {passwordStatus === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {passwordMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input type={showPasswords ? 'text' : 'password'} value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <div className="relative">
              <input type={showPasswords ? 'text' : 'password'} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={passwordStatus === 'loading'}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {passwordStatus === 'loading' ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Active Sessions
          </h2>
          {sessions.length > 0 && (
            <button onClick={handleLogoutAll}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
              <LogOut className="w-4 h-4" />
              Log out all
            </button>
          )}
        </div>

        {isLoadingSessions ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-100'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {session.deviceInfo || 'Unknown device'}
                    </span>
                    {session.isCurrent && (
                      <span className="text-xs text-blue-600 font-medium">Current</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {session.ipAddress || 'Unknown IP'} · {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
