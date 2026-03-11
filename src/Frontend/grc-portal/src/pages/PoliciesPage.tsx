import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policyApi, apiClient } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { NewPolicyModal } from '../components/NewPolicyModal';
import { DetailModal } from '../components/DetailModal';
import { EditPolicyModal } from '../components/EditPolicyModal';
import type { PolicyFormData } from '../components/NewPolicyModal';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState } from 'react';

const statusColors: Record<string, string> = { Draft: '#64748b', UnderReview: '#f59e0b', Approved: '#0ea5e9', Published: '#10b981', Retired: '#ef4444' };

export function PoliciesPage() {
  const { getToken, account, hasRole } = useAuth();
  const canEdit = hasRole('GRC.Admin') || hasRole('GRC.PolicyManager');
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

  const { data, isLoading } = useQuery({ queryKey: ['policies'], queryFn: policyApi.getAll, enabled: ready });

  const createPolicy = useMutation({
    mutationFn: (payload: Record<string, unknown>) => policyApi.create(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); setShowModal(false); },
  });

  const updatePolicy = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => policyApi.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['policies'] });
      const fresh = await policyApi.getById(selected?.id as string);
      setSelected(fresh);
      setEditing(false);
    },
  });

  const deletePolicy = useMutation({
    mutationFn: (id: string) => policyApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['policies'] }); setSelected(null); },
  });

  const policies = Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data ?? [];

  const columns = [
    { key: 'title', label: 'Policy Title' },
    { key: 'categoryName', label: 'Category' },
    { key: 'statusName', label: 'Status', render: (row: Record<string, unknown>) => {
      const status = String(row.statusName ?? row.status ?? '-');
      const color = statusColors[status] ?? '#64748b';
      return <span className="badge" style={{ background: `${color}20`, color }}>{status}</span>;
    }},
    { key: 'owner', label: 'Owner' },
    { key: 'department', label: 'Department' },
    { key: 'reviewDueDate', label: 'Review Due', render: (row: Record<string, unknown>) => {
      const d = row.reviewDueDate as string;
      return d ? new Date(d).toLocaleDateString('en-AU') : '-';
    }},
    { key: 'actions', label: '', render: (row: Record<string, unknown>) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          title="View">👁</button>
        {canEdit && <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${row.title}"?`)) deletePolicy.mutate(row.id as string); }}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Delete</button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Policy Management" subtitle="ISO 27001:2022 — Policy Lifecycle Management" icon="◇" color="#6366f1"
        action={canEdit ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Policy</button> : undefined} />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={policies as Record<string, unknown>[]} loading={isLoading}
            emptyMessage="No policies recorded yet"
            onRowClick={async (row) => { const full = await policyApi.getById(row.id as string); setSelected(full); }} />
        </div>
      </div>
      {selected && !editing && (
        <DetailModal canEdit={canEdit}
          title={String(selected.title)}
          subtitle={`Policy ID: ${String(selected.id).substring(0, 8)}...`}
          icon="◇" color="#6366f1"
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(true)}
          onDelete={() => { if (window.confirm(`Delete "${selected.title}"?`)) deletePolicy.mutate(selected.id as string); }}
          fields={[
            { label: 'Category', value: String(selected.categoryName ?? selected.category ?? '') },
            { label: 'Status', value: String(selected.statusName ?? selected.status ?? '') },
            { label: 'Owner', value: selected.owner as string },
            { label: 'Department', value: selected.department as string },
            { label: 'Requires Attestation', value: selected.requiresAttestation as boolean },
            { label: 'Review Due', value: selected.reviewDueDate ? new Date(selected.reviewDueDate as string).toLocaleDateString('en-AU') : null },
            { label: 'Approved By', value: selected.approvedBy as string },
            { label: 'Approved At', value: selected.approvedAt ? new Date(selected.approvedAt as string).toLocaleDateString('en-AU') : null },
            { label: 'Description', value: selected.description as string, wide: true },
          ]} />
      )}
      {selected && editing && (
        <EditPolicyModal policy={selected} saving={updatePolicy.isPending} onClose={() => setEditing(false)}
          onSave={(form) => updatePolicy.mutate({ id: selected.id as string, data: {
            title: form.title, description: form.description, category: form.category,
            owner: form.owner || null, department: form.department || null,
            requiresAttestation: form.requiresAttestation,
            reviewDueDate: form.reviewDueDate ? new Date(form.reviewDueDate).toISOString() : null,
          }})} />
      )}
      {showModal && <NewPolicyModal onClose={() => setShowModal(false)} onSave={(form: PolicyFormData) => createPolicy.mutate({
        title: form.title, description: form.description, category: form.category, content: form.content,
        owner: form.owner || null, department: form.department || null,
        requiresAttestation: form.requiresAttestation,
        reviewDueDate: form.reviewDueDate ? new Date(form.reviewDueDate).toISOString() : null,
      })} />}
    </div>
  );
}
