import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Custom fetcher for password verification
const verifyPassword = async (alias: string, password: string) => {
  const { data } = await axios.post(`${API_URL}/links/${alias}/verify`, { password });
  return data;
};

export default function ProtectedPage() {
  const { alias } = useParams<{ alias: string }>();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mutation = useMutation({
    mutationFn: (pwd: string) => verifyPassword(alias!, pwd),
    onSuccess: (data) => {
      if (data.success && data.data?.token) {
        // Redirect back to the shortlink using the token
        // E.g., /:alias?token=...
        // We can extract the base url from API_URL by removing /api/v1
        const backendBaseUrl = API_URL.replace('/api/v1', '');
        window.location.href = `${backendBaseUrl}/${alias}?token=${data.data.token}`;
      } else {
        setErrorMsg('Incorrect password');
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || 'Incorrect password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!password) {
      setErrorMsg('Password is required');
      return;
    }
    mutation.mutate(password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Protected Link</h2>
            <p className="text-sm text-gray-500 mt-2">
              This link requires a password to proceed.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errorMsg ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errorMsg && (
                <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Unlocking...
                  </>
                ) : (
                  'Unlock'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
