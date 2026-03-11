import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError('Vui lòng nhập đầy đủ'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-md p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded bg-emerald-600 flex items-center justify-center text-2xl mb-4">
              📚
            </div>
            <h1 className="text-lg font-semibold text-slate-900">HR Knowledge Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Đăng nhập để tiếp tục</p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-4 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="label">Tên đăng nhập</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Mật khẩu</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              className="btn-primary w-full justify-center py-2.5 mt-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          HR Knowledge Hub © 2025
        </p>
      </div>
    </div>
  );
}
