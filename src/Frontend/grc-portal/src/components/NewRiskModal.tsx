import { useState } from 'react';
import type { CSSProperties } from 'react';

interface NewRiskModalProps {
  onClose: () => void;
  onSave: (risk: RiskFormData) => void;
}

export interface RiskFormData {
  title: string;
  description: string;
  category: number;
  likelihood: number;
  impact: number;
  owner: string;
  department: string;
  reviewDueDate: string;
  regulatoryReference: string;
  treatmentOption: number;
  treatmentPlan: string;
  annexAControl: string;
  residualLikelihood: number;
  residualImpact: number;
}

const CATEGORIES = [
  { value: 1, label: 'Strategic' }, { value: 2, label: 'Operational' },
  { value: 3, label: 'Financial' }, { value: 4, label: 'Compliance' },
  { value: 5, label: 'Technology' }, { value: 6, label: 'Reputational' },
  { value: 7, label: 'Legal' },
];
const LIKELIHOOD_LABELS = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const IMPACT_LABELS = ['', 'Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const TREATMENT_OPTIONS = [
  { value: 2, label: 'Reduce (Mitigate)' }, { value: 4, label: 'Accept (Tolerate)' },
  { value: 3, label: 'Transfer (Share)' },  { value: 1, label: 'Avoid (Terminate)' },
];
const ANNEX_A_CONTROLS = ['A.5 - Organisational Controls','A.6 - People Controls','A.7 - Physical Controls','A.8.1 - User Endpoint Devices','A.8.2 - Privileged Access Rights','A.8.3 - Information Access Restriction','A.8.5 - Secure Authentication','A.8.7 - Protection Against Malware','A.8.8 - Technical Vulnerabilities','A.8.9 - Configuration Management','A.8.13 - Information Backup','A.8.15 - Logging','A.8.24 - Cryptography','A.8.28 - Secure Coding','Not Applicable'];

function ScoreChip({ score }: { score: number }) {
  const color = score >= 15 ? '#ef4444' : score >= 8 ? '#f59e0b' : score >= 4 ? '#eab308' : '#10b981';
  const label = score >= 15 ? 'Critical' : score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:`${color}20`, color, fontWeight:700, fontSize:13 }}>
      <span style={{ fontSize:18, fontWeight:800 }}>{score}</span>
      <span style={{ fontSize:11 }}>{label}</span>
    </span>
  );
}

function ScaleSelector({ value, labels, onChange }: { value: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <div style={{ display:'flex', gap:6 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" title={labels[n]} onClick={() => onChange(n)} style={{
          width:44, height:44, borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:15,
          background: value === n ? (n <= 2 ? '#10b981' : n === 3 ? '#f59e0b' : '#ef4444') : '#2a2a3a',
          color: value === n ? '#fff' : '#888', transition:'all 0.15s',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
        }}>
          {n}
        </button>
      ))}
    </div>
  );
}

const INITIAL: RiskFormData = {
  title:'', description:'', category:0, likelihood:1, impact:1,
  owner:'', department:'', reviewDueDate:'', regulatoryReference:'',
  treatmentOption:0, treatmentPlan:'', annexAControl:'',
  residualLikelihood:1, residualImpact:1,
};

const inp: CSSProperties = { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid #333', background:'#1a1a2e', color:'#e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const lbl: CSSProperties = { fontSize:11, fontWeight:600, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6, display:'block' };
const row2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 };
const card = { padding:16, background:'#1a1a2e', borderRadius:10, border:'1px solid #333' };

export function NewRiskModal({ onClose, onSave }: NewRiskModalProps) {
  const [form, setForm] = useState<RiskFormData>(INITIAL);
  const [step, setStep] = useState(1);
  const riskScore = form.likelihood * form.impact;
  const residualScore = form.residualLikelihood * form.residualImpact;
  const set = (field: keyof RiskFormData, value: string | number) => setForm(f => ({ ...f, [field]: value }));
  const step1Valid = !!(form.title && form.category && form.owner);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#12121e', borderRadius:16, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid #2a2a3a', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>

        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', marginBottom:4 }}>New Risk</h2>
            <p style={{ fontSize:12, color:'#64748b' }}>ISO 27001:2022 — Clause 6.1.2 Risk Assessment</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', fontSize:22, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        <div style={{ display:'flex', padding:'0 28px', borderBottom:'1px solid #2a2a3a' }}>
          {[{n:1,label:'Identification'},{n:2,label:'Assessment'},{n:3,label:'Treatment'}].map(s => (
            <button key={s.n} onClick={() => setStep(s.n)} type="button" style={{ padding:'12px 16px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight: step===s.n ? 700 : 500, color: step===s.n ? '#818cf8' : '#64748b', borderBottom: step===s.n ? '2px solid #818cf8' : '2px solid transparent', marginBottom:-1 }}>
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>

          {step === 1 && <>
            <div>
              <label style={lbl}>Risk Title *</label>
              <input style={inp} placeholder="e.g. Unauthorised access to customer data" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Category *</label>
                <select style={inp} value={form.category} onChange={e => set('category', Number(e.target.value))}>
                  <option value={0}>Select category...</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background:'#1a1a2e' }}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Risk Owner *</label>
                <input style={inp} placeholder="e.g. John Smith" value={form.owner} onChange={e => set('owner', e.target.value)} />
              </div>
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Department</label>
                <input style={inp} placeholder="e.g. IT, Finance, HR" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Regulatory Reference</label>
                <input style={inp} placeholder="e.g. ISO 27001 A.8.3" value={form.regulatoryReference} onChange={e => set('regulatoryReference', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={lbl}>Risk Description</label>
              <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} placeholder="Describe the risk scenario, cause and potential effect..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </>}

          {step === 2 && <>
            <div style={card}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:14, letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:600 }}>Inherent Risk Score</div>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Likelihood</label>
                <ScaleSelector value={form.likelihood} labels={LIKELIHOOD_LABELS} onChange={v => set('likelihood', v)} />
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>{LIKELIHOOD_LABELS[form.likelihood]}</div>
              </div>
              <div>
                <label style={lbl}>Impact</label>
                <ScaleSelector value={form.impact} labels={IMPACT_LABELS} onChange={v => set('impact', v)} />
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>{IMPACT_LABELS[form.impact]}</div>
              </div>
              <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:13, color:'#64748b' }}>Risk Score = {form.likelihood} × {form.impact} =</span>
                <ScoreChip score={riskScore} />
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:14, letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:600 }}>Residual Risk (after treatment)</div>
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Residual Likelihood</label>
                <ScaleSelector value={form.residualLikelihood} labels={LIKELIHOOD_LABELS} onChange={v => set('residualLikelihood', v)} />
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>{LIKELIHOOD_LABELS[form.residualLikelihood]}</div>
              </div>
              <div>
                <label style={lbl}>Residual Impact</label>
                <ScaleSelector value={form.residualImpact} labels={IMPACT_LABELS} onChange={v => set('residualImpact', v)} />
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>{IMPACT_LABELS[form.residualImpact]}</div>
              </div>
              <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:13, color:'#64748b' }}>Residual Score =</span>
                <ScoreChip score={residualScore} />
                {residualScore < riskScore && <span style={{ fontSize:12, color:'#10b981' }}>↓ {riskScore - residualScore} reduction</span>}
              </div>
            </div>

            <div style={row2}>
              <div>
                <label style={lbl}>Review Due Date</label>
                <input type="date" style={{ ...inp, colorScheme:'dark' }} value={form.reviewDueDate} onChange={e => set('reviewDueDate', e.target.value)} />
              </div>
            </div>
          </>}

          {step === 3 && <>
            <div>
              <label style={lbl}>Treatment Option *</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {TREATMENT_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('treatmentOption', opt.value)} style={{ padding:'14px 16px', borderRadius:10, cursor:'pointer', textAlign:'left', border:`1px solid ${form.treatmentOption===opt.value ? '#818cf8' : '#2a2a3a'}`, background: form.treatmentOption===opt.value ? '#818cf820' : '#1a1a2e', color: form.treatmentOption===opt.value ? '#818cf8' : '#94a3b8', fontWeight: form.treatmentOption===opt.value ? 700 : 400, fontSize:13 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Treatment Plan</label>
              <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} placeholder="Describe the specific actions to treat this risk..." value={form.treatmentPlan} onChange={e => set('treatmentPlan', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Annex A Control Mapping</label>
              <select style={inp} value={form.annexAControl} onChange={e => set('annexAControl', e.target.value)}>
                <option value="">Select applicable control...</option>
                {ANNEX_A_CONTROLS.map(c => <option key={c} style={{ background:'#1a1a2e' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ ...card, display:'flex', gap:24, alignItems:'center' }}>
              <div><div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>Inherent Risk</div><ScoreChip score={riskScore} /></div>
              <div style={{ fontSize:20, color:'#334155' }}>→</div>
              <div><div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>Residual Risk</div><ScoreChip score={residualScore} /></div>
            </div>
          </>}
        </div>

        <div style={{ padding:'16px 28px', borderTop:'1px solid #2a2a3a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:6 }}>
            {[1,2,3].map(n => <div key={n} style={{ width:8, height:8, borderRadius:'50%', background: step===n ? '#818cf8' : '#2a2a3a' }} />)}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {step > 1 && <button onClick={() => setStep(s => s-1)} style={{ padding:'10px 20px', borderRadius:8, border:'1px solid #2a2a3a', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:14 }}>Back</button>}
            {step < 3
              ? <button onClick={() => setStep(s => s+1)} className="btn-primary" style={{ padding:'10px 24px', opacity: step===1 && !step1Valid ? 0.4 : 1 }} disabled={step===1 && !step1Valid}>Next →</button>
              : <button onClick={() => onSave(form)} className="btn-primary" style={{ padding:'10px 24px', opacity: !form.treatmentOption ? 0.4 : 1 }} disabled={!form.treatmentOption}>Save Risk</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}




