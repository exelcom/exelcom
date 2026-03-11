import { useState } from 'react';
import type { CSSProperties } from 'react';

export interface FrameworkFormData {
  name: string;
  description: string;
  type: number;
  version: string;
}

interface NewFrameworkModalProps {
  onClose: () => void;
  onSave: (data: FrameworkFormData) => void;
}

const FRAMEWORK_TYPES = [
  { value: 1, label: 'ISO 27001' }, { value: 2, label: 'SOC 2' },
  { value: 3, label: 'NIST' }, { value: 4, label: 'PCI DSS' },
  { value: 5, label: 'GDPR' }, { value: 6, label: 'Australian Privacy Act' },
  { value: 7, label: 'APRA' }, { value: 99, label: 'Custom' },
];

const inp: CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #333', background:'#1a1a2e', color:'#e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lbl: CSSProperties = { fontSize:11, fontWeight:600, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6, display:'block' };

export function NewFrameworkModal({ onClose, onSave }: NewFrameworkModalProps) {
  const [form, setForm] = useState<FrameworkFormData>({ name:'', description:'', type:0, version:'' });
  const set = (field: keyof FrameworkFormData, value: string | number) => setForm(f => ({ ...f, [field]: value }));
  const isValid = !!(form.name && form.type && form.version);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#12121e', borderRadius:16, width:'100%', maxWidth:560, border:'1px solid #2a2a3a', boxShadow:'0 24px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', marginBottom:4 }}>New Compliance Framework</h2>
            <p style={{ fontSize:12, color:'#64748b' }}>ISO 27001:2022 — Clause 6.1.3 Compliance Tracking</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', fontSize:22, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={lbl}>Framework Name *</label>
            <input style={inp} placeholder="e.g. ISO 27001:2022 ISMS" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <label style={lbl}>Framework Type *</label>
              <select style={inp} value={form.type} onChange={e => set('type', Number(e.target.value))}>
                <option value={0}>Select type...</option>
                {FRAMEWORK_TYPES.map(t => <option key={t.value} value={t.value} style={{ background:'#1a1a2e' }}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Version *</label>
              <input style={inp} placeholder="e.g. 2022" value={form.version} onChange={e => set('version', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} placeholder="Describe the scope and purpose of this compliance framework..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid #2a2a3a', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:8, border:'1px solid #2a2a3a', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:14 }}>Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary" style={{ padding:'10px 24px', opacity: !isValid ? 0.4 : 1 }} disabled={!isValid}>Create Framework</button>
        </div>
      </div>
    </div>
  );
}



