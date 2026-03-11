import { useAuth } from '../auth/useAuth';
import { AppRoles } from '../auth/authConfig';
import { Link } from 'react-router-dom';

const modules = [
  {
    to: '/risks',
    label: 'Risk Management',
    icon: '◈',
    description: 'Identify, assess and mitigate organisational risks',
    color: '#ef4444',
    role: AppRoles.RiskManager,
  },
  {
    to: '/compliance',
    label: 'Compliance Tracking',
    icon: '◎',
    description: 'Track regulatory frameworks and compliance status',
    color: '#0ea5e9',
    role: AppRoles.ComplianceOfficer,
  },
  {
    to: '/policies',
    label: 'Policy Management',
    icon: '◇',
    description: 'Manage, version and distribute organisational policies',
    color: '#6366f1',
    role: AppRoles.PolicyManager,
  },
  {
    to: '/audits',
    label: 'Audit Management',
    icon: '◉',
    description: 'Plan, execute and report on internal and external audits',
    color: '#10b981',
    role: AppRoles.Auditor,
  },
];

export function Dashboard() {
  const { account, hasRole } = useAuth();
  const name = account?.name?.split(' ')[0] ?? 'there';

  const accessible = modules.filter(m => hasRole(m.role));

  return (
    <div style={{ padding: '48px 40px' }}>
      <div className="animate-fade-up">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Welcome back
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          Hello, {name} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 48 }}>
          Here's an overview of your GRC platform modules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {accessible.map((mod, i) => (
          <Link
            key={mod.to}
            to={mod.to}
            className={`card animate-fade-up-delay-${i + 1}`}
            style={{ padding: 28, textDecoration: 'none', display: 'block' }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${mod.color}20`,
              border: `1px solid ${mod.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, marginBottom: 16, color: mod.color,
            }}>
              {mod.icon}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{mod.label}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{mod.description}</p>
            <div style={{ marginTop: 20, fontSize: 12, color: mod.color, fontWeight: 600, letterSpacing: '0.05em' }}>
              OPEN MODULE →
            </div>
          </Link>
        ))}
      </div>

      {accessible.length === 0 && (
        <div className="card animate-fade-up" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
          <h3 style={{ marginBottom: 8 }}>No modules assigned</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Contact your administrator to be assigned a GRC role.
          </p>
        </div>
      )}
    </div>
  );
}
