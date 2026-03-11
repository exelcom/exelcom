import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi, apiClient } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { NewFrameworkModal } from '../components/NewFrameworkModal';
import { DetailModal } from '../components/DetailModal';
import { EditFrameworkModal } from '../components/EditFrameworkModal';
import type { FrameworkFormData } from '../components/NewFrameworkModal';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState } from 'react';

export function CompliancePage() {
  const { getToken, account, hasRole } = useAuth();
  const canEdit = hasRole('GRC.Admin') || hasRole('GRC.ComplianceOfficer');
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

  const { data, isLoading } = useQuery({ queryKey: ['frameworks'], queryFn: complianceApi.getFrameworks, enabled: ready });

  const createFramework = useMutation({
    mutationFn: (payload: Record<string, unknown>) => complianceApi.create(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['frameworks'] }); setShowModal(false); },
  });

  const updateFramework = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => complianceApi.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      const fresh = await complianceApi.getById(selected?.id as string);
      setSelected(fresh);
      setEditing(false);
    },
  });

  const deleteFramework = useMutation({
    mutationFn: (id: string) => complianceApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['frameworks'] }); setSelected(null); },
  });

  const frameworks = Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data ?? [];

  const columns = [
    { key: 'name', label: 'Framework' },
    { key: 'typeName', label: 'Type' },
    { key: 'version', label: 'Version' },
    { key: 'compliancePercentage', label: 'Compliance', render: (row: Record<string, unknown>) => {
      const pct = Number(row.compliancePercentage ?? 0);
      const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: '#2a2a3a', borderRadius: 3, maxWidth: 80 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
        </div>
      );
    }},
    { key: 'controls', label: 'Controls', render: (row: Record<string, unknown>) => `${row.implementedControls ?? 0} / ${row.totalControls ?? 0}` },
    { key: 'actions', label: '', render: (row: Record<string, unknown>) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          title="View">👁</button>
        {canEdit && <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${row.name}"?`)) deleteFramework.mutate(row.id as string); }}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Delete</button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Compliance Tracking" subtitle="ISO 27001:2022 — Clause 6.1.3 Compliance Frameworks" icon="◎" color="#0ea5e9"
        action={canEdit ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Framework</button> : undefined} />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={frameworks as Record<string, unknown>[]} loading={isLoading}
            emptyMessage="No frameworks recorded yet"
            onRowClick={async (row) => { const full = await complianceApi.getById(row.id as string); setSelected(full); }} />
        </div>
      </div>
      {selected && !editing && (
        <DetailModal canEdit={canEdit}
          title={String(selected.name)}
          subtitle={`Framework ID: ${String(selected.id).substring(0, 8)}...`}
          icon="◎" color="#0ea5e9"
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(true)}
          onDelete={() => { if (window.confirm(`Delete "${selected.name}"?`)) deleteFramework.mutate(selected.id as string); }}
          fields={[
            { label: 'Type', value: String(selected.typeName ?? selected.type ?? '') },
            { label: 'Version', value: selected.version as string },
            { label: 'Compliance', value: `${Number(selected.compliancePercentage ?? 0).toFixed(1)}%` },
            { label: 'Controls', value: `${selected.implementedControls ?? 0} / ${selected.totalControls ?? 0}` },
            { label: 'Active', value: selected.isActive as boolean },
            { label: 'Created At', value: selected.createdAt ? new Date(selected.createdAt as string).toLocaleDateString('en-AU') : null },
            { label: 'Description', value: selected.description as string, wide: true },
          ]} />
      )}
      {selected && editing && (
        <EditFrameworkModal framework={selected} saving={updateFramework.isPending} onClose={() => setEditing(false)}
          onSave={(form) => updateFramework.mutate({ id: selected.id as string, data: { name: form.name, description: form.description, version: form.version, isActive: form.isActive } })} />
      )}
      {showModal && <NewFrameworkModal onClose={() => setShowModal(false)} onSave={(form: FrameworkFormData) =>
        createFramework.mutate({ name: form.name, description: form.description, type: form.type, version: form.version })} />}
    </div>
  );
}