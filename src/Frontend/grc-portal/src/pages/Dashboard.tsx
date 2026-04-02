import { useAuth } from '../auth/useAuth';
import { AppRoles } from '../auth/authConfig';
import { Link } from 'react-router-dom';
import { ScoreGauge, OverallGauge } from '../components/ScoreGauge';
import { useQuery } from '@tanstack/react-query';
import { riskApi, complianceApi, policyApi, auditApi, soaApi, ncApi, assetApi, incidentApi, apiClient } from '../services/api';
import { useEffect, useState } from 'react';

const modulesMeta = [
  { to: '/risks',            label: 'Risk Management',     icon: '◈', color: '#ef4444', role: AppRoles.RiskManager },
  { to: '/compliance',       label: 'Compliance',          icon: '◎', color: '#0ea5e9', role: AppRoles.ComplianceOfficer },
  { to: '/policies',         label: 'Policy',              icon: '◇', color: '#6366f1', role: AppRoles.PolicyManager },
  { to: '/audits',           label: 'Audit',               icon: '◉', color: '#10b981', role: AppRoles.Auditor },
  { to: '/soa',              label: 'SoA',                 icon: '📋', color: '#8b5cf6', role: AppRoles.Admin },
  { to: '/nonconformities',  label: 'NC&CA',               icon: '⚠️', color: '#f59e0b', role: AppRoles.Admin },
  { to: '/assets',           label: 'Assets',              icon: '🖥',  color: '#06b6d4', role: AppRoles.Admin },
  { to: '/incidents',        label: 'Incidents',           icon: '🚨', color: '#dc2626', role: AppRoles.Admin },
];

const riskLevelColor: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#7f1d1d' };
const statusColor: Record<string, string> = { Draft: '#64748b', UnderReview: '#f59e0b', Approved: '#0ea5e9', Published: '#10b981', Retired: '#ef4444', Planning: '#64748b', InProgress: '#0ea5e9', Closed: '#10b981', Open: '#ef4444' };

function toArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.controls)) return d.controls;
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#ef4444' : '#7f1d1d';
  const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'At Risk' : 'Critical';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: color + '20', color, marginLeft: 8 }}>{label}</span>
  );
}

export function Dashboard() {
  const { account, hasRole, getToken } = useAuth();
  const name = account?.name?.split(' ')[0] ?? 'there';
  const [ready, setReady] = useState(false);
  const isAdmin = hasRole(AppRoles.Admin);

  useEffect(() => {
    getToken().then(token => {
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        setReady(true);
      }
    });
  }, [getToken]);

  const { data: risksRaw }      = useQuery({ queryKey: ['risks'],      queryFn: riskApi.getAll,              enabled: ready && hasRole(AppRoles.RiskManager) });
  const { data: frameworksRaw } = useQuery({ queryKey: ['frameworks'], queryFn: complianceApi.getFrameworks, enabled: ready && hasRole(AppRoles.ComplianceOfficer) });
  const { data: policiesRaw }   = useQuery({ queryKey: ['policies'],   queryFn: policyApi.getAll,            enabled: ready && hasRole(AppRoles.PolicyManager) });
  const { data: auditsRaw }     = useQuery({ queryKey: ['audits'],     queryFn: auditApi.getAll,             enabled: ready && hasRole(AppRoles.Auditor) });
  const { data: soaRaw }        = useQuery({ queryKey: ['soa'],        queryFn: soaApi.getAll,               enabled: ready && isAdmin });
  const { data: ncRaw }         = useQuery({ queryKey: ['nc'],         queryFn: () => ncApi.getAll(),                enabled: ready && isAdmin });
  const { data: assetsRaw }     = useQuery({ queryKey: ['assets'],     queryFn: () => assetApi.getAll(),             enabled: ready && isAdmin });
  const { data: incidentsRaw }  = useQuery({ queryKey: ['incidents'],  queryFn: () => incidentApi.getAll(),          enabled: ready && isAdmin });

  const risks     = toArray(risksRaw);
  const frameworks = toArray(frameworksRaw);
  const policies  = toArray(policiesRaw);
  const audits    = toArray(auditsRaw);
  const controls  = toArray(soaRaw);
  const ncs       = toArray(ncRaw);
  const assets    = toArray(assetsRaw);
  const incidents = toArray(incidentsRaw);

  // ── Compute scores ────────────────────────────────────────────────────────
  const riskScore = risks.length === 0 ? null : Math.round(
    (risks.filter((r: any) => Number(r.riskScore ?? 0) < 8).length / risks.length) * 100
  );
  const complianceScore = frameworks.length === 0 ? null : Math.round(
    frameworks.reduce((sum: number, f: any) => sum + Number(f.compliancePercentage ?? 0), 0) / frameworks.length
  );
  const policyScore = policies.length === 0 ? null : Math.round(
    (policies.filter((p: any) => ['Published', 'Approved'].includes(p.statusName ?? p.status)).length / policies.length) * 100
  );
  const totalFindings = audits.reduce((sum: number, a: any) => sum + Number(a.openFindingsCount ?? 0), 0);
  const auditScore = audits.length === 0 ? null : Math.max(0, Math.round(
    (audits.filter((a: any) => (a.statusName ?? a.status) === 'Closed').length / audits.length) * 100 - Math.min(totalFindings * 5, 30)
  ));
  const soaScore = controls.length === 0 ? null : Math.round(
    (controls.filter((c: any) => c.implementationStatus === 'Implemented').length / controls.length) * 100
  );
  const ncScore = ncs.length === 0 ? 100 : Math.round(
    (ncs.filter((n: any) => ['Closed', 'EffectivenessVerified'].includes(n.status)).length / ncs.length) * 100
  );
  const assetScore = assets.length === 0 ? null : Math.round(
    (assets.filter((a: any) => a.status === 'Active' && !['Critical', 'High'].includes(a.riskLevel)).length / assets.length) * 100
  );
  const incidentScore = incidents.length === 0 ? 100 : Math.round(
    (incidents.filter((i: any) => ['Resolved', 'Closed'].includes(i.status)).length / incidents.length) * 100
  );

  const scoreMap: Record<string, number | null> = {
    '/risks':           riskScore,
    '/compliance':      complianceScore,
    '/policies':        policyScore,
    '/audits':          auditScore,
    '/soa':             soaScore,
    '/nonconformities': ncScore,
    '/assets':          assetScore,
    '/incidents':       incidentScore,
  };

  const accessible = modulesMeta
    .filter(m => hasRole(m.role))
    .map(m => ({ ...m, score: scoreMap[m.to] ?? 0 }));

  const scoredModules = accessible.filter(m => scoreMap[m.to] !== null);
  const overallScore = scoredModules.length > 0
    ? Math.round(scoredModules.reduce((sum, m) => sum + (scoreMap[m.to] ?? 0), 0) / scoredModules.length)
    : 0;

  const risksByLevel = risks.reduce((acc: Record<string, number>, r: any) => {
    const score = Number(r.riskScore ?? 0);
    const level = score >= 15 ? 'Critical' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  const policiesByStatus = policies.reduce((acc: Record<string, number>, p: any) => {
    const s = p.statusName ?? p.status ?? 'Unknown';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const auditsByStatus = audits.reduce((acc: Record<string, number>, a: any) => {
    const s = a.statusName ?? a.status ?? 'Unknown';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const openIncidents = incidents.filter((i: any) => !['Resolved', 'Closed'].includes(i.status));
  const criticalIncidents = incidents.filter((i: any) => i.severity === 'Critical' && !['Resolved', 'Closed'].includes(i.status));
  const openNcs = ncs.filter((n: any) => !['Closed', 'EffectivenessVerified'].includes(n.status));
  const implementedControls = controls.filter((c: any) => c.implementationStatus === 'Implemented').length;
  const inProgressControls = controls.filter((c: any) => c.implementationStatus === 'InProgress').length;

  return (
    <div style={{ padding: '48px 40px' }}>
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Welcome back</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Hello, {name} 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Here's your GRC platform overview.
          {overallScore > 0 && <ScoreBadge score={overallScore} />}
        </p>
      </div>

      {accessible.length > 0 && (
        <div className="card animate-fade-up-delay-1" style={{ padding: '36px 40px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <OverallGauge score={overallScore} size={180} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
              Based on {scoredModules.length} module{scoredModules.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ width: 1, height: 160, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 20, flex: 1, minWidth: 0 }}>
            {accessible.map(mod => (
              <Link key={mod.to} to={mod.to} style={{ textDecoration: 'none' }}>
                <ScoreGauge score={scoreMap[mod.to] ?? 0} label={mod.label.split(' ')[0]} icon={mod.icon} color={mod.color} size={100} />
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
              <StatRow key={f.id} label={f.name} value={(f.compliancePercentage ?? 0).toFixed(1) + '%'}
                color={(f.compliancePercentage ?? 0) >= 80 ? '#10b981' : (f.compliancePercentage ?? 0) >= 50 ? '#f59e0b' : '#ef4444'} />
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
            <StatRow label="Open Findings" value={totalFindings} color={totalFindings > 0 ? '#ef4444' : '#10b981'} />
            {Object.entries(auditsByStatus).map(([status, count]) => (
              <StatRow key={status} label={status} value={count} color={statusColor[status]} />
            ))}
            {audits.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No audits recorded yet</div>}
          </SummaryCard>
        )}

        {isAdmin && (
          <SummaryCard title="Statement of Applicability" icon="📋" color="#8b5cf6" to="/soa">
            <StatRow label="Total Controls" value={controls.length} />
            <StatRow label="Implemented" value={implementedControls} color="#10b981" />
            <StatRow label="In Progress" value={inProgressControls} color="#f59e0b" />
            <StatRow label="Not Started" value={controls.length - implementedControls - inProgressControls} color="#64748b" />
          </SummaryCard>
        )}

        {isAdmin && (
          <SummaryCard title="Nonconformities & CA" icon="⚠️" color="#f59e0b" to="/nonconformities">
            <StatRow label="Total" value={ncs.length} />
            <StatRow label="Open" value={openNcs.length} color={openNcs.length > 0 ? '#ef4444' : '#10b981'} />
            <StatRow label="Closed" value={ncs.length - openNcs.length} color="#10b981" />
            {ncs.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No nonconformities recorded yet</div>}
          </SummaryCard>
        )}

        {isAdmin && (
          <SummaryCard title="Asset Inventory" icon="🖥" color="#06b6d4" to="/assets">
            <StatRow label="Total Assets" value={assets.length} />
            <StatRow label="Active" value={assets.filter((a: any) => a.status === 'Active').length} color="#10b981" />
            <StatRow label="Critical Risk" value={assets.filter((a: any) => a.riskLevel === 'Critical').length} color="#7f1d1d" />
            <StatRow label="High Risk" value={assets.filter((a: any) => a.riskLevel === 'High').length} color="#ef4444" />
            {assets.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No assets recorded yet</div>}
          </SummaryCard>
        )}

        {isAdmin && (
          <SummaryCard title="Incident Management" icon="🚨" color="#dc2626" to="/incidents">
            <StatRow label="Total Incidents" value={incidents.length} />
            <StatRow label="Open" value={openIncidents.length} color={openIncidents.length > 0 ? '#ef4444' : '#10b981'} />
            <StatRow label="Critical (Open)" value={criticalIncidents.length} color={criticalIncidents.length > 0 ? '#7f1d1d' : '#10b981'} />
            <StatRow label="Resolved/Closed" value={incidents.length - openIncidents.length} color="#10b981" />
            {incidents.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No incidents recorded yet</div>}
          </SummaryCard>
        )}

      </div>
    </div>
  );
}

