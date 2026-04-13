import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../auth/useAuth';
import { useState } from 'react';
import { AppRoles } from '../auth/authConfig';

interface PortalAccount {
  id: string;
  username: string;
  customerName: string;
  crmCustomerId: string;
  grcCustomerId: string;
  parentGrcCustomerId?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  totpEnabled?: boolean;
}

interface AccountForm {
  username: string;
  password: string;
  customerName: string;
  crmCustomerId: string;
  grcCustomerId: string;
  parentGrcCustomerId: string;
}

const EMPTY_FORM: AccountForm = {
  username: '', password: '', customerName: '',
  crmCustomerId: '', grcCustomerId: '', parentGrcCustomerId: '',
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block',
};

const portalApi = {
  listAccounts: () => apiClient.get('/portal/api/portal/accounts').then(r => r.data),
  createAccount: (data: AccountForm) => apiClient.post('/portal/api/portal/accounts', data).then(r => r.data),
  updateAccount: (id: string, data: Partial<AccountForm>) =>
    apiClient.put(`/portal/api/portal/accounts/${id}`, data).then(r => r.data),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch(`/portal/api/portal/accounts/${id}/active`, { isActive }).then(r => r.data),
  resetPassword: (id: string, newPassword: string) =>
    apiClient.post(`/portal/api/portal/accounts/${id}/password`, { newPassword }).then(r => r.data),
  deleteAccount: (id: string) =>
    apiClient.delete(`/portal/api/portal/accounts/${id}`).then(r => r.data),
  disableMfa: (id: string) =>
    apiClient.delete(`/portal/api/portal/mfa/${id}`).then(r => r.data),
};

function AccountModal({ account, onClose, onSave }: {
  account?: PortalAccount;
  onClose: () => void;
  onSave: (data: AccountForm) => void;
}) {
  const isEdit = !!account;
  const [form, setForm] = useState<AccountForm>(
    account ? {
      username: account.username, password: '',
      customerName: account.customerName,
      crmCustomerId: account.crmCustomerId,
      grcCustomerId: account.grcCustomerId,
      parentGrcCustomerId: account.parentGrcCustomerId ?? '',
    } : EMPTY_FORM
  );
  const set = (k: keyof AccountForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isValid = !!(form.username && form.customerName && form.grcCustomerId && (isEdit || form.password));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e1e2e', borderRadius: 20, width: '100%', maxWidth: 600, border: '1px solid #2e2e42', boxShadow: '0 32px 100px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', background: 'linear-gradient(135deg, #6366f115, #818cf810)', borderBottom: '1px solid #2e2e42', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#6366f120', border: '1px solid #6366f140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {isEdit ? '✏️' : '👤'}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 3, color: '#f1f5f9' }}>{isEdit ? 'Edit Customer Account' : 'New Customer Account'}</h2>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Customer Portal access — no Microsoft account required</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section: Login Credentials */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔐</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Login Credentials</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '16px 18px', borderRadius: 10, background: '#16162a', border: '1px solid #2e2e42' }}>
              <div>
                <label style={lbl}>Username *</label>
                <input style={{ ...inp, opacity: isEdit ? 0.6 : 1, background: isEdit ? '#2a2a3a' : '#252535' }}
                  placeholder="e.g. acme.client"
                  value={form.username} onChange={e => set('username', e.target.value)} disabled={isEdit} />
                {!isEdit && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Used to log into the Customer Portal</div>}
                {isEdit && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Username cannot be changed</div>}
              </div>
              <div>
                <label style={lbl}>{isEdit ? 'New Password' : 'Password *'}</label>
                <input style={inp} type="password"
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'}
                  value={form.password} onChange={e => set('password', e.target.value)} />
                {!isEdit && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Customer will use this to sign in</div>}
              </div>
            </div>
          </div>

          {/* Section: Customer Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏢</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Customer Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 18px', borderRadius: 10, background: '#16162a', border: '1px solid #2e2e42' }}>
              <div>
                <label style={lbl}>Customer / Company Name *</label>
                <input style={inp} placeholder="e.g. Acme Corporation"
                  value={form.customerName} onChange={e => set('customerName', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>GRC Customer ID *</label>
                  <input style={inp} placeholder="e.g. ACME001"
                    value={form.grcCustomerId} onChange={e => set('grcCustomerId', e.target.value)} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Links customer to their data in the platform</div>
                </div>
                <div>
                  <label style={lbl}>CRM Customer ID</label>
                  <input style={inp} placeholder="e.g. CRM-12345"
                    value={form.crmCustomerId} onChange={e => set('crmCustomerId', e.target.value)} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Your internal CRM reference (optional)</div>
                </div>
              </div>
              <div>
                <label style={lbl}>Parent GRC Customer ID <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span></label>
                <input style={inp} placeholder="Leave blank if this is a top-level customer"
                  value={form.parentGrcCustomerId} onChange={e => set('parentGrcCustomerId', e.target.value)} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Set if this account is a subsidiary or child of another customer</div>
              </div>
            </div>
          </div>

          {/* Info note */}
          {!isEdit && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 10, background: '#0ea5e910', border: '1px solid #0ea5e930' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                The customer will log in at{' '}
                <strong style={{ color: '#0ea5e9' }}>portal.exelcom.au/customer-portal</strong>{' '}
                using their username and password. They will only see their own incidents, assets and compliance data.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid #2e2e42', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16162a' }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {isValid ? '✅ Ready to ' + (isEdit ? 'save' : 'create') : '⚠️ Fill in required fields (*)'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #2e2e42', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Cancel</button>
            <button onClick={() => onSave(form)} className="btn-primary"
              style={{ padding: '10px 28px', opacity: !isValid ? 0.4 : 1, fontWeight: 700 }} disabled={!isValid}>
              {isEdit ? '💾 Save Changes' : '✨ Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ account, onClose, onSave }: {
  account: PortalAccount;
  onClose: () => void;
  onSave: (password: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const isValid = password.length >= 8 && password === confirm;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e1e2e', borderRadius: 20, width: '100%', maxWidth: 460, border: '1px solid #2e2e42', boxShadow: '0 32px 100px rgba(0,0,0,0.4)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '28px 32px 20px', background: 'linear-gradient(135deg, #ef444415, #dc262610)', borderBottom: '1px solid #2e2e42', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ef444420', border: '1px solid #ef444440', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              🔑
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 3, color: '#f1f5f9' }}>Reset Password</h2>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{account.customerName} — <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{account.username}</span></p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '16px 18px', borderRadius: 10, background: '#16162a', border: '1px solid #2e2e42', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' }}>New Password *</label>
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2e2e42', background: '#252535', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                type="password" placeholder="Min 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' }}>Confirm Password *</label>
              <input
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${confirm && password !== confirm ? '#ef4444' : '#2e2e42'}`, background: '#252535', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                type="password" placeholder="Repeat new password"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
              {confirm && password !== confirm && (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ⚠️ Passwords do not match
                </div>
              )}
              {confirm && password === confirm && password.length >= 8 && (
                <div style={{ fontSize: 11, color: '#10b981', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✅ Passwords match
                </div>
              )}
            </div>
          </div>

          {/* Password requirements */}
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#1a1a2e', border: '1px solid #2e2e42' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Password Requirements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'At least 8 characters', met: password.length >= 8 },
                { label: 'Passwords match', met: password === confirm && confirm.length > 0 },
              ].map(req => (
                <div key={req.label} style={{ fontSize: 12, color: req.met ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{req.met ? '✅' : '○'}</span> {req.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid #2e2e42', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16162a' }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {isValid ? '✅ Ready to reset' : '⚠️ Fill in required fields'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 8, border: '1px solid #2e2e42', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Cancel</button>
            <button onClick={() => onSave(password)}
              style={{ padding: '10px 28px', borderRadius: 8, background: isValid ? '#ef4444' : '#ef444440', border: 'none', color: '#fff', cursor: isValid ? 'pointer' : 'default', fontSize: 14, fontWeight: 700, opacity: !isValid ? 0.5 : 1 }}
              disabled={!isValid}>
              🔑 Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<PortalAccount | null>(null);
  const [resetAccount, setResetAccount] = useState<PortalAccount | null>(null);

  const { data, isLoading } = useQuery<PortalAccount[]>({
    queryKey: ['portal-accounts'],
    queryFn: portalApi.listAccounts,
  });

  const accounts = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: (form: AccountForm) => portalApi.createAccount(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: AccountForm }) =>
      form.password
        ? portalApi.updateAccount(id, form).then(() => portalApi.resetPassword(id, form.password))
        : portalApi.updateAccount(id, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }); setEditAccount(null); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => portalApi.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => portalApi.resetPassword(id, password),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }); setResetAccount(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalApi.deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }),
  });

  const disableMfaMutation = useMutation({
    mutationFn: (id: string) => portalApi.disableMfa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-accounts'] }),
  });

  if (!hasRole(AppRoles.Admin)) {
    return (
      <div style={{ padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)' }}>This section is only accessible to GRC Administrators.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin — Customer Portal Accounts"
        subtitle="Manage external customer access to the Customer Portal"
        icon="⚙️"
        color="#6366f1"
        action={
          <button className="btn-primary" onClick={() => { setEditAccount(null); setShowModal(true); }}>
            + New Account
          </button>
        }
      />
      <div style={{ padding: '24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Accounts', value: accounts.length, color: '#6366f1' },
            { label: 'Active', value: accounts.filter(a => a.isActive).length, color: '#10b981' },
            { label: 'Inactive', value: accounts.filter(a => !a.isActive).length, color: '#ef4444' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: stat.color + '20', border: '1px solid ' + stat.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: stat.color }}>
                {stat.value}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="card animate-fade-up">
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No customer accounts yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Create an account to give a customer access to the Customer Portal.</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create First Account</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Customer', 'Username', 'GRC ID', 'CRM ID', 'Status', 'Last Login', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{a.customerName}</div>
                        {a.parentGrcCustomerId && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Child of {a.parentGrcCustomerId}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace' }}>{a.username}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, background: '#6366f120', color: '#6366f1', fontWeight: 600 }}>{a.grcCustomerId}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{a.crmCustomerId || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: a.isActive ? '#10b98120' : '#ef444420', color: a.isActive ? '#10b981' : '#ef4444' }}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setEditAccount(a)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                            title="Edit">✏️</button>
                          <button onClick={() => setResetAccount(a)}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                            title="Reset Password">🔑</button>
                          {a.totpEnabled && (
                            <button onClick={() => { if (window.confirm(`Disable 2FA for "${a.username}"? They will need to re-enroll their authenticator app.`)) disableMfaMutation.mutate(a.id); }}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #f59e0b', background: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 12 }}
                              title="Disable 2FA">🔓</button>
                          )}
                          <button onClick={() => toggleActiveMutation.mutate({ id: a.id, isActive: !a.isActive })}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: a.isActive ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12 }}
                            title={a.isActive ? 'Disable' : 'Enable'}>
                            {a.isActive ? '🚫' : '✅'}
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete account "${a.username}"? This cannot be undone.`)) deleteMutation.mutate(a.id); }}
                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                            title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 20 }}>ℹ️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Customer Portal URL</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Share this URL with customers:{' '}
              <a href="https://portal.exelcom.au/customer-portal" target="_blank" rel="noreferrer"
                style={{ color: '#6366f1', fontWeight: 600 }}>
                https://portal.exelcom.au/customer-portal
              </a>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AccountModal
          onClose={() => setShowModal(false)}
          onSave={(form) => createMutation.mutate(form)}
        />
      )}
      {editAccount && (
        <AccountModal
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onSave={(form) => updateMutation.mutate({ id: editAccount.id, form })}
        />
      )}
      {resetAccount && (
        <ResetPasswordModal
          account={resetAccount}
          onClose={() => setResetAccount(null)}
          onSave={(password) => resetPasswordMutation.mutate({ id: resetAccount.id, password })}
        />
      )}
    </div>
  );
}
