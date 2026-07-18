import { useState } from 'react';
import type { CSSProperties } from 'react';

interface NewPolicyModalProps {
  onClose: () => void;
  onSave: (data: PolicyFormData) => void;
  initialData?: PolicyFormData;
}

export interface PolicyFormData {
  title: string;
  description: string;
  category: number;
  content: string;
  owner: string;
  department: string;
  requiresAttestation: boolean;
  reviewDueDate: string;
}

const POLICY_CATEGORIES = [
  { value: 1, label: 'Information Security' },
  { value: 2, label: 'Data Privacy' },
  { value: 3, label: 'Risk Management' },
  { value: 4, label: 'Business Continuity' },
  { value: 5, label: 'Human Resources' },
  { value: 6, label: 'Legal' },
  { value: 7, label: 'Operational' },
];

const inp: CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e7de', background: '#f4f5ee', color: '#14170d', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6b7060', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };

const INITIAL: PolicyFormData = { title: '', description: '', category: 0, content: '', owner: '', department: '', requiresAttestation: false, reviewDueDate: '' };

export function NewPolicyModal({ onClose, onSave, initialData }: NewPolicyModalProps) {
  const [form, setForm] = useState<PolicyFormData>(initialData ?? INITIAL);
  const [step, setStep] = useState(1);
  const set = (field: keyof PolicyFormData, value: string | number | boolean) => setForm(f => ({ ...f, [field]: value }));
  const step1Valid = !!(form.title && form.category);
  const isValid = step1Valid && !!form.content;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e6e7de', boxShadow: '0 24px 80px rgba(20,23,13,0.14)' }}>

        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e6e7de', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#14170d', marginBottom: 4 }}>New Policy</h2>
            <p style={{ fontSize: 12, color: '#6b7060' }}>ISO 27001:2022 — Policy Management</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7060', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', padding: '0 28px', borderBottom: '1px solid #e6e7de' }}>
          {[{ n: 1, label: 'Details' }, { n: 2, label: 'Content' }].map(s => (
            <button key={s.n} onClick={() => setStep(s.n)} type="button" style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: step === s.n ? 700 : 500, color: step === s.n ? '#5c8a00' : '#6b7060', borderBottom: step === s.n ? '2px solid #5c8a00' : '2px solid transparent', marginBottom: -1 }}>
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {step === 1 && <>
            <div>
              <label style={lbl}>Policy Title *</label>
              <input style={inp} placeholder="e.g. Information Security Policy" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Category *</label>
                <select style={inp} value={form.category} onChange={e => set('category', Number(e.target.value))}>
                  <option value={0}>Select category...</option>
                  {POLICY_CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: '#f4f5ee' }}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Policy Owner</label>
                <input style={inp} placeholder="e.g. CISO" value={form.owner} onChange={e => set('owner', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Department</label>
                <input style={inp} placeholder="e.g. IT Security" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Review Due Date</label>
                <input type="date" style={{ ...inp, colorScheme: 'dark' }} value={form.reviewDueDate} onChange={e => set('reviewDueDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Brief description of this policy's purpose and scope..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: '#f4f5ee', borderRadius: 10, border: '1px solid #e6e7de' }}>
              <input type="checkbox" id="attestation" checked={form.requiresAttestation} onChange={e => set('requiresAttestation', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#5c8a00', cursor: 'pointer' }} />
              <div>
                <label htmlFor="attestation" style={{ fontSize: 14, color: '#14170d', cursor: 'pointer', fontWeight: 600 }}>Requires Staff Attestation</label>
                <div style={{ fontSize: 12, color: '#6b7060', marginTop: 2 }}>Staff must acknowledge they have read and understood this policy</div>
              </div>
            </div>
          </>}

          {step === 2 && <>
            <div>
              <label style={lbl}>Policy Content *</label>
              <textarea style={{ ...inp, minHeight: 280, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} placeholder="Enter the full policy content here...&#10;&#10;1. Purpose&#10;2. Scope&#10;3. Policy Statement&#10;4. Responsibilities&#10;5. Compliance" value={form.content} onChange={e => set('content', e.target.value)} />
              <div style={{ fontSize: 11, color: '#6b7060', marginTop: 6 }}>{form.content.length} characters</div>
            </div>
          </>}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid #e6e7de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map(n => <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: step === n ? '#5c8a00' : '#e6e7de' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e6e7de', background: 'none', color: '#6b7060', cursor: 'pointer', fontSize: 14 }}>Back</button>}
            {step < 2
              ? <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '10px 24px', opacity: !step1Valid ? 0.4 : 1 }} disabled={!step1Valid}>Next →</button>
              : <button onClick={() => onSave(form)} className="btn-primary" style={{ padding: '10px 24px', opacity: !isValid ? 0.4 : 1 }} disabled={!isValid}>Create Policy</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}





