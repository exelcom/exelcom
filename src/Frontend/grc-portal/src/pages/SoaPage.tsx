import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { soaApi, ncApi, apiClient } from '../services/api';
import { useAuth } from '../auth/useAuth';

const domainColor: Record<string, string> = {
  OrganisationalControls: '#6366f1',
  PeopleControls: '#f59e0b',
  PhysicalControls: '#10b981',
  TechnologicalControls: '#0ea5e9',
};

const domainLabel: Record<string, string> = {
  OrganisationalControls: 'Organisational',
  PeopleControls: 'People',
  PhysicalControls: 'Physical',
  TechnologicalControls: 'Technological',
};

const implColor: Record<string, string> = {
  NotStarted: '#64748b',
  InProgress: '#f59e0b',
  Implemented: '#0ea5e9',
  Verified: '#10b981',
};

const implLabel: Record<string, string> = {
  NotStarted: 'Not Started',
  InProgress: 'In Progress',
  Implemented: 'Implemented',
  Verified: 'Verified',
};

const NC_STATUS_COLOR: Record<string, string> = {
  Open: '#C0392B',
  UnderAnalysis: '#935116',
  CorrectiveActionInProgress: '#1A5276',
  AwaitingEffectivenessReview: '#1E8449',
  Closed: '#616A6B',
};

const NC_STATUS_LABEL: Record<string, string> = {
  Open: 'Open',
  UnderAnalysis: 'Under Analysis',
  CorrectiveActionInProgress: 'CA In Progress',
  AwaitingEffectivenessReview: 'Awaiting Review',
  Closed: 'Closed',
};

function Badge({ text, color, small }: { text: string; color: string; small?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 8px' : '3px 10px',
      borderRadius: 20,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: color + '18',
      color,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {text}
    </span>
  );
}

function NcCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, borderRadius: 9,
      fontSize: 10, fontWeight: 700,
      background: '#C0392B', color: '#fff',
      padding: '0 5px',
    }}>{count}</span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '20px 24px', minWidth: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export function SoaPage() {
  const { hasRole } = useAuth();
  const canEdit = hasRole('GRC.Admin') || hasRole('GRC.ComplianceOfficer');
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [selectedControl, setSelectedControl] = useState<any>(null);
  const [filterDomain, setFilterDomain] = useState<string>('All');
  const [filterApplicability, setFilterApplicability] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState<'applicability' | 'implementation' | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    getToken().then(token => {
      if (token) { apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token; setReady(true); }
    });
  }, [getToken]);

  const { data: controls = [], isLoading } = useQuery({
    queryKey: ['soa-controls'],
    queryFn: soaApi.getAll,
    enabled: ready,
  });

  const { data: stats } = useQuery({
    queryKey: ['soa-stats'],
    queryFn: soaApi.getStats,
    enabled: ready,
  });

  const { data: controlDetail } = useQuery({
    queryKey: ['soa-control', selectedControl?.id],
    queryFn: () => soaApi.getById(selectedControl.id),
    enabled: !!selectedControl?.id && ready,
  });

  // Fetch all NCs to compute per-control counts and show linked NCs
  const { data: allNcs = [] } = useQuery({
    queryKey: ['nc-all'],
    queryFn: () => ncApi.getAll(),
    enabled: ready,
  });

  // Pre-select control from URL param ?control=A.8.24
  useEffect(() => {
    const controlParam = searchParams.get('control');
    if (controlParam && (controls as any[]).length > 0) {
      const match = (controls as any[]).find((c: any) =>
        c.controlId.toLowerCase() === controlParam.toLowerCase()
      );
      if (match) setSelectedControl(match);
    }
  }, [searchParams, controls]);

  // Build a map of controlId -> open NC count
  const ncCountByControl = (allNcs as any[]).reduce((acc: Record<string, number>, nc: any) => {
    const ref = nc.clauseReference?.trim();
    if (ref && nc.status !== 'Closed') {
      acc[ref] = (acc[ref] ?? 0) + 1;
    }
    return acc;
  }, {});

  // NCs linked to the selected control
  const linkedNcs = selectedControl
    ? (allNcs as any[]).filter((nc: any) =>
        nc.clauseReference?.trim().toLowerCase() === selectedControl.controlId?.toLowerCase()
      )
    : [];

  const updateApplicability = useMutation({
    mutationFn: ({ id, data }: any) => soaApi.updateApplicability(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['soa-controls'] });
      queryClient.invalidateQueries({ queryKey: ['soa-stats'] });
      queryClient.setQueryData(['soa-control', updated.id], updated);
      setSelectedControl(updated);
      setEditMode(null);
    },
  });

  const updateImplementation = useMutation({
    mutationFn: ({ id, data }: any) => soaApi.updateImplementation(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['soa-controls'] });
      queryClient.invalidateQueries({ queryKey: ['soa-stats'] });
      queryClient.setQueryData(['soa-control', updated.id], updated);
      setSelectedControl(updated);
      setEditMode(null);
    },
  });

  const domains = ['All', 'OrganisationalControls', 'PeopleControls', 'PhysicalControls', 'TechnologicalControls'];
  const applicabilities = ['All', 'Applicable', 'NotApplicable'];
  const statuses = ['All', 'NotStarted', 'InProgress', 'Implemented', 'Verified'];

  const filtered = (controls as any[]).filter((c: any) => {
    if (filterDomain !== 'All' && c.domain !== filterDomain) return false;
    if (filterApplicability !== 'All' && c.applicability !== filterApplicability) return false;
    if (filterStatus !== 'All' && c.implementationStatus !== filterStatus) return false;
    if (search && !c.controlId.toLowerCase().includes(search.toLowerCase()) && !c.controlName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const detail = controlDetail ?? selectedControl;

  return (
    <div style={{ padding: '48px 40px', maxWidth: 1400 }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>ISO 27001:2022</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Statement of Applicability</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Annex A controls — applicability, justification and implementation tracking</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="animate-fade-up-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Controls" value={stats.totalControls} />
          <StatCard label="Applicable" value={stats.applicableControls} color="#6366f1" />
          <StatCard label="Not Applicable" value={stats.notApplicableControls} color="#64748b" />
          <StatCard label="Implemented" value={stats.implemented + stats.verified} color="#10b981" />
          <StatCard label="In Progress" value={stats.inProgress} color="#f59e0b" />
          <StatCard label="Compliance" value={`${stats.compliancePercentage.toFixed(1)}%`} color={stats.compliancePercentage >= 80 ? '#10b981' : stats.compliancePercentage >= 50 ? '#f59e0b' : '#ef4444'} />
        </div>
      )}

      {/* Domain progress bars */}
      {stats && (
        <div className="card animate-fade-up-delay-1" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Implementation by domain</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Object.entries(domainLabel).map(([key, label]) => {
              const domainControls = (controls as any[]).filter((c: any) => c.domain === key && c.applicability === 'Applicable');
              const done = domainControls.filter((c: any) => c.implementationStatus === 'Implemented' || c.implementationStatus === 'Verified').length;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: domainColor[key] }}>{done}/{domainControls.length}</span>
                  </div>
                  <ProgressBar value={done} max={domainControls.length} color={domainColor[key]} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedControl ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Controls table */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search controls..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}
            />
            <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}>
              {domains.map(d => <option key={d} value={d}>{d === 'All' ? 'All domains' : domainLabel[d]}</option>)}
            </select>
            <select value={filterApplicability} onChange={e => setFilterApplicability(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}>
              {applicabilities.map(a => <option key={a} value={a}>{a === 'All' ? 'All applicability' : a}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}>
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All statuses' : implLabel[s] ?? s}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} controls</span>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading controls...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Control', 'Name', 'Domain', 'Applicability', 'Status', 'Owner', 'NCs'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => {
                      const ncCount = ncCountByControl[c.controlId] ?? 0;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => { setSelectedControl(c); setEditMode(null); }}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: selectedControl?.id === c.id ? 'var(--bg-hover)' : 'transparent',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { if (selectedControl?.id !== c.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { if (selectedControl?.id !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: domainColor[c.domain] ?? 'var(--text)', whiteSpace: 'nowrap' }}>{c.controlId}</td>
                          <td style={{ padding: '10px 14px', maxWidth: 260 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.controlName}</div>
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <Badge text={domainLabel[c.domain] ?? c.domain} color={domainColor[c.domain] ?? '#64748b'} small />
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {c.applicability === 'NotApplicable'
                              ? <Badge text="N/A" color="#64748b" small />
                              : <Badge text="Applicable" color="#10b981" small />}
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {c.applicability === 'Applicable'
                              ? <Badge text={implLabel[c.implementationStatus] ?? c.implementationStatus} color={implColor[c.implementationStatus] ?? '#64748b'} small />
                              : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.responsibleOwner ?? '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <NcCountBadge count={ncCount} />
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No controls match filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedControl && (
          <div className="card" style={{ padding: 24, height: 'fit-content', position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: domainColor[detail?.domain ?? selectedControl.domain] }}>{detail?.controlId ?? selectedControl.controlId}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{detail?.controlName ?? selectedControl.controlName}</div>
              </div>
              <button onClick={() => setSelectedControl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 4, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              {detail?.description ?? selectedControl.description ?? ''}
            </div>

            {/* Applicability section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicability</span>
                {canEdit && (<button
                  onClick={() => { setEditMode('applicability'); setForm({ applicability: detail?.applicability ?? selectedControl.applicability, justification: detail?.justificationForExclusion ?? '' }); }}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >Edit</button>)}
              </div>

              {editMode === 'applicability' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <select value={form.applicability} onChange={e => setForm({ ...form, applicability: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}>
                    <option value="Applicable">Applicable</option>
                    <option value="NotApplicable">Not Applicable</option>
                  </select>
                  {form.applicability === 'NotApplicable' && (
                    <textarea
                      placeholder="Justification for exclusion..."
                      value={form.justification}
                      onChange={e => setForm({ ...form, justification: e.target.value })}
                      rows={3}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13, resize: 'vertical' }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => updateApplicability.mutate({ id: detail?.id ?? selectedControl.id, data: { applicability: form.applicability, justification: form.justification } })}
                      disabled={updateApplicability.isPending}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >{updateApplicability.isPending ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditMode(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge
                    text={(detail?.applicability ?? selectedControl.applicability) === 'NotApplicable' ? 'Not Applicable' : 'Applicable'}
                    color={(detail?.applicability ?? selectedControl.applicability) === 'NotApplicable' ? '#64748b' : '#10b981'}
                  />
                  {(detail?.justificationForExclusion) && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>{detail.justificationForExclusion}</div>
                  )}
                </div>
              )}
            </div>

            {/* Implementation section */}
            {(detail?.applicability ?? selectedControl.applicability) === 'Applicable' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Implementation</span>
                  {canEdit && (<button
                    onClick={() => {
                      setEditMode('implementation');
                      setForm({
                        status: detail?.implementationStatus ?? selectedControl.implementationStatus ?? 'NotStarted',
                        notes: detail?.implementationNotes ?? '',
                        owner: detail?.responsibleOwner ?? '',
                        targetDate: detail?.targetDate ? detail.targetDate.substring(0, 10) : '',
                        evidenceRef: detail?.evidenceReference ?? '',
                      });
                    }}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >Edit</button>)}
                </div>

                {editMode === 'implementation' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }}>
                      {Object.entries(implLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input placeholder="Responsible owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }} />
                    <input type="date" placeholder="Target date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }} />
                    <textarea placeholder="Implementation notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                      rows={3} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13, resize: 'vertical' }} />
                    <input placeholder="Evidence reference (doc link, ticket ID...)" value={form.evidenceRef} onChange={e => setForm({ ...form, evidenceRef: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 13 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => updateImplementation.mutate({ id: detail?.id ?? selectedControl.id, data: { status: form.status, notes: form.notes || null, owner: form.owner || null, targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null, evidenceRef: form.evidenceRef || null } })}
                        disabled={updateImplementation.isPending}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                      >{updateImplementation.isPending ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditMode(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Badge text={implLabel[detail?.implementationStatus ?? selectedControl.implementationStatus] ?? (detail?.implementationStatus ?? selectedControl.implementationStatus)} color={implColor[detail?.implementationStatus ?? selectedControl.implementationStatus] ?? '#64748b'} />
                    {[
                      { label: 'Owner', value: detail?.responsibleOwner },
                      { label: 'Target Date', value: detail?.targetDate ? new Date(detail.targetDate).toLocaleDateString() : null },
                      { label: 'Completed', value: detail?.completedDate ? new Date(detail.completedDate).toLocaleDateString() : null },
                      { label: 'Evidence', value: detail?.evidenceReference },
                    ].filter(r => r.value).map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ fontWeight: 500, maxWidth: 200, textAlign: 'right', wordBreak: 'break-all' }}>{r.value}</span>
                      </div>
                    ))}
                    {detail?.implementationNotes && (
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, lineHeight: 1.5 }}>
                        {detail.implementationNotes}
                      </div>
                    )}
                    {detail?.updatedBy && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Last updated by {detail.updatedBy}{detail.updatedAt ? ` · ${new Date(detail.updatedAt).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Linked NCs ─────────────────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Nonconformities
                  {linkedNcs.length > 0 && (
                    <span style={{ marginLeft: 6, background: '#C0392B', color: '#fff',
                      borderRadius: 9, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                      {linkedNcs.length}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => navigate(`/nonconformities?clause=${selectedControl.controlId}`)}
                  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6,
                    border: '1px solid #2E86C1', background: '#EBF5FB',
                    color: '#2E86C1', cursor: 'pointer', fontWeight: 600 }}>
                  + Raise NC
                </button>
              </div>

              {linkedNcs.length === 0 ? (
                <div
                  onClick={() => navigate(`/nonconformities?clause=${selectedControl.controlId}`)}
                  style={{ fontSize: 12, color: '#2E86C1', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: 6, border: '1px dashed #2E86C130',
                    background: '#EBF5FB', textAlign: 'center', fontWeight: 500 }}>
                  + Raise a nonconformity against this control
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedNcs.map((nc: any) => (
                    <div
                      key={nc.id}
                      onClick={() => navigate(`/nonconformities?nc=${nc.id}`)}
                      style={{ padding: '8px 10px', borderRadius: 6,
                        border: `1px solid ${NC_STATUS_COLOR[nc.status] ?? '#ccc'}30`,
                        background: `${NC_STATUS_COLOR[nc.status] ?? '#ccc'}08`,
                        cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {nc.referenceNumber}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: NC_STATUS_COLOR[nc.status],
                          background: `${NC_STATUS_COLOR[nc.status]}18`, padding: '1px 6px', borderRadius: 4 }}>
                          {NC_STATUS_LABEL[nc.status] ?? nc.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nc.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {nc.severity} · {new Date(nc.raisedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




