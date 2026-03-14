import { useState, useMemo, useRef, useEffect } from "react";

const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];
const GRAD_COLS   = ["#f97316","#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4"];

const VCATS = [
  { id:"car",   label:"ΙΧ",       icons:["🚗","🚙"] },
  { id:"moto",  label:"Μηχανή",   icons:["🏍️"] },
  { id:"van",   label:"Βαν/Βαρύ", icons:["🚐","🚚"] },
  { id:"truck", label:"Φορτηγό",  icons:["🚛"] },
  { id:"bus",   label:"Λεωφ.",    icons:["🚌"] },
];

const FTYPES = [
  { id:"unleaded95",  label:"Αμόλυβδη 95",   icon:"🟢" },
  { id:"unleaded98",  label:"Αμόλυβδη 98",   icon:"🔵" },
  { id:"unleaded100", label:"Αμόλυβδη 100",  icon:"🔷" },
  { id:"diesel",      label:"Diesel",         icon:"🟡" },
  { id:"diesel_plus", label:"Diesel Plus",    icon:"🟠" },
  { id:"lpg",         label:"Υγραέριο (LPG)", icon:"🟣" },
  { id:"cng",         label:"Φυσικό Αέριο",   icon:"⚪" },
];

const FT_COLORS = {
  unleaded95:  { bg:"#10b98122", color:"#10b981" },
  unleaded98:  { bg:"#3b82f622", color:"#3b82f6" },
  unleaded100: { bg:"#8b5cf622", color:"#8b5cf6" },
  diesel:      { bg:"#eab30822", color:"#eab308" },
  diesel_plus: { bg:"#f9731622", color:"#f97316" },
  lpg:         { bg:"#a78bfa22", color:"#a78bfa" },
  cng:         { bg:"#71717a22", color:"#a1a1aa" },
};

const STATIONS = [
  { id:"aegean", label:"Aegean", bg:"#0057a8", fg:"#fff" },
  { id:"avin",   label:"Avin",   bg:"#ff6600", fg:"#fff" },
  { id:"bp",     label:"BP",     bg:"#00a650", fg:"#fff" },
  { id:"eko",    label:"ΕΚΟ",    bg:"#e30613", fg:"#fff" },
  { id:"eteka",  label:"ΕΤΕΚΑ",  bg:"#1a5fa8", fg:"#fff" },
  { id:"revoil", label:"Revoil", bg:"#0055a5", fg:"#fff" },
  { id:"shell",  label:"Shell",  bg:"#f5d000", fg:"#000" },
  { id:"other",  label:"Άλλο",   bg:"#555",    fg:"#fff" },
];

const RTYPES = [
  { id:"service",   label:"Service",          icon:"🔧", hasDate:true,  hasKm:true  },
  { id:"kteo",      label:"ΚΤΕΟ",             icon:"📋", hasDate:true,  hasKm:false },
  { id:"emissions", label:"Κάρτα Καυσαερίων", icon:"💨", hasDate:true,  hasKm:false },
  { id:"tyres",     label:"Αλλ. Ελαστικών",   icon:"🔄", hasDate:false, hasKm:true  },
  { id:"insurance", label:"Ασφάλεια",         icon:"🛡️", hasDate:true,  hasKm:false },
  { id:"custom",    label:"Άλλο",             icon:"📌", hasDate:true,  hasKm:true  },
];

const EXPENSE_CATS = [
  { id:"oil",      label:"Λάδια / Φίλτρα", icon:"🛢️" },
  { id:"adblue",   label:"AdBlue",          icon:"💧" },
  { id:"tyres",    label:"Ελαστικά",        icon:"⚫" },
  { id:"chains",   label:"Αλυσίδες",        icon:"🔗" },
  { id:"cleaning", label:"Καθαριστικά",     icon:"🧴" },
  { id:"parts",    label:"Ανταλλακτικά",    icon:"🔩" },
  { id:"parking",  label:"Parking",         icon:"🅿️" },
  { id:"tolls",    label:"Διόδια",          icon:"🛣️" },
  { id:"service",  label:"Service",         icon:"🔧" },
  { id:"custom",   label:"Άλλο",            icon:"💸" },
];

const MONTHS = ["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];
const KM2MI = 0.621371;
const uid   = () => Math.random().toString(36).substr(2, 9);
const fmt   = (n, d=2) => n != null ? (+n).toFixed(d) : "—";
const today = () => new Date().toISOString().split("T")[0];
const ddiff = ds => Math.round((new Date(ds) - new Date()) / 86400000);

const DK = { bg:"#0a0a0f", sf:"#13131e", br:"#252535", tx:"#f0f0ff", mt:"#8888aa", ft:"#3a3a55", inp:"#0a0a0f", ib:"#252535" };
const LT = { bg:"#f0f2ff", sf:"#ffffff",  br:"#dde0f0", tx:"#0f0f1a", mt:"#555577", ft:"#9090aa", inp:"#ffffff", ib:"#c8cce0" };

const defV = () => ({
  id:"v1", name:"Αυτοκίνητο 1", icon:"🚗", color:"#f97316", category:"car",
  info:{ plate:"", chassis:"", brand:"", model:"", year:"", fuelType:"unleaded95", insurance:"", insuranceNo:"", notes:"" },
  reminders:[], unitMiles:false,
});

const emptyFuel = (ft="unleaded95", stId="", stLabel="") => ({
  date:today(), fuelType:ft, liters:"", ppl:"", total:"",
  km:"", odo:"", notes:"", stId, stLabel,
  dual:false, lpgL:"", lpgP:"", lpgT:"",
});

const emptyExpense = () => ({ date:today(), catId:"oil", customCat:"", amount:"", notes:"" });

// SVG Sparkline
// Gauge / Speedometer chart
function Gauge({ value, min, max, color, label, unit, T }) {
  if (value == null) return null;
  const pct    = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R      = 70, cx = 100, cy = 90;
  const startA = Math.PI * 0.85;
  const endA   = Math.PI * 2.15;
  const totalA = endA - startA;
  const valA   = startA + totalA * pct;
  const arcPath = (r, a1, a2) => {
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const lg = (a2 - a1) > Math.PI ? 1 : 0;
    return "M " + x1 + " " + y1 + " A " + r + " " + r + " 0 " + lg + " 1 " + x2 + " " + y2;
  };
  const needleX = cx + (R - 10) * Math.cos(valA);
  const needleY = cy + (R - 10) * Math.sin(valA);
  // tick marks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const a = startA + totalA * t;
    const x1t = cx + (R + 4) * Math.cos(a), y1t = cy + (R + 4) * Math.sin(a);
    const x2t = cx + (R + 10) * Math.cos(a), y2t = cy + (R + 10) * Math.sin(a);
    const tv  = min + (max - min) * t;
    const lx  = cx + (R + 18) * Math.cos(a), ly = cy + (R + 18) * Math.sin(a);
    return { x1t, y1t, x2t, y2t, lx, ly, tv };
  });
  const gid = "gauge_" + color.replace("#","");
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 200 110" style={{width:"100%",maxWidth:200,height:"auto",display:"block",margin:"0 auto"}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="50%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#ef4444"/>
          </linearGradient>
        </defs>
        {/* Track */}
        <path d={arcPath(R, startA, endA)} fill="none" stroke={T.br} strokeWidth={10} strokeLinecap="round"/>
        {/* Value arc */}
        <path d={arcPath(R, startA, valA)} fill="none" stroke={"url(#" + gid + ")"} strokeWidth={10} strokeLinecap="round"/>
        {/* Ticks */}
        {ticks.map((tk, i) => (
          <g key={i}>
            <line x1={tk.x1t} y1={tk.y1t} x2={tk.x2t} y2={tk.y2t} stroke={T.ft} strokeWidth={1.5}/>
          </g>
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        {/* Value text */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill={color} fontSize={16} fontWeight="700">{(+value).toFixed(value > 10 ? 1 : 3)}</text>
        <text x={cx} y={cy - 2} textAnchor="middle" fill={T.mt} fontSize={9}>{unit}</text>
      </svg>
      <div style={{fontSize:10,color:T.mt,letterSpacing:1,marginTop:-4}}>{label}</div>
    </div>
  );
}

// Mini sparkline (kept for bar/trend charts)
function SVGChart({ points, color, type }) {
  if (!points || points.length < 2) return null;
  const W=400, H=70, P=6;
  const vals = points.map(p => p.y);
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1;
  const sx = i => P + (i / (points.length - 1)) * (W - P * 2);
  const sy = v => H - P - ((v - minV) / range) * (H - P * 2);
  if (type === "bar") {
    const bw = Math.max(3, (W - P * 2) / points.length - 4);
    return (
      <svg viewBox={"0 0 " + W + " " + H} style={{width:"100%",height:70,display:"block"}}>
        {points.map((p, i) => (
          <rect key={i} x={sx(i)-bw/2} y={sy(p.y)} width={bw} height={H-P-sy(p.y)} fill={color} opacity={0.9} rx={3}/>
        ))}
      </svg>
    );
  }
  const d    = points.map((p, i) => (i===0?"M":"L") + sx(i) + "," + sy(p.y)).join(" ");
  const area = d + " L" + sx(points.length-1) + "," + (H-P) + " L" + P + "," + (H-P) + " Z";
  const gid  = "sp" + color.replace("#","");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{width:"100%",height:70,display:"block"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#" + gid + ")"}/>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p, i) => <circle key={i} cx={sx(i)} cy={sy(p.y)} r={3.5} fill={color}/>)}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, type, T }) {
  const pts = data.filter(d => d[dk] != null).map(d => ({ x:d.date, y:d[dk] }));
  if (pts.length < 2) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:6}}>{title}</div>
      <div style={{background:T.bg,borderRadius:12,padding:"10px 8px 4px",border:"1px solid " + T.br}}>
        <SVGChart points={pts} color={color} type={type || "line"}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"2px 4px 2px"}}>
          <span style={{fontSize:10,color:T.ft}}>{pts[0].x}</span>
          <span style={{fontSize:10,color:T.ft}}>{pts[pts.length-1].x}</span>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, T, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e => e.stopPropagation()} style={{background:T.sf,borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",border:"1px solid " + T.br}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontWeight:700,fontSize:16,color:T.tx}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mt,fontSize:24,lineHeight:1,cursor:"pointer"}}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StationModal({ current, onSelect, onClose, T }) {
  const [custom, setCustom] = useState(current.stId === "other" ? current.stLabel : "");
  return (
    <Modal title="Επιλογή Πρατηρίου" onClose={onClose} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {STATIONS.map(s => (
          <button key={s.id}
            onClick={() => { if (s.id !== "other") onSelect(s.id, s.label); else onSelect("other", custom || "Άλλο"); }}
            style={{padding:"10px 8px",border:"2px solid " + (current.stId === s.id ? s.bg : T.br),borderRadius:10,
              background:current.stId === s.id ? s.bg : "transparent",
              color:current.stId === s.id ? s.fg : T.tx,
              fontSize:13,fontWeight:current.stId === s.id ? 700 : 400,cursor:"pointer"}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4}}>Ή γράψε το όνομα</label>
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="π.χ. Μαμούθ Βενζινάδικο..."
          style={{width:"100%",padding:"10px 12px",background:T.inp,border:"1px solid " + T.ib,borderRadius:10,color:T.tx,fontSize:14,boxSizing:"border-box"}}/>
      </div>
      {custom.trim() && (
        <button onClick={() => onSelect("other", custom.trim())}
          style={{width:"100%",padding:11,background:T.bg,border:"1px solid " + T.br,borderRadius:10,color:T.tx,fontSize:14,cursor:"pointer",marginBottom:8}}>
          Χρήση: {custom.trim()}
        </button>
      )}
    </Modal>
  );
}

function FtBadge({ ftId, size }) {
  const ft = FTYPES.find(f => f.id === ftId);
  const fc = FT_COLORS[ftId] || {};
  if (!ft) return null;
  return (
    <span style={{fontSize:size||11,background:fc.bg,color:fc.color,padding:"2px 8px",borderRadius:6,fontWeight:700,whiteSpace:"nowrap"}}>
      {ft.icon} {ft.label}
    </span>
  );
}

// Vehicle Info Modal
function VehicleInfoModal({ av, onClose, onUpdate, onDelete, onAddReminder, onUpdateReminder, onDelReminder, T, dl }) {
  const upI = (f, v) => onUpdate({ info:{ ...av.info, [f]:v } });
  const upV = (f, v) => onUpdate({ [f]:v });
  const lS  = { display:"block", fontSize:11, color:T.mt, letterSpacing:1, marginBottom:4 };
  const iS  = { width:"100%", padding:"9px 11px", background:T.inp, border:"1px solid " + T.ib, borderRadius:9, color:T.tx, fontSize:13, boxSizing:"border-box" };

  const rst = r => {
    if (!r.dueDate) return null;
    const d = ddiff(r.dueDate);
    if (d < 0)   return { c:"#ef4444", l:"Εκπρόθεσμο " + Math.abs(d) + " μ." };
    if (d <= 30) return { c:"#f97316", l:"Σε " + d + " μέρες" };
    return { c:"#10b981", l:"Σε " + d + " μέρες" };
  };

  return (
    <Modal title={av.icon + " " + av.name} onClose={onClose} T={T}>
      {/* Category */}
      <div style={{marginBottom:14}}>
        <label style={lS}>ΤΥΠΟΣ ΟΧΗΜΑΤΟΣ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {VCATS.map(c => (
            <button key={c.id} onClick={() => { upV("category", c.id); upV("icon", c.icons[0]); }}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid " + (av.category===c.id?T.tx:T.br),
                background:av.category===c.id?T.tx+"22":"transparent",color:av.category===c.id?T.tx:T.mt,fontSize:12,cursor:"pointer"}}>
              {c.icons[0]} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div style={{marginBottom:14}}>
        <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(VCATS.find(c=>c.id===av.category)?.icons||["🚗"]).map(ic => (
            <button key={ic} onClick={() => upV("icon", ic)}
              style={{fontSize:22,padding:"6px 10px",border:"2px solid " + (av.icon===ic?T.tx:T.br),borderRadius:9,background:"transparent",cursor:"pointer"}}>{ic}</button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{marginBottom:12}}>
        <label style={lS}>ΟΝΟΜΑ</label>
        <input value={av.name} onChange={e => upV("name", e.target.value)} style={iS}/>
      </div>

      {/* Info grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[["ΜΑΡΚΑ","brand","π.χ. Toyota"],["ΜΟΝΤΕΛΟ","model","π.χ. Corolla"],
          ["ΕΤΟΣ","year","π.χ. 2020"],["ΠΙΝΑΚΙΔΑ","plate","π.χ. ΑΒΓ-1234"]].map(([lb,f,ph]) => (
          <div key={f}>
            <label style={lS}>{lb}</label>
            <input value={av.info?.[f]||""} onChange={e => upI(f, e.target.value)} placeholder={ph} style={iS}/>
          </div>
        ))}
      </div>

      <div style={{marginBottom:12}}>
        <label style={lS}>ΑΡ. ΠΛΑΙΣΙΟΥ / VIN</label>
        <input value={av.info?.chassis||""} onChange={e => upI("chassis", e.target.value)} placeholder="π.χ. WBA3A5C51DF..." style={iS}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={lS}>ΑΣΦΑΛΙΣΤΙΚΗ</label>
          <input value={av.info?.insurance||""} onChange={e => upI("insurance", e.target.value)} placeholder="π.χ. Interamerican" style={iS}/>
        </div>
        <div>
          <label style={lS}>ΑΡ. ΑΣΦΑΛΙΣΤΗΡΙΟΥ</label>
          <input value={av.info?.insuranceNo||""} onChange={e => upI("insuranceNo", e.target.value)} placeholder="π.χ. 12345678" style={iS}/>
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <label style={lS}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</label>
        <select value={av.info?.fuelType||"unleaded95"} onChange={e => upI("fuelType", e.target.value)}
          style={{...iS, appearance:"none"}}>
          {FTYPES.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
        </select>
      </div>

      <div style={{marginBottom:20}}>
        <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
        <input value={av.info?.notes||""} onChange={e => upI("notes", e.target.value)} placeholder="π.χ. Χειμερινά λάδια..." style={iS}/>
      </div>

      {/* Reminders */}
      <div style={{borderTop:"1px solid " + T.br,paddingTop:16}}>
        <div style={{fontSize:12,color:T.mt,letterSpacing:1,marginBottom:10}}>ΥΠΕΝΘΥΜΙΣΕΙΣ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
          {RTYPES.map(rt => (
            <button key={rt.id} onClick={() => onAddReminder(rt.id)}
              style={{padding:"8px 10px",border:"1px solid " + T.br,borderRadius:9,background:T.bg,color:T.tx,fontSize:11,textAlign:"left",cursor:"pointer"}}>
              {rt.icon} {rt.label}
            </button>
          ))}
        </div>
        {(av.reminders||[]).length === 0 && <div style={{fontSize:12,color:T.ft,textAlign:"center",padding:10}}>Δεν υπάρχουν υπενθυμίσεις.</div>}
        {(av.reminders||[]).map(r => {
          const rs  = rst(r);
          const rt  = RTYPES.find(x => x.id===r.type);
          return (
            <div key={r.id} style={{background:T.bg,borderRadius:11,padding:11,marginBottom:9,border:"1px solid " + (rs?rs.c+"44":T.br)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{r.icon} {r.label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {rs && <span style={{fontSize:11,color:rs.c,fontWeight:700}}>{rs.l}</span>}
                  <button onClick={() => onDelReminder(r.id)} style={{background:"none",border:"none",color:T.ft,fontSize:16,cursor:"pointer"}}>x</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:rt?.hasDate&&rt?.hasKm?"1fr 1fr":"1fr",gap:8,marginBottom:6}}>
                {rt?.hasDate && (
                  <div>
                    <label style={{...lS,marginBottom:2}}>Ημ/νία λήξης</label>
                    <input type="date" value={r.dueDate||""} onChange={e => onUpdateReminder(r.id,"dueDate",e.target.value)}
                      style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid " + T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                  </div>
                )}
                {rt?.hasKm && (
                  <div>
                    <label style={{...lS,marginBottom:2}}>Σε {dl}</label>
                    <input type="number" placeholder="π.χ. 40000" value={r.dueKm||""} onChange={e => onUpdateReminder(r.id,"dueKm",e.target.value)}
                      style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid " + T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                  </div>
                )}
              </div>
              <input placeholder="Σημειώσεις..." value={r.notes||""} onChange={e => onUpdateReminder(r.id,"notes",e.target.value)}
                style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid " + T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
            </div>
          );
        })}
      </div>
      {/* Delete vehicle */}
      <div style={{borderTop:"1px solid " + T.br,paddingTop:14,marginTop:6}}>
        <button onClick={() => { if (window.confirm("Διαγραφή οχήματος και όλων των δεδομένων του;")) onDelete(); }}
          style={{width:"100%",padding:11,background:"#ef444412",border:"1px solid #ef444444",borderRadius:10,color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          🗑️ Διαγραφή Οχήματος
        </button>
      </div>
    </Modal>
  );
}

export default function FuelLog() {
  const [dark, setDark]   = useState(true);
  const T = dark ? DK : LT;

  const [vehicles, setVehicles]   = useState([defV()]);
  const [vid, setVid]             = useState("v1");
  const [entries, setEntries]     = useState({});
  const [expenses, setExpenses]   = useState({});
  const [tab, setTab]             = useState("add");
  const [modal, setModal]         = useState(null);
  const [newV, setNewV]           = useState({ name:"", icon:"🚗", category:"car" });
  const [fY, setFY]               = useState("all");
  const [fM, setFM]               = useState("all");
  const [lastFuel, setLastFuel]   = useState({});
  const [showStPicker, setShowStPicker] = useState(false);
  const [showFtPicker, setShowFtPicker] = useState(false);
  const fref = useRef();

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fuellog_data");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.vehicles) setVehicles(d.vehicles);
        if (d.entries)  setEntries(d.entries);
        if (d.expenses) setExpenses(d.expenses);
        if (d.lastFuel) setLastFuel(d.lastFuel);
        if (d.vid)      setVid(d.vid);
      }
    } catch(e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fuellog_data", JSON.stringify({ vehicles, entries, expenses, lastFuel, vid }));
    } catch(e) {}
  }, [vehicles, entries, expenses, lastFuel, vid]);

  const av  = vehicles.find(v => v.id === vid) || vehicles[0];
  const col = av?.color || "#f97316";
  const mi  = av?.unitMiles || false;
  const dl  = mi ? "μίλια" : "km";
  const lf  = lastFuel[vid] || { fuelType:"unleaded95", stId:"", stLabel:"" };

  const [fuelForm,    setFuelForm]    = useState(() => emptyFuel(lf.fuelType, lf.stId, lf.stLabel));
  const [expenseForm, setExpenseForm] = useState(emptyExpense);

  const switchVehicle = id => {
    setVid(id);
    const lf2 = lastFuel[id] || { fuelType:"unleaded95", stId:"", stLabel:"" };
    setFuelForm(emptyFuel(lf2.fuelType, lf2.stId, lf2.stLabel));
  };

  const allFuel    = useMemo(() => (entries[vid]  || []).slice().sort((a,b) => new Date(a.date) - new Date(b.date)), [entries,  vid]);
  const allExpense = useMemo(() => (expenses[vid] || []).slice().sort((a,b) => new Date(a.date) - new Date(b.date)), [expenses, vid]);
  const years      = useMemo(() => [...new Set(allFuel.map(e => e.date.slice(0,4)))].sort().reverse(), [allFuel]);

  const filtFuel = useMemo(() => {
    let f = allFuel;
    if (fY !== "all") f = f.filter(e => e.date.startsWith(fY));
    if (fM !== "all") f = f.filter(e => e.date.slice(5,7) === fM);
    return f;
  }, [allFuel, fY, fM]);

  const filtExp = useMemo(() => {
    let f = allExpense;
    if (fY !== "all") f = f.filter(e => e.date.startsWith(fY));
    if (fM !== "all") f = f.filter(e => e.date.slice(5,7) === fM);
    return f;
  }, [allExpense, fY, fM]);

  const dueR = useMemo(() => (av?.reminders || []).filter(r => r.dueDate && ddiff(r.dueDate) <= 30), [av]);

  const hff = (field, val) => {
    const u = { ...fuelForm, [field]:val };
    if (field==="liters" && u.ppl)                 u.total = (parseFloat(val||0)*parseFloat(u.ppl)).toFixed(2);
    if (field==="ppl"    && u.liters)              u.total = (parseFloat(u.liters)*parseFloat(val||0)).toFixed(2);
    if (field==="total"  && u.liters && +u.liters) u.ppl   = (parseFloat(val||0)/parseFloat(u.liters)).toFixed(3);
    if (field==="lpgL"   && u.lpgP)               u.lpgT  = (parseFloat(val||0)*parseFloat(u.lpgP)).toFixed(2);
    if (field==="lpgP"   && u.lpgL)               u.lpgT  = (parseFloat(u.lpgL)*parseFloat(val||0)).toFixed(2);
    if (field==="lpgT"   && u.lpgL && +u.lpgL)    u.lpgP  = (parseFloat(val||0)/parseFloat(u.lpgL)).toFixed(3);
    setFuelForm(u);
  };

  const submitFuel = () => {
    if (!fuelForm.date || (!fuelForm.liters && !fuelForm.total)) return;
    const liters = parseFloat(fuelForm.liters) || null;
    const total  = parseFloat(fuelForm.total)  || null;
    const ppl    = parseFloat(fuelForm.ppl) || (liters && total ? total/liters : null);
    const kmS    = parseFloat(fuelForm.km) || null;
    setEntries(p => ({ ...p, [vid]:[...(p[vid]||[]), {
      id:uid(), date:fuelForm.date, fuelType:fuelForm.fuelType, liters, ppl, total,
      km:kmS, odo:parseFloat(fuelForm.odo)||null, notes:fuelForm.notes,
      stId:fuelForm.stId, station:fuelForm.stLabel, dual:fuelForm.dual,
      lpgL:parseFloat(fuelForm.lpgL)||null, lpgP:parseFloat(fuelForm.lpgP)||null, lpgT:parseFloat(fuelForm.lpgT)||null,
    }]}));
    setLastFuel(p => ({ ...p, [vid]:{ fuelType:fuelForm.fuelType, stId:fuelForm.stId, stLabel:fuelForm.stLabel } }));
    setFuelForm(emptyFuel(fuelForm.fuelType, fuelForm.stId, fuelForm.stLabel));
    setTab("history");
  };

  const submitExpense = () => {
    if (!expenseForm.date || !expenseForm.amount) return;
    const cat   = EXPENSE_CATS.find(c => c.id === expenseForm.catId);
    const label = expenseForm.catId==="custom" ? (expenseForm.customCat||"Άλλο") : cat?.label||"";
    setExpenses(p => ({ ...p, [vid]:[...(p[vid]||[]), {
      id:uid(), date:expenseForm.date, catId:expenseForm.catId, label,
      amount:parseFloat(expenseForm.amount)||0, notes:expenseForm.notes,
    }]}));
    setExpenseForm(emptyExpense());
  };

  const delFuel    = id => setEntries(p  => ({ ...p, [vid]:p[vid].filter(e => e.id !== id) }));
  const delExpense = id => setExpenses(p => ({ ...p, [vid]:p[vid].filter(e => e.id !== id) }));

  const addVeh = () => {
    if (!newV.name.trim()) return;
    const v = { id:uid(), name:newV.name.trim(), icon:newV.icon, color:FUEL_COLORS[vehicles.length%FUEL_COLORS.length],
      category:newV.category,
      info:{ plate:"", chassis:"", brand:"", model:"", year:"", fuelType:"unleaded95", insurance:"", insuranceNo:"", notes:"" },
      reminders:[], unitMiles:false };
    setVehicles(p => [...p, v]);
    switchVehicle(v.id);
    setNewV({ name:"", icon:"🚗", category:"car" });
    setModal(null);
  };

  const updateVehicle = (fields) => setVehicles(p => p.map(x => x.id===vid ? { ...x, ...fields } : x));
  const upV = (f, v) => setVehicles(p => p.map(x => x.id===vid ? { ...x, [f]:v } : x));

  const deleteVehicle = () => {
    const remaining = vehicles.filter(v => v.id !== vid);
    if (remaining.length === 0) return;
    setVehicles(remaining);
    setEntries(p  => Object.fromEntries(Object.entries(p).filter(([k]) => k !== vid)));
    setExpenses(p => Object.fromEntries(Object.entries(p).filter(([k]) => k !== vid)));
    switchVehicle(remaining[0].id);
    setModal(null);
  };

  const addR = type => {
    const rt = RTYPES.find(r => r.id===type);
    setVehicles(p => p.map(v => v.id===vid ? { ...v, reminders:[...(v.reminders||[]),
      { id:uid(), type, label:rt.label, icon:rt.icon, dueDate:"", dueKm:"", notes:"" }] } : v));
  };
  const upR  = (rid, f, v) => setVehicles(p => p.map(x => x.id===vid ? { ...x, reminders:x.reminders.map(r => r.id===rid ? { ...r, [f]:v } : r) } : x));
  const delR = rid => setVehicles(p => p.map(x => x.id===vid ? { ...x, reminders:x.reminders.filter(r => r.id!==rid) } : x));

  const stats = useMemo(() => {
    if (!filtFuel.length && !filtExp.length) return null;
    const fuelSpent = filtFuel.reduce((s,x)=>s+(x.total||0),0) + filtFuel.reduce((s,x)=>s+(x.lpgT||0),0);
    const expSpent  = filtExp.reduce((s,x)=>s+x.amount,0);
    const tL  = filtFuel.reduce((s,x)=>s+(x.liters||0),0);
    const wK  = filtFuel.filter(x => x.km && x.liters);
    const wP  = filtFuel.filter(x => x.ppl);
    const aC  = wK.length ? wK.reduce((s,x)=>s+(x.liters/x.km*100),0)/wK.length : null;
    const aP  = wP.length ? wP.reduce((s,x)=>s+x.ppl,0)/wP.length : null;
    const pr  = wP.map(x=>x.ppl);
    const sc  = {};
    filtFuel.forEach(x => { if (x.station) sc[x.station]=(sc[x.station]||0)+1; });
    const tSt = Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const dE  = filtFuel.filter(x=>x.dual&&x.lpgL&&x.km);
    const aLC = dE.length ? dE.reduce((s,x)=>s+(x.lpgL/x.km*100),0)/dE.length : null;
    return { fuelSpent, expSpent, totalSpent:fuelSpent+expSpent, tL, aC, aP,
      minP:pr.length?Math.min(...pr):null, maxP:pr.length?Math.max(...pr):null, tSt, aLC };
  }, [filtFuel, filtExp]);

  const cd = useMemo(() => filtFuel.map(x => ({
    date:  x.date.slice(5),
    price: x.ppl   ? +(+x.ppl).toFixed(3)                      : null,
    cons:  x.km && x.liters ? +(x.liters/x.km*100).toFixed(1)  : null,
    cost:  x.total ? +(+x.total).toFixed(2)                     : null,
    lpgC:  x.dual && x.lpgL && x.km ? +(x.lpgL/x.km*100).toFixed(1) : null,
  })), [filtFuel]);

  const exJson = () => {
    const blob = new Blob([JSON.stringify({ vehicles, entries, expenses, exportedAt:new Date().toISOString() }, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="fuellog_backup_" + today() + ".json"; a.click();
  };
  const exCsv = () => {
    const rows = allFuel.map(x => [x.date, FTYPES.find(f=>f.id===x.fuelType)?.label||x.fuelType,
      x.liters||"", x.ppl?fmt(x.ppl,3):"", x.total?fmt(x.total):"",
      x.km?fmt(x.km,1):"", x.odo||"", x.km&&x.liters?fmt(x.liters/x.km*100,1):"",
      x.station||"", x.notes||""].map(v => '"' + v + '"').join(","));
    if (!rows.length) return;
    const blob = new Blob([["Ημ/νία,Καύσιμο,Λίτρα,Τιμή/L,Σύνολο,km,Odo,L/100,Πρατήριο,Σημ."].concat(rows).join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="fuellog_" + today() + ".csv"; a.click();
  };
  const imJson = ev => {
    const file = ev.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (d.vehicles && d.entries) { setVehicles(d.vehicles); setEntries(d.entries); setExpenses(d.expenses||{}); switchVehicle(d.vehicles[0]?.id); alert("Εισαγωγή OK"); }
        else alert("Μη έγκυρο αρχείο.");
      } catch(err) { alert("Σφάλμα."); }
    };
    r.readAsText(file); ev.target.value="";
  };

  const loadDemo = () => {
    const demoFuel = [
      {id:uid(),date:"2025-09-05",fuelType:"unleaded95",liters:42,ppl:1.789,total:75.14,km:480,odo:51200,notes:"Πλήρες",stId:"shell",station:"Shell"},
      {id:uid(),date:"2025-10-08",fuelType:"unleaded98",liters:40,ppl:1.949,total:77.96,km:460,odo:52090,notes:"Αυτοκινητόδρομος",stId:"eko",station:"ΕΚΟ"},
      {id:uid(),date:"2025-11-14",fuelType:"unleaded95",liters:38,ppl:1.829,total:69.50,km:430,odo:52975,notes:"",stId:"avin",station:"Avin"},
      {id:uid(),date:"2025-12-20",fuelType:"diesel",liters:50,ppl:1.699,total:84.95,km:510,odo:54000,notes:"",stId:"bp",station:"BP"},
      {id:uid(),date:"2026-01-15",fuelType:"unleaded95",liters:40,ppl:1.849,total:73.96,km:450,odo:55035,notes:"",stId:"avin",station:"Avin"},
      {id:uid(),date:"2026-02-10",fuelType:"unleaded95",liters:41,ppl:1.869,total:76.63,km:470,odo:56200,notes:"",stId:"shell",station:"Shell"},
    ];
    setEntries(p => ({ ...p, [vid]:demoFuel }));
    setTab("stats");
  };

  const iS  = (on) => ({ width:"100%", padding:"10px 12px", background:T.inp, border:"1px solid " + (on ? col+"99" : T.ib), borderRadius:10, color:T.tx, fontSize:14, boxSizing:"border-box", outline:"none" });
  const lS  = { display:"block", fontSize:11, color:T.mt, letterSpacing:1, marginBottom:4 };
  const curSt    = STATIONS.find(s => s.id === fuelForm.stId);
  const prevCons = (fuelForm.km && fuelForm.liters) ? (parseFloat(fuelForm.liters)/parseFloat(fuelForm.km)*100).toFixed(1) : null;
  const showPrev = !!(fuelForm.liters || fuelForm.ppl || fuelForm.total || fuelForm.km);

  const FBar = () => (
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <select value={fY} onChange={e => setFY(e.target.value)} style={{padding:"8px 10px",background:T.inp,border:"1px solid " + col + "44",borderRadius:9,color:T.tx,fontSize:13,flex:1}}>
        <option value="all">Όλα τα χρόνια</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={fM} onChange={e => setFM(e.target.value)} style={{padding:"8px 10px",background:T.inp,border:"1px solid " + col + "44",borderRadius:9,color:T.tx,fontSize:13,flex:1}}>
        <option value="all">Όλοι οι μήνες</option>
        {MONTHS.map((m, i) => <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:T.bg,color:T.tx,maxWidth:480,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg," + col + "20," + T.bg + ")",borderBottom:"1px solid " + col + "30",padding:"14px 14px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:26}}>⛽</span>
            <div>
              <div style={{fontSize:19,fontWeight:700,color:T.tx}}>FuelLog</div>
              <div style={{fontSize:10,color:T.mt,letterSpacing:1}}>ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΚΑΥΣΙΜΩΝ</div>
            </div>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <button onClick={() => setDark(!dark)} style={{padding:"6px 10px",background:T.sf,border:"1px solid " + T.br,borderRadius:9,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
            {dueR.length > 0 && (
              <button onClick={() => setModal("vi")} style={{padding:"6px 9px",background:"#ef444422",border:"1px solid #ef4444",borderRadius:9,color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer"}}>{"🔔" + dueR.length}</button>
            )}
            <button onClick={() => setModal("vi")}  style={{padding:"6px 10px",background:T.sf,border:"1px solid " + col + "44",borderRadius:9,color:col,cursor:"pointer"}}>📋</button>
            <button onClick={() => setModal("bk")}  style={{padding:"6px 10px",background:T.sf,border:"1px solid " + T.br,borderRadius:9,color:"#10b981",cursor:"pointer"}}>☁️</button>
          </div>
        </div>

        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2}}>
          {vehicles.map(v => (
            <button key={v.id} onClick={() => switchVehicle(v.id)} style={{
              padding:"7px 11px",borderRadius:"9px 9px 0 0",border:"none",
              background:vid===v.id?T.sf:"transparent",color:vid===v.id?v.color:T.ft,
              fontWeight:vid===v.id?700:400,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",
              borderBottom:vid===v.id?"2px solid " + v.color:"2px solid transparent",
            }}>{v.icon} {v.name}</button>
          ))}
          <button onClick={() => setModal("av")} style={{padding:"7px 10px",background:"transparent",border:"none",color:T.ft,fontSize:18,cursor:"pointer"}}>+</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{background:T.sf,padding:"0 14px 80px",minHeight:"70vh"}}>
        <div style={{display:"flex",borderBottom:"1px solid " + T.br,marginBottom:16}}>
          {[["add","⛽ Καύσιμα","#ff5500"],["expenses","💸 Έξοδα","#00cc66"],["stats","📊 Στατιστικά","#0088ff"],["history","📋 Ιστορικό","#aa44ff"]].map(([id, lb, tc]) => (
            <button key={id} onClick={() => setTab(id)} style={{flex:1,padding:"12px 4px",border:"none",
              background:tab===id?tc+"28":"transparent",
              color:tab===id?tc:T.mt,fontWeight:tab===id?700:400,fontSize:11,cursor:"pointer",
              borderBottom:"3px solid " + (tab===id?tc:"transparent"),marginBottom:-1,whiteSpace:"nowrap"}}>{lb}</button>
          ))}
        </div>

        {/* TAB: ADD FUEL */}
        {tab==="add" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* Live Preview */}
            {showPrev && (
              <div style={{background:"linear-gradient(135deg," + col + "22," + col + "06)",border:"1px solid " + col + "44",borderRadius:14,padding:13}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,color:T.mt,letterSpacing:1}}>ΠΡΟΕΠΙΣΚΟΠΗΣΗ</span>
                  <FtBadge ftId={fuelForm.fuelType} size={12}/>
                </div>
                <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                  {fuelForm.liters && <div><div style={{fontSize:10,color:T.mt}}>ΛΙΤΡΑ</div><div style={{fontSize:18,fontWeight:700,color:col}}>{fuelForm.liters}L</div></div>}
                  {fuelForm.ppl    && <div><div style={{fontSize:10,color:T.mt}}>ΤΙΜΗ/L</div><div style={{fontSize:18,fontWeight:700,color:col}}>€{fuelForm.ppl}</div></div>}
                  {fuelForm.total  && <div><div style={{fontSize:10,color:T.mt}}>ΣΥΝΟΛΟ</div><div style={{fontSize:18,fontWeight:700,color:col}}>€{fuelForm.total}</div></div>}
                  {prevCons        && <div><div style={{fontSize:10,color:T.mt}}>ΚΑΤΑΝΑΛΩΣΗ</div><div style={{fontSize:18,fontWeight:700,color:"#10b981"}}>{prevCons}L/100</div></div>}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label>
                <input type="date" value={fuelForm.date} onChange={e => hff("date", e.target.value)} style={iS(true)}/>
              </div>
              <div>
                <label style={lS}>ΚΑΥΣΙΜΟ</label>
                <button onClick={() => setShowFtPicker(true)} style={{...iS(false), textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                  <FtBadge ftId={fuelForm.fuelType} size={13}/>
                  <span style={{color:T.mt,fontSize:11}}>▼</span>
                </button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lS}>ΛΙΤΡΑ</label><input type="number" step="any" placeholder="π.χ. 40" value={fuelForm.liters} onChange={e => hff("liters", e.target.value)} style={iS(!!fuelForm.liters)}/></div>
              <div><label style={lS}>ΤΙΜΗ/L €</label><input type="number" step="any" placeholder="π.χ. 1.789" value={fuelForm.ppl} onChange={e => hff("ppl", e.target.value)} style={iS(!!fuelForm.ppl)}/></div>
            </div>

            <div>
              <label style={lS}>ΣΥΝΟΛΟ €</label>
              <input type="number" step="any" placeholder="π.χ. 71.56" value={fuelForm.total} onChange={e => hff("total", e.target.value)} style={iS(!!fuelForm.total)}/>
            </div>

            {/* LPG section */}
            {fuelForm.dual && (
              <div style={{background:T.bg,borderRadius:12,padding:12,border:"2px solid #a78bfa44"}}>
                <div style={{fontSize:11,color:"#a78bfa",letterSpacing:1,marginBottom:10}}>ΥΓΡΑΕΡΙΟ LPG</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><label style={lS}>ΛΙΤΡΑ LPG</label><input type="number" step="any" value={fuelForm.lpgL} onChange={e => hff("lpgL",e.target.value)} style={iS(!!fuelForm.lpgL)}/></div>
                  <div><label style={lS}>ΤΙΜΗ/L €</label><input type="number" step="any" value={fuelForm.lpgP} onChange={e => hff("lpgP",e.target.value)} style={iS(!!fuelForm.lpgP)}/></div>
                </div>
                <div><label style={lS}>ΣΥΝΟΛΟ LPG €</label><input type="number" step="any" value={fuelForm.lpgT} onChange={e => hff("lpgT",e.target.value)} style={iS(!!fuelForm.lpgT)}/></div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={lS}>{"ΔΙΑΝΥΘΕΝΤΑ " + dl.toUpperCase()}</label>
                <input type="number" placeholder={mi?"π.χ. 280":"π.χ. 450"} value={fuelForm.km} onChange={e => hff("km", e.target.value)} style={iS(!!fuelForm.km)}/>
              </div>
              <div>
                <label style={lS}>ΧΙΛΙΟΜΕΤΡΗΤΗΣ</label>
                <input type="number" placeholder="π.χ. 52300" value={fuelForm.odo} onChange={e => hff("odo", e.target.value)} style={iS(!!fuelForm.odo)}/>
              </div>
            </div>

            {/* Station button */}
            <div>
              <label style={lS}>ΠΡΑΤΗΡΙΟ</label>
              <button onClick={() => setShowStPicker(true)} style={{...iS(!!fuelForm.stId), textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                {fuelForm.stLabel
                  ? <span style={{fontWeight:700,background:curSt?curSt.bg:"#555",color:curSt?curSt.fg:"#fff",padding:"2px 10px",borderRadius:6,fontSize:13}}>{fuelForm.stLabel}</span>
                  : <span style={{color:T.ft}}>Επίλεξε πρατήριο...</span>
                }
                <span style={{color:T.mt,fontSize:11}}>▼</span>
              </button>
            </div>

            <div>
              <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
              <input type="text" placeholder="π.χ. Full tank..." value={fuelForm.notes} onChange={e => hff("notes",e.target.value)} style={iS(!!fuelForm.notes)}/>
            </div>

            {/* Dual fuel toggle */}
            <button onClick={() => hff("dual", !fuelForm.dual)}
              style={{padding:"10px 14px",border:"1px solid " + (fuelForm.dual?"#a78bfa":T.br),borderRadius:10,
                background:fuelForm.dual?"#a78bfa22":"transparent",color:fuelForm.dual?"#a78bfa":T.mt,
                fontSize:12,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
              🔘 Διπλή κατανάλωση (+ LPG)
              {fuelForm.dual && <span style={{marginLeft:"auto",fontSize:11,background:"#a78bfa",color:"#fff",padding:"1px 8px",borderRadius:5}}>ON</span>}
            </button>

            <button onClick={submitFuel} style={{padding:16,background:col,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:"pointer"}}>
              ⛽ ΠΡΟΣΘΗΚΗ ΚΑΥΣΙΜΟΥ
            </button>
          </div>
        )}

        {/* TAB: EXPENSES */}
        {tab==="expenses" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date:e.target.value})} style={iS(true)}/></div>
              <div><label style={lS}>ΠΟΣΟ €</label><input type="number" step="any" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount:e.target.value})} style={iS(!!expenseForm.amount)}/></div>
            </div>
            <div>
              <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:7}}>
                {EXPENSE_CATS.map(c => (
                  <button key={c.id} onClick={()=>setExpenseForm({...expenseForm, catId:c.id})}
                    style={{padding:"8px 4px",borderRadius:8,border:"1px solid "+(expenseForm.catId===c.id?col:T.br),
                      background:expenseForm.catId===c.id?col+"22":"transparent",
                      color:expenseForm.catId===c.id?col:T.mt,fontSize:11,cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:18}}>{c.icon}</div>
                    <div style={{fontSize:10,marginTop:2}}>{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {expenseForm.catId==="custom" && (
              <div>
                <label style={lS}>ΠΕΡΙΓΡΑΦΗ</label>
                <input placeholder="π.χ. Μπαταρία..." value={expenseForm.customCat||""} onChange={e=>setExpenseForm({...expenseForm,customCat:e.target.value})} style={iS(true)}/>
              </div>
            )}
            <div>
              <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
              <input type="text" placeholder="π.χ. Castrol 5W40..." value={expenseForm.notes} onChange={e=>setExpenseForm({...expenseForm,notes:e.target.value})} style={iS(false)}/>
            </div>
            <button onClick={submitExpense} style={{padding:14,background:"#10b981",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer"}}>
              💸 ΠΡΟΣΘΗΚΗ ΕΞΟΔΟΥ
            </button>
            <div style={{marginTop:8}}>
              {allExpense.slice().reverse().map(ex => {
                const cat = EXPENSE_CATS.find(c => c.id===ex.catId);
                return (
                  <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid "+T.br}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{cat?.icon||"💸"}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:T.tx}}>{ex.label}</div>
                        <div style={{fontSize:11,color:T.mt}}>{ex.date}{ex.notes?" · "+ex.notes:""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontWeight:700,color:"#ef4444"}}>-€{ex.amount}</span>
                      <button onClick={()=>delExpense(ex.id)} style={{background:"none",border:"none",color:T.ft,cursor:"pointer"}}>x</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: STATS */}
        {tab==="stats" && (
          <div>
            <FBar/>
            {!stats ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div style={{marginBottom:16}}>Δεν υπάρχουν δεδομένα ακόμα.</div>
                <button onClick={loadDemo} style={{padding:"10px 20px",background:T.br,color:T.tx,border:"none",borderRadius:9,fontSize:13,cursor:"pointer"}}>Φόρτωση demo δεδομένων</button>
              </div>
            ) : (
              <div>
                {/* Gradient stat cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    ["💰","Συνολικά έξοδα", stats.totalSpent?fmt(stats.totalSpent)+"€":"—", null],
                    ["⛽","Καύσιμα",         stats.fuelSpent ?fmt(stats.fuelSpent)+"€" :"—", "↑"],
                    ["🔥","Μέση κατανάλωση",stats.aC        ?fmt(stats.aC,1)+"L/100"  :"—", "↓"],
                    ["📈","Μέση τιμή/L",     stats.aP        ?fmt(stats.aP,3)+"€"      :"—", "↑"],
                    ["🔧","Άλλα έξοδα",     stats.expSpent  ?fmt(stats.expSpent)+"€"  :"—", null],
                    ["⛽","Συνολικά λίτρα",  stats.tL        ?fmt(stats.tL,1)+"L"      :"—", "↑"],
                  ].map(([ic, lb, val, trend], i) => {
                    const gc = GRAD_COLS[i];
                    const trendColor = trend==="↑" ? "#ef4444" : "#10b981";
                    return (
                      <div key={lb} style={{borderRadius:13,padding:13,position:"relative",overflow:"hidden",
                        background:"linear-gradient(135deg," + gc + "28," + gc + "06)",border:"1px solid " + gc + "44"}}>
                        <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                        <div style={{fontSize:17,fontWeight:700,color:T.tx}}>{val}</div>
                        <div style={{fontSize:11,color:T.mt,marginTop:2}}>{lb}</div>
                        {trend && <div style={{position:"absolute",top:10,right:10,fontSize:13,fontWeight:700,color:trendColor}}>{trend}</div>}
                      </div>
                    );
                  })}
                </div>

                {stats.aLC && (
                  <div style={{background:T.bg,borderRadius:13,padding:13,marginBottom:12,border:"2px solid #a78bfa44"}}>
                    <div style={{fontSize:11,color:"#a78bfa",letterSpacing:1,marginBottom:6}}>ΔΙΠΛΗ ΚΑΤΑΝΑΛΩΣΗ</div>
                    <div style={{display:"flex",gap:24}}>
                      <div><div style={{fontSize:11,color:T.mt}}>Βενζίνη</div><div style={{fontSize:15,fontWeight:700,color:col}}>{fmt(stats.aC,1)} L/100</div></div>
                      <div><div style={{fontSize:11,color:T.mt}}>LPG</div><div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>{fmt(stats.aLC,1)} L/100</div></div>
                    </div>
                  </div>
                )}

                {stats.minP && (
                  <div style={{background:T.bg,borderRadius:13,padding:13,marginBottom:14,border:"1px solid " + T.br,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:11,color:T.mt}}>MIN €/L</div><div style={{fontSize:15,fontWeight:700,color:"#10b981"}}>{fmt(stats.minP,3)}€</div></div>
                    {stats.tSt && <div style={{textAlign:"center"}}><div style={{fontSize:11,color:T.mt}}>TOP ΠΡΑΤΗΡΙΟ</div><div style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{stats.tSt}</div></div>}
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:T.mt}}>MAX €/L</div><div style={{fontSize:15,fontWeight:700,color:"#ef4444"}}>{fmt(stats.maxP,3)}€</div></div>
                  </div>
                )}

                <ChartBlock title="ΤΙΜΗ €/L"       data={cd} dk="price" color={col}     type="line" T={T}/>
                <ChartBlock title="ΕΞΟΔΑ/ΓΕΜΙΣΜΑ" data={cd} dk="cost"  color={col}     type="bar"  T={T}/>

                {/* Gauges */}
                {(stats.aC != null || stats.aP != null) && (
                  <div style={{background:T.bg,borderRadius:13,padding:"14px 8px 8px",border:"1px solid " + T.br,marginBottom:14}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:8,paddingLeft:6}}>ΚΟΝΤΕΡ</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {stats.aC != null && <Gauge value={stats.aC} min={4} max={20} color="#10b981" label="ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>}
                      {stats.aP != null && <Gauge value={stats.aP} min={1.4} max={2.4} color={col}     label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>}
                    </div>
                  </div>
                )}

                <ChartBlock title="ΚΑΤΑΝΑΛΩΣΗ"     data={cd} dk="cons"  color="#10b981" type="line" T={T}/>
                <ChartBlock title="LPG L/100"      data={cd} dk="lpgC"  color="#a78bfa" type="line" T={T}/>

                {stats.expSpent > 0 && filtExp.length > 0 && (
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:8}}>ΑΝΑΛΥΣΗ ΕΞΟΔΩΝ</div>
                    <div style={{background:T.bg,borderRadius:13,padding:13,border:"1px solid " + T.br}}>
                      {Object.entries(filtExp.reduce((acc,x)=>{ acc[x.label]=(acc[x.label]||0)+x.amount; return acc; },{}))
                        .sort((a,b)=>b[1]-a[1]).map(([label,amount]) => {
                          const pct = (amount/stats.expSpent*100);
                          const cat = EXPENSE_CATS.find(c=>c.label===label);
                          return (
                            <div key={label} style={{marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                                <span style={{fontSize:12,color:T.tx}}>{cat?.icon||"💸"} {label}</span>
                                <span style={{fontSize:12,fontWeight:700,color:col}}>{fmt(amount)}€</span>
                              </div>
                              <div style={{background:T.br,borderRadius:4,height:5}}>
                                <div style={{background:col,borderRadius:4,height:5,width:pct+"%"}}/>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {tab==="history" && (
          <div>
            <FBar/>
            {filtFuel.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div>Δεν υπάρχουν καταχωρήσεις.</div>
              </div>
            ) : [...filtFuel].reverse().map(f => {
              const ft = FTYPES.find(x => x.id===f.fuelType);
              const so = STATIONS.find(s => s.id===f.stId);
              const fc = FT_COLORS[f.fuelType] || { color:col };
              return (
                <div key={f.id} style={{background:T.bg,borderRadius:13,padding:"12px 12px 12px 16px",marginBottom:9,border:"1px solid " + T.br,position:"relative"}}>
                  {/* Colored left bar */}
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,borderRadius:"13px 0 0 13px",background:fc.color||col}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
                        <span style={{fontWeight:700,fontSize:13,color:col}}>{f.date}</span>
                        {ft && <FtBadge ftId={f.fuelType} size={11}/>}
                        {f.dual && <span style={{fontSize:11,background:"#a78bfa22",color:"#a78bfa",padding:"2px 7px",borderRadius:6}}>Dual LPG</span>}
                        {f.station && <span style={{fontSize:11,background:so?so.bg:"#555",color:so?so.fg:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>{f.station}</span>}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px"}}>
                        {f.liters && <span style={{fontSize:12,color:T.tx}}>⛽ {fmt(f.liters,1)}L</span>}
                        {f.ppl    && <span style={{fontSize:12,color:T.tx}}>💧 {fmt(f.ppl,3)}€/L</span>}
                        {f.total  && <span style={{fontSize:12,color:T.tx}}>💰 {fmt(f.total)}€</span>}
                        {f.km     && <span style={{fontSize:12,color:T.tx}}>📍 {fmt(f.km,0)}{dl}</span>}
                        {f.km && f.liters && <span style={{fontSize:12,color:"#10b981"}}>🔥 {fmt(f.liters/f.km*100,1)}L/100</span>}
                      </div>
                      {f.dual && (f.lpgL||f.lpgT) && (
                        <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px",marginTop:3}}>
                          {f.lpgL && <span style={{fontSize:12,color:"#a78bfa"}}>🟣 {fmt(f.lpgL,1)}L</span>}
                          {f.lpgP && <span style={{fontSize:12,color:"#a78bfa"}}>💧 {fmt(f.lpgP,3)}€/L</span>}
                          {f.lpgT && <span style={{fontSize:12,color:"#a78bfa"}}>💰 {fmt(f.lpgT)}€</span>}
                          {f.km && f.lpgL && <span style={{fontSize:12,color:"#a78bfa"}}>🔥 {fmt(f.lpgL/f.km*100,1)}L/100</span>}
                        </div>
                      )}
                      {f.notes && <div style={{marginTop:4,fontSize:11,color:T.mt}}>📝 {f.notes}</div>}
                    </div>
                    <button onClick={() => delFuel(f.id)} style={{background:"none",border:"none",color:T.ft,fontSize:18,paddingLeft:8,cursor:"pointer"}}>x</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer / Logo */}
        <div style={{textAlign:"center",padding:"28px 0 4px",fontSize:19,fontWeight:700,color:"#3b82f6"}}>
          ⛽ FuelLog v1.0
        </div>
        <div style={{textAlign:"center",paddingBottom:18,fontSize:19,fontWeight:700,color:"#3b82f6"}}>
          Ταχμαζίδης Κ. Γιώργος
        </div>
      </div>

      {/* FUEL TYPE PICKER */}
      {showFtPicker && (
        <Modal title="Είδος Καυσίμου" onClose={()=>setShowFtPicker(false)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FTYPES.map(ft => {
              const fc  = FT_COLORS[ft.id] || {};
              const sel = fuelForm.fuelType === ft.id;
              return (
                <button key={ft.id} onClick={()=>{ setFuelForm({...fuelForm, fuelType:ft.id}); setShowFtPicker(false); }}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",
                    border:"2px solid " + (sel?fc.color||col:T.br),borderRadius:12,
                    background:sel?fc.bg||col+"22":T.bg,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{ft.icon}</span>
                    <span style={{fontSize:14,fontWeight:sel?700:400,color:sel?fc.color||col:T.tx}}>{ft.label}</span>
                  </div>
                  <div style={{width:20,height:20,borderRadius:"50%",border:"2px solid " + (sel?fc.color||col:T.br),
                    background:sel?fc.color||col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>
                    {sel?"v":""}
                  </div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* STATION PICKER */}
      {showStPicker && (
        <StationModal
          current={{ stId:fuelForm.stId, stLabel:fuelForm.stLabel }}
          onSelect={(id,lb) => { setFuelForm({...fuelForm, stId:id, stLabel:lb}); setShowStPicker(false); }}
          onClose={() => setShowStPicker(false)}
          T={T}
        />
      )}

      {/* MODAL: Add Vehicle */}
      {modal==="av" && (
        <Modal title="Νέο Όχημα" onClose={()=>setModal(null)} T={T}>
          <div style={{marginBottom:12}}>
            <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {VCATS.map(c => (
                <button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icons[0]})}
                  style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(newV.category===c.id?col:T.br),
                    background:newV.category===c.id?col+"22":"transparent",color:newV.category===c.id?col:T.mt,fontSize:12,cursor:"pointer"}}>
                  {c.icons[0]} {c.label}
                </button>
              ))}
            </div>
            <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {(VCATS.find(c=>c.id===newV.category)?.icons||["🚗"]).map(ic => (
                <button key={ic} onClick={()=>setNewV({...newV,icon:ic})}
                  style={{fontSize:22,padding:"6px 10px",border:"2px solid "+(newV.icon===ic?col:T.br),borderRadius:9,background:"transparent",cursor:"pointer"}}>{ic}</button>
              ))}
            </div>
            <label style={lS}>ΟΝΟΜΑ</label>
            <input value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} placeholder="π.χ. Εταιρικό Βαν"
              style={{...iS(!!newV.name), marginBottom:14}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:12,background:"transparent",border:"1px solid "+T.br,borderRadius:10,color:T.mt,cursor:"pointer"}}>Ακύρωση</button>
            <button onClick={addVeh} style={{flex:2,padding:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor:"pointer"}}>Προσθήκη</button>
          </div>
        </Modal>
      )}

      {/* MODAL: Vehicle Info */}
      {modal==="vi" && av && (
        <VehicleInfoModal
          av={av}
          onClose={() => setModal(null)}
          onUpdate={updateVehicle}
          onDelete={deleteVehicle}
          onAddReminder={addR}
          onUpdateReminder={upR}
          onDelReminder={delR}
          T={T}
          dl={dl}
        />
      )}

      {/* MODAL: Backup */}
      {modal==="bk" && (
        <Modal title="Backup and Export" onClose={()=>setModal(null)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={lS}>ΕΞΑΓΩΓΗ</label>
            <button onClick={exCsv}  style={{padding:"13px 16px",background:"#3b82f622",border:"1px solid #3b82f644",borderRadius:11,color:"#3b82f6",fontSize:14,fontWeight:600,textAlign:"left",cursor:"pointer"}}>📄 Export CSV (καύσιμα)</button>
            <button onClick={exJson} style={{padding:"13px 16px",background:col+"22",border:"1px solid "+col+"44",borderRadius:11,color:col,fontSize:14,fontWeight:600,textAlign:"left",cursor:"pointer"}}>📦 Backup JSON (όλα)</button>
            <label style={{...lS,marginTop:8}}>ΕΠΑΝΑΦΟΡΑ</label>
            <input ref={fref} type="file" accept=".json" onChange={imJson} style={{display:"none"}}/>
            <button onClick={()=>fref.current?.click()} style={{padding:"13px 16px",background:T.bg,border:"1px solid "+T.br,borderRadius:11,color:T.tx,fontSize:14,fontWeight:600,textAlign:"left",cursor:"pointer"}}>📥 Εισαγωγή JSON backup</button>
            <div style={{borderTop:"1px solid "+T.br,paddingTop:12,marginTop:4}}>
              <button onClick={loadDemo} style={{width:"100%",padding:10,background:T.br,color:T.tx,border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Φόρτωση demo δεδομένων</button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
} 
