import { useState } from 'react';

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'AlmostCertain'];
const IMPACT = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

interface EditRiskModalProps {
  risk: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: { likelihood: number; impact: number; residualLikelihood?: number; residualImpact?: number }) => void;
  saving?: boolean;
}

const sel = {
  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e6e7de',
  background: '#f4f5ee', color: '#14170d', fontSize: 14, cursor: 'pointer',
} as React.CSSProperties;

const lbl = { fontSize: 11, fontWeight: 600, color: '#6b7060', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' };

export function EditRiskModal({ risk, onClose, onSave, saving }: EditRiskModalProps) {
  const toIdx = (val: unknown) => {
    if (typeof val === 'number') return val;
    const n = Number(val);
    return isNaN(n) ? 3 : n;
  };

  const [likelihood, setLikelihood] = useState(toIdx(risk.likelihood ?? risk.inherentLikelihood ?? 3));
  const [impact, setImpact] = useState(toIdx(risk.impact ?? risk.inherentImpact ?? 3));
  const [residualLikelihood, setResidualLikelihood] = useState(toIdx(risk.residualLikelihood ?? 2));
  const [residualImpact, setResidualImpact] = useState(toIdx(risk.residualImpact ?? 2));

  const inherentScore = likelihood * impact;
  const residualScore = residualLikelihood * residualImpact;
  const scoreColor = (s: number) => s >= 15 ? '#ef4444' : s >= 8 ? '#f59e0b' : s >= 4 ? '#10b981' : '#6b7060';
  const scoreLabel = (s: number) => s >= 15 ? 'Critical' : s >= 8 ? 'High' : s >= 4 ? 'Medium' : 'Low';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 520, border: '1px solid #e6e7de', boxShadow: '0 24px 80px rgba(20,23,13,0.14)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e6e7de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#14170d' }}>Edit Risk Assessment</h2>
            <p style={{ fontSize: 12, color: '#6b7060', marginTop: 2 }}>{String(risk.title)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7060', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Inherent */}
          <div style={{ background: '#f4f5ee', borderRadius: 10, padding: 16, border: '1px solid #e6e7de' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7060', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inherent Risk</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Likelihood</label>
                <select style={sel} value={likelihood} onChange={e => setLikelihood(Number(e.target.value))}>
                  {LIKELIHOOD.map((l, i) => <option key={l} value={i + 1}>{i + 1} — {l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Impact</label>
                <select style={sel} value={impact} onChange={e => setImpact(Number(e.target.value))}>
                  {IMPACT.map((imp, i) => <option key={imp} value={i + 1}>{i + 1} — {imp}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#6b7060' }}>Score:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(inherentScore) }}>{inherentScore}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(inherentScore), background: scoreColor(inherentScore) + '20', padding: '2px 8px', borderRadius: 4 }}>{scoreLabel(inherentScore)}</span>
            </div>
          </div>

          {/* Residual */}
          <div style={{ background: '#f4f5ee', borderRadius: 10, padding: 16, border: '1px solid #e6e7de' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7060', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Residual Risk (after controls)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Likelihood</label>
                <select style={sel} value={residualLikelihood} onChange={e => setResidualLikelihood(Number(e.target.value))}>
                  {LIKELIHOOD.map((l, i) => <option key={l} value={i + 1}>{i + 1} — {l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Impact</label>
                <select style={sel} value={residualImpact} onChange={e => setResidualImpact(Number(e.target.value))}>
                  {IMPACT.map((imp, i) => <option key={imp} value={i + 1}>{i + 1} — {imp}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#6b7060' }}>Score:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(residualScore) }}>{residualScore}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor(residualScore), background: scoreColor(residualScore) + '20', padding: '2px 8px', borderRadius: 4 }}>{scoreLabel(residualScore)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e6e7de', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e6e7de', background: 'none', color: '#6b7060', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button disabled={saving} onClick={() => onSave({ likelihood, impact, residualLikelihood, residualImpact })}
            className="btn-primary" style={{ padding: '9px 24px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
