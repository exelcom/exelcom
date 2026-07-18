import { useState } from 'react';

interface EditAuditModalProps {
  audit: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: { title: string; scope: string; leadAuditor: string; startDate: string; endDate: string }) => void;
  saving?: boolean;
}

const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e7de', background: '#f4f5ee', color: '#14170d', fontSize: 14, boxSizing: 'border-box' } as React.CSSProperties;
const lbl = { fontSize: 11, fontWeight: 600, color: '#6b7060', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' };

export function EditAuditModal({ audit, onClose, onSave, saving }: EditAuditModalProps) {
  const [title, setTitle] = useState(String(audit.title ?? ''));
  const [scope, setScope] = useState(String(audit.scope ?? ''));
  const [leadAuditor, setLeadAuditor] = useState(String(audit.leadAuditor ?? ''));
  const [startDate, setStartDate] = useState(audit.startDate ?? audit.plannedStartDate ? String(audit.startDate ?? audit.plannedStartDate).substring(0, 10) : '');
  const [endDate, setEndDate] = useState(audit.endDate ?? audit.plannedEndDate ? String(audit.endDate ?? audit.plannedEndDate).substring(0, 10) : '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520, border: '1px solid #e6e7de', boxShadow: '0 24px 80px rgba(20,23,13,0.14)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e6e7de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14170d' }}>Edit Audit</h2>
            <p style={{ fontSize: 12, color: '#6b7060', marginTop: 2 }}>{String(audit.title)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7060', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lbl}>Title</label><input style={inp} value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Lead Auditor</label><input style={inp} value={leadAuditor} onChange={e => setLeadAuditor(e.target.value)} /></div>
            <div></div>
            <div><label style={lbl}>Start Date</label><input type="date" style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label style={lbl}>End Date</label><input type="date" style={inp} value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div><label style={lbl}>Scope</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={scope} onChange={e => setScope(e.target.value)} /></div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e6e7de', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e6e7de', background: 'none', color: '#6b7060', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button disabled={saving} onClick={() => onSave({ title, scope, leadAuditor, startDate, endDate })} className="btn-primary" style={{ padding: '9px 24px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}


