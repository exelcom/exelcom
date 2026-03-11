import { useQuery } from '@tanstack/react-query';
import { riskApi } from '../services/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

const riskLevelColors: Record<string, string> = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#7f1d1d',
};

export function RisksPage() {
  const { data, isLoading } = useQuery({ queryKey: ['risks'], queryFn: riskApi.getAll });
  const risks = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  const columns = [
    { key: 'title', label: 'Risk Title' },
    { key: 'category', label: 'Category' },
    {
      key: 'riskLevel', label: 'Level',
      render: (row: Record<string, unknown>) => {
        const level = String(row.riskLevel ?? row.level ?? '—');
        return (
          <span className="badge" style={{
            background: `${riskLevelColors[level] ?? '#64748b'}20`,
            color: riskLevelColors[level] ?? '#64748b',
          }}>
            {level}
          </span>
        );
      },
    },
    { key: 'status', label: 'Status' },
    { key: 'owner', label: 'Owner' },
  ];

  return (
    <div>
      <PageHeader
        title="Risk Management"
        subtitle="Identify, assess and mitigate organisational risks"
        icon="◈"
        color="#ef4444"
        action={
          <button className="btn-primary">+ New Risk</button>
        }
      />
      <div style={{ padding: '24px 40px' }}>
        <div className="card animate-fade-up">
          <DataTable columns={columns} data={risks} loading={isLoading} emptyMessage="No risks recorded yet" />
        </div>
      </div>
    </div>
  );
}
