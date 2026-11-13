import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldAlert } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin@alhaditha.com');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a192f] px-4">
      <div className="max-w-md w-full bg-[#112240] border border-slate-700/80 rounded-[12px] shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-[12px] p-4 shadow-lg mb-4">
            <img
              src={logoImg}
              alt="Al Haditha Energy"
              className="h-12 w-auto object-contain mx-auto"
            />
          </div>
          <h2 className="text-[22px] font-semibold text-white leading-[1.25]">Hostel Allotment Management</h2>
          <p className="text-[13px] text-slate-400 mt-1">
            Al Haditha Energy &bull; Secure Administrator Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-[10px] bg-rose-950/40 border border-rose-800 text-rose-300 text-[13px] flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1.5">
              Username / Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0a192f] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00a651] focus:border-transparent text-[14px]"
              placeholder="admin@alhaditha.com"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#0a192f] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00a651] focus:border-transparent text-[14px]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#00a651] hover:bg-[#008c44] disabled:opacity-50 text-white font-medium rounded-[10px] transition duration-150 flex items-center justify-center gap-2 text-[14px] mt-3"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};
