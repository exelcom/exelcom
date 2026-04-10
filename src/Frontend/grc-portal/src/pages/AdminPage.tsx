import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState } from 'react';
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
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, display: 'block',
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
};

function AccountModal({ account, onClose, onSave }: {
  account?: PortalAccount;
  onClose: () => void;
  onSave: (data: AccountForm) => void;
}) {
  const isEdit = !!account;
  const [form, setForm] = useState<AccountForm>(
    account ? {
      username: account.username,
      password: '',
      customerName: account.customerName,
      crmCustomerId: account.crmCustomerId,
      grcCustomerId: account.grcCustomerId,
      parentGrcCustomerId: account.parentGrcCustomerId ?? '',
    } : EMPTY_FORM
  );
  const set = (k: keyof AccountForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.username && form.customerName && form.grcCustomerId && (!isEdit || true) && (isEdit || form.password);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 560, border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{isEdit ? 'Edit Account' : 'New Customer Account'}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Customer Portal access — no Microsoft account required</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Username *</label>
              <input style={inp} placeholder="e.g. client.company" value={form.username}
                onChange={e => set('username', e.target.value)} disabled={isEdit} />
            </div>
            <div>
              <label style={lbl}>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input style={inp} type="password" placeholder={isEdit ? 'Enter to change...' : 'Min 8 characters'}
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Customer Name *</label>
            <input style={inp} placeholder="e.g. Acme Corporation" value={form.customerName}
              onChange={e => set('customerName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>GRC Customer ID *</label>
              <input style={inp} placeholder="e.g. ACME001" value={form.grcCustomerId}
                onChange={e => set('grcCustomerId', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>CRM Customer ID</label>
              <input style={inp} placeholder="e.g. CRM-12345" value={form.crmCustomerId}
                onChange={e => set('crmCustomerId', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Parent GRC Customer ID (optional)</label>
            <input style={inp} placeholder="Leave blank if top-level customer" value={form.parentGrcCustomerId}
              onChange={e => set('parentGrcCustomerId', e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Set this if the account belongs to a parent organisation
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary"
            style={{ padding: '10px 24px', opacity: !isValid ? 0.4 : 1 }}
            disabled={!isValid}>
            {isEdit ? 'Save Changes' : 'Create Account'}
          </button>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 440, border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>Reset Password</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{account.username} — {account.customerName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>New Password *</label>
            <input style={inp} type="password" placeholder="Min 8 characters"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Confirm Password *</label>
            <input style={inp} type="password" placeholder="Repeat password"
              value={confirm} onChange={e => setConfirm(e.target.value)} />
            {confirm && password !== confirm && (
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
            )}
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => onSave(password)} className="btn-primary"
            style={{ padding: '10px 24px', opacity: !isValid ? 0.4 : 1 }} disabled={!isValid}>
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { getToken, account, hasRole } = useAuth();
  const [ready, setReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState<PortalAccount | null>(null);
  const [resetAccount, setResetAccount] = useState<PortalAccount | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (account && !ready) {
      getToken().then(token => {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setReady(true);
      }).catch(console.error);
    }
  }, [account]);

  const { data, isLoading } = useQuery<PortalAccount[]>({
    queryKey: ['portal-accounts'],
    queryFn: portalApi.listAccounts,
    enabled: ready,
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

        {/* Stats row */}
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

        {/* Accounts table */}
        <div className="card animate-fade-up">
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No customer accounts yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Create an account to give a customer access to the Customer Portal.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Customer', 'Username', 'GRC ID', 'CRM ID', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditAccount(a)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                          title="Edit">✏️</button>
                        <button
                          onClick={() => setResetAccount(a)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                          title="Reset Password">🔑</button>
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: a.id, isActive: !a.isActive })}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: a.isActive ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12 }}
                          title={a.isActive ? 'Disable' : 'Enable'}>
                          {a.isActive ? '🚫' : '✅'}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete account "${a.username}"? This cannot be undone.`)) deleteMutation.mutate(a.id); }}
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                          title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Portal URL info box */}
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
