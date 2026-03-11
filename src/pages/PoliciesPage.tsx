import { useQuery } from '@tanstack/react-query';
import { policyApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

export function PoliciesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['policies'], queryFn: policyApi.getAll });
  const policies = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  const columns = [
    { key: 'title', label: 'Policy Title' },
    { key: 'category', label: 'Category' },
    { key: 'version', label: 'Version' },
    {
      key: 'status', label: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = String(row.status ?? '—');
        const colors: Record<string, string> = { Active: '#10b981', Draft: '#f59e0b', Archived: '#64748b', UnderReview: '#6366f1' };
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
    { key: 'owner', label: 'Owner' },
  ];

  return (
    <div>
      <PageHeader
        title="Policy Management"
        subtitle="Manage, version and distribute organisational policies"
        icon="◇"
        color="#6366f1"
        action={<button className="btn-primary">+ New Policy</button>}
      />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={policies} loading={isLoading} emptyMessage="No policies recorded yet" />
        </div>
      </div>
    </div>
  );
}
