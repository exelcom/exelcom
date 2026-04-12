import { useState, useEffect, useCallback } from "react";

const PORTAL_API = "https://app-portal-grc-exelcom-dev.azurewebsites.net";

const portalApi = {
  login: (username, password) =>
    fetch(`${PORTAL_API}/api/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  mfaChallenge: (username, code) =>
    fetch(`${PORTAL_API}/api/portal/mfa/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, code }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
};

const grcApi = (token) => ({
  incidents: () =>
    fetch(`${PORTAL_API}/api/portal/data/incidents`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []),
  assets: () =>
    fetch(`${PORTAL_API}/api/portal/data/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []),
  nonconformities: () =>
    fetch(`${PORTAL_API}/api/portal/data/nonconformities`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : d.items || d.data || []),
  soa: () =>
    fetch(`${PORTAL_API}/api/portal/data/soa`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : d.controls || d.items || d.data || []),
  updateIncidentStatus: (id, action, data = {}) =>
    fetch(`${PORTAL_API}/api/portal/data/incidents/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.ok ? (r.text().then(t => t ? JSON.parse(t) : {})) : Promise.reject(r.status)),
  addAction: (id, data) =>
    fetch(`${PORTAL_API}/api/portal/data/incidents/${id}/actions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(r => r.ok ? r.json() : Promise.reject(r.status)),
});

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  loginWrap: { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0d2137 100%)", fontFamily:"'Segoe UI',system-ui,sans-serif" },
  loginCard: { background:"rgba(255,255,255,0.05)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"48px 40px", width:380, boxShadow:"0 24px 64px rgba(0,0,0,0.4)" },
  loginTitle: { fontSize:13, fontWeight:700, letterSpacing:"0.15em", color:"#A9C4E0", textTransform:"uppercase", margin:"0 0 4px", textAlign:"center" },
  loginSubtitle: { fontSize:22, fontWeight:700, color:"#fff", margin:0, textAlign:"center" },
  loginSub3: { fontSize:12, color:"#A9C4E0", marginTop:4, textAlign:"center", marginBottom:32 },
  loginLabel: { display:"block", fontSize:11, fontWeight:600, letterSpacing:"0.1em", color:"#A9C4E0", textTransform:"uppercase", marginBottom:6 },
  loginInput: { width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:16 },
  loginBtn: { width:"100%", padding:"13px", background:"#2E86C1", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:8 },
  loginErr: { background:"rgba(192,57,43,0.2)", border:"1px solid rgba(192,57,43,0.4)", borderRadius:8, padding:"10px 14px", color:"#E74C3C", fontSize:13, marginBottom:16 },
  portalWrap: { minHeight:"100vh", background:"#F4F6F9", fontFamily:"'Segoe UI',system-ui,sans-serif" },
  header: { background:"#1A3A5C", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 8px rgba(0,0,0,0.2)" },
  headerLogo: { fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"0.05em" },
  headerSub: { fontSize:11, color:"#A9C4E0", letterSpacing:"0.1em" },
  customerBadge: { background:"rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 12px", color:"#A9C4E0", fontSize:12, fontWeight:600 },
  logoutBtn: { background:"transparent", border:"1px solid rgba(255,255,255,0.2)", borderRadius:6, color:"#A9C4E0", fontSize:12, padding:"4px 12px", cursor:"pointer" },
  nav: { background:"#fff", borderBottom:"1px solid #E8EBF0", padding:"0 32px", display:"flex", gap:4 },
  navBtn: (a) => ({ padding:"14px 16px", fontSize:13, fontWeight:a?600:400, color:a?"#2E86C1":"#717D7E", background:"none", border:"none", borderBottom:a?"2px solid #2E86C1":"2px solid transparent", cursor:"pointer" }),
  content: { padding:32, maxWidth:1100, margin:"0 auto" },
  pageTitle: { fontSize:22, fontWeight:700, color:"#1a1a1a", margin:"0 0 4px" },
  pageSub: { fontSize:13, color:"#717D7E", margin:"0 0 24px" },
  statsGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:24 },
  statCard: (c) => ({ background:"#fff", borderRadius:10, padding:"20px 24px", borderLeft:`4px solid ${c}`, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }),
  statLabel: { fontSize:11, color:"#717D7E", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 },
  statVal: (c) => ({ fontSize:28, fontWeight:700, color:c }),
  tableWrap: { background:"#fff", borderRadius:10, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#717D7E", letterSpacing:"0.08em", textTransform:"uppercase", borderBottom:"1px solid #E8EBF0", background:"#F8F9FA" },
  td: { padding:"13px 16px", fontSize:13, color:"#1a1a1a", borderBottom:"1px solid #F0F2F5" },
  trHover: { cursor:"pointer" },
  badge: (bg,c) => ({ background:bg, color:c, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, display:"inline-block" }),
  empty: { textAlign:"center", padding:"48px 0", color:"#A9C4E0", fontSize:14 },
  loading: { textAlign:"center", padding:"48px 0", color:"#A9C4E0", fontSize:14 },
  // Modal
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"flex-end" },
  modal: { background:"#fff", width:560, height:"100vh", overflowY:"auto", boxShadow:"-4px 0 24px rgba(0,0,0,0.15)", padding:0 },
  modalHeader: { background:"#1A3A5C", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  modalTitle: { color:"#fff", fontSize:16, fontWeight:700, margin:0 },
  modalClose: { background:"transparent", border:"none", color:"#A9C4E0", fontSize:20, cursor:"pointer", lineHeight:1 },
  modalBody: { padding:24 },
  section: { marginBottom:24 },
  sectionTitle: { fontSize:12, fontWeight:700, color:"#717D7E", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, paddingBottom:8, borderBottom:"1px solid #E8EBF0" },
  fieldGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 },
  field: { marginBottom:12 },
  fieldLabel: { fontSize:11, color:"#717D7E", fontWeight:600, marginBottom:4, display:"block" },
  fieldVal: { fontSize:13, color:"#1a1a1a", fontWeight:500 },
  textarea: { width:"100%", padding:"10px 12px", border:"1px solid #E8EBF0", borderRadius:8, fontSize:13, resize:"vertical", minHeight:80, boxSizing:"border-box", fontFamily:"inherit" },
  input: { width:"100%", padding:"10px 12px", border:"1px solid #E8EBF0", borderRadius:8, fontSize:13, boxSizing:"border-box", fontFamily:"inherit" },
  select: { width:"100%", padding:"10px 12px", border:"1px solid #E8EBF0", borderRadius:8, fontSize:13, boxSizing:"border-box", background:"#fff" },
  btn: (c) => ({ padding:"10px 20px", background:c||"#2E86C1", border:"none", borderRadius:8, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", marginRight:8 }),
  btnGhost: { padding:"10px 20px", background:"transparent", border:"1px solid #E8EBF0", borderRadius:8, color:"#717D7E", fontSize:13, fontWeight:600, cursor:"pointer" },
  actionItem: { background:"#F8F9FA", borderRadius:8, padding:"12px 16px", marginBottom:8, fontSize:13 },
  severityNote: { background:"#FEF9E7", border:"1px solid #F9E79F", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#7D6608", marginBottom:16 },
};

const sevColor = { Critical:"#922B21", High:"#C0392B", Medium:"#935116", Low:"#1E8449" };
const statusColor = { New:"#1A5276", Investigating:"#935116", Contained:"#6C3483", Resolved:"#1E8449", Closed:"#616A6B" };
const statusBg = { New:"#EBF5FB", Investigating:"#FEF9E7", Contained:"#F5EEF8", Resolved:"#EAFAF1", Closed:"#F2F3F4" };

// ── Incident Detail Modal ─────────────────────────────────────────────────────
function IncidentModal({ incident, token, onClose, onUpdated }) {
  const [tab, setTab] = useState("details");
  const [actionDesc, setActionDesc] = useState("");
  const [actionType, setActionType] = useState("Communication");
  const [actionDue, setActionDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const api = grcApi(token);

  const nextStatus = {
    New: { label: "Start Investigation", action: "investigate" },
    Investigating: { label: "Mark Contained", action: "contain" },
    Contained: { label: "Mark Resolved", action: "resolve" },
    Resolved: { label: "Close Incident", action: "close" },
  };

  const handleStatusChange = async () => {
    const next = nextStatus[incident.status];
    if (!next) return;
    setSaving(true); setError("");
    try {
      await api.updateIncidentStatus(incident.id, next.action);
      onUpdated();
    } catch { setError("Failed to update status."); }
    finally { setSaving(false); }
  };

  const handleAddAction = async () => {
    if (!actionDesc.trim()) return;
    setSaving(true); setError("");
    try {
      await api.addAction(incident.id, { type: actionType, description: actionDesc, dueDate: actionDue || null, assignedToUserId: null });
      setActionDesc(""); setActionDue("");
      onUpdated();
    } catch { setError("Failed to add action."); }
    finally { setSaving(false); }
  };

  const next = nextStatus[incident.status];

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHeader}>
          <div>
            <div style={{ fontSize:12, color:"#A9C4E0", marginBottom:4 }}>{incident.referenceNumber}</div>
            <div style={S.modalTitle}>{incident.title}</div>
          </div>
          <button style={S.modalClose} onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom:"1px solid #E8EBF0", display:"flex", gap:0 }}>
          {["details","actions"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"12px 20px", fontSize:13, fontWeight:tab===t?600:400, color:tab===t?"#2E86C1":"#717D7E", background:"none", border:"none", borderBottom:tab===t?"2px solid #2E86C1":"2px solid transparent", cursor:"pointer", textTransform:"capitalize" }}>{t}</button>
          ))}
        </div>

        <div style={S.modalBody}>
          {error && <div style={{ background:"#FDEDEC", border:"1px solid #FADBD8", borderRadius:8, padding:"10px 14px", color:"#C0392B", fontSize:13, marginBottom:16 }}>{error}</div>}

          {tab === "details" && (
            <>
              <div style={S.severityNote}>
                ⚠️ To change the severity rating, please call our support line. Severity is assessed by our security team.
              </div>

              <div style={S.section}>
                <div style={S.sectionTitle}>Status & Classification</div>
                <div style={S.fieldGrid}>
                  <div style={S.field}><span style={S.fieldLabel}>Status</span><span style={S.badge(statusBg[incident.status], statusColor[incident.status])}>{incident.status}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Severity</span><span style={S.badge(sevColor[incident.severity]+"22", sevColor[incident.severity])}>{incident.severity}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Type</span><span style={S.fieldVal}>{incident.type}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Customer</span><span style={S.fieldVal}>{incident.customerName}</span></div>
                </div>
              </div>

              <div style={S.section}>
                <div style={S.sectionTitle}>Timeline</div>
                <div style={S.fieldGrid}>
                  <div style={S.field}><span style={S.fieldLabel}>Occurred</span><span style={S.fieldVal}>{incident.occurredAt ? new Date(incident.occurredAt).toLocaleDateString("en-AU") : "—"}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Detected</span><span style={S.fieldVal}>{incident.detectedAt ? new Date(incident.detectedAt).toLocaleDateString("en-AU") : "—"}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Contained</span><span style={S.fieldVal}>{incident.containedAt ? new Date(incident.containedAt).toLocaleDateString("en-AU") : "—"}</span></div>
                  <div style={S.field}><span style={S.fieldLabel}>Resolved</span><span style={S.fieldVal}>{incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString("en-AU") : "—"}</span></div>
                </div>
              </div>

              <div style={S.section}>
                <div style={S.sectionTitle}>Description</div>
                <div style={{ fontSize:13, color:"#1a1a1a", lineHeight:1.6, marginBottom:12 }}>{incident.description || "—"}</div>
                {incident.impactDescription && <>
                  <div style={{ fontSize:11, color:"#717D7E", fontWeight:600, marginBottom:4 }}>IMPACT</div>
                  <div style={{ fontSize:13, color:"#1a1a1a", lineHeight:1.6 }}>{incident.impactDescription}</div>
                </>}
              </div>

              {next && incident.status !== "Closed" && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Update Status</div>
                  <button style={S.btn("#1E8449")} onClick={handleStatusChange} disabled={saving}>
                    {saving ? "Updating..." : next.label}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "actions" && (
            <>
              <div style={S.section}>
                <div style={S.sectionTitle}>Existing Actions</div>
                {incident.actions?.length === 0 ? (
                  <div style={{ color:"#A9C4E0", fontSize:13 }}>No actions recorded yet.</div>
                ) : incident.actions?.map(a => (
                  <div key={a.id} style={S.actionItem}>
                    <div style={{ fontWeight:600, marginBottom:4 }}>{a.description}</div>
                    <div style={{ display:"flex", gap:16, fontSize:12, color:"#717D7E" }}>
                      <span>Type: {a.type}</span>
                      <span>Status: {a.status}</span>
                      {a.dueDate && <span>Due: {new Date(a.dueDate).toLocaleDateString("en-AU")}</span>}
                      {a.isOverdue && <span style={{ color:"#C0392B", fontWeight:600 }}>OVERDUE</span>}
                    </div>
                  </div>
                ))}
              </div>

              {incident.status !== "Closed" && (
                <div style={S.section}>
                  <div style={S.sectionTitle}>Add Action</div>
                  <div style={S.field}>
                    <label style={S.fieldLabel}>Action Type</label>
                    <select style={S.select} value={actionType} onChange={e => setActionType(e.target.value)}>
                      {["Communication","Investigation","Containment","Remediation","Evidence","Other"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.fieldLabel}>Description</label>
                    <textarea style={S.textarea} value={actionDesc} onChange={e => setActionDesc(e.target.value)} placeholder="Describe the action taken or planned..." />
                  </div>
                  <div style={S.field}>
                    <label style={S.fieldLabel}>Due Date (optional)</label>
                    <input type="date" style={S.input} value={actionDue} onChange={e => setActionDue(e.target.value)} />
                  </div>
                  <button style={S.btn()} onClick={handleAddAction} disabled={saving || !actionDesc.trim()}>
                    {saving ? "Adding..." : "Add Action"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Incidents View ─────────────────────────────────────────────────────────────
function IncidentsView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    grcApi(token).incidents()
      .then(d => setItems(Array.isArray(d) ? d.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)) : []))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleUpdated = () => {
    load();
    // refresh selected incident data
    setSelected(prev => items.find(i => i.id === prev?.id) || prev);
  };

  const stats = { total:items.length, open:items.filter(i=>!["Resolved","Closed"].includes(i.status)).length, critical:items.filter(i=>i.severity==="Critical").length, high:items.filter(i=>i.severity==="High").length };

  return (
    <div>
      <div style={S.statsGrid}>
        <div style={S.statCard("#2E86C1")}><div style={S.statLabel}>Total</div><div style={S.statVal("#2E86C1")}>{stats.total}</div></div>
        <div style={S.statCard("#E67E22")}><div style={S.statLabel}>Open</div><div style={S.statVal("#E67E22")}>{stats.open}</div></div>
        <div style={S.statCard("#922B21")}><div style={S.statLabel}>Critical</div><div style={S.statVal("#922B21")}>{stats.critical}</div></div>
        <div style={S.statCard("#C0392B")}><div style={S.statLabel}>High</div><div style={S.statVal("#C0392B")}>{stats.high}</div></div>
      </div>
      <div style={S.tableWrap}>
        {loading ? <div style={S.loading}>Loading incidents...</div> :
         items.length === 0 ? <div style={S.empty}>No incidents recorded</div> : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Reference</th><th style={S.th}>Title</th><th style={S.th}>Type</th>
              <th style={S.th}>Severity</th><th style={S.th}>Status</th><th style={S.th}>Occurred</th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id} style={S.trHover} onClick={() => setSelected(i)}
                onMouseEnter={e => e.currentTarget.style.background="#F8F9FA"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                <td style={{...S.td, fontWeight:600, color:"#2E86C1"}}>{i.referenceNumber}</td>
                <td style={S.td}>{i.title}</td>
                <td style={S.td}>{i.type}</td>
                <td style={S.td}><span style={S.badge(sevColor[i.severity]+"22",sevColor[i.severity]||"#888")}>{i.severity}</span></td>
                <td style={S.td}><span style={S.badge(statusBg[i.status],statusColor[i.status]||"#888")}>{i.status}</span></td>
                <td style={S.td}>{i.occurredAt ? new Date(i.occurredAt).toLocaleDateString("en-AU") : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {selected && <IncidentModal incident={selected} token={token} onClose={() => setSelected(null)} onUpdated={() => { load(); setSelected(null); }} />}
    </div>
  );
}

// ── Assets View ───────────────────────────────────────────────────────────────
function AssetsView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    grcApi(token).assets().then(d => setItems(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [token]);
  return (
    <div>
      <div style={S.statsGrid}>
        <div style={S.statCard("#2E86C1")}><div style={S.statLabel}>Total Assets</div><div style={S.statVal("#2E86C1")}>{items.length}</div></div>
        <div style={S.statCard("#1E8449")}><div style={S.statLabel}>Active</div><div style={S.statVal("#1E8449")}>{items.filter(i=>i.status==="Active").length}</div></div>
        <div style={S.statCard("#922B21")}><div style={S.statLabel}>Critical Risk</div><div style={S.statVal("#922B21")}>{items.filter(i=>i.riskLevel==="Critical").length}</div></div>
      </div>
      <div style={S.tableWrap}>
        {loading ? <div style={S.loading}>Loading assets...</div> :
         items.length === 0 ? <div style={S.empty}>No assets recorded</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Status</th><th style={S.th}>Risk Level</th><th style={S.th}>Owner</th></tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id}>
                <td style={{...S.td,fontWeight:600}}>{i.name}</td>
                <td style={S.td}>{i.type}</td>
                <td style={S.td}><span style={S.badge("#1E844922","#1E8449")}>{i.status}</span></td>
                <td style={S.td}><span style={S.badge((sevColor[i.riskLevel]||"#888")+"22",sevColor[i.riskLevel]||"#888")}>{i.riskLevel}</span></td>
                <td style={S.td}>{i.ownerUserId||"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── NC View ───────────────────────────────────────────────────────────────────
function NcView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    grcApi(token).nonconformities().then(setItems).finally(() => setLoading(false));
  }, [token]);
  return (
    <div style={S.tableWrap}>
      {loading ? <div style={S.loading}>Loading...</div> :
       items.length === 0 ? <div style={S.empty}>No nonconformities recorded</div> : (
        <table style={S.table}>
          <thead><tr><th style={S.th}>Reference</th><th style={S.th}>Title</th><th style={S.th}>Severity</th><th style={S.th}>Status</th><th style={S.th}>Source</th><th style={S.th}>Raised</th></tr></thead>
          <tbody>{items.map(i => (
            <tr key={i.id}>
              <td style={{...S.td,fontWeight:600,color:"#2E86C1"}}>{i.referenceNumber}</td>
              <td style={S.td}>{i.title}</td>
              <td style={S.td}><span style={S.badge((sevColor[i.severity]||"#888")+"22",sevColor[i.severity]||"#888")}>{i.severity}</span></td>
              <td style={S.td}><span style={S.badge("#EBF5FB","#1A5276")}>{i.status}</span></td>
              <td style={S.td}>{i.source}</td>
              <td style={S.td}>{i.raisedAt ? new Date(i.raisedAt).toLocaleDateString("en-AU") : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

// ── SoA View ──────────────────────────────────────────────────────────────────
function SoaView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    grcApi(token).soa().then(setItems).finally(() => setLoading(false));
  }, [token]);
  const implemented = items.filter(i=>i.implementationStatus==="Implemented").length;
  const inProgress = items.filter(i=>i.implementationStatus==="InProgress").length;
  return (
    <div>
      <div style={S.statsGrid}>
        <div style={S.statCard("#2E86C1")}><div style={S.statLabel}>Total Controls</div><div style={S.statVal("#2E86C1")}>{items.length}</div></div>
        <div style={S.statCard("#1E8449")}><div style={S.statLabel}>Implemented</div><div style={S.statVal("#1E8449")}>{implemented}</div></div>
        <div style={S.statCard("#935116")}><div style={S.statLabel}>In Progress</div><div style={S.statVal("#935116")}>{inProgress}</div></div>
        <div style={S.statCard("#717D7E")}><div style={S.statLabel}>Not Started</div><div style={S.statVal("#717D7E")}>{items.length-implemented-inProgress}</div></div>
      </div>
      <div style={S.tableWrap}>
        {loading ? <div style={S.loading}>Loading...</div> :
         items.length === 0 ? <div style={S.empty}>No controls found</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Control</th><th style={S.th}>Name</th><th style={S.th}>Domain</th><th style={S.th}>Applicability</th><th style={S.th}>Status</th></tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id}>
                <td style={{...S.td,fontWeight:700,color:"#2E86C1",width:70}}>{i.controlId}</td>
                <td style={S.td}>{i.controlName||i.name}</td>
                <td style={S.td}>{i.domain}</td>
                <td style={S.td}><span style={S.badge("#1E844922","#1E8449")}>{i.applicability}</span></td>
                <td style={S.td}>{i.implementationStatus}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── MFA Settings View ─────────────────────────────────────────────────────────
function SettingsView({ token, accountId }) {
  const [mfaStatus, setMfaStatus] = useState(null);
  const [step, setStep] = useState("idle");
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const mfaApi = {
    status: () => fetch(`${PORTAL_API}/api/portal/mfa/status/${accountId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    setup: () => fetch(`${PORTAL_API}/api/portal/mfa/setup/${accountId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    verify: (c) => fetch(`${PORTAL_API}/api/portal/mfa/verify/${accountId}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) }).then(r => r.ok ? r.json() : Promise.reject("Invalid code")),
    disable: () => fetch(`${PORTAL_API}/api/portal/mfa/${accountId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? true : Promise.reject("Failed"))
  };
  useEffect(() => { if (accountId) mfaApi.status().then(setMfaStatus).catch(() => {}); }, [accountId]);
  const handleSetup = async () => {
    setLoading(true); setError("");
    try { const r = await mfaApi.setup(); setQrUrl(r.qrCodeUrl); setSecret(r.manualEntryKey); setStep("setup"); }
    catch { setError("Failed to start MFA setup."); } finally { setLoading(false); }
  };
  const handleVerify = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true); setError("");
    try { await mfaApi.verify(code); setMfaStatus({ enabled: true, enabledAt: new Date().toISOString() }); setStep("done"); setSuccess("2FA enabled! Your account is now protected."); setCode(""); }
    catch { setError("Invalid code. Please try again."); } finally { setLoading(false); }
  };
  const handleDisable = async () => {
    if (!window.confirm("Disable 2FA? This reduces your account security.")) return;
    setLoading(true); setError("");
    try { await mfaApi.disable(); setMfaStatus({ enabled: false }); setStep("idle"); setSuccess("2FA has been disabled."); }
    catch { setError("Failed to disable 2FA."); } finally { setLoading(false); }
  };
  const card = { background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "28px 32px", marginBottom: 20 };
  return (
    <div>
      {error && <div style={{ background:"#FDEDEC",border:"1px solid #F1948A",borderRadius:8,padding:"12px 16px",color:"#C0392B",fontSize:13,marginBottom:16 }}>⚠️ {error}</div>}
      {success && <div style={{ background:"#EAFAF1",border:"1px solid #82E0AA",borderRadius:8,padding:"12px 16px",color:"#1E8449",fontSize:13,marginBottom:16 }}>✅ {success}</div>}
      <div style={card}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:6 }}>🔐 Two-Factor Authentication (2FA)</div>
            <div style={{ fontSize:13,color:"#717D7E",lineHeight:1.6,maxWidth:520 }}>Add an extra layer of security. When enabled, you'll need your authenticator app in addition to your password to sign in.</div>
          </div>
          <div style={{ textAlign:"right",flexShrink:0,marginLeft:24 }}>
            {mfaStatus === null ? <span style={{ fontSize:12,color:"#A9C4E0" }}>Loading...</span>
              : mfaStatus.enabled ? <span style={{ background:"#EAFAF1",color:"#1E8449",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,border:"1px solid #82E0AA" }}>✅ Enabled</span>
              : <span style={{ background:"#FEF9E7",color:"#935116",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,border:"1px solid #F9E79F" }}>⚠️ Not Enabled</span>}
            {mfaStatus?.enabledAt && <div style={{ fontSize:11,color:"#A9C4E0",marginTop:4 }}>Since {new Date(mfaStatus.enabledAt).toLocaleDateString()}</div>}
          </div>
        </div>
        {mfaStatus !== null && (
          <div style={{ marginTop:20,paddingTop:20,borderTop:"1px solid #E8EBF0" }}>
            {!mfaStatus.enabled && step === "idle" && <button style={{ padding:"10px 24px",background:"#2E86C1",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }} onClick={handleSetup} disabled={loading}>{loading ? "Setting up..." : "🔐 Enable 2FA"}</button>}
            {mfaStatus.enabled && step !== "setup" && <button style={{ padding:"10px 24px",background:"transparent",border:"1px solid #E74C3C",borderRadius:8,color:"#E74C3C",fontSize:13,fontWeight:700,cursor:"pointer" }} onClick={handleDisable} disabled={loading}>{loading ? "Disabling..." : "🚫 Disable 2FA"}</button>}
          </div>
        )}
      </div>
      {(step === "setup" || step === "verify") && (
        <div style={card}>
          <div style={{ fontSize:15,fontWeight:700,color:"#1a1a1a",marginBottom:4 }}>Setup Authenticator App</div>
          <div style={{ fontSize:13,color:"#717D7E",marginBottom:24 }}>Follow these steps to enable 2FA on your account.</div>
          <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
            <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:"#2E86C1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>1</div>
              <div><div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:4 }}>Install an Authenticator App</div><div style={{ fontSize:12,color:"#717D7E",lineHeight:1.6 }}>Download <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> on your phone.</div></div>
            </div>
            <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:"#2E86C1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>2</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>Scan the QR Code</div>
                <div style={{ fontSize:12,color:"#717D7E",marginBottom:12 }}>Open your authenticator app and scan this QR code.</div>
                {qrUrl && (
                  <div style={{ display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap" }}>
                    <div style={{ background:"#f8f9fa",border:"1px solid #E8EBF0",borderRadius:8,padding:8,display:"inline-block" }}><img src={qrUrl} alt="QR Code" style={{ display:"block",width:160,height:160 }} /></div>
                    <div style={{ flex:1 }}><div style={{ fontSize:11,color:"#717D7E",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em" }}>Can't scan? Enter manually:</div><div style={{ background:"#F8F9FA",border:"1px solid #E8EBF0",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:13,color:"#1a1a1a",letterSpacing:2,wordBreak:"break-all" }}>{secret}</div></div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex",gap:16,alignItems:"flex-start" }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:"#2E86C1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>3</div>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>Enter Verification Code</div>
                <div style={{ fontSize:12,color:"#717D7E",marginBottom:12 }}>Enter the 6-digit code shown in your authenticator app.</div>
                <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                  <input style={{ padding:"12px 14px",border:"1px solid #E8EBF0",borderRadius:8,fontSize:18,width:160,textAlign:"center",letterSpacing:8,fontFamily:"monospace",outline:"none" }} type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} onKeyDown={e=>e.key==="Enter"&&handleVerify()} />
                  <button style={{ padding:"12px 24px",background:code.length===6?"#1E8449":"#A9C4E0",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:code.length===6?"pointer":"default" }} onClick={handleVerify} disabled={loading||code.length!==6}>{loading?"Verifying...":"✓ Verify & Enable"}</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop:20,paddingTop:16,borderTop:"1px solid #E8EBF0" }}><button style={{ background:"transparent",border:"none",color:"#A9C4E0",fontSize:13,cursor:"pointer" }} onClick={()=>setStep("idle")}>Cancel</button></div>
        </div>
      )}
      <div style={{ ...card,background:"#EBF5FB",border:"1px solid #AED6F1" }}>
        <div style={{ fontSize:13,fontWeight:700,color:"#1A5276",marginBottom:8 }}>ℹ️ About Two-Factor Authentication</div>
        <div style={{ fontSize:12,color:"#2E86C1",lineHeight:1.7 }}>2FA adds a second layer of security. Even if someone has your password, they cannot sign in without your authenticator app. Exelcom recommends enabling 2FA on all accounts (ISO/IEC 27001:2022 Annex A 8.5).</div>
      </div>
    </div>
  );
}
// ── Login Page ─────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await portalApi.login(username, password);
      if (result.mfaRequired) {
        setPendingUsername(username);
        setMfaRequired(true);
      } else {
        onLogin(result);
      }
    }
    catch (err) { setError(err.message || "Invalid username or password."); }
    finally { setLoading(false); }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await portalApi.mfaChallenge(pendingUsername, mfaCode);
      onLogin(result);
    }
    catch (err) { setError("Invalid authentication code. Please try again."); }
    finally { setLoading(false); }
  };

  if (mfaRequired) {
    return (
      <div style={S.loginWrap}>
        <div style={S.loginCard}>
          <div style={S.loginTitle}>GRC Platform</div>
          <div style={S.loginSubtitle}>Two-Factor Authentication</div>
          <div style={S.loginSub3}>Enter the code from your authenticator app</div>
          {error && <div style={S.loginErr}>{error}</div>}
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
            <div style={{ fontSize:13, color:"#A9C4E0", lineHeight:1.6 }}>
              Open your authenticator app and enter the 6-digit code for <strong style={{color:"#fff"}}>{pendingUsername}</strong>
            </div>
          </div>
          <form onSubmit={handleMfaSubmit}>
            <label style={S.loginLabel}>Authentication Code</label>
            <input
              style={{ ...S.loginInput, textAlign:"center", fontSize:24, letterSpacing:12, fontFamily:"monospace" }}
              type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ""))}
              autoFocus autoComplete="one-time-code" required />
            <button type="submit" style={{ ...S.loginBtn, background: mfaCode.length===6 ? "#1E8449" : "#2E86C1" }}
              disabled={loading || mfaCode.length !== 6}>
              {loading ? "Verifying..." : "✓ Verify"}
            </button>
          </form>
          <div style={{ textAlign:"center", marginTop:16 }}>
            <button style={{ background:"none", border:"none", color:"#4A6380", fontSize:12, cursor:"pointer" }}
              onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }}>
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.loginTitle}>GRC Platform</div>
        <div style={S.loginSubtitle}>Customer Portal</div>
        <div style={S.loginSub3}>Exelcom Cybersecurity</div>
        {error && <div style={S.loginErr}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={S.loginLabel}>Username</label>
          <input style={S.loginInput} value={username} onChange={e=>setUsername(e.target.value)} placeholder="your.username" autoComplete="username" required />
          <label style={S.loginLabel}>Password</label>
          <input style={S.loginInput} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
          <button type="submit" style={S.loginBtn} disabled={loading}>{loading?"Signing in...":"Sign In →"}</button>
        </form>
        <div style={{textAlign:"center",marginTop:24,fontSize:12,color:"#4A6380"}}>
          Need access? Contact <a href="mailto:grc@exelcom.au" style={{color:"#2E86C1"}}>grc@exelcom.au</a>
        </div>
      </div>
    </div>
  );
}

// ── Main Portal ────────────────────────────────────────────────────────────────
const TABS = [
  { id:"incidents", label:"🚨 Incidents" },
  { id:"assets", label:"🖥 Assets" },
  { id:"nonconformities", label:"⚠️ Nonconformities" },
  { id:"soa", label:"📋 SoA" },
  { id:"settings", label:"⚙️ Settings" },
];

const tabTitles = {
  incidents: { title:"Incidents", sub:"ISO/IEC 27001:2022 — Annex A.16 — Information security incident management" },
  assets: { title:"Asset Inventory", sub:"ISO/IEC 27001:2022 — Annex A.8 — Asset management" },
  nonconformities: { title:"Nonconformities & Corrective Actions", sub:"ISO/IEC 27001:2022 — Clause 10.2" },
  soa: { title:"Statement of Applicability", sub:"Annex A controls — applicability and implementation tracking" },
  settings: { title:"Account Settings", sub:"Manage your security settings and two-factor authentication" },
};

export default function CustomerPortalModule() {
  const [session, setSession] = useState(() => {
    try { const s = sessionStorage.getItem("grc_portal_session"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [activeTab, setActiveTab] = useState("incidents");

  const handleLogin = useCallback((result) => {
    const s = { token:result.token, customerName:result.customerName, scope:result.customerScope, accountId:result.accountId };
    sessionStorage.setItem("grc_portal_session", JSON.stringify(s));
    setSession(s);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("grc_portal_session");
    setSession(null);
  }, []);

  if (!session) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={S.portalWrap}>
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div>
            <div style={S.headerLogo}>GRC PLATFORM</div>
            <div style={S.headerSub}>CUSTOMER PORTAL</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <span style={S.customerBadge}>{session.customerName}</span>
          <button style={S.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </div>
      <div style={S.nav}>
        {TABS.map(t => <button key={t.id} style={S.navBtn(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}
      </div>
      <div style={S.content}>
        <div style={S.pageTitle}>{tabTitles[activeTab].title}</div>
        <div style={S.pageSub}>{tabTitles[activeTab].sub}</div>
        {activeTab==="incidents" && <IncidentsView token={session.token} />}
        {activeTab==="assets" && <AssetsView token={session.token} />}
        {activeTab==="nonconformities" && <NcView token={session.token} />}
        {activeTab==="soa" && <SoaView token={session.token} />}
        {activeTab==="settings" && <SettingsView token={session.token} accountId={session.accountId} />}
      </div>
    </div>
  );
}


