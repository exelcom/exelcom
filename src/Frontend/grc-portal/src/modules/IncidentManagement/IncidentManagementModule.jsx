import { useState, useEffect, useCallback, useRef } from "react";
import { incidentApi } from "../../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = ["Security","IT","Physical","PrivacyBreach"];
const TYPE_META = {
  Security:     { label: "Security",      icon: "🔒", color: "#7B241C", bg: "#FADBD8" },
  IT:           { label: "IT",            icon: "🖥️", color: "#1A5276", bg: "#D6EAF8" },
  Physical:     { label: "Physical",      icon: "🏢", color: "#784212", bg: "#FAD7A0" },
  PrivacyBreach:{ label: "Privacy Breach",icon: "🔏", color: "#6C3483", bg: "#E8DAEF" },
};

const SEV_META = {
  Low:      { label: "Low",      color: "#1E8449", bg: "#D5F5E3" },
  Medium:   { label: "Medium",   color: "#935116", bg: "#FDEBD0" },
  High:     { label: "High",     color: "#C0392B", bg: "#FDEDEC" },
  Critical: { label: "Critical", color: "#922B21", bg: "#F5B7B1" },
};

const STATUS_META = {
  New:          { label: "New",          color: "#1A5276", bg: "#D6EAF8" },
  Investigating:{ label: "Investigating",color: "#935116", bg: "#FDEBD0" },
  Contained:    { label: "Contained",    color: "#6C3483", bg: "#E8DAEF" },
  Resolved:     { label: "Resolved",     color: "#1E8449", bg: "#D5F5E3" },
  Closed:       { label: "Closed",       color: "#616A6B", bg: "#F2F3F4" },
};

const ACTION_TYPES = ["Containment","Remediation","Communication","Evidence","Other"];
const ACTION_STATUS_META = {
  Pending:    { label: "Pending",     color: "#935116", bg: "#FDEBD0" },
  InProgress: { label: "In Progress", color: "#1A5276", bg: "#D6EAF8" },
  Completed:  { label: "Completed",   color: "#1E8449", bg: "#D5F5E3" },
};

const STATUS_TRANSITIONS = {
  New:          { next: "investigate", label: "Begin Investigation", color: "#935116" },
  Investigating:{ next: "contain",     label: "Mark Contained",      color: "#6C3483" },
  Contained:    { next: "resolve",     label: "Mark Resolved",       color: "#1E8449" },
  Resolved:     { next: "close",       label: "Close Incident",      color: "#616A6B" },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtDateTime = d => d ? new Date(d).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const toInputDate = d => d ? new Date(d).toISOString().slice(0,10) : "";

const inp = { fontSize:13,padding:"8px 10px",borderRadius:6,border:"1px solid #D5D8DC",
  background:"#fff",color:"#1a1a1a",width:"100%",boxSizing:"border-box",outline:"none" };
const lbl = { fontSize:11,color:"#717D7E",display:"block",marginBottom:5,
  fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em" };

// ── Badges ────────────────────────────────────────────────────────────────────

const Badge = ({label,color,bg}) => (
  <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,
    color,backgroundColor:bg,border:`1px solid ${color}30`,whiteSpace:"nowrap"}}>{label}</span>
);

const SevBadge = ({s}) => { const m=SEV_META[s]||{label:s,color:"#888",bg:"#eee"}; return <Badge {...m}/>; };
const StatusBadge = ({s}) => { const m=STATUS_META[s]||{label:s,color:"#888",bg:"#eee"}; return <Badge {...m}/>; };
const TypeBadge = ({t}) => { const m=TYPE_META[t]||{label:t,icon:"⚠️",color:"#888",bg:"#eee"}; return <Badge label={`${m.icon} ${m.label}`} color={m.color} bg={m.bg}/>; };
const ActionStatusBadge = ({s}) => { const m=ACTION_STATUS_META[s]||{label:s,color:"#888",bg:"#eee"}; return <Badge {...m}/>; };

// ── Customer sidebar ──────────────────────────────────────────────────────────

function CustomerSidebar({ customers, selected, onSelect }) {
  const total = customers.reduce((s,c)=>s+c.total,0);
  const open = customers.reduce((s,c)=>s+c.open,0);
  return (
    <div style={{width:210,flexShrink:0,borderRight:"1px solid #EAECEE",background:"#FAFBFC",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 14px",borderBottom:"1px solid #EAECEE"}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#717D7E",marginBottom:8}}>Customers</div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,background:"#EBF5FB",borderRadius:6,padding:"6px 8px"}}>
            <div style={{fontSize:10,color:"#2E86C1",fontWeight:600}}>TOTAL</div>
            <div style={{fontSize:18,fontWeight:700,color:"#2E86C1"}}>{total}</div>
          </div>
          <div style={{flex:1,background:"#FDEBD0",borderRadius:6,padding:"6px 8px"}}>
            <div style={{fontSize:10,color:"#935116",fontWeight:600}}>OPEN</div>
            <div style={{fontSize:18,fontWeight:700,color:"#935116"}}>{open}</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
        <button onClick={()=>onSelect(null)} style={{display:"flex",alignItems:"center",
          justifyContent:"space-between",width:"100%",padding:"8px 14px",border:"none",
          cursor:"pointer",fontSize:12,background:selected===null?"#EBF5FB":"transparent",
          color:selected===null?"#2E86C1":"#1a1a1a",
          borderLeft:selected===null?"3px solid #2E86C1":"3px solid transparent",
          fontWeight:selected===null?600:400,textAlign:"left"}}>
          <span>🌐 All</span><span style={{fontSize:11,color:"#717D7E"}}>{total}</span>
        </button>
        {customers.map(c=>(
          <button key={c.customerId} onClick={()=>onSelect(c.customerId)} style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            width:"100%",padding:"8px 14px",border:"none",cursor:"pointer",fontSize:12,
            background:selected===c.customerId?"#EBF5FB":"transparent",
            color:selected===c.customerId?"#2E86C1":"#1a1a1a",
            borderLeft:selected===c.customerId?"3px solid #2E86C1":"3px solid transparent",
            fontWeight:selected===c.customerId?600:400,textAlign:"left"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1}}>
              <span>{c.customerId==="__exelcom__"?"🏢":"👤"} {c.customerName}</span>
              <span style={{fontSize:10,color:"#717D7E"}}>{c.open} open{c.critical>0?` · ${c.critical} critical`:""}</span>
            </div>
            <span style={{fontSize:11,color:"#717D7E",flexShrink:0}}>{c.total}</span>
          </button>
        ))}
        {customers.length===0&&(
          <div style={{padding:"14px",fontSize:12,color:"#717D7E",fontStyle:"italic"}}>No incidents yet.</div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ stats }) {
  if (!stats) return null;
  const cards = [
    {label:"Total",      value:stats.total,        color:"#1A5276",bg:"#D6EAF8"},
    {label:"New",        value:stats.new,           color:"#1A5276",bg:"#D6EAF8"},
    {label:"Investigating",value:stats.investigating,color:"#935116",bg:"#FDEBD0"},
    {label:"Critical",   value:stats.critical,      color:"#922B21",bg:"#FDEDEC"},
    {label:"High",       value:stats.high,          color:"#C0392B",bg:"#FDEDEC"},
    {label:"Overdue Actions",value:stats.overdueActions,color:"#935116",bg:"#FDEBD0"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
      {cards.map(c=>(
        <div key={c.label} style={{background:c.bg,border:`1px solid ${c.color}25`,borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:10,color:c.color,fontWeight:600,marginBottom:2,textTransform:"uppercase",letterSpacing:"0.05em"}}>{c.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:c.color}}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

function ContextMenu({ x, y, incident, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(()=>{
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div ref={ref} style={{position:"fixed",top:y,left:x,zIndex:200,background:"#fff",
      border:"1px solid #D5D8DC",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",minWidth:160}}>
      <div style={{padding:"4px 0"}}>
        <button onClick={()=>{onEdit(incident);onClose();}} style={{display:"block",width:"100%",
          textAlign:"left",padding:"8px 16px",border:"none",background:"none",fontSize:13,cursor:"pointer",color:"#1a1a1a"}}
          onMouseOver={e=>e.currentTarget.style.background="#F2F3F4"}
          onMouseOut={e=>e.currentTarget.style.background="none"}>✏️ Edit</button>
        <div style={{height:1,background:"#EAECEE",margin:"2px 0"}}/>
        <button onClick={()=>{onDelete(incident);onClose();}} style={{display:"block",width:"100%",
          textAlign:"left",padding:"8px 16px",border:"none",background:"none",fontSize:13,cursor:"pointer",color:"#C0392B"}}
          onMouseOver={e=>e.currentTarget.style.background="#FDEDEC"}
          onMouseOut={e=>e.currentTarget.style.background="none"}>🗑️ Delete</button>
      </div>
    </div>
  );
}

// ── Incident row ──────────────────────────────────────────────────────────────

function IncidentRow({ incident, selected, onClick, onContextMenu }) {
  return (
    <div onClick={onClick} onContextMenu={e=>{e.preventDefault();onContextMenu(e,incident);}}
      style={{padding:"10px 14px",borderBottom:"1px solid #EAECEE",cursor:"pointer",
        background:selected?"#EBF5FB":"transparent",
        borderLeft:selected?"3px solid #2E86C1":"3px solid transparent",transition:"background 0.1s"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#717D7E"}}>{incident.referenceNumber}</span>
        <SevBadge s={incident.severity}/>
        <StatusBadge s={incident.status}/>
      </div>
      <div style={{fontSize:12,fontWeight:600,color:"#1a1a1a",marginBottom:2,
        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{incident.title}</div>
      <div style={{display:"flex",gap:10,fontSize:11,color:"#717D7E"}}>
        <span>{TYPE_META[incident.type]?.icon} {TYPE_META[incident.type]?.label??incident.type}</span>
        {incident.customerName&&<span style={{color:"#2E86C1"}}>· {incident.customerName}</span>}
        <span>· {fmtDate(incident.occurredAt)}</span>
      </div>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:8,marginBottom:8,fontSize:13}}>
      <span style={{color:"#717D7E"}}>{label}</span>
      <span style={{color:"#1a1a1a"}}>{value||"—"}</span>
    </div>
  );
}

function SectionHeader({ title }) {
  return <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",
    color:"#717D7E",marginBottom:8,marginTop:16,paddingBottom:5,borderBottom:"1px solid #EAECEE"}}>{title}</div>;
}

function IncidentDetail({ incident, onEdit, onDelete, onTransition, onRefresh }) {
  const [modal, setModal] = useState(null);
  const transition = STATUS_TRANSITIONS[incident.status];

  const doTransition = async () => {
    try { await onTransition(incident.id, incident.status); onRefresh(); }
    catch (e) { alert(e.message||"Failed"); }
  };

  return (
    <div style={{flex:1,overflow:"auto",padding:"20px 24px",background:"#FDFEFE"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
            <TypeBadge t={incident.type}/>
            <SevBadge s={incident.severity}/>
            <StatusBadge s={incident.status}/>
            <span style={{fontSize:12,fontWeight:700,color:"#717D7E"}}>{incident.referenceNumber}</span>
          </div>
          <h2 style={{fontSize:17,fontWeight:700,margin:0,color:"#1a1a1a"}}>{incident.title}</h2>
          {incident.customerName&&(
            <div style={{fontSize:12,color:"#2E86C1",marginTop:3,fontWeight:600}}>
              👤 {incident.customerName}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {transition&&(
            <button onClick={doTransition} style={{padding:"6px 14px",borderRadius:6,border:"none",
              background:transition.color,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>
              {transition.label}
            </button>
          )}
          <button onClick={()=>onEdit(incident)} style={{padding:"6px 12px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:"#2E86C1"}}>✏️ Edit</button>
          <button onClick={()=>onDelete(incident)} style={{padding:"6px 12px",borderRadius:6,
            border:"1px solid #F1948A",background:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:"#C0392B"}}>🗑️ Delete</button>
        </div>
      </div>

      {/* Description */}
      <div style={{fontSize:13,color:"#1a1a1a",background:"#F8F9FA",borderRadius:6,
        padding:"10px 14px",marginBottom:4,lineHeight:1.6}}>{incident.description}</div>
      {incident.impactDescription&&(
        <div style={{fontSize:13,color:"#7B241C",background:"#FADBD8",borderRadius:6,
          padding:"8px 12px",marginTop:6,lineHeight:1.6}}>
          <strong>Impact:</strong> {incident.impactDescription}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginTop:4}}>
        <div>
          <SectionHeader title="Details"/>
          <Field label="Occurred" value={fmtDateTime(incident.occurredAt)}/>
          <Field label="Detected" value={fmtDateTime(incident.detectedAt)}/>
          {incident.containedAt&&<Field label="Contained" value={fmtDateTime(incident.containedAt)}/>}
          {incident.resolvedAt&&<Field label="Resolved" value={fmtDateTime(incident.resolvedAt)}/>}
          {incident.closedAt&&<Field label="Closed" value={fmtDateTime(incident.closedAt)}/>}
        </div>
        <div>
          <SectionHeader title="Assignment"/>
          <Field label="Reported by" value={incident.reportedByUserId}/>
          <Field label="Assigned to" value={incident.assignedToUserId}/>
          {incident.linkedControlId&&<Field label="SoA control" value={incident.linkedControlId}/>}
          {incident.affectedAssetIds&&<Field label="Affected assets" value={incident.affectedAssetIds}/>}
        </div>
      </div>

      {/* Actions */}
      <SectionHeader title="Actions"/>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <button onClick={()=>setModal({type:"addAction"})} style={{padding:"6px 12px",borderRadius:6,
          border:"1px solid #2E86C1",background:"#EBF5FB",cursor:"pointer",fontSize:12,fontWeight:600,color:"#2E86C1"}}>
          + Add action
        </button>
      </div>
      {incident.actions.length===0&&(
        <div style={{fontSize:13,color:"#717D7E",fontStyle:"italic",marginBottom:8}}>No actions recorded.</div>
      )}
      {incident.actions.map(a=>(
        <div key={a.id} style={{padding:"10px 14px",borderRadius:8,border:"1px solid #EAECEE",
          marginBottom:8,background:a.status==="Completed"?"#F8F9FA":"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{a.type}</span>
              <ActionStatusBadge s={a.status}/>
              {a.isOverdue&&<span style={{fontSize:10,fontWeight:700,color:"#C0392B",
                background:"#FDEDEC",padding:"1px 6px",borderRadius:4}}>⚠ Overdue</span>}
            </div>
            <div style={{display:"flex",gap:6}}>
              {a.status!=="Completed"&&(
                <button onClick={()=>setModal({type:"completeAction",action:a})} style={{
                  padding:"3px 10px",borderRadius:5,border:"1px solid #1E8449",
                  background:"#D5F5E3",cursor:"pointer",fontSize:11,fontWeight:600,color:"#1E8449"}}>
                  ✓ Complete
                </button>
              )}
            </div>
          </div>
          <div style={{fontSize:13,color:"#1a1a1a",marginBottom:4}}>{a.description}</div>
          <div style={{display:"flex",gap:16,fontSize:11,color:"#717D7E"}}>
            <span>Assigned: {a.assignedToUserId}</span>
            {a.dueDate&&<span>Due: {fmtDate(a.dueDate)}</span>}
            {a.completedAt&&<span>Completed: {fmtDateTime(a.completedAt)} by {a.completedByUserId}</span>}
          </div>
          {a.notes&&<div style={{fontSize:12,color:"#717D7E",marginTop:4,fontStyle:"italic"}}>{a.notes}</div>}
        </div>
      ))}

      {/* Post-incident review */}
      <SectionHeader title="Post-Incident Review"/>
      {incident.postIncidentReview ? (
        <div style={{padding:"14px",borderRadius:8,border:"1px solid #D5F5E3",background:"#F0FBF4"}}>
          <Field label="Summary" value={incident.postIncidentReview.summary}/>
          <Field label="Root cause" value={incident.postIncidentReview.rootCause}/>
          <Field label="Lessons learned" value={incident.postIncidentReview.lessonsLearned}/>
          {incident.postIncidentReview.recommendations&&
            <Field label="Recommendations" value={incident.postIncidentReview.recommendations}/>}
          <Field label="Reviewed by" value={incident.postIncidentReview.reviewerUserId}/>
          <Field label="Reviewed at" value={fmtDateTime(incident.postIncidentReview.reviewedAt)}/>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:13,color:"#717D7E",fontStyle:"italic"}}>No post-incident review recorded.</div>
          {(incident.status==="Resolved"||incident.status==="Closed")&&(
            <button onClick={()=>setModal({type:"review"})} style={{padding:"6px 12px",borderRadius:6,
              border:"1px solid #1E8449",background:"#D5F5E3",cursor:"pointer",fontSize:12,fontWeight:600,color:"#1E8449"}}>
              + Record review
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {modal?.type==="addAction"&&(
        <ActionModal incidentId={incident.id} onClose={()=>setModal(null)} onSaved={onRefresh}/>
      )}
      {modal?.type==="completeAction"&&(
        <CompleteActionModal incidentId={incident.id} action={modal.action}
          onClose={()=>setModal(null)} onSaved={onRefresh}/>
      )}
      {modal?.type==="review"&&(
        <PostIncidentReviewModal incidentId={incident.id}
          onClose={()=>setModal(null)} onSaved={onRefresh}/>
      )}
    </div>
  );
}

// ── Action modal ──────────────────────────────────────────────────────────────

function ActionModal({ incidentId, onClose, onSaved }) {
  const [form,setForm] = useState({type:"Containment",description:"",assignedToUserId:"",dueDate:"",notes:""});
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if (!form.description||!form.assignedToUserId) return;
    setSaving(true);
    try {
      await incidentApi.addAction(incidentId,{
        ...form,
        dueDate:form.dueDate?new Date(form.dueDate).toISOString():null,
        notes:form.notes||null,
      });
      onSaved(); onClose();
    } catch { setSaving(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,30,30,0.55)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D5D8DC",
        width:520,padding:"28px 32px",boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:18,color:"#1a1a1a"}}>Add action</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><label style={lbl}>Type</label>
            <select style={inp} value={form.type} onChange={e=>set("type",e.target.value)}>
              {ACTION_TYPES.map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={lbl}>Due date</label>
            <input type="date" style={inp} value={form.dueDate} onChange={e=>set("dueDate",e.target.value)}/></div>
        </div>
        <div style={{marginBottom:14}}><label style={lbl}>Description *</label>
          <textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form.description}
            onChange={e=>set("description",e.target.value)}/></div>
        <div style={{marginBottom:14}}><label style={lbl}>Assigned to *</label>
          <input style={inp} placeholder="user@domain.com" value={form.assignedToUserId}
            onChange={e=>set("assignedToUserId",e.target.value)}/></div>
        <div style={{marginBottom:18}}><label style={lbl}>Notes</label>
          <input style={inp} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={saving} style={{padding:"9px 18px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#717D7E"}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{padding:"9px 22px",borderRadius:6,
            border:"none",background:saving?"#aaa":"#2E86C1",color:"#fff",
            cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
            {saving?"Saving...":"Add action"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Complete action modal ─────────────────────────────────────────────────────

function CompleteActionModal({ incidentId, action, onClose, onSaved }) {
  const [form,setForm] = useState({completedByUserId:"",notes:""});
  const [saving,setSaving] = useState(false);
  const submit = async () => {
    if (!form.completedByUserId) return;
    setSaving(true);
    try {
      await incidentApi.completeAction(incidentId,action.id,{
        completedByUserId:form.completedByUserId,
        notes:form.notes||null,
      });
      onSaved(); onClose();
    } catch { setSaving(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,30,30,0.55)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D5D8DC",
        width:440,padding:"28px 32px",boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:6,color:"#1a1a1a"}}>Complete action</div>
        <div style={{fontSize:13,color:"#717D7E",marginBottom:16}}>{action.description}</div>
        <div style={{marginBottom:14}}><label style={lbl}>Completed by *</label>
          <input style={inp} placeholder="user@domain.com" value={form.completedByUserId}
            onChange={e=>setForm(f=>({...f,completedByUserId:e.target.value}))}/></div>
        <div style={{marginBottom:18}}><label style={lbl}>Notes</label>
          <input style={inp} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={saving} style={{padding:"9px 18px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#717D7E"}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{padding:"9px 22px",borderRadius:6,
            border:"none",background:saving?"#aaa":"#1E8449",color:"#fff",
            cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
            {saving?"Saving...":"Mark complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post-incident review modal ────────────────────────────────────────────────

function PostIncidentReviewModal({ incidentId, onClose, onSaved }) {
  const [form,setForm] = useState({summary:"",rootCause:"",lessonsLearned:"",recommendations:"",reviewerUserId:""});
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if (!form.summary||!form.rootCause||!form.lessonsLearned||!form.reviewerUserId) return;
    setSaving(true);
    try {
      await incidentApi.recordReview(incidentId,{...form,recommendations:form.recommendations||null});
      onSaved(); onClose();
    } catch { setSaving(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,30,30,0.55)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D5D8DC",
        width:580,maxHeight:"90vh",overflow:"auto",padding:"28px 32px",
        boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:18,color:"#1a1a1a"}}>Post-Incident Review</div>
        {[["summary","Summary *"],["rootCause","Root Cause *"],["lessonsLearned","Lessons Learned *"],
          ["recommendations","Recommendations"],["reviewerUserId","Reviewer (user ID) *"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:14}}>
            <label style={lbl}>{l}</label>
            {k==="reviewerUserId"
              ? <input style={inp} placeholder="user@domain.com" value={form[k]} onChange={e=>set(k,e.target.value)}/>
              : <textarea style={{...inp,minHeight:60,resize:"vertical"}} value={form[k]} onChange={e=>set(k,e.target.value)}/>}
          </div>
        ))}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={onClose} disabled={saving} style={{padding:"9px 18px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#717D7E"}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{padding:"9px 22px",borderRadius:6,
            border:"none",background:saving?"#aaa":"#1E8449",color:"#fff",
            cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
            {saving?"Saving...":"Save review"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report / Edit incident modal ──────────────────────────────────────────────

function IncidentFormModal({ existing, defaultCustomerId, defaultCustomerName, onClose, onSaved }) {
  const isEdit = !!existing;
  const now = new Date().toISOString().slice(0,16);
  const [form,setForm] = useState({
    type: existing?.type??"Security",
    severity: existing?.severity??"Medium",
    status: existing?.status??"New",
    title: existing?.title??"",
    description: existing?.description??"",
    impactDescription: existing?.impactDescription??"",
    occurredAt: existing?.occurredAt?toInputDate(existing.occurredAt):now.slice(0,10),
    detectedAt: existing?.detectedAt?toInputDate(existing.detectedAt):"",
    reportedByUserId: existing?.reportedByUserId??"",
    assignedToUserId: existing?.assignedToUserId??"",
    customerId: existing?.customerId??defaultCustomerId??"",
    customerName: existing?.customerName??defaultCustomerName??"",
    linkedControlId: existing?.linkedControlId??"",
    affectedAssetIds: existing?.affectedAssetIds??"",
    contactEmail: existing?.contactEmail??"",
  });
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.title||!form.description||!form.occurredAt||(!isEdit&&!form.reportedByUserId)) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        customerId: form.customerId||null,
        customerName: form.customerName||null,
        contactEmail: form.contactEmail||null,
        occurredAt: new Date(form.occurredAt).toISOString(),
        detectedAt: form.detectedAt?new Date(form.detectedAt).toISOString():null,
        impactDescription: form.impactDescription||null,
        linkedControlId: form.linkedControlId||null,
        affectedAssetIds: form.affectedAssetIds||null,
      };
      const result = isEdit
        ? await incidentApi.update(existing.id, payload)
        : await incidentApi.report(payload);
      onSaved(result); onClose();
    } catch { setError("Failed to save incident."); setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,30,30,0.55)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D5D8DC",
        width:680,maxHeight:"92vh",overflow:"auto",padding:"28px 32px",
        boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
        <div style={{fontWeight:700,fontSize:17,marginBottom:20,color:"#1a1a1a"}}>
          {isEdit?`Edit — ${existing.referenceNumber}`:"Report incident"}
        </div>
        {error&&<div style={{marginBottom:14,padding:"10px 14px",borderRadius:6,
          background:"#FDEDEC",color:"#C0392B",fontSize:13}}>{error}</div>}

        {/* Customer */}
        <div style={{marginBottom:14,padding:"12px 14px",background:"#F8F9FA",
          borderRadius:8,border:"1px solid #EAECEE"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#717D7E",marginBottom:10,
            textTransform:"uppercase",letterSpacing:"0.05em"}}>Customer (leave blank for Exelcom internal)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={lbl}>Customer name</label>
              <input style={inp} placeholder="e.g. Acme Corp" value={form.customerName}
                onChange={e=>{set("customerName",e.target.value);if(!form.customerId)set("customerId",e.target.value);}}/></div>
            <div><label style={lbl}>Customer ID</label>
              <input style={inp} placeholder="e.g. ACME-001" value={form.customerId}
                onChange={e=>set("customerId",e.target.value)}/></div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><label style={lbl}>Type *</label>
            <select style={inp} value={form.type} onChange={e=>set("type",e.target.value)}>
              {INCIDENT_TYPES.map(t=><option key={t} value={t}>{TYPE_META[t]?.icon} {TYPE_META[t]?.label??t}</option>)}
            </select></div>
          <div><label style={lbl}>Severity *</label>
            <select style={inp} value={form.severity} onChange={e=>set("severity",e.target.value)}>
              {["Low","Medium","High","Critical"].map(s=><option key={s}>{s}</option>)}
            </select></div>
        </div>

        <div style={{marginBottom:14}}><label style={lbl}>Title *</label>
          <input style={inp} placeholder="Brief description of the incident" value={form.title}
            onChange={e=>set("title",e.target.value)}/></div>

        <div style={{marginBottom:14}}><label style={lbl}>Description *</label>
          <textarea style={{...inp,minHeight:70,resize:"vertical"}} value={form.description}
            onChange={e=>set("description",e.target.value)}/></div>

        <div style={{marginBottom:14}}><label style={lbl}>Impact description</label>
          <textarea style={{...inp,minHeight:50,resize:"vertical"}} value={form.impactDescription}
            onChange={e=>set("impactDescription",e.target.value)}/></div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><label style={lbl}>Occurred at *</label>
            <input type="date" style={inp} value={form.occurredAt} onChange={e=>set("occurredAt",e.target.value)}/></div>
          <div><label style={lbl}>Detected at</label>
            <input type="date" style={inp} value={form.detectedAt} onChange={e=>set("detectedAt",e.target.value)}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {!isEdit&&<div><label style={lbl}>Reported by (user ID) *</label>
            <input style={inp} placeholder="user@domain.com" value={form.reportedByUserId}
              onChange={e=>set("reportedByUserId",e.target.value)}/></div>}
          <div><label style={lbl}>Assigned to (user ID)</label>
            <input style={inp} placeholder="user@domain.com" value={form.assignedToUserId}
              onChange={e=>set("assignedToUserId",e.target.value)}/></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <div><label style={lbl}>Linked SoA control</label>
            <input style={inp} placeholder="e.g. A.16.1" value={form.linkedControlId}
              onChange={e=>set("linkedControlId",e.target.value)}/></div>
          <div><label style={lbl}>Contact email (for notifications)</label>
            <input style={inp} placeholder="customer@example.com" value={form.contactEmail}
              onChange={e=>set("contactEmail",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <div><label style={lbl}>Affected asset IDs</label>
            <input style={inp} placeholder="asset-id-1, asset-id-2" value={form.affectedAssetIds}
              onChange={e=>set("affectedAssetIds",e.target.value)}/></div>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={saving} style={{padding:"9px 18px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#717D7E"}}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{padding:"9px 22px",borderRadius:6,
            border:"none",background:saving?"#aaa":"#2E86C1",color:"#fff",
            cursor:saving?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
            {saving?"Saving...":isEdit?"Save changes":"Report incident"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ incident, onClose, onDeleted }) {
  const [deleting,setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try { await incidentApi.delete(incident.id); onDeleted(incident.id); onClose(); }
    catch { setDeleting(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,30,30,0.55)",zIndex:100,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #D5D8DC",
        width:420,padding:"28px 32px",boxShadow:"0 12px 40px rgba(0,0,0,0.18)"}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:10,color:"#C0392B"}}>Delete incident</div>
        <div style={{fontSize:13,color:"#1a1a1a",marginBottom:20,lineHeight:1.6}}>
          Are you sure you want to delete <strong>{incident.referenceNumber} — {incident.title}</strong>? This cannot be undone.
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} disabled={deleting} style={{padding:"9px 18px",borderRadius:6,
            border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#717D7E"}}>Cancel</button>
          <button onClick={confirm} disabled={deleting} style={{padding:"9px 22px",borderRadius:6,
            border:"none",background:deleting?"#aaa":"#C0392B",color:"#fff",
            cursor:deleting?"not-allowed":"pointer",fontSize:13,fontWeight:700}}>
            {deleting?"Deleting...":"Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function IncidentManagementModule() {
  const [incidents,setIncidents] = useState([]);
  const [stats,setStats] = useState(null);
  const [customers,setCustomers] = useState([]);
  const [selectedCustomer,setSelectedCustomer] = useState(null);
  const [selected,setSelected] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);
  const [filterStatus,setFilterStatus] = useState("All");
  const [filterSev,setFilterSev] = useState("All");
  const [filterType,setFilterType] = useState("All");
  const [search,setSearch] = useState("");
  const [modal,setModal] = useState(null);
  const [contextMenu,setContextMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [data,s,c] = await Promise.all([
        incidentApi.getAll(selectedCustomer?{customerId:selectedCustomer}:undefined),
        incidentApi.getStats(selectedCustomer??undefined),
        incidentApi.getCustomers(),
      ]);
      setIncidents(data);
      setStats(s);
      setCustomers(c);
      if (data.length>0) setSelected(prev=>prev??data[0]);
      else setSelected(null);
    } catch { setError("Failed to load incidents."); }
    finally { setLoading(false); }
  },[selectedCustomer]);

  useEffect(()=>{load();},[load]);

  const refreshSelected = useCallback(async () => {
    if (!selected) return;
    try {
      const updated = await incidentApi.getById(selected.id);
      setIncidents(prev=>prev.map(i=>i.id===updated.id?updated:i));
      setSelected(updated);
      const [s,c] = await Promise.all([
        incidentApi.getStats(selectedCustomer??undefined),
        incidentApi.getCustomers(),
      ]);
      setStats(s); setCustomers(c);
    } catch {}
  },[selected,selectedCustomer]);

  const handleTransition = async (id, status) => {
    const map = {New:"investigate",Investigating:"contain",Contained:"resolve",Resolved:"close"};
    const endpoint = map[status];
    if (!endpoint) throw new Error("No transition available");
    await incidentApi[endpoint](id,{});
  };

  const filtered = incidents.filter(i=>{
    if (filterStatus!=="All"&&i.status!==filterStatus) return false;
    if (filterSev!=="All"&&i.severity!==filterSev) return false;
    if (filterType!=="All"&&i.type!==filterType) return false;
    if (search&&!i.title.toLowerCase().includes(search.toLowerCase())&&
        !i.referenceNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSaved = (incident) => {
    setIncidents(prev=>{
      const idx=prev.findIndex(i=>i.id===incident.id);
      if (idx>=0){const n=[...prev];n[idx]=incident;return n;}
      return [incident,...prev];
    });
    setSelected(incident);
    Promise.all([
      incidentApi.getStats(selectedCustomer??undefined),
      incidentApi.getCustomers(),
    ]).then(([s,c])=>{setStats(s);setCustomers(c);}).catch(()=>{});
  };

  const handleDeleted = (id) => {
    setIncidents(prev=>prev.filter(i=>i.id!==id));
    setSelected(prev=>prev?.id===id?null:prev);
    Promise.all([
      incidentApi.getStats(selectedCustomer??undefined),
      incidentApi.getCustomers(),
    ]).then(([s,c])=>{setStats(s);setCustomers(c);}).catch(()=>{});
  };

  const selInFiltered = selected&&filtered.find(i=>i.id===selected.id);
  const selectedCustomerInfo = customers.find(c=>c.customerId===selectedCustomer);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      height:300,color:"#717D7E",fontSize:13}}>Loading incidents...</div>
  );
  if (error) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",
      height:300,flexDirection:"column",gap:12}}>
      <div style={{color:"#C0392B",fontSize:13}}>{error}</div>
      <button onClick={load} style={{padding:"8px 16px",borderRadius:6,
        border:"1px solid #D5D8DC",background:"#fff",cursor:"pointer",fontSize:13}}>Retry</button>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,color:"#1a1a1a"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,margin:0,marginBottom:2,color:"#1a1a1a"}}>Incident Management</h1>
          <div style={{fontSize:12,color:"#717D7E"}}>ISO/IEC 27001:2022 · Annex A.16 — Information security incident management</div>
        </div>
        <button onClick={()=>setModal({type:"report",
          customerId:selectedCustomer&&selectedCustomer!=="__exelcom__"?selectedCustomer:"",
          customerName:selectedCustomerInfo?.customerName&&selectedCustomerInfo.customerId!=="__exelcom__"?selectedCustomerInfo.customerName:"",
        })} style={{padding:"9px 18px",borderRadius:7,border:"none",background:"#C0392B",
          color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,
          boxShadow:"0 2px 8px rgba(192,57,43,0.3)"}}>+ Report incident</button>
      </div>

      <Dashboard stats={stats}/>

      <div style={{display:"flex",border:"1px solid #EAECEE",borderRadius:10,
        overflow:"hidden",minHeight:560,background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>

        <CustomerSidebar customers={customers} selected={selectedCustomer}
          onSelect={id=>{setSelectedCustomer(id);setSelected(null);}}/>

        {/* List */}
        <div style={{width:310,flexShrink:0,borderRight:"1px solid #EAECEE",
          display:"flex",flexDirection:"column",background:"#FDFEFE"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid #EAECEE",display:"flex",flexDirection:"column",gap:6}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search incidents…"
              style={{padding:"6px 10px",borderRadius:6,border:"1px solid #D5D8DC",
                background:"#fff",color:"#1a1a1a",fontSize:12,outline:"none"}}/>
            <div style={{display:"flex",gap:6}}>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                style={{flex:1,padding:"5px 6px",borderRadius:6,border:"1px solid #D5D8DC",
                  background:"#fff",color:"#1a1a1a",fontSize:11,outline:"none"}}>
                <option value="All">All statuses</option>
                {Object.keys(STATUS_META).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSev} onChange={e=>setFilterSev(e.target.value)}
                style={{flex:1,padding:"5px 6px",borderRadius:6,border:"1px solid #D5D8DC",
                  background:"#fff",color:"#1a1a1a",fontSize:11,outline:"none"}}>
                <option value="All">All severities</option>
                {["Critical","High","Medium","Low"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{fontSize:11,color:"#717D7E"}}>
              {filtered.length} incident{filtered.length!==1?"s":""} · right-click for actions
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {filtered.length===0&&(
              <div style={{padding:24,fontSize:13,color:"#717D7E",textAlign:"center"}}>No incidents match your filters.</div>
            )}
            {filtered.map(i=>(
              <IncidentRow key={i.id} incident={i} selected={selected?.id===i.id}
                onClick={()=>setSelected(i)}
                onContextMenu={(e,inc)=>setContextMenu({x:e.clientX,y:e.clientY,incident:inc})}/>
            ))}
          </div>
        </div>

        {/* Detail */}
        {selInFiltered
          ? <IncidentDetail incident={selInFiltered}
              onEdit={i=>setModal({type:"edit",incident:i})}
              onDelete={i=>setModal({type:"delete",incident:i})}
              onTransition={handleTransition}
              onRefresh={refreshSelected}/>
          : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
              color:"#717D7E",fontSize:13,background:"#FDFEFE",flexDirection:"column",gap:8}}>
              <span style={{fontSize:32}}>🚨</span>
              <span>Select an incident to view details</span>
            </div>
        }
      </div>

      {contextMenu&&(
        <ContextMenu x={contextMenu.x} y={contextMenu.y} incident={contextMenu.incident}
          onEdit={i=>setModal({type:"edit",incident:i})}
          onDelete={i=>setModal({type:"delete",incident:i})}
          onClose={()=>setContextMenu(null)}/>
      )}

      {modal?.type==="report"&&(
        <IncidentFormModal defaultCustomerId={modal.customerId} defaultCustomerName={modal.customerName}
          onClose={()=>setModal(null)} onSaved={handleSaved}/>
      )}
      {modal?.type==="edit"&&(
        <IncidentFormModal existing={modal.incident} onClose={()=>setModal(null)} onSaved={handleSaved}/>
      )}
      {modal?.type==="delete"&&(
        <DeleteConfirm incident={modal.incident} onClose={()=>setModal(null)} onDeleted={handleDeleted}/>
      )}
    </div>
  );
}
