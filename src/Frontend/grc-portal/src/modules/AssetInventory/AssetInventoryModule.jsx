import { useState, useEffect, useCallback, useRef } from "react";
import { assetApi } from "../../services/api";

const ASSET_TYPES = ["Hardware","Software","CloudService","DataAsset","MobileDevice","VideoConference","CollaborationLicense"];

const TYPE_META = {
  Hardware:             { label: "Hardware",              icon: "🖥️", color: "#1A5276", bg: "#D6EAF8" },
  Software:             { label: "Software",              icon: "💿", color: "#6C3483", bg: "#E8DAEF" },
  CloudService:         { label: "Cloud Service",         icon: "☁️", color: "#0E6655", bg: "#D1F2EB" },
  DataAsset:            { label: "Data Asset",            icon: "🗄️", color: "#784212", bg: "#FAD7A0" },
  MobileDevice:         { label: "Mobile Device",         icon: "📱", color: "#1A5276", bg: "#D6EAF8" },
  VideoConference:      { label: "Video Conference",      icon: "📹", color: "#117A65", bg: "#D1F2EB" },
  CollaborationLicense: { label: "Collaboration License", icon: "🤝", color: "#6C3483", bg: "#E8DAEF" },
};

const RISK_META = {
  Low:      { label: "Low",      color: "#1E8449", bg: "#D5F5E3" },
  Medium:   { label: "Medium",   color: "#935116", bg: "#FDEBD0" },
  High:     { label: "High",     color: "#C0392B", bg: "#FDEDEC" },
  Critical: { label: "Critical", color: "#922B21", bg: "#F5B7B1" },
};

const STATUS_META = {
  Active:   { label: "Active",   color: "#1E8449", bg: "#D5F5E3" },
  Inactive: { label: "Inactive", color: "#935116", bg: "#FDEBD0" },
  Retired:  { label: "Retired",  color: "#616A6B", bg: "#F2F3F4" },
  Disposed: { label: "Disposed", color: "#922B21", bg: "#FDEDEC" },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const inp = { fontSize: 13, padding: "8px 10px", borderRadius: 6, border: "1px solid #D5D8DC",
  background: "#fff", color: "#1a1a1a", width: "100%", boxSizing: "border-box", outline: "none" };
const lbl = { fontSize: 11, color: "#717D7E", display: "block", marginBottom: 5,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" };

function RiskBadge({ rating }) {
  const m = RISK_META[rating] || { label: rating, color: "#888", bg: "#eee" };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
    color: m.color, backgroundColor: m.bg, border: `1px solid ${m.color}30`, whiteSpace: "nowrap" }}>{m.label}</span>;
}
function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: "#888", bg: "#eee" };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
    color: m.color, backgroundColor: m.bg, border: `1px solid ${m.color}30`, whiteSpace: "nowrap" }}>{m.label}</span>;
}
function TypeBadge({ type }) {
  const m = TYPE_META[type] || { label: type, icon: "📦", color: "#888", bg: "#eee" };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
    color: m.color, backgroundColor: m.bg, border: `1px solid ${m.color}30`, whiteSpace: "nowrap" }}>
    {m.icon} {m.label}</span>;
}

// ── Customer sidebar ──────────────────────────────────────────────────────────

function CustomerSidebar({ customers, selectedCustomer, onSelect }) {
  const total = customers.reduce((s, c) => s + c.total, 0);
  const active = customers.reduce((s, c) => s + c.active, 0);
  const critical = customers.reduce((s, c) => s + c.critical, 0);

  return (
    <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid #EAECEE",
      background: "#FAFBFC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #EAECEE" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "#717D7E", marginBottom: 8 }}>Customers</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#EBF5FB", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 10, color: "#2E86C1", fontWeight: 600 }}>TOTAL</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#2E86C1" }}>{total}</div>
          </div>
          <div style={{ flex: 1, background: "#FDEDEC", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 10, color: "#C0392B", fontWeight: 600 }}>CRITICAL</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#C0392B" }}>{critical}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {/* All assets */}
        <button onClick={() => onSelect(null)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13,
          background: selectedCustomer === null ? "#EBF5FB" : "transparent",
          color: selectedCustomer === null ? "#2E86C1" : "#1a1a1a",
          borderLeft: selectedCustomer === null ? "3px solid #2E86C1" : "3px solid transparent",
          fontWeight: selectedCustomer === null ? 600 : 400, textAlign: "left" }}>
          <span>🌐 All assets</span>
          <span style={{ fontSize: 11, color: "#717D7E" }}>{total}</span>
        </button>

        {customers.map(c => (
          <button key={c.customerId} onClick={() => onSelect(c.customerId)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13,
            background: selectedCustomer === c.customerId ? "#EBF5FB" : "transparent",
            color: selectedCustomer === c.customerId ? "#2E86C1" : "#1a1a1a",
            borderLeft: selectedCustomer === c.customerId ? "3px solid #2E86C1" : "3px solid transparent",
            fontWeight: selectedCustomer === c.customerId ? 600 : 400, textAlign: "left" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
              <span style={{ fontSize: 12 }}>
                {c.customerId === "__exelcom__" ? "🏢" : "👤"} {c.customerName}
              </span>
              <span style={{ fontSize: 10, color: "#717D7E" }}>
                {c.active} active{c.critical > 0 ? ` · ${c.critical} critical` : ""}
                {c.expiringWithin30Days > 0 ? ` · ⚠ ${c.expiringWithin30Days} expiring` : ""}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#717D7E", flexShrink: 0 }}>{c.total}</span>
          </button>
        ))}

        {customers.length === 0 && (
          <div style={{ padding: "16px", fontSize: 12, color: "#717D7E", fontStyle: "italic" }}>
            No customers yet. Add an asset with a customer name to get started.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ stats, customerName }) {
  if (!stats) return null;
  const cards = [
    { label: "Total",          value: stats.total,                color: "#1A5276", bg: "#D6EAF8" },
    { label: "Active",         value: stats.active,               color: "#1E8449", bg: "#D5F5E3" },
    { label: "Critical Risk",  value: stats.critical,             color: "#922B21", bg: "#FDEDEC" },
    { label: "High Risk",      value: stats.high,                 color: "#C0392B", bg: "#FDEDEC" },
    { label: "Expiring (30d)", value: stats.expiringWithin30Days, color: "#935116", bg: "#FDEBD0" },
    { label: "Retired/Disposed",value: stats.retired + stats.disposed, color: "#616A6B", bg: "#F2F3F4" },
  ];
  return (
    <div style={{ marginBottom: 16 }}>
      {customerName && (
        <div style={{ fontSize: 12, color: "#2E86C1", fontWeight: 600, marginBottom: 8 }}>
          Showing: {customerName}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.color}25`,
            borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: c.color, fontWeight: 600, marginBottom: 2,
              textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, asset, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "fixed", top: y, left: x, zIndex: 200,
      background: "#fff", border: "1px solid #D5D8DC", borderRadius: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 160 }}>
      <div style={{ padding: "4px 0" }}>
        <button onClick={() => { onEdit(asset); onClose(); }} style={{
          display: "block", width: "100%", textAlign: "left", padding: "8px 16px",
          border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#1a1a1a" }}
          onMouseOver={e => e.currentTarget.style.background = "#F2F3F4"}
          onMouseOut={e => e.currentTarget.style.background = "none"}>✏️ Edit</button>
        <div style={{ height: 1, background: "#EAECEE", margin: "2px 0" }} />
        <button onClick={() => { onDelete(asset); onClose(); }} style={{
          display: "block", width: "100%", textAlign: "left", padding: "8px 16px",
          border: "none", background: "none", fontSize: 13, cursor: "pointer", color: "#C0392B" }}
          onMouseOver={e => e.currentTarget.style.background = "#FDEDEC"}
          onMouseOut={e => e.currentTarget.style.background = "none"}>🗑️ Delete</button>
      </div>
    </div>
  );
}

// ── Asset row ─────────────────────────────────────────────────────────────────

function AssetRow({ asset, selected, onClick, onContextMenu }) {
  const isExpiring = asset.expiryDate &&
    new Date(asset.expiryDate) <= new Date(Date.now() + 30*24*60*60*1000) &&
    asset.status === "Active";
  return (
    <div onClick={onClick} onContextMenu={e => { e.preventDefault(); onContextMenu(e, asset); }}
      style={{ padding: "10px 14px", borderBottom: "1px solid #EAECEE", cursor: "pointer",
        background: selected ? "#EBF5FB" : "transparent",
        borderLeft: selected ? "3px solid #2E86C1" : "3px solid transparent",
        transition: "background 0.1s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12 }}>{TYPE_META[asset.type]?.icon ?? "📦"}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{asset.name}</span>
        <RiskBadge rating={asset.riskRating} />
        <StatusBadge status={asset.status} />
        {isExpiring && <span style={{ fontSize: 10, fontWeight: 700, color: "#935116",
          background: "#FDEBD0", padding: "1px 5px", borderRadius: 4 }}>⚠ Expiring</span>}
      </div>
      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#717D7E" }}>
        <span>{TYPE_META[asset.type]?.label ?? asset.type}</span>
        {asset.manufacturer && <span>· {asset.manufacturer}</span>}
        {asset.customerName && <span style={{ color: "#2E86C1" }}>· {asset.customerName}</span>}
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 8, marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "#717D7E" }}>{label}</span>
      <span style={{ color: "#1a1a1a" }}>{value || "—"}</span>
    </div>
  );
}

function AssetDetail({ asset, onEdit, onDelete }) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: "#FDFEFE" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18 }}>{TYPE_META[asset.type]?.icon ?? "📦"}</span>
            <TypeBadge type={asset.type} />
            <RiskBadge rating={asset.riskRating} />
            <StatusBadge status={asset.status} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>{asset.name}</h2>
          {asset.description && <div style={{ fontSize: 13, color: "#717D7E", marginTop: 3 }}>{asset.description}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => onEdit(asset)} style={{ padding: "6px 12px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#2E86C1" }}>✏️ Edit</button>
          <button onClick={() => onDelete(asset)} style={{ padding: "6px 12px", borderRadius: 6,
            border: "1px solid #F1948A", background: "#fff", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#C0392B" }}>🗑️ Delete</button>
        </div>
      </div>

      {asset.customerName && (
        <div style={{ marginBottom: 14, padding: "8px 12px", background: "#EBF5FB",
          borderRadius: 6, border: "1px solid #2E86C130", fontSize: 13 }}>
          <span style={{ color: "#717D7E", marginRight: 6 }}>👤 Customer:</span>
          <span style={{ fontWeight: 700, color: "#2E86C1" }}>{asset.customerName}</span>
          {asset.customerId && asset.customerId !== asset.customerName &&
            <span style={{ color: "#717D7E", fontSize: 11, marginLeft: 6 }}>({asset.customerId})</span>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "#717D7E", marginBottom: 8, paddingBottom: 5, borderBottom: "1px solid #EAECEE" }}>Ownership</div>
          <Field label="Owner" value={asset.ownerUserId} />
          <Field label="Custodian" value={asset.custodianUserId} />
          <Field label="Location" value={asset.location} />
          <Field label="Created by" value={asset.createdByUserId} />
          <Field label="Created" value={fmtDate(asset.createdAt)} />
          <Field label="Updated" value={fmtDate(asset.updatedAt)} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "#717D7E", marginBottom: 8, paddingBottom: 5, borderBottom: "1px solid #EAECEE" }}>Technical</div>
          <Field label="Manufacturer" value={asset.manufacturer} />
          <Field label="Model" value={asset.model} />
          <Field label="Version" value={asset.version} />
          <Field label="Serial / licence" value={asset.serialNumber} />
          <Field label="Purchase date" value={fmtDate(asset.purchaseDate)} />
          <Field label="Expiry date" value={fmtDate(asset.expiryDate)} />
          {asset.retiredAt && <Field label="Retired" value={fmtDate(asset.retiredAt)} />}
        </div>
      </div>

      {asset.linkedControlId && (
        <div style={{ marginTop: 14, padding: "8px 12px", background: "#EBF5FB",
          borderRadius: 6, border: "1px solid #2E86C130", fontSize: 13 }}>
          <span style={{ color: "#717D7E", marginRight: 6 }}>Linked SoA control:</span>
          <span style={{ fontWeight: 700, color: "#2E86C1" }}>{asset.linkedControlId}</span>
        </div>
      )}
    </div>
  );
}

// ── Asset form modal ──────────────────────────────────────────────────────────

function AssetFormModal({ existing, defaultCustomerId, defaultCustomerName, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    type: existing?.type ?? "Hardware",
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    customerId: existing?.customerId ?? defaultCustomerId ?? "",
    customerName: existing?.customerName ?? defaultCustomerName ?? "",
    riskRating: existing?.riskRating ?? "Medium",
    status: existing?.status ?? "Active",
    ownerUserId: existing?.ownerUserId ?? "",
    custodianUserId: existing?.custodianUserId ?? "",
    location: existing?.location ?? "",
    serialNumber: existing?.serialNumber ?? "",
    manufacturer: existing?.manufacturer ?? "",
    model: existing?.model ?? "",
    version: existing?.version ?? "",
    purchaseDate: existing?.purchaseDate ? existing.purchaseDate.slice(0, 10) : "",
    expiryDate: existing?.expiryDate ? existing.expiryDate.slice(0, 10) : "",
    linkedControlId: existing?.linkedControlId ?? "",
    createdByUserId: existing?.createdByUserId ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.ownerUserId || (!isEdit && !form.createdByUserId)) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        customerId: form.customerId || null,
        customerName: form.customerName || null,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      };
      const result = isEdit ? await assetApi.update(existing.id, payload) : await assetApi.create(payload);
      onSave(result); onClose();
    } catch { setError("Failed to save asset."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D5D8DC",
        width: 660, maxHeight: "90vh", overflow: "auto", padding: "28px 32px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, color: "#1a1a1a" }}>
          {isEdit ? `Edit — ${existing.name}` : "Add asset"}
        </div>
        {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 6,
          background: "#FDEDEC", color: "#C0392B", fontSize: 13 }}>{error}</div>}

        {/* Customer */}
        <div style={{ marginBottom: 14, padding: "12px 14px", background: "#F8F9FA",
          borderRadius: 8, border: "1px solid #EAECEE" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#717D7E", marginBottom: 10,
            textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer (leave blank for Exelcom internal)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={lbl}>Customer name</label>
              <input style={inp} placeholder="e.g. Acme Corp" value={form.customerName}
                onChange={e => { set("customerName", e.target.value); if (!form.customerId) set("customerId", e.target.value); }} /></div>
            <div><label style={lbl}>Customer ID</label>
              <input style={inp} placeholder="e.g. ACME-001" value={form.customerId}
                onChange={e => set("customerId", e.target.value)} /></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Asset type *</label>
            <select style={inp} value={form.type} onChange={e => set("type", e.target.value)}>
              {ASSET_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.icon} {TYPE_META[t]?.label}</option>)}
            </select></div>
          <div><label style={lbl}>Risk rating *</label>
            <select style={inp} value={form.riskRating} onChange={e => set("riskRating", e.target.value)}>
              {["Low","Medium","High","Critical"].map(r => <option key={r}>{r}</option>)}
            </select></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Asset name *</label>
          <input style={inp} placeholder="e.g. Dell PowerEdge R750, MS Teams License" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 55, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Owner (user ID) *</label>
            <input style={inp} placeholder="user@domain.com" value={form.ownerUserId} onChange={e => set("ownerUserId", e.target.value)} /></div>
          <div><label style={lbl}>Custodian (user ID)</label>
            <input style={inp} placeholder="user@domain.com" value={form.custodianUserId} onChange={e => set("custodianUserId", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Manufacturer</label>
            <input style={inp} value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} /></div>
          <div><label style={lbl}>Model</label>
            <input style={inp} value={form.model} onChange={e => set("model", e.target.value)} /></div>
          <div><label style={lbl}>Version</label>
            <input style={inp} value={form.version} onChange={e => set("version", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Serial / licence no.</label>
            <input style={inp} value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} /></div>
          <div><label style={lbl}>Location</label>
            <input style={inp} placeholder="e.g. Server Room, Cloud" value={form.location} onChange={e => set("location", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Purchase date</label>
            <input type="date" style={inp} value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)} /></div>
          <div><label style={lbl}>Expiry date</label>
            <input type="date" style={inp} value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div><label style={lbl}>Linked SoA control</label>
            <input style={inp} placeholder="e.g. A.8.1" value={form.linkedControlId} onChange={e => set("linkedControlId", e.target.value)} /></div>
          {isEdit
            ? <div><label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                  {["Active","Inactive","Retired","Disposed"].map(s => <option key={s}>{s}</option>)}
                </select></div>
            : <div><label style={lbl}>Created by (user ID) *</label>
                <input style={inp} placeholder="user@domain.com" value={form.createdByUserId} onChange={e => set("createdByUserId", e.target.value)} /></div>}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "9px 18px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: "#717D7E" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "9px 22px", borderRadius: 6,
            border: "none", background: saving ? "#aaa" : "#2E86C1", color: "#fff",
            cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add asset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ asset, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try { await assetApi.delete(asset.id); onDeleted(asset.id); onClose(); }
    catch { setDeleting(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,30,30,0.55)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #D5D8DC",
        width: 420, padding: "28px 32px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: "#C0392B" }}>Delete asset</div>
        <div style={{ fontSize: 13, color: "#1a1a1a", marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{asset.name}</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={deleting} style={{ padding: "9px 18px", borderRadius: 6,
            border: "1px solid #D5D8DC", background: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: "#717D7E" }}>Cancel</button>
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

export default function AssetInventoryModule() {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [data, s, c] = await Promise.all([
        assetApi.getAll(selectedCustomer ? { customerId: selectedCustomer } : undefined),
        assetApi.getStats(selectedCustomer ?? undefined),
        assetApi.getCustomers(),
      ]);
      setAssets(data);
      setStats(s);
      setCustomers(c);
      if (data.length > 0) setSelected(prev => prev ?? data[0]);
      else setSelected(null);
    } catch { setError("Failed to load assets."); }
    finally { setLoading(false); }
  }, [selectedCustomer]);

  useEffect(() => { load(); }, [load]);

  const filtered = assets.filter(a => {
    if (filterType !== "All" && a.type !== filterType) return false;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    if (filterRisk !== "All" && a.riskRating !== filterRisk) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !(a.manufacturer ?? "").toLowerCase().includes(search.toLowerCase()) &&
        !(a.customerName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSaved = (asset) => {
    setAssets(prev => {
      const idx = prev.findIndex(a => a.id === asset.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = asset; return next; }
      return [asset, ...prev];
    });
    setSelected(asset);
    Promise.all([
      assetApi.getStats(selectedCustomer ?? undefined),
      assetApi.getCustomers(),
    ]).then(([s, c]) => { setStats(s); setCustomers(c); }).catch(() => {});
  };

  const handleDeleted = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setSelected(prev => prev?.id === id ? null : prev);
    Promise.all([
      assetApi.getStats(selectedCustomer ?? undefined),
      assetApi.getCustomers(),
    ]).then(([s, c]) => { setStats(s); setCustomers(c); }).catch(() => {});
  };

  const selectedCustomerInfo = customers.find(c => c.customerId === selectedCustomer);
  const selInFiltered = selected && filtered.find(a => a.id === selected.id);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 300, color: "#717D7E", fontSize: 13 }}>Loading assets...</div>
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 2, color: "#1a1a1a" }}>Asset Inventory</h1>
          <div style={{ fontSize: 12, color: "#717D7E" }}>ISO/IEC 27001:2022 · Annex A.8 — Asset management</div>
        </div>
        <button onClick={() => setModal({
          type: "add",
          customerId: selectedCustomer && selectedCustomer !== "__exelcom__" ? selectedCustomer : "",
          customerName: selectedCustomerInfo?.customerName && selectedCustomerInfo.customerId !== "__exelcom__"
            ? selectedCustomerInfo.customerName : "",
        })} style={{ padding: "9px 18px", borderRadius: 7, border: "none",
          background: "#2E86C1", color: "#fff", cursor: "pointer",
          fontSize: 13, fontWeight: 700, boxShadow: "0 2px 8px rgba(46,134,193,0.3)" }}>+ Add asset</button>
      </div>

      <Dashboard stats={stats}
        customerName={selectedCustomerInfo ? selectedCustomerInfo.customerName : null} />

      {/* Main layout */}
      <div style={{ display: "flex", border: "1px solid #EAECEE", borderRadius: 10,
        overflow: "hidden", minHeight: 560, background: "#fff",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>

        {/* Customer sidebar */}
        <CustomerSidebar
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={id => { setSelectedCustomer(id); setSelected(null); }} />

        {/* Asset list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid #EAECEE",
          display: "flex", flexDirection: "column", background: "#FDFEFE" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #EAECEE", display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D5D8DC",
                background: "#fff", color: "#1a1a1a", fontSize: 12, outline: "none" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ flex: 1, padding: "5px 6px", borderRadius: 6, border: "1px solid #D5D8DC",
                  background: "#fff", color: "#1a1a1a", fontSize: 11, outline: "none" }}>
                <option value="All">All types</option>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.label}</option>)}
              </select>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                style={{ flex: 1, padding: "5px 6px", borderRadius: 6, border: "1px solid #D5D8DC",
                  background: "#fff", color: "#1a1a1a", fontSize: 11, outline: "none" }}>
                <option value="All">All risks</option>
                {["Critical","High","Medium","Low"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, color: "#717D7E" }}>
              {filtered.length} asset{filtered.length !== 1 ? "s" : ""} · right-click for actions
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: 24, fontSize: 13, color: "#717D7E", textAlign: "center" }}>
                No assets match your filters.
              </div>
            )}
            {filtered.map(a => (
              <AssetRow key={a.id} asset={a} selected={selected?.id === a.id}
                onClick={() => setSelected(a)}
                onContextMenu={(e, asset) => setContextMenu({ x: e.clientX, y: e.clientY, asset })} />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selInFiltered
          ? <AssetDetail asset={selInFiltered}
              onEdit={a => setModal({ type: "edit", asset: a })}
              onDelete={a => setModal({ type: "delete", asset: a })} />
          : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#717D7E", fontSize: 13, background: "#FDFEFE", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 32 }}>📦</span>
              <span>Select an asset to view details</span>
            </div>
        }
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} asset={contextMenu.asset}
          onEdit={a => setModal({ type: "edit", asset: a })}
          onDelete={a => setModal({ type: "delete", asset: a })}
          onClose={() => setContextMenu(null)} />
      )}

      {modal?.type === "add" && (
        <AssetFormModal
          defaultCustomerId={modal.customerId}
          defaultCustomerName={modal.customerName}
          onClose={() => setModal(null)} onSave={handleSaved} />
      )}
      {modal?.type === "edit" && (
        <AssetFormModal existing={modal.asset} onClose={() => setModal(null)} onSave={handleSaved} />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirm asset={modal.asset} onClose={() => setModal(null)} onDeleted={handleDeleted} />
      )}
    </div>
  );
}
