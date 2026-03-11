import { useQuery } from '@tanstack/react-query';
import { complianceApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

export function CompliancePage() {
  const { data, isLoading } = useQuery({ queryKey: ['frameworks'], queryFn: complianceApi.getFrameworks });
  const frameworks = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  const columns = [
    { key: 'name', label: 'Framework' },
    { key: 'version', label: 'Version' },
    { key: 'description', label: 'Description' },
    {
      key: 'status', label: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = String(row.status ?? '—');
        const colors: Record<string, string> = { Active: '#10b981', Inactive: '#64748b', Draft: '#f59e0b' };
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
  ];

  return (
    <div>
      <PageHeader
        title="Compliance Tracking"
        subtitle="Track regulatory frameworks and compliance status"
        icon="◎"
        color="#0ea5e9"
        action={<button className="btn-primary">+ New Framework</button>}
      />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={frameworks} loading={isLoading} emptyMessage="No frameworks recorded yet" />
        </div>
      </div>
    </div>
  );
}
