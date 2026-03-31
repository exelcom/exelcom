import { useState, useEffect, useCallback } from "react";

// ── API base ──────────────────────────────────────────────────────────────────
const PORTAL_API = "https://app-portal-grc-exelcom-dev.azurewebsites.net";
const GRC_API    = "https://apim-grc-exelcom-dev.azure-api.net";

const portalApi = {
  login: (username, password) =>
    fetch(`${PORTAL_API}/api/portal/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
};

const grcApi = (token) => ({
  incidents: (customerId) =>
    fetch(`${GRC_API}/incident/api/incidents?customerId=${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  assets: (customerId) =>
    fetch(`${GRC_API}/asset/api/assets?customerId=${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  risks: () =>
    fetch(`${GRC_API}/risk/api/risks`, {
      headers: { Authorization: `Bearer ${token}`, "Api-Version": "v1" },
    }).then(r => r.json()),
  nonconformities: () =>
    fetch(`${GRC_API}/nonconformity/api/nonconformities`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  soa: () =>
    fetch(`${GRC_API}/soa/api/controls`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  // Login page
  loginWrap: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  loginCard: {
    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
    padding: "48px 40px", width: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
  },
  loginLogo: {
    textAlign: "center", marginBottom: 32,
  },
  loginTitle: {
    fontSize: 13, fontWeight: 700, letterSpacing: "0.15em",
    color: "#A9C4E0", textTransform: "uppercase", margin: "0 0 4px",
  },
  loginSubtitle: {
    fontSize: 22, fontWeight: 700, color: "#fff", margin: 0,
  },
  loginLabel: {
    display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
    color: "#A9C4E0", textTransform: "uppercase", marginBottom: 6,
  },
  loginInput: {
    width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
    marginBottom: 16,
  },
  loginBtn: {
    width: "100%", padding: "13px", background: "#2E86C1",
    border: "none", borderRadius: 8, color: "#fff", fontSize: 14,
    fontWeight: 700, cursor: "pointer", marginTop: 8,
    transition: "background 0.2s",
  },
  loginError: {
    background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.4)",
    borderRadius: 8, padding: "10px 14px", color: "#E74C3C",
    fontSize: 13, marginBottom: 16,
  },

  // Portal layout
  portalWrap: {
    minHeight: "100vh", background: "#F4F6F9",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "#1A3A5C", padding: "0 32px", height: 56,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerLogo: { fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" },
  headerSub: { fontSize: 11, color: "#A9C4E0", letterSpacing: "0.1em" },
  headerRight: { display: "flex", alignItems: "center", gap: 16 },
  customerBadge: {
    background: "rgba(255,255,255,0.1)", borderRadius: 6,
    padding: "4px 12px", color: "#A9C4E0", fontSize: 12, fontWeight: 600,
  },
  logoutBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6, color: "#A9C4E0", fontSize: 12, padding: "4px 12px",
    cursor: "pointer",
  },
  nav: {
    background: "#fff", borderBottom: "1px solid #E8EBF0",
    padding: "0 32px", display: "flex", gap: 4,
  },
  navBtn: (active) => ({
    padding: "14px 16px", fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? "#2E86C1" : "#717D7E", background: "none", border: "none",
    borderBottom: active ? "2px solid #2E86C1" : "2px solid transparent",
    cursor: "pointer", transition: "all 0.15s",
  }),
  content: { padding: 32, maxWidth: 1100, margin: "0 auto" },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" },
  pageSubtitle: { fontSize: 13, color: "#717D7E", margin: "0 0 24px" },

  // Cards / stats
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: (color) => ({
    background: "#fff", borderRadius: 10, padding: "20px 24px",
    borderLeft: `4px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  }),
  statLabel: { fontSize: 11, color: "#717D7E", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 },
  statValue: (color) => ({ fontSize: 28, fontWeight: 700, color }),

  // Table
  tableWrap: { background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#717D7E", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid #E8EBF0", background: "#F8F9FA" },
  td: { padding: "13px 16px", fontSize: 13, color: "#1a1a1a", borderBottom: "1px solid #F0F2F5" },
  badge: (bg, color) => ({ background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block" }),

  empty: { textAlign: "center", padding: "48px 0", color: "#A9C4E0", fontSize: 14 },
  loading: { textAlign: "center", padding: "48px 0", color: "#A9C4E0", fontSize: 14 },
};

// ── Severity / Status colors ───────────────────────────────────────────────────
const sevColor = { Critical: "#922B21", High: "#C0392B", Medium: "#935116", Low: "#1E8449" };
const statusColor = { New: "#1A5276", Investigating: "#935116", Contained: "#6C3483", Resolved: "#1E8449", Closed: "#616A6B", Open: "#1A5276", "In Progress": "#935116", Closed_: "#616A6B" };

// ── Incidents view ─────────────────────────────────────────────────────────────
function IncidentsView({ token, scope }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const api = grcApi(token);
    Promise.all(scope.map(id => api.incidents(id)))
      .then(results => setItems(results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .finally(() => setLoading(false));
  }, [token, scope]);

  const stats = {
    total: items.length,
    open: items.filter(i => !["Resolved","Closed"].includes(i.status)).length,
    critical: items.filter(i => i.severity === "Critical").length,
    high: items.filter(i => i.severity === "High").length,
  };

  return (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2E86C1")}><div style={styles.statLabel}>Total</div><div style={styles.statValue("#2E86C1")}>{stats.total}</div></div>
        <div style={styles.statCard("#E67E22")}><div style={styles.statLabel}>Open</div><div style={styles.statValue("#E67E22")}>{stats.open}</div></div>
        <div style={styles.statCard("#922B21")}><div style={styles.statLabel}>Critical</div><div style={styles.statValue("#922B21")}>{stats.critical}</div></div>
        <div style={styles.statCard("#C0392B")}><div style={styles.statLabel}>High</div><div style={styles.statValue("#C0392B")}>{stats.high}</div></div>
      </div>
      <div style={styles.tableWrap}>
        {loading ? <div style={styles.loading}>Loading incidents...</div> :
         items.length === 0 ? <div style={styles.empty}>No incidents recorded</div> : (
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Severity</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Occurred</th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id}>
                <td style={{...styles.td, fontWeight: 600, color: "#2E86C1"}}>{i.referenceNumber}</td>
                <td style={styles.td}>{i.title}</td>
                <td style={styles.td}>{i.type}</td>
                <td style={styles.td}><span style={styles.badge(sevColor[i.severity]+"22", sevColor[i.severity])}>{i.severity}</span></td>
                <td style={styles.td}><span style={styles.badge(statusColor[i.status]+"22", statusColor[i.status])}>{i.status}</span></td>
                <td style={styles.td}>{new Date(i.occurredAt).toLocaleDateString("en-AU")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Assets view ───────────────────────────────────────────────────────────────
function AssetsView({ token, scope }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const api = grcApi(token);
    Promise.all(scope.map(id => api.assets(id)))
      .then(results => setItems(results.flat()))
      .finally(() => setLoading(false));
  }, [token, scope]);

  return (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2E86C1")}><div style={styles.statLabel}>Total Assets</div><div style={styles.statValue("#2E86C1")}>{items.length}</div></div>
        <div style={styles.statCard("#1E8449")}><div style={styles.statLabel}>Active</div><div style={styles.statValue("#1E8449")}>{items.filter(i=>i.status==="Active").length}</div></div>
        <div style={styles.statCard("#922B21")}><div style={styles.statLabel}>Critical Risk</div><div style={styles.statValue("#922B21")}>{items.filter(i=>i.riskLevel==="Critical").length}</div></div>
      </div>
      <div style={styles.tableWrap}>
        {loading ? <div style={styles.loading}>Loading assets...</div> :
         items.length === 0 ? <div style={styles.empty}>No assets recorded</div> : (
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Risk Level</th>
              <th style={styles.th}>Owner</th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id}>
                <td style={{...styles.td, fontWeight: 600}}>{i.name}</td>
                <td style={styles.td}>{i.type}</td>
                <td style={styles.td}><span style={styles.badge("#1E844922","#1E8449")}>{i.status}</span></td>
                <td style={styles.td}><span style={styles.badge(sevColor[i.riskLevel]+"22", sevColor[i.riskLevel]||"#888")}>{i.riskLevel}</span></td>
                <td style={styles.td}>{i.ownerUserId||"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── NC view ───────────────────────────────────────────────────────────────────
function NcView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    grcApi(token).nonconformities()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={styles.tableWrap}>
      {loading ? <div style={styles.loading}>Loading nonconformities...</div> :
       items.length === 0 ? <div style={styles.empty}>No nonconformities recorded</div> : (
        <table style={styles.table}>
          <thead><tr>
            <th style={styles.th}>Reference</th>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Severity</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Source</th>
            <th style={styles.th}>Raised</th>
          </tr></thead>
          <tbody>{items.map(i => (
            <tr key={i.id}>
              <td style={{...styles.td, fontWeight: 600, color: "#2E86C1"}}>{i.referenceNumber}</td>
              <td style={styles.td}>{i.title}</td>
              <td style={styles.td}><span style={styles.badge(sevColor[i.severity]+"22", sevColor[i.severity]||"#888")}>{i.severity}</span></td>
              <td style={styles.td}><span style={styles.badge("#1A527622","#1A5276")}>{i.status}</span></td>
              <td style={styles.td}>{i.source}</td>
              <td style={styles.td}>{new Date(i.raisedAt).toLocaleDateString("en-AU")}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

// ── SoA view ──────────────────────────────────────────────────────────────────
function SoaView({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    grcApi(token).soa()
      .then(data => setItems(Array.isArray(data) ? data : data.controls || []))
      .finally(() => setLoading(false));
  }, [token]);

  const implemented = items.filter(i => i.implementationStatus === "Implemented").length;
  const inProgress = items.filter(i => i.implementationStatus === "InProgress").length;

  return (
    <div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard("#2E86C1")}><div style={styles.statLabel}>Total Controls</div><div style={styles.statValue("#2E86C1")}>{items.length}</div></div>
        <div style={styles.statCard("#1E8449")}><div style={styles.statLabel}>Implemented</div><div style={styles.statValue("#1E8449")}>{implemented}</div></div>
        <div style={styles.statCard("#935116")}><div style={styles.statLabel}>In Progress</div><div style={styles.statValue("#935116")}>{inProgress}</div></div>
        <div style={styles.statCard("#717D7E")}><div style={styles.statLabel}>Not Started</div><div style={styles.statValue("#717D7E")}>{items.length - implemented - inProgress}</div></div>
      </div>
      <div style={styles.tableWrap}>
        {loading ? <div style={styles.loading}>Loading controls...</div> :
         items.length === 0 ? <div style={styles.empty}>No controls found</div> : (
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Control</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Domain</th>
              <th style={styles.th}>Applicability</th>
              <th style={styles.th}>Status</th>
            </tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.id}>
                <td style={{...styles.td, fontWeight: 700, color: "#2E86C1", width: 70}}>{i.controlId}</td>
                <td style={styles.td}>{i.name}</td>
                <td style={styles.td}>{i.domain}</td>
                <td style={styles.td}><span style={styles.badge("#1E844922","#1E8449")}>{i.applicability}</span></td>
                <td style={styles.td}>{i.implementationStatus}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Login page ─────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const result = await portalApi.login(username, password);
      onLogin(result);
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>
          <div style={styles.loginTitle}>GRC Platform</div>
          <div style={styles.loginSubtitle}>Customer Portal</div>
          <div style={{fontSize: 12, color: "#A9C4E0", marginTop: 4}}>Exelcom Cybersecurity</div>
        </div>
        {error && <div style={styles.loginError}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.loginLabel}>Username</label>
          <input style={styles.loginInput} value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="your.username" autoComplete="username" required />
          <label style={styles.loginLabel}>Password</label>
          <input style={styles.loginInput} type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password" required />
          <button type="submit" style={styles.loginBtn} disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <div style={{textAlign:"center", marginTop: 24, fontSize: 12, color: "#4A6380"}}>
          Need access? Contact <a href="mailto:grc@exelcom.au" style={{color:"#2E86C1"}}>grc@exelcom.com.au</a>
        </div>
      </div>
    </div>
  );
}

// ── Main portal ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "incidents", label: "🚨 Incidents" },
  { id: "assets", label: "🖥 Assets" },
  { id: "nonconformities", label: "⚠️ Nonconformities" },
  { id: "soa", label: "📋 SoA" },
];

export default function CustomerPortalModule() {
  const [session, setSession] = useState(() => {
    try {
      const s = sessionStorage.getItem("grc_portal_session");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState("incidents");

  const handleLogin = useCallback((result) => {
    const s = { token: result.token, customerName: result.customerName, scope: result.customerScope };
    sessionStorage.setItem("grc_portal_session", JSON.stringify(s));
    setSession(s);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("grc_portal_session");
    setSession(null);
  }, []);

  if (!session) return <LoginPage onLogin={handleLogin} />;

  const tabTitles = {
    incidents: { title: "Incidents", sub: "ISO/IEC 27001:2022 — Annex A.16 — Information security incident management" },
    assets: { title: "Asset Inventory", sub: "ISO/IEC 27001:2022 — Annex A.8 — Asset management" },
    nonconformities: { title: "Nonconformities & Corrective Actions", sub: "ISO/IEC 27001:2022 — Clause 10.2" },
    soa: { title: "Statement of Applicability", sub: "Annex A controls — applicability and implementation tracking" },
  };

  return (
    <div style={styles.portalWrap}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <div style={styles.headerLogo}>GRC PLATFORM</div>
            <div style={styles.headerSub}>CUSTOMER PORTAL</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.customerBadge}>{session.customerName}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </div>
      <div style={styles.nav}>
        {TABS.map(t => (
          <button key={t.id} style={styles.navBtn(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div style={styles.content}>
        <div style={styles.pageTitle}>{tabTitles[activeTab].title}</div>
        <div style={styles.pageSubtitle}>{tabTitles[activeTab].sub}</div>
        {activeTab === "incidents" && <IncidentsView token={session.token} scope={session.scope} />}
        {activeTab === "assets" && <AssetsView token={session.token} scope={session.scope} />}
        {activeTab === "nonconformities" && <NcView token={session.token} />}
        {activeTab === "soa" && <SoaView token={session.token} />}
      </div>
    </div>
  );
}
