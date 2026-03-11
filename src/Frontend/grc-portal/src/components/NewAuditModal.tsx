import { useState } from 'react';
import type { CSSProperties } from 'react';

interface NewAuditModalProps {
  onClose: () => void;
  onSave: (data: AuditFormData) => void;
}

export interface AuditFormData {
  title: string;
  scope: string;
  type: number;
  leadAuditor: string;
  startDate: string;
  endDate: string;
}

const AUDIT_TYPES = [
  { value: 1, label: 'Internal', icon: '🏢', desc: 'Conducted by internal audit team' },
  { value: 2, label: 'External', icon: '🔍', desc: 'Conducted by third-party auditors' },
  { value: 3, label: 'Regulatory', icon: '⚖️', desc: 'Required by regulatory body' },
  { value: 4, label: 'Supplier', icon: '🤝', desc: 'Audit of supplier/vendor' },
];

const inp: CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#1a1a2e', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };

const INITIAL: AuditFormData = { title: '', scope: '', type: 0, leadAuditor: '', startDate: '', endDate: '' };

export function NewAuditModal({ onClose, onSave }: NewAuditModalProps) {
  const [form, setForm] = useState<AuditFormData>(INITIAL);
  const set = (field: keyof AuditFormData, value: string | number) => setForm(f => ({ ...f, [field]: value }));
  const isValid = !!(form.title && form.scope && form.type && form.leadAuditor && form.startDate && form.endDate);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#12121e', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #2a2a3a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>New Audit</h2>
            <p style={{ fontSize: 12, color: '#64748b' }}>ISO 27001:2022 — Clause 9.2 Internal Audit</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <label style={lbl}>Audit Title *</label>
            <input style={inp} placeholder="e.g. Annual ISO 27001 Internal Audit 2026" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Audit Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {AUDIT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)} style={{ padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: `1px solid ${form.type === t.value ? '#10b981' : '#2a2a3a'}`, background: form.type === t.value ? '#10b98120' : '#1a1a2e', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: form.type === t.value ? 700 : 500, color: form.type === t.value ? '#10b981' : '#e2e8f0' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Audit Scope *</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Define the scope of this audit, e.g. departments, systems, processes covered..." value={form.scope} onChange={e => set('scope', e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Lead Auditor *</label>
            <input style={inp} placeholder="e.g. Jane Smith" value={form.leadAuditor} onChange={e => set('leadAuditor', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Planned Start Date *</label>
              <input type="date" style={{ ...inp, colorScheme: 'dark' }} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Planned End Date *</label>
              <input type="date" style={{ ...inp, colorScheme: 'dark' }} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {form.startDate && form.endDate && new Date(form.endDate) > new Date(form.startDate) && (
            <div style={{ padding: 14, background: '#1a1a2e', borderRadius: 10, border: '1px solid #333', display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Duration</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                  {Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Type</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>{AUDIT_TYPES.find(t => t.value === form.type)?.label ?? '—'}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid #2a2a3a', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #2a2a3a', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary" style={{ padding: '10px 24px', opacity: !isValid ? 0.4 : 1 }} disabled={!isValid}>
            Create Audit
          </button>
        </div>
      </div>
    </div>
  );
}




