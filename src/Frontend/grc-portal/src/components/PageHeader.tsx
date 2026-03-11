interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, color, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '40px 40px 32px', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="animate-fade-up">
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color,
        }}>
          {icon}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>{title}</h1>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="animate-fade-up">{action}</div>}
    </div>
  );
}
