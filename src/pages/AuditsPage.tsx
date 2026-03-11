import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

export function AuditsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['audits'], queryFn: auditApi.getAll });
  const audits = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  const columns = [
    { key: 'title', label: 'Audit Title' },
    { key: 'type', label: 'Type' },
    { key: 'auditor', label: 'Auditor' },
    {
      key: 'status', label: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = String(row.status ?? '—');
        const colors: Record<string, string> = {
          Planned: '#6366f1', InProgress: '#f59e0b',
          Completed: '#10b981', Cancelled: '#64748b',
        };
        return (
          <span className="badge" style={{
            background: `${colors[status] ?? '#64748b'}20`,
            color: colors[status] ?? '#64748b',
          }}>
            {status}
          </span>
        );
      },
    },
    {
      key: 'startDate', label: 'Start Date',
      render: (row: Record<string, unknown>) => {
        const d = row.startDate as string;
        return d ? new Date(d).toLocaleDateString('en-AU') : '—';
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Management"
        subtitle="Plan, execute and report on internal and external audits"
        icon="◉"
        color="#10b981"
        action={<button className="btn-primary">+ New Audit</button>}
      />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={audits} loading={isLoading} emptyMessage="No audits recorded yet" />
        </div>
      </div>
    </div>
  );
}
