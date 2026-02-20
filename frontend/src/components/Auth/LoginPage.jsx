import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ParticleBG from '../UI/ParticleBG';

const DEMOS = [
  ['admin', 'admin123', 'ADMIN'],
  ['hr.manager', 'hr123456', 'MANAGER'],
  ['employee01', 'emp12345', 'USER'],
];

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <ParticleBG />

      <div className="glass" style={{
        borderRadius: 28, padding: '48px 44px', width: 420, maxWidth: '90vw',
        position: 'relative', zIndex: 1,
        animation: 'float 6s ease-in-out infinite, fadeIn 0.8s ease',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px', borderRadius: 20,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            animation: 'glow 3s ease-in-out infinite',
            boxShadow: '0 8px 40px rgba(99,102,241,0.4)',
          }}>📚</div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 900,
            background: 'linear-gradient(135deg,#e2e8f0,#3b82f6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-heading)',
          }}>HR Knowledge Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Đăng nhập để tiếp tục</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Tên đăng nhập</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="admin" />
          </div>
          <div>
            <label className="label">Mật khẩu</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="••••••" />
          </div>
          <button className="btn-primary" onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 16, borderRadius: 14, marginTop: 4, letterSpacing: 0.5, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop: 24, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Demo Accounts</div>
          {DEMOS.map(([u, p, r]) => (
            <div key={u} onClick={() => { setUsername(u); setPassword(p); setError(''); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'background 0.2s', fontSize: 12, color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontFamily: 'monospace' }}>{u}</span>
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                background: r === 'ADMIN' ? 'rgba(239,68,68,0.15)' : r === 'MANAGER' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
                color: r === 'ADMIN' ? '#f87171' : r === 'MANAGER' ? '#60a5fa' : '#4ade80',
              }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
