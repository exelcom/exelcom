import { useAuth } from '../auth/useAuth';
import { AppRoles } from '../auth/authConfig';
import { Link } from 'react-router-dom';
import { ScoreGauge, OverallGauge } from '../components/ScoreGauge';
import { useQuery } from '@tanstack/react-query';
import { riskApi, complianceApi, policyApi, auditApi, apiClient } from '../services/api';
import { useEffect, useState } from 'react';

const modulesMeta = [
  { to: '/risks',      label: 'Risk Management',     icon: '◈', description: 'Identify, assess and mitigate organisational risks',          color: '#ef4444', role: AppRoles.RiskManager },
  { to: '/compliance', label: 'Compliance Tracking',  icon: '◎', description: 'Track regulatory frameworks and compliance status',            color: '#0ea5e9', role: AppRoles.ComplianceOfficer },
  { to: '/policies',   label: 'Policy Management',    icon: '◇', description: 'Manage, version and distribute organisational policies',       color: '#6366f1', role: AppRoles.PolicyManager },
  { to: '/audits',     label: 'Audit Management',     icon: '◉', description: 'Plan, execute and report on internal and external audits',     color: '#10b981', role: AppRoles.Auditor },
];

const riskLevelColor: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#7f1d1d' };
const statusColor: Record<string, string> = { Draft: '#64748b', UnderReview: '#f59e0b', Approved: '#0ea5e9', Published: '#10b981', Retired: '#ef4444', Planning: '#64748b', InProgress: '#0ea5e9', Closed: '#10b981' };

function toArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
  }
  return [];
}

function SummaryCard({ title, icon, color, to, children }: { title: string; icon: string; color: string; to: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', border: '1px solid ' + color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color }}>{icon}</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        </div>
        <Link to={to} style={{ fontSize: 11, color, fontWeight: 600, textDecoration: 'none', letterSpacing: '0.05em' }}>VIEW ALL →</Link>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</span>
    </div>
  );
}

export function Dashboard() {
  const { account, hasRole, getToken } = useAuth();
  const name = account?.name?.split(' ')[0] ?? 'there';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getToken().then(token => {
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        setReady(true);
      }
    });
  }, [getToken]);

  const { data: risksRaw } = useQuery({ queryKey: ['risks'], queryFn: riskApi.getAll, enabled: ready });
  const { data: frameworksRaw } = useQuery({ queryKey: ['frameworks'], queryFn: complianceApi.getFrameworks, enabled: ready });
  const { data: policiesRaw } = useQuery({ queryKey: ['policies'], queryFn: policyApi.getAll, enabled: ready });
  const { data: auditsRaw } = useQuery({ queryKey: ['audits'], queryFn: auditApi.getAll, enabled: ready });

  const risks = toArray(risksRaw);
  const frameworks = toArray(frameworksRaw);
  const policies = toArray(policiesRaw);
  const audits = toArray(auditsRaw);

  // Compute real scores
  const riskScore = risks.length === 0 ? 0 : Math.round(
    (risks.filter((r: any) => { const s = Number(r.riskScore ?? 0); return s < 8; }).length / risks.length) * 100
  );
  const complianceScore = frameworks.length === 0 ? 0 : Math.round(
    frameworks.reduce((sum: number, f: any) => sum + Number(f.compliancePercentage ?? 0), 0) / frameworks.length
  );
  const policyScore = policies.length === 0 ? 0 : Math.round(
    (policies.filter((p: any) => ['Published', 'Approved'].includes(p.statusName ?? p.status)).length / policies.length) * 100
  );
  const totalFindings = audits.reduce((sum: number, a: any) => sum + Number(a.openFindingsCount ?? 0), 0);
  const auditScore = audits.length === 0 ? 0 : Math.max(0, Math.round(
    (audits.filter((a: any) => (a.statusName ?? a.status) === 'Closed').length / audits.length) * 100 - Math.min(totalFindings * 5, 30)
  ));

  const scoreMap: Record<string, number> = {
    '/risks': riskScore,
    '/compliance': complianceScore,
    '/policies': policyScore,
    '/audits': auditScore,
  };

  const accessible = modulesMeta.filter(m => hasRole(m.role)).map(m => ({ ...m, score: scoreMap[m.to] ?? 0 }));
  const overallScore = accessible.length > 0 ? Math.round(accessible.reduce((sum, m) => sum + m.score, 0) / accessible.length) : 0;

  const risksByLevel = risks.reduce((acc: Record<string, number>, r: any) => {
    const score = Number(r.riskScore ?? 0);
    const level = score >= 15 ? 'Critical' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  const policiesByStatus = policies.reduce((acc: Record<string, number>, p: any) => {
    acc[p.statusName ?? p.status ?? 'Unknown'] = (acc[p.statusName ?? p.status ?? 'Unknown'] ?? 0) + 1;
    return acc;
  }, {});

  const auditsByStatus = audits.reduce((acc: Record<string, number>, a: any) => {
    acc[a.statusName ?? a.status ?? 'Unknown'] = (acc[a.statusName ?? a.status ?? 'Unknown'] ?? 0) + 1;
    return acc;
  }, {});

  const openFindings = audits.reduce((sum: number, a: any) => sum + (a.openFindingsCount ?? 0), 0);

  return (
    <div style={{ padding: '48px 40px' }}>
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Hello, {name} 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Here's your GRC platform overview.</p>
      </div>

      {accessible.length > 0 && (
        <div className="card animate-fade-up-delay-1" style={{ padding: '36px 40px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <OverallGauge score={overallScore} size={180} />
          </div>
          <div style={{ width: 1, height: 160, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 24, flex: 1, minWidth: 0 }}>
            {accessible.map(mod => (
              <Link key={mod.to} to={mod.to} style={{ textDecoration: 'none' }}>
                <ScoreGauge score={mod.score} label={mod.label.split(' ')[0]} icon={mod.icon} color={mod.color} size={110} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 32 }}>
        {hasRole(AppRoles.RiskManager) && (
          <SummaryCard title="Risk Management" icon="◈" color="#ef4444" to="/risks">
            <StatRow label="Total Risks" value={risks.length} />
            {Object.entries(risksByLevel).map(([level, count]) => (
              <StatRow key={level} label={level} value={count} color={riskLevelColor[level]} />
            ))}
            {risks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No risks recorded yet</div>}
          </SummaryCard>
        )}

        {hasRole(AppRoles.ComplianceOfficer) && (
          <SummaryCard title="Compliance" icon="◎" color="#0ea5e9" to="/compliance">
            <StatRow label="Frameworks" value={frameworks.length} />
            {frameworks.map((f: any) => (
              <StatRow key={f.id} label={f.name} value={(f.compliancePercentage ?? 0).toFixed(1) + '%'} color={(f.compliancePercentage ?? 0) >= 80 ? '#10b981' : (f.compliancePercentage ?? 0) >= 50 ? '#f59e0b' : '#ef4444'} />
            ))}
            {frameworks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No frameworks recorded yet</div>}
          </SummaryCard>
        )}

        {hasRole(AppRoles.PolicyManager) && (
          <SummaryCard title="Policy Management" icon="◇" color="#6366f1" to="/policies">
            <StatRow label="Total Policies" value={policies.length} />
            {Object.entries(policiesByStatus).map(([status, count]) => (
              <StatRow key={status} label={status} value={count} color={statusColor[status]} />
            ))}
            {policies.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No policies recorded yet</div>}
          </SummaryCard>
        )}

        {hasRole(AppRoles.Auditor) && (
          <SummaryCard title="Audit Management" icon="◉" color="#10b981" to="/audits">
            <StatRow label="Total Audits" value={audits.length} />
            <StatRow label="Open Findings" value={openFindings} color={openFindings > 0 ? '#ef4444' : '#10b981'} />
            {Object.entries(auditsByStatus).map(([status, count]) => (
              <StatRow key={status} label={status} value={count} color={statusColor[status]} />
            ))}
            {audits.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No audits recorded yet</div>}
          </SummaryCard>
        )}
      </div>
    </div>
  );
}
