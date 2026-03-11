import { useState } from 'react';

interface EditFrameworkModalProps {
  framework: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: { name: string; description: string; version: string; isActive: boolean }) => void;
  saving?: boolean;
}

const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' } as React.CSSProperties;
const lbl = { fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' };

export function EditFrameworkModal({ framework, onClose, onSave, saving }: EditFrameworkModalProps) {
  const [name, setName] = useState(String(framework.name ?? ''));
  const [description, setDescription] = useState(String(framework.description ?? ''));
  const [version, setVersion] = useState(String(framework.version ?? ''));
  const [isActive, setIsActive] = useState(Boolean(framework.isActive ?? true));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#12121e', borderRadius: 16, width: '100%', maxWidth: 520, border: '1px solid #2a2a3a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>Edit Framework</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{String(framework.name)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={lbl}>Name</label><input style={inp} value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label style={lbl}>Version</label><input style={inp} value={version} onChange={e => setVersion(e.target.value)} /></div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="isActive" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>Active</label>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #2a2a3a', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #2a2a3a', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button disabled={saving} onClick={() => onSave({ name, description, version, isActive })} className="btn-primary" style={{ padding: '9px 24px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
