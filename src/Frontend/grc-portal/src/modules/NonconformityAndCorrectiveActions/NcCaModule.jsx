import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ncApi } from "../../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  Open:                       { label: "Open",                color: "#C0392B", bg: "#FDEDEC" },
  UnderAnalysis:              { label: "Under Analysis",      color: "#935116", bg: "#FDEBD0" },
  CorrectiveActionInProgress: { label: "CA In Progress",      color: "#1A5276", bg: "#D6EAF8" },
  AwaitingEffectivenessReview:{ label: "Awaiting Review",     color: "#1E8449", bg: "#D5F5E3" },
  Closed:                     { label: "Closed",              color: "#616A6B", bg: "#F2F3F4" },
};

const SEVERITY_META = {
  Minor:    { label: "Minor",    color: "#1A5276", bg: "#D6EAF8" },
  Major:    { label: "Major",    color: "#935116", bg: "#FDEBD0" },
  Critical: { label: "Critical", color: "#922B21", bg: "#FDEDEC" },
};

const SOURCES = [
  "InternalAudit","ExternalAudit","CustomerComplaint",
  "IncidentReview","ManagementReview","SelfAssessment",
  "SupplierAudit","RegulatoryInspection",
];

const RCA_METHODS = ["FiveWhys", "Fishbone"];
const CAUSE_CATEGORIES = [
  "People","Process","Technology","Environment","Supplier","Policy","Unknown"
];

const CA_STATUS_META = {
  Open:        { label: "Open",        color: "#922B21", bg: "#FDEDEC" },
  InProgress:  { label: "In Progress", color: "#935116", bg: "#FDEBD0" },
  Implemented: { label: "Implemented", color: "#1E8449", bg: "#D5F5E3" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtSource = s => s?.replace(/([A-Z])/g, " $1").trim() ?? "—";

const inp = {
  fontSize: 13, padding: "8px 10px", borderRadius: 6,
  border: "1px solid #D5D8DC",
  background: "#fff", color: "#1a1a1a",
  width: "100%", boxSizing: "border-box",
  outline: "none",
};

const lbl = {
  fontSize: 11, color: "#717D7E", display: "block",
  marginBottom: 5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.05em",
};

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      color, backgroundColor: bg, border: `1px solid ${color}30`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
const StatusBadge = ({ status }) => { const m = STATUS_META[status] || { label: status, color: "#888", bg: "#eee" }; return <Badge {...m} />; };
const SeverityBadge = ({ severity }) => { const m = SEVERITY_META[severity] || { label: severity, color: "#888", bg: "#eee" }; return <Badge {...m} />; };
const CaStatusBadge = ({ status }) => { const m = CA_STATUS_META[status] || { label: status, color: "#888", bg: "#eee" }; return <Badge {...m} />; };

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ ncs }) {
  const open = ncs.filter(n => n.status !== "Closed").length;
  const critical = ncs.filter(n => n.severity === "Critical").length;
  const overdueCAs = ncs.flatMap(n => n.correctiveActions ?? []).filter(c => c.isOverdue).length;
  const closed = ncs.filter(n => n.status === "Closed").length;
  const stats = [
    { label: "Open NCs",    value: open,       color: "#C0392B", bg: "#FDEDEC" },
    { label: "Critical",    value: critical,   color: "#922B21", bg: "#F5B7B1" },
    { label: "Overdue CAs", value: overdueCAs, color: "#935116", bg: "#FDEBD0" },
    { label: "Closed",      value: closed,     color: "#1E8449", bg: "#D5F5E3" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, nc, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "fixed", top: y, left: x, zIndex: 200,
      background: "#fff", border: "1px solid #D5D8DC", borderRadius: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 160, overflow: "hidden" }}>
      <div style={{ padding: "4px 0" }}>
        <button onClick={() => { onEdit(nc); onClose(); }} style={{
          display: "block", width: "100%", textAlign: "left", padding: "8px 16px",
          border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#1a1a1a" }}
          onMouseOver={e => e.currentTarget.style.background = "#F2F3F4"}
          onMouseOut={e => e.currentTarget.style.background = "none"}>✏️ Edit NC</button>
        <div style={{ height: 1, background: "#EAECEE", margin: "2px 0" }} />
        <button onClick={() => { onDelete(nc); onClose(); }} style={{
          display: "block", width: "100%", textAlign: "left", padding: "8px 16px",
          border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#C0392B" }}
          onMouseOver={e => e.currentTarget.style.background = "#FDEDEC"}
          onMouseOut={e => e.currentTarget.style.background = "none"}>🗑️ Delete NC</button>
      </div>
    </div>
  );
}

// ── NC list row ───────────────────────────────────────────────────────────────

function NcRow({ nc, onClick, selected, onContextMenu }) {
  const overdueCA = (nc.correctiveActions ?? []).some(c => c.isOverdue);
  return (
    <div onClick={onClick} onContextMenu={e => { e.preventDefault(); onContextMenu(e, nc); }}
      style={{ padding: "12px 16px", borderBottom: "1px solid #EAECEE", cursor: "pointer",
        transition: "background 0.1s", background: selected ? "#EBF5FB" : "transparent",
        borderLeft: selected ? "3px solid #2E86C1" : "3px solid transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: "#717D7E", fontWeight: 600 }}>{nc.referenceNumber}</span>
        <SeverityBadge severity={nc.severity} />
        <StatusBadge status={nc.status} />
        {overdueCA && <Badge label="⚠ CA Overdue" color="#935116" bg="#FDEBD0" />}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#1a1a1a" }}>{nc.title}</div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#717D7E" }}>
        <span>{fmtSource(nc.source)}</span>
        {nc.clauseReference && <span>· {nc.clauseReference}</span>}
        <span>· {fmtDate(nc.raisedAt)}</span>
      </div>
    </div>
  );
}

// ── Section / Field ───────────────────────────────────────────────────────────

function Section({ title, children, action }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #EAECEE" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "#717D7E" }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "#717D7E" }}>{label}</span>
      <span style={{ color: "#1a1a1a" }}>{value || "—"}</span>
    </div>
  );
}

// ── RCA Form ──────────────────────────────────────────────────────────────────

function RcaForm({ ncId, existing, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    method: existing?.method ?? "FiveWhys",
    causeCategory: existing?.causeCategory ?? "Process",
    causeDescription: existing?.causeDescription ?? "",
    analystUserId: existing?.analystUserId ?? "",
    fiveWhys: existing?.fiveWhys ?? ["","","","",""],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setWhy = (i, v) => setForm(f => { const w = [...f.fiveWhys]; w[i] = v; return { ...f, fiveWhys: w }; });

  const submit = async () => {
    if (!form.causeDescription || !form.analystUserId) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        method: form.method,
        causeCategory: form.causeCategory,
        causeDescription: form.causeDescription,
        analystUserId: form.analystUserId,
        fiveWhys: form.method === "FiveWhys" ? form.fiveWhys.filter(w => w.trim()) : [],
      };
      const nc = await ncApi.recordRca(ncId, payload);
      onSave(nc); setEditing(false);
    } catch { setError("Failed to save RCA."); }
    finally { setSaving(false); }
  };

  if (!editing && existing) return (
    <div>
      <Field label="Method" value={existing.method === "FiveWhys" ? "5-Whys" : "Fishbone"} />
      <Field label="Cause category" value={existing.causeCategory} />
      <Field label="Root cause" value={existing.causeDescription} />
      <Field label="Analyst" value={existing.analystUserId} />
      <Field label="Completed" value={fmtDate(existing.completedAt)} />
      {existing.fiveWhys?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "#717D7E", marginBottom: 6, fontWeight: 600 }}>5-Whys trace</div>
          {existing.fiveWhys.map((why, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
              <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#EBF5FB",
                border: "1px solid #2E86C130", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#2E86C1", flexShrink: 0 }}>{i+1}</div>
              <span style={{ fontSize: 13, color: "#1a1a1a", paddingTop: 2 }}>{why}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setEditing(true)} style={{ marginTop: 12, padding: "6px 14px",
        borderRadius: 6, border: "1px solid #D5D8DC", background: "#fff",
        cursor: "pointer", fontSize: 12, color: "#2E86C1", fontWeight: 600 }}>✏️ Edit RCA</button>
    </div>
  );

  if (!editing && !existing) return (
    <div>
      <div style={{ fontSize: 13, color: "#717D7E", fontStyle: "italic", marginBottom: 14 }}>
        No RCA recorded yet. Record the root cause to advance this NC to "Under Analysis".
      </div>
      <button onClick={() => setEditing(true)} style={{ padding: "8px 16px", borderRadius: 6,
        border: "none", background: "#2E86C1", color: "#fff", cursor: "pointer",
        fontSize: 13, fontWeight: 600 }}>+ Record RCA</button>
    </div>
  );

  return (
    <div style={{ background: "#F8F9FA", borderRadius: 8, padding: "16px 18px", border: "1px solid #EAECEE" }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#1a1a1a" }}>
        {existing ? "Edit root-cause analysis" : "Record root-cause analysis"}
      </div>
      {error && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6,
        background: "#FDEDEC", color: "#C0392B", fontSize: 13 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={lbl}>Method</label>
          <select style={inp} value={form.method} onChange={e => set("method", e.target.value)}>
            <option value="FiveWhys">5-Whys</option>
            <option value="Fishbone">Fishbone (Ishikawa)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Cause category</label>
          <select style={inp} value={form.causeCategory} onChange={e => set("causeCategory", e.target.value)}>
            {CAUSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Root cause description *</label>
        <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }}
          value={form.causeDescription} onChange={e => set("causeDescription", e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Analyst (user ID) *</label>
        <input style={inp} placeholder="user@domain.com" value={form.analystUserId} onChange={e => set("analystUserId", e.target.value)} />
      </div>
      {form.method === "FiveWhys" && (
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>5-Whys trace</label>
          {form.fiveWhys.map((why, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ minWidth: 22, height: 22, borderRadius: "50%", background: "#EBF5FB",
                border: "1px solid #2E86C130", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#2E86C1", flexShrink: 0 }}>{i+1}</div>
              <input style={inp} placeholder={`Why ${i+1}...`} value={why} onChange={e => setWhy(i, e.target.value)} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={() => setEditing(false)} disabled={saving} style={{
          padding: "7px 16px", borderRadius: 6, border: "1px solid #D5D8DC",
          background: "#fff", cursor: "pointer", fontSize: 13, color: "#717D7E" }}>Cancel</button>
        <button onClick={submit} disabled={saving} style={{
          padding: "7px 18px", borderRadius: 6, border: "none",
          background: saving ? "#aaa" : "#2E86C1", color: "#fff",
          cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "Saving..." : "Save RCA"}
        </button>
      </div>
    </div>
  );
}

// ── CA list with Mark Implemented ─────────────────────────────────────────────

function CaList({ nc, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingCa, setEditingCa] = useState(null);
  const [implementing, setImplementing] = useState(null);
  const [implUserId, setImplUserId] = useState("");
  const [saving, setSaving] = useState(false);

  const markImplemented = async (ca) => {
    if (!implUserId.trim()) return;
    setSaving(true);
    try {
      const updated = await ncApi.markImplemented(nc.id, ca.id, { verifiedByUserId: implUserId });
      onRefresh(updated); setImplementing(null); setImplUserId("");
    } catch { }
    finally { setSaving(false); }
  };

  if (!nc.correctiveActions?.length && !showAdd) return (
    <div>
      <div style={{ fontSize: 13, color: "#717D7E", fontStyle: "italic", marginBottom: 14 }}>
        No corrective actions yet. Add one to advance this NC to "CA In Progress".
      </div>
      <button onClick={() => setShowAdd(true)} style={{ padding: "8px 16px", borderRadius: 6,
        border: "none", background: "#2E86C1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        + Add corrective action
      </button>
    </div>
  );

  return (
    <div>
      {nc.correctiveActions?.map(ca => (
        <div key={ca.id} style={{ border: "1px solid #EAECEE", borderRadius: 8,
          padding: "12px 14px", marginBottom: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", flex: 1, marginRight: 8 }}>{ca.description}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <CaStatusBadge status={ca.status} />
              {ca.status !== "Implemented" && (
                <>
                  <button onClick={() => setEditingCa(ca)} style={{ padding: "2px 8px", borderRadius: 4,
                    border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 11, color: "#2E86C1" }}>Edit</button>
                  <button onClick={() => { setImplementing(ca); setImplUserId(""); }} style={{ padding: "2px 8px", borderRadius: 4,
                    border: "1px solid #1E8449", background: "#D5F5E3", cursor: "pointer", fontSize: 11, color: "#1E8449", fontWeight: 600 }}>✓ Implement</button>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#717D7E", flexWrap: "wrap" }}>
            <span>Owner: {ca.ownerUserId}</span>
            <span>Due: {fmtDate(ca.dueDate)}</span>
            {ca.isOverdue && <span style={{ color: "#935116", fontWeight: 700 }}>⚠ Overdue</span>}
            {ca.implementedAt && <span>Implemented: {fmtDate(ca.implementedAt)}</span>}
          </div>
          {implementing?.id === ca.id && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#F8F9FA",
              borderRadius: 6, border: "1px solid #EAECEE" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>
                Mark as implemented
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={{ ...inp, flex: 1 }} placeholder="Verified by (user ID)"
                  value={implUserId} onChange={e => setImplUserId(e.target.value)} />
                <button onClick={() => markImplemented(ca)} disabled={saving} style={{
                  padding: "8px 14px", borderRadius: 6, border: "none",
                  background: saving ? "#aaa" : "#1E8449", color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {saving ? "..." : "Confirm"}
                </button>
                <button onClick={() => setImplementing(null)} style={{ padding: "8px 10px", borderRadius: 6,
                  border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 13, color: "#717D7E" }}>✕</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => setShowAdd(true)} style={{ padding: "7px 14px", borderRadius: 6,
        border: "1px solid #2E86C1", background: "#EBF5FB", color: "#2E86C1",
        fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>+ Add CA</button>

      {(showAdd || editingCa) && (
        <CaModal ncId={nc.id} existing={editingCa}
          onClose={() => { setShowAdd(false); setEditingCa(null); }}
          onSave={updated => { onRefresh(updated); setShowAdd(false); setEditingCa(null); }} />
      )}
    </div>
  );
}

// ── Effectiveness / Close form ────────────────────────────────────────────────

function EffectivenessForm({ nc, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ isEffective: true, reviewNotes: "", reviewerUserId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.reviewNotes || !form.reviewerUserId) return;
    setSaving(true); setError(null);
    try {
      const nc2 = await ncApi.close(nc.id, form);
      onSave(nc2); setEditing(false);
    } catch (e) {
      setError(e?.response?.data || "Failed to close NC.");
    } finally { setSaving(false); }
  };

  const canClose = nc.status === "AwaitingEffectivenessReview";
  const er = nc.effectivenessReview;

  if (er) return (
    <div style={{ border: `1px solid ${er.isEffective ? "#1E844950" : "#C0392B50"}`,
      borderRadius: 8, padding: "14px 16px", background: er.isEffective ? "#D5F5E3" : "#FDEDEC" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: er.isEffective ? "#1E8449" : "#C0392B", marginBottom: 8 }}>
        {er.isEffective ? "✓ Effective — NC closed" : "✗ Not effective — NC reopened"}
      </div>
      <div style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 8 }}>{er.reviewNotes}</div>
      <div style={{ fontSize: 11, color: "#717D7E" }}>
        Reviewed by {er.reviewerUserId} on {fmtDate(er.reviewedAt)}
      </div>
    </div>
  );

  if (!canClose) return (
    <div style={{ fontSize: 13, color: "#717D7E", fontStyle: "italic" }}>
      {nc.status === "Closed"
        ? "This NC has been closed."
        : "Pending — all corrective actions must be implemented before closing."}
    </div>
  );

  if (!editing) return (
    <div>
      <div style={{ fontSize: 13, color: "#717D7E", marginBottom: 14 }}>
        All corrective actions are implemented. Submit an effectiveness review to close this NC.
      </div>
      <button onClick={() => setEditing(true)} style={{ padding: "8px 16px", borderRadius: 6,
        border: "none", background: "#1E8449", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        Submit effectiveness review
      </button>
    </div>
  );

  return (
    <div style={{ background: "#F8F9FA", borderRadius: 8, padding: "16px 18px", border: "1px solid #EAECEE" }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "#1a1a1a" }}>Effectiveness review & close-out</div>
      {error && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6,
        background: "#FDEDEC", color: "#C0392B", fontSize: 13 }}>{error}</div>}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Was the corrective action effective?</label>
        <div style={{ display: "flex", gap: 12 }}>
          {[true, false].map(v => (
            <label key={String(v)} style={{ display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, cursor: "pointer", color: "#1a1a1a" }}>
              <input type="radio" checked={form.isEffective === v}
                onChange={() => set("isEffective", v)} />
              {v ? "✓ Yes — close NC" : "✗ No — reopen NC"}
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Review notes *</label>
        <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }}
          placeholder="Describe the evidence that the corrective action was (or wasn't) effective..."
          value={form.reviewNotes} onChange={e => set("reviewNotes", e.target.value)} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Reviewer (user ID) *</label>
        <input style={inp} placeholder="user@domain.com"
          value={form.reviewerUserId} onChange={e => set("reviewerUserId", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={() => setEditing(false)} disabled={saving} style={{
          padding: "7px 16px", borderRadius: 6, border: "1px solid #D5D8DC",
          background: "#fff", cursor: "pointer", fontSize: 13, color: "#717D7E" }}>Cancel</button>
        <button onClick={submit} disabled={saving} style={{
          padding: "7px 18px", borderRadius: 6, border: "none",
          background: saving ? "#aaa" : form.isEffective ? "#1E8449" : "#C0392B",
          color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "Saving..." : form.isEffective ? "Close NC" : "Reopen NC"}
        </button>
      </div>
    </div>
  );
}

// ── Add / Edit CA Modal ───────────────────────────────────────────────────────

function CaModal({ ncId, existing, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    description: existing?.description ?? "",
    ownerUserId: existing?.ownerUserId ?? "",
    dueDate: existing?.dueDate ? existing.dueDate.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.description || !form.ownerUserId || !form.dueDate) return;
    setSaving(true); setError(null);
    try {
      const data = { ...form, dueDate: new Date(form.dueDate).toISOString() };
      const nc = isEdit
        ? await ncApi.updateCorrectiveAction(ncId, existing.id, data)
        : await ncApi.addCorrectiveAction(ncId, data);
      onSave(nc); onClose();
    } catch { setError("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D5D8DC",
        width: 440, padding: "24px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#1a1a1a" }}>
          {isEdit ? "Edit corrective action" : "Add corrective action"}
        </div>
        {error && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6,
          background: "#FDEDEC", color: "#C0392B", fontSize: 13 }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description *</label>
          <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }}
            value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={lbl}>Owner (user ID) *</label>
            <input style={inp} value={form.ownerUserId} onChange={e => set("ownerUserId", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Due date *</label>
            <input type="date" style={inp} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "8px 16px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 13, color: "#717D7E" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "8px 20px", borderRadius: 6,
            border: "none", background: saving ? "#aaa" : "#2E86C1", color: "#fff",
            cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
            {saving ? "Saving..." : isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function NcDetail({ nc, onEdit, onDelete, onRefresh }) {
  const [tab, setTab] = useState("details");
  const navigate = useNavigate();
  const tabs = [
    { id: "details",  label: "Details" },
    { id: "rca",      label: "Root Cause" },
    { id: "actions",  label: `Actions (${nc.correctiveActions?.length ?? 0})` },
    { id: "review",   label: "Effectiveness" },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 28px", background: "#FDFEFE" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#717D7E", fontWeight: 700 }}>{nc.referenceNumber}</span>
            <SeverityBadge severity={nc.severity} />
            <StatusBadge status={nc.status} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>{nc.title}</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => onEdit(nc)} style={{ padding: "6px 14px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#2E86C1" }}>✏️ Edit</button>
          <button onClick={() => onDelete(nc)} style={{ padding: "6px 14px", borderRadius: 6,
            border: "1px solid #F1948A", background: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#C0392B" }}>🗑️ Delete</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #EAECEE", marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "none", border: "none",
            cursor: "pointer", color: tab === t.id ? "#2E86C1" : "#717D7E",
            borderBottom: tab === t.id ? "2px solid #2E86C1" : "2px solid transparent",
            marginBottom: -1, transition: "color 0.1s" }}>{t.label}</button>
        ))}
      </div>

      {tab === "details" && (
        <Section title="Nonconformity details">
          <Field label="Source" value={fmtSource(nc.source)} />
          <Field label="Clause / control" value={
            nc.clauseReference
              ? <span
                  onClick={() => navigate(`/soa?control=${nc.clauseReference}`)}
                  style={{ color: "#2E86C1", cursor: "pointer", fontWeight: 600,
                    textDecoration: "underline", textDecorationStyle: "dotted" }}>
                  {nc.clauseReference} ↗
                </span>
              : "—"
          } />
          <Field label="Severity" value={nc.severity} />
          <Field label="Raised by" value={nc.raisedByUserId} />
          <Field label="Raised" value={fmtDate(nc.raisedAt)} />
          <Field label="Last updated" value={fmtDate(nc.updatedAt)} />
          {nc.evidenceReference && <Field label="Evidence" value={nc.evidenceReference} />}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#717D7E", marginBottom: 4, fontWeight: 600 }}>Description</div>
            <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.6 }}>{nc.description}</div>
          </div>
        </Section>
      )}

      {tab === "rca" && (
        <Section title="Root-cause analysis">
          <RcaForm ncId={nc.id} existing={nc.rootCauseAnalysis} onSave={onRefresh} />
        </Section>
      )}

      {tab === "actions" && (
        <Section title="Corrective action plan">
          <CaList nc={nc} onRefresh={onRefresh} />
        </Section>
      )}

      {tab === "review" && (
        <Section title="Effectiveness review & close-out">
          <EffectivenessForm nc={nc} onSave={onRefresh} />
        </Section>
      )}
    </div>
  );
}

// ── NC Form Modal ─────────────────────────────────────────────────────────────

function NcFormModal({ existing, clauseReference: prefillClause, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    source: existing?.source ?? "InternalAudit",
    clauseReference: existing?.clauseReference ?? prefillClause ?? "",
    severity: existing?.severity ?? "Major",
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    evidenceReference: existing?.evidenceReference ?? "",
    raisedByUserId: existing?.raisedByUserId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.description || (!isEdit && !form.raisedByUserId)) return;
    setSaving(true); setError(null);
    try {
      const nc = isEdit ? await ncApi.update(existing.id, form) : await ncApi.raise(form);
      onSave(nc); onClose();
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D5D8DC",
        width: 580, maxHeight: "90vh", overflow: "auto", padding: "28px 32px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 22, color: "#1a1a1a" }}>
          {isEdit ? `Edit ${existing.referenceNumber}` : "Raise nonconformity"}
        </div>
        {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 6,
          background: "#FDEDEC", color: "#C0392B", fontSize: 13, fontWeight: 500 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div><label style={lbl}>Source *</label>
            <select style={inp} value={form.source} onChange={e => set("source", e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{fmtSource(s)}</option>)}
            </select></div>
          <div><label style={lbl}>Severity *</label>
            <select style={inp} value={form.severity} onChange={e => set("severity", e.target.value)}>
              {["Minor","Major","Critical"].map(s => <option key={s}>{s}</option>)}
            </select></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Clause / control reference</label>
          <input style={inp} placeholder="e.g. A.8.24" value={form.clauseReference} onChange={e => set("clauseReference", e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Title *</label>
          <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Description *</label>
          <textarea style={{ ...inp, minHeight: 90, resize: "vertical" }}
            value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
          <div><label style={lbl}>Evidence reference</label>
            <input style={inp} placeholder="Filename or URL" value={form.evidenceReference} onChange={e => set("evidenceReference", e.target.value)} /></div>
          {!isEdit && <div><label style={lbl}>Raised by (user ID) *</label>
            <input style={inp} placeholder="user@domain.com" value={form.raisedByUserId} onChange={e => set("raisedByUserId", e.target.value)} /></div>}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "9px 18px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#717D7E" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "9px 22px", borderRadius: 6,
            border: "none", background: saving ? "#aaa" : "#2E86C1", color: "#fff",
            cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Raise NC"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ nc, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try { await ncApi.delete(nc.id); onDeleted(nc.id); onClose(); }
    catch { setDeleting(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D5D8DC",
        width: 420, padding: "28px 32px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: "#C0392B" }}>Delete nonconformity</div>
        <div style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{nc.referenceNumber} — {nc.title}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={deleting} style={{ padding: "9px 18px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#717D7E" }}>Cancel</button>
          <button onClick={confirm} disabled={deleting} style={{ padding: "9px 22px", borderRadius: 6,
            border: "none", background: deleting ? "#aaa" : "#C0392B", color: "#fff",
            cursor: deleting ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function NcCaModule() {
  const [ncs, setNcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchParams] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await ncApi.getAll();
      setNcs(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch { setError("Failed to load nonconformities."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Handle ?nc= param — pre-select an NC from SoA link
  useEffect(() => {
    const ncId = searchParams.get("nc");
    if (ncId && ncs.length > 0) {
      const match = ncs.find(n => n.id === ncId);
      if (match) setSelected(match);
    }
  }, [searchParams, ncs]);

  // Handle ?clause= param — open Raise NC modal pre-filled with clause
  useEffect(() => {
    const clause = searchParams.get("clause");
    if (clause && !loading) {
      setModal({ type: "raise", clauseReference: clause });
    }
  }, [searchParams, loading]);

  useEffect(() => { load(); }, [load]);

  const filtered = ncs.filter(n => {
    if (filterStatus !== "All" && n.status !== filterStatus) return false;
    if (filterSeverity !== "All" && n.severity !== filterSeverity) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) &&
        !n.referenceNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSaved = (nc) => {
    setNcs(prev => {
      const idx = prev.findIndex(n => n.id === nc.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = nc; return next; }
      return [nc, ...prev];
    });
    setSelected(nc);
  };

  const handleDeleted = (id) => {
    setNcs(prev => prev.filter(n => n.id !== id));
    setSelected(prev => prev?.id === id ? null : prev);
  };

  const selInFiltered = selected && filtered.find(n => n.id === selected.id);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 300, color: "#717D7E", fontSize: 13 }}>Loading nonconformities...</div>
  );
  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 300, flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#C0392B", fontSize: 13 }}>{error}</div>
      <button onClick={load} style={{ padding: "8px 16px", borderRadius: 6,
        border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer", fontSize: 13 }}>Retry</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13, color: "#1a1a1a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 2, color: "#1a1a1a" }}>
            Nonconformity & Corrective Actions
          </h1>
          <div style={{ fontSize: 12, color: "#717D7E" }}>ISO/IEC 27001:2022 · Clause 10.2</div>
        </div>
        <button onClick={() => setModal({ type: "raise" })} style={{ padding: "9px 18px", borderRadius: 7,
          border: "none", background: "#2E86C1", color: "#fff", cursor: "pointer",
          fontSize: 13, fontWeight: 700, boxShadow: "0 2px 8px rgba(46,134,193,0.3)" }}>+ Raise NC</button>
      </div>

      <Dashboard ncs={ncs} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NCs…"
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D5D8DC",
            background: "#fff", color: "#1a1a1a", fontSize: 12, width: 180, outline: "none" }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D5D8DC",
            background: "#fff", color: "#1a1a1a", fontSize: 12, outline: "none" }}>
          <option value="All">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D5D8DC",
            background: "#fff", color: "#1a1a1a", fontSize: 12, outline: "none" }}>
          <option value="All">All severities</option>
          {Object.keys(SEVERITY_META).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#717D7E", alignSelf: "center" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} · right-click for actions
        </div>
      </div>

      <div style={{ display: "flex", border: "1px solid #EAECEE", borderRadius: 10,
        overflow: "hidden", minHeight: 520, background: "#fff",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid #EAECEE",
          overflowY: "auto", background: "#FDFEFE" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, fontSize: 13, color: "#717D7E", textAlign: "center" }}>
              No nonconformities match your filters.
            </div>
          )}
          {filtered.map(nc => (
            <NcRow key={nc.id} nc={nc} selected={selected?.id === nc.id}
              onClick={() => setSelected(nc)}
              onContextMenu={(e, n) => setContextMenu({ x: e.clientX, y: e.clientY, nc: n })} />
          ))}
        </div>
        {selInFiltered
          ? <NcDetail nc={selInFiltered} onEdit={nc => setModal({ type: "edit", nc })}
              onDelete={nc => setModal({ type: "delete", nc })} onRefresh={handleSaved} />
          : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#717D7E", fontSize: 13, background: "#FDFEFE" }}>
              Select a nonconformity to view details
            </div>
        }
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} nc={contextMenu.nc}
          onEdit={nc => setModal({ type: "edit", nc })}
          onDelete={nc => setModal({ type: "delete", nc })}
          onClose={() => setContextMenu(null)} />
      )}

      {modal?.type === "raise" && <NcFormModal clauseReference={modal.clauseReference} onClose={() => setModal(null)} onSave={handleSaved} />}
      {modal?.type === "edit" && <NcFormModal existing={modal.nc} onClose={() => setModal(null)} onSave={handleSaved} />}
      {modal?.type === "delete" && <DeleteConfirm nc={modal.nc} onClose={() => setModal(null)} onDeleted={handleDeleted} />}
    </div>
  );
}
