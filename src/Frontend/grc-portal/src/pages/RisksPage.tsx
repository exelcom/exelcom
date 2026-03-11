import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskApi, apiClient } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { NewRiskModal } from '../components/NewRiskModal';
import { DetailModal } from '../components/DetailModal';
import { EditRiskModal } from '../components/EditRiskModal';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState } from 'react';

const riskLevelColors: Record<string, string> = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#7f1d1d' };

export function RisksPage() {
  const { getToken, account, hasRole } = useAuth();
  const canEdit = hasRole('GRC.Admin') || hasRole('GRC.RiskManager');
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

  const { data, isLoading } = useQuery({ queryKey: ['risks'], queryFn: riskApi.getAll, enabled: ready });

  const createRisk = useMutation({
    mutationFn: (risk: Record<string, unknown>) => riskApi.create(risk),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['risks'] }); setShowModal(false); },
  });

  const deleteRisk = useMutation({
    mutationFn: (id: string) => riskApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['risks'] }); setSelected(null); },
  });

  const updateAssessment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => riskApi.updateAssessment(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['risks'] });
      const fresh = await riskApi.getById(selected?.id as string);
      setSelected(fresh);
      setEditing(false);
    },
  });

  const risks = Array.isArray(data) ? data : (data as any)?.items ?? (data as any)?.data ?? [];

  const columns = [
    { key: 'title', label: 'Risk Title' },
    { key: 'categoryName', label: 'Category' },
    { key: 'riskLevel', label: 'Level', render: (row: Record<string, unknown>) => {
      const score = Number(row.riskScore ?? row.inherentScore ?? 0);
      const level = score >= 15 ? 'Critical' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';
      const color = riskLevelColors[level] ?? '#64748b';
      return <span className="badge" style={{ background: `${color}20`, color }}>{level}</span>;
    }},
    { key: 'statusName', label: 'Status' },
    { key: 'owner', label: 'Owner' },
    { key: 'reviewDueDate', label: 'Review Date', render: (row: Record<string, unknown>) => {
      const d = row.reviewDueDate as string;
      return d ? new Date(d).toLocaleDateString('en-AU') : '-';
    }},
    { key: 'actions', label: '', render: (row: Record<string, unknown>) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
          title="View">👁</button>
        {canEdit && <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete risk "${row.title}"?`)) deleteRisk.mutate(row.id as string); }}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
          Delete</button>}
      </div>
    )},
  ];

  const score = selected ? Number((selected as any).riskScore ?? (selected as any).inherentScore ?? 0) : 0;
  const level = score >= 15 ? 'Critical' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';

  return (
    <div>
      <PageHeader title="Risk Management" subtitle="ISO 27001:2022 — Clause 6.1.2 Risk Assessment" icon="◈" color="#ef4444"
        action={canEdit ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Risk</button> : undefined} />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={risks} loading={isLoading} emptyMessage="No risks recorded yet"
            onRowClick={async (row) => { const full = await riskApi.getById(row.id as string); setSelected(full); }} />
        </div>
      </div>
      {selected && !editing && (
        <DetailModal canEdit={canEdit}
          title={String(selected.title)}
          subtitle={`Risk ID: ${String(selected.id).substring(0, 8)}...`}
          icon="◈" color="#ef4444"
          onClose={() => setSelected(null)}
          onEdit={() => setEditing(true)}
          onDelete={() => { if (window.confirm(`Delete "${selected.title}"?`)) deleteRisk.mutate(selected.id as string); }}
          fields={[
            { label: 'Category', value: String(selected.categoryName ?? selected.category ?? '') },
            { label: 'Risk Level', value: level, color: riskLevelColors[level] },
            { label: 'Inherent Score', value: score },
            { label: 'Status', value: String(selected.statusName ?? selected.status ?? '') },
            { label: 'Owner', value: selected.owner as string },
            { label: 'Department', value: selected.department as string },
            { label: 'Regulatory Reference', value: selected.regulatoryReference as string },
            { label: 'Review Due Date', value: selected.reviewDueDate ? new Date(selected.reviewDueDate as string).toLocaleDateString('en-AU') : null },
            { label: 'Description', value: selected.description as string, wide: true },
            { label: 'Created By', value: selected.createdBy as string },
            { label: 'Created At', value: selected.createdAt ? new Date(selected.createdAt as string).toLocaleDateString('en-AU') : null },
          ]} />
      )}
      {selected && editing && (
        <EditRiskModal risk={selected} saving={updateAssessment.isPending} onClose={() => setEditing(false)}
          onSave={(formData) => updateAssessment.mutate({ id: selected.id as string, data: {
            likelihood: ['Rare','Unlikely','Possible','Likely','AlmostCertain'][formData.likelihood - 1],
            impact: ['Insignificant','Minor','Moderate','Major','Catastrophic'][formData.impact - 1],
            residualLikelihood: ['Rare','Unlikely','Possible','Likely','AlmostCertain'][(formData.residualLikelihood ?? 1) - 1],
            residualImpact: ['Insignificant','Minor','Moderate','Major','Catastrophic'][(formData.residualImpact ?? 1) - 1],
          }})} />
      )}
      {showModal && (
        <NewRiskModal onClose={() => setShowModal(false)} onSave={(formData) => {
          createRisk.mutate({
            title: formData.title, category: formData.category, description: formData.description,
            likelihood: formData.likelihood, impact: formData.impact,
            riskScore: formData.likelihood * formData.impact, owner: formData.owner,
            treatmentOption: formData.treatmentOption, treatmentPlan: formData.treatmentPlan,
            annexAControl: formData.annexAControl, residualLikelihood: formData.residualLikelihood,
            residualImpact: formData.residualImpact,
            residualScore: (formData.residualLikelihood ?? 1) * (formData.residualImpact ?? 1),
            reviewDueDate: formData.reviewDueDate,
          });
        }} />
      )}
    </div>
  );
}