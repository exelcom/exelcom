import { useState } from 'react';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Information Security', value: 'InformationSecurity' },
  { label: 'Data Privacy', value: 'DataPrivacy' },
  { label: 'Risk Management', value: 'RiskManagement' },
  { label: 'Business Continuity', value: 'BusinessContinuity' },
  { label: 'Human Resources', value: 'HumanResources' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Operational', value: 'Operational' },
];

interface EditPolicyModalProps {
  policy: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: { title: string; description: string; category: string; owner: string; department: string; requiresAttestation: boolean; reviewDueDate: string }) => void;
  saving?: boolean;
}

const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' } as React.CSSProperties;
const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' };

export function EditPolicyModal({ policy, onClose, onSave, saving }: EditPolicyModalProps) {
  const [title, setTitle] = useState(String(policy.title ?? ''));
  const [description, setDescription] = useState(String(policy.description ?? ''));
  const [category, setCategory] = useState<string>(String(policy.categoryName ?? policy.category ?? 'InformationSecurity'));
  const [owner, setOwner] = useState(String(policy.owner ?? ''));
  const [department, setDepartment] = useState(String(policy.department ?? ''));
  const [requiresAttestation, setRequiresAttestation] = useState(Boolean(policy.requiresAttestation));
  const [reviewDueDate, setReviewDueDate] = useState(policy.reviewDueDate ? String(policy.reviewDueDate).substring(0, 10) : '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#12121e', borderRadius: 16, width: '100%', maxWidth: 560, border: '1px solid #2a2a3a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>Edit Policy</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{String(policy.title)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
          <div><label style={lbl}>Title</label><input style={inp} value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Owner</label><input style={inp} value={owner} onChange={e => setOwner(e.target.value)} /></div>
            <div><label style={lbl}>Department</label><input style={inp} value={department} onChange={e => setDepartment(e.target.value)} /></div>
            <div><label style={lbl}>Review Due Date</label><input type="date" style={inp} value={reviewDueDate} onChange={e => setReviewDueDate(e.target.value)} /></div>
          </div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="reqAtt" checked={requiresAttestation} onChange={e => setRequiresAttestation(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="reqAtt" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>Requires Attestation</label>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #2a2a3a', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #2a2a3a', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button disabled={saving} onClick={() => onSave({ title, description, category, owner, department, requiresAttestation, reviewDueDate })} className="btn-primary" style={{ padding: '9px 24px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}




