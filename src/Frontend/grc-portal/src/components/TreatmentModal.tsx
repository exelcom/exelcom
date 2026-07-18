import { useState } from 'react';

const TREATMENT_OPTIONS = [
  { value: 2, label: 'Reduce (Mitigate)' }, { value: 4, label: 'Accept (Tolerate)' },
  { value: 3, label: 'Transfer (Share)' },  { value: 1, label: 'Avoid (Terminate)' },
];

interface TreatmentModalProps {
  riskTitle: string;
  defaultOwner?: string;
  onClose: () => void;
  onSave: (data: { description: string; type: number; owner: string; dueDate: string }) => void;
  saving?: boolean;
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e7de', background: '#f4f5ee', color: '#14170d', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6b7060', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };

export function TreatmentModal({ riskTitle, defaultOwner, onClose, onSave, saving }: TreatmentModalProps) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState(2);
  const [owner, setOwner] = useState(defaultOwner ?? '');
  const [dueDate, setDueDate] = useState('');
  const valid = !!(description && owner && dueDate);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520, border: '1px solid #e6e7de', boxShadow: '0 24px 80px rgba(20,23,13,0.14)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e6e7de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14170d' }}>Add Treatment</h2>
            <p style={{ fontSize: 12, color: '#6b7060', marginTop: 2 }}>{riskTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7060', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Treatment Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TREATMENT_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setType(opt.value)} style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${type === opt.value ? '#5c8a00' : '#e6e7de'}`, background: type === opt.value ? '#5c8a0020' : '#f4f5ee', color: type === opt.value ? '#5c8a00' : '#6b7060', fontWeight: type === opt.value ? 700 : 400, fontSize: 13 }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Description *</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="What action will be taken to treat this risk..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Owner *</label>
              <input style={inp} placeholder="e.g. John Smith" value={owner} onChange={e => setOwner(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Due Date *</label>
              <input type="date" style={inp} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e6e7de', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e6e7de', background: 'none', color: '#6b7060', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button disabled={saving || !valid} onClick={() => onSave({ description, type, owner, dueDate: new Date(dueDate).toISOString() })}
            className="btn-primary" style={{ padding: '9px 24px', opacity: (saving || !valid) ? 0.5 : 1 }}>
            {saving ? 'Saving...' : 'Add Treatment'}
          </button>
        </div>
      </div>
    </div>
  );
}
