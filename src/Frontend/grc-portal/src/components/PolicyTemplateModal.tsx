import { useState } from 'react';
import { POLICY_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/PolicyTemplates';
import type { PolicyTemplate } from '../data/PolicyTemplates';
import type { PolicyFormData } from './NewPolicyModal';

interface PolicyTemplateModalProps {
  onClose: () => void;
  onSelect: (data: PolicyFormData) => void;
}

export function PolicyTemplateModal({ onClose, onSelect }: PolicyTemplateModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [preview, setPreview] = useState<PolicyTemplate | null>(null);

  const filtered = POLICY_TEMPLATES.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.isoClause.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || t.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleSelect = (template: PolicyTemplate) => {
    const reviewDate = new Date();
    reviewDate.setFullYear(reviewDate.getFullYear() + 1);
    onSelect({
      title: template.title,
      description: template.description,
      category: template.category,
      content: template.content,
      owner: template.owner,
      department: template.department,
      requiresAttestation: template.requiresAttestation,
      reviewDueDate: reviewDate.toISOString().split('T')[0],
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#12121e', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #2a2a3a', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>Policy Templates</h2>
            <p style={{ fontSize: 12, color: '#64748b' }}>ISO/IEC 27001:2022 — Pre-built policy templates for Exelcom</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Search and filter */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #2a2a3a', display: 'flex', gap: 12 }}>
          <input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
          />
          <select
            value={selectedCategory ?? ''}
            onChange={e => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#e2e8f0', fontSize: 14, outline: 'none' }}
          >
            <option value="">All Categories</option>
            {Object.entries(TEMPLATE_CATEGORIES).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          
          {/* Template list */}
          <div style={{ width: preview ? 340 : '100%', overflowY: 'auto', borderRight: preview ? '1px solid #2a2a3a' : 'none' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No templates found</div>
            ) : (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setPreview(t)}
                    style={{
                      padding: '16px 18px', borderRadius: 10, border: `1px solid ${preview?.id === t.id ? '#818cf8' : '#2a2a3a'}`,
                      background: preview?.id === t.id ? '#1e1e3a' : '#1a1a2e',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, flex: 1, marginRight: 8 }}>{t.title}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#818cf820', color: '#818cf8', whiteSpace: 'nowrap' }}>{t.isoClause}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, lineHeight: 1.4 }}>{t.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#0ea5e920', color: '#0ea5e9' }}>{TEMPLATE_CATEGORIES[t.category]}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#33333a', color: '#94a3b8' }}>{t.owner}</span>
                      {t.requiresAttestation && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#10b98120', color: '#10b981' }}>Requires Attestation</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview panel */}
          {preview && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{preview.title}</div>
                  <div style={{ fontSize: 11, color: '#818cf8' }}>{preview.isoClause}</div>
                </div>
                <button
                  onClick={() => handleSelect(preview)}
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  Use Template →
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <pre style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {preview.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid #2a2a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} template{filtered.length !== 1 ? 's' : ''} available</span>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #2a2a3a', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
