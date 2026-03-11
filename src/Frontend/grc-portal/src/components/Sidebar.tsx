import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AppRoles } from '../auth/authConfig';

const nav = [
  { to: '/', label: 'Dashboard', icon: '⬡', roles: [] },
  { to: '/risks', label: 'Risk Management', icon: '◈', roles: [AppRoles.Admin, AppRoles.RiskManager] },
  { to: '/compliance', label: 'Compliance', icon: '◎', roles: [AppRoles.Admin, AppRoles.ComplianceOfficer] },
  { to: '/policies', label: 'Policies', icon: '◇', roles: [AppRoles.Admin, AppRoles.PolicyManager] },
  { to: '/audits', label: 'Audit', icon: '◉', roles: [AppRoles.Admin, AppRoles.Auditor] },
];

export function Sidebar() {
  const { account, roles, logout } = useAuth();
  const userRoles: string[] = roles;

  const canAccess = (required: string[]) =>
    required.length === 0 || required.some(r => userRoles.includes(r));

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>GRC</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.filter(n => canAccess(n.roles)).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'rgba(14,165,233,0.08)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {account?.username}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, opacity: 0.6 }}>
          {userRoles.join(', ') || 'No roles assigned'}
        </div>
        <button onClick={logout} style={{
          width: '100%', padding: '8px', borderRadius: 6,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--danger)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
