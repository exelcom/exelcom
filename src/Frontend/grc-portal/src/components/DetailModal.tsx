import type { CSSProperties } from 'react';

interface Field {
  label: string;
  value: string | number | boolean | null | undefined;
  color?: string;
  wide?: boolean;
}

interface DetailModalProps {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  fields: Field[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  canEdit?: boolean;
}

const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 };
const val: CSSProperties = { fontSize: 14, color: '#e2e8f0', fontWeight: 500, wordBreak: 'break-word' };

export function DetailModal({ title, subtitle, icon, color, fields, onClose, onEdit, onDelete, deleteLabel = 'Delete', canEdit = true }: DetailModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#12121e', borderRadius: 16, width: '100%', maxWidth: 640, border: '1px solid #2a2a3a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '20', border: '1px solid ' + color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {fields.map((f, i) => (
              <div key={i} style={{ gridColumn: f.wide ? '1 / -1' : undefined }}>
                <div style={lbl}>{f.label}</div>
                {f.value === null || f.value === undefined || f.value === '' ? (
                  <div style={{ ...val, color: '#475569', fontStyle: 'italic' }}>—</div>
                ) : typeof f.value === 'boolean' ? (
                  <div style={{ ...val, color: f.value ? '#10b981' : '#64748b' }}>{f.value ? 'Yes' : 'No'}</div>
                ) : (
                  <div style={{ ...val, color: f.color ?? '#e2e8f0' }}>{String(f.value)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            {onDelete && canEdit && (
              <button onClick={onDelete} style={{ background: 'none', border: '1px solid #ef444440', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8 }}>
                {deleteLabel}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #2a2a3a', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Close</button>
            {onEdit && (
              canEdit
                ? <button onClick={onEdit} className="btn-primary" style={{ padding: '9px 24px' }}>Edit</button>
                : <button disabled style={{ padding: '9px 24px', borderRadius: 8, border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#475569', fontSize: 14, cursor: 'not-allowed' }} title="You don't have permission to edit">Edit</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}