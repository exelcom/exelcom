import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi, apiClient } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { NewAuditModal } from '../components/NewAuditModal';
import { DetailModal } from '../components/DetailModal';
import { EditAuditModal } from '../components/EditAuditModal';
import type { AuditFormData } from '../components/NewAuditModal';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState } from 'react';

const statusColors: Record<string, string> = { Planning: '#64748b', InProgress: '#0ea5e9', FieldworkComplete: '#f59e0b', UnderReview: '#6366f1', Closed: '#10b981' };

export function AuditsPage() {
  const { getToken, account, hasRole } = useAuth();
  const canEdit = hasRole('GRC.Admin') || hasRole('GRC.Auditor');
  const [ready, setReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (account && !ready) {
      getToken().then(token => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setReady(true);
      }).catch(console.error);
    }
  }, [account]);

  const { data, isLoading } = useQuery({ queryKey: ['audits'], queryFn: auditApi.getAll, enabled: ready });

  const createAudit = useMutation({
    mutationFn: (payload: Record<string, unknown>) => auditApi.create(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['audits'] }); setShowModal(false); },
  });

  const updateAudit = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => auditApi.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['audits'] });
      const fresh = await auditApi.getById(selected?.id as string);
      setSelected(fresh);
      setEditing(false);
    },
  });

  const deleteAudit = useMutation({
    mutationFn: (id: string) => auditApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['audits'] }); setSelected(null); },
  });

  const audits = Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data ?? [];

  const columns = [
    { key: 'title', label: 'Audit Title' },
    { key: 'typeName', label: 'Type' },
    { key: 'statusName', label: 'Status', render: (row: Record<string, unknown>) => {
      const status = String(row.statusName ?? row.status ?? '-');
      const color = statusColors[status] ?? '#64748b';
      return <span className="badge" style={{ background: `${color}20`, color }}>{status}</span>;
    }},
    { key: 'leadAuditor', label: 'Lead Auditor' },
    { key: 'plannedEndDate', label: 'Due Date', render: (row: Record<string, unknown>) => {
      const d = row.plannedEndDate as string;
      return d ? new Date(d).toLocaleDateString('en-AU') : '-';
    }},
    { key: 'openFindingsCount', label: 'Open Findings', render: (row: Record<string, unknown>) => {
      const n = Number(row.openFindingsCount ?? 0);
      return <span style={{ color: n > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{n}</span>;
    }},
    { key: 'actions', label: '', render: (row: Record<string, unknown>) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          title="View">👁</button>
        {canEdit && <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${row.title}"?`)) deleteAudit.mutate(row.id as string); }}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Delete</button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Audit Management" subtitle="ISO 27001:2022 — Clause 9.2 Internal Audit" icon="◉" color="#10b981"
        action={canEdit ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Audit</button> : undefined} />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={audits as Record<string, unknown>[]} loading={isLoading}
            emptyMessage="No audits recorded yet"
            onRowClick={async (row) => { const full = await auditApi.getById(row.id as string); setSelected(full); }} />
        </div>
      </div>
      {selected && !editing && (
        <DetailModal canEdit={canEdit}
          title={String(selected.title)}
          subtitle={`Audit ID: ${String(selected.id).substring(0, 8)}...`}
          icon="◉" color="#10b981"
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(true)}
          onDelete={() => { if (window.confirm(`Delete "${selected.title}"?`)) deleteAudit.mutate(selected.id as string); }}
          fields={[
            { label: 'Type', value: String(selected.typeName ?? selected.type ?? '') },
            { label: 'Status', value: String(selected.statusName ?? selected.status ?? '') },
            { label: 'Lead Auditor', value: selected.leadAuditor as string },
            { label: 'Start Date', value: selected.plannedStartDate ? new Date(selected.plannedStartDate as string).toLocaleDateString('en-AU') : null },
            { label: 'End Date', value: selected.plannedEndDate ? new Date(selected.plannedEndDate as string).toLocaleDateString('en-AU') : null },
            { label: 'Open Findings', value: selected.openFindingsCount as number },
            { label: 'Total Findings', value: selected.totalFindings as number },
            { label: 'Critical Findings', value: selected.criticalFindings as number },
            { label: 'Scope', value: selected.scope as string, wide: true },
            { label: 'Executive Summary', value: selected.executiveSummary as string, wide: true },
          ]} />
      )}
      {selected && editing && (
        <EditAuditModal audit={selected} saving={updateAudit.isPending} onClose={() => setEditing(false)}
          onSave={(form) => updateAudit.mutate({ id: selected.id as string, data: {
            title: form.title, scope: form.scope, leadAuditor: form.leadAuditor,
            startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
            endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          }})} />
      )}
      {showModal && <NewAuditModal onClose={() => setShowModal(false)} onSave={(form: AuditFormData) => createAudit.mutate({
        title: form.title, scope: form.scope, type: form.type, leadAuditor: form.leadAuditor,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      })} />}
    </div>
  );
}
