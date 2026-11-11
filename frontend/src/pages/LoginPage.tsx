import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { SketchShieldLogo, ShieldCheck } from '../components/sketch/AnimatedIcons';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { email, password, name, role } : { email, password };

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setAuth(res.user, res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 selection:bg-neutral-900 selection:text-white font-sans">
      <div className="max-w-md w-full bg-[#fdfcf9] border-[2px] border-neutral-950 rounded-2xl p-7 sm:p-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2 border-[1.5px] border-neutral-950 rounded-2xl bg-[#faf8f5] mb-2.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)]">
            <SketchShieldLogo className="w-10 h-10" />
          </div>
          <h1 className="font-sketch font-bold text-2xl text-neutral-950 tracking-wide">
            DEM Platform
          </h1>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Endpoint Health Monitoring & Automated Remediation
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-2.5 border-[1.5px] border-neutral-900 bg-rose-50 rounded-xl text-xs text-neutral-900 font-sans">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ayush Singh"
                className="w-full sketch-input px-3.5 py-2 text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
              Corporate Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dem.local"
              className="w-full sketch-input px-3.5 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full sketch-input px-3.5 py-2 text-xs font-mono"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1 font-sketch text-[13px]">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full sketch-input px-3.5 py-2 text-xs bg-white"
              >
                <option value="OPERATOR">IT Operator</option>
                <option value="ADMIN">System Administrator</option>
                <option value="VIEWER">Read-Only Auditor</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sketch-btn-black text-xs font-sketch font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck size={15} strokeWidth={2} className="text-white" />
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to Console'}</span>
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-sketch text-neutral-700 hover:text-neutral-950 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register new user"}
          </button>
        </div>
      </div>
    </div>
  );
}
