import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        top: '30%', left: '60%',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-up" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '48px 40px',
        width: 400,
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 24px',
          boxShadow: '0 0 32px rgba(14,165,233,0.3)',
        }}>⬡</div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>GRC Platform</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
          Governance, Risk & Compliance
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 36, opacity: 0.7 }}>
          EXELCOM Solutions
        </p>

        <button
          onClick={login}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Sign in with Microsoft
        </button>

        <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', opacity: 0.5 }}>
          Access restricted to authorised EXELCOM personnel
        </p>
      </div>
    </div>
  );
}
