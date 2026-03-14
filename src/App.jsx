import { useState, useMemo, useRef, useEffect } from "react";

// CONFIGURATION & CONSTANTS
const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];
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
  { id:"kteo",      label:"ΚΤΕΟ",              icon:"📋", hasDate:true,  hasKm:false },
  { id:"emissions", label:"Κάρτα Καυσαερίων", icon:"💨", hasDate:true,  hasKm:false },
  { id:"tyres",     label:"Αλλ. Ελαστικών",   icon:"🔄", hasDate:false, hasKm:true  },
  { id:"insurance", label:"Ασφάλεια",          icon:"🛡️", hasDate:true,  hasKm:false },
  { id:"custom",    label:"Άλλο",              icon:"📌", hasDate:true,  hasKm:true  },
];

const EXPENSE_CATS = [
  { id:"oil",      label:"Λάδια / Φίλτρα", icon:"🛢️" },
  { id:"adblue",   label:"AdBlue",          icon:"💧" },
  { id:"tyres",    label:"Ελαστικά",        icon:"⚫" },
  { id:"chains",   label:"Αλυσίδες",        icon:"🔗" },
  { id:"cleaning", label:"Καθαριστικά",     icon:"🧴" },
  { id:"parts",    label:"Ανταλλακτικά",    icon:"🔩" },
  { id:"parking",  label:"Parking",          icon:"🅿️" },
  { id:"tolls",    label:"Διόδια",          icon:"🛣️" },
  { id:"service",  label:"Service",          icon:"🔧" },
  { id:"custom",   label:"Άλλο",             icon:"💸" },
];

const DK = { bg:"#050508", sf:"#12121f", br:"#3b82f644", tx:"#f8fafc", mt:"#94a3b8", ft:"#64748b", inp:"#050508", ib:"#1e293b" };
const LT = { bg:"#f1f5f9", sf:"#ffffff", br:"#3b82f633", tx:"#0f172a", mt:"#475569", ft:"#94a3b8", inp:"#ffffff", ib:"#cbd5e1" };

const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const ddiff = ds => Math.round((new Date(ds) - new Date()) / 86400000);

// REUSABLE COMPONENTS
function SVGChart({ points, color }) {
  if (!points || points.length < 2) return null;
  const W=400, H=80, P=10;
  const vals = points.map(p => p.y);
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1;
  const sx = i => P + (i / (points.length - 1)) * (W - P * 2);
  const sy = v => H - P - ((v - minV) / range) * (H - P * 2);
  const d = points.map((p, i) => (i===0?"M":"L") + sx(i) + "," + sy(p.y)).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%", height:80, display:"block", overflow:"visible"}}>
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={sx(i)} cy={sy(p.y)} r={4} fill={color} stroke="#fff" strokeWidth={1} />)}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, T }) {
  const pts = data.filter(d => d[dk] != null).map(d => ({ x:d.date, y:d[dk] }));
  if (pts.length < 2) return null;
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11, color:color, fontWeight:800, letterSpacing:1.5, marginBottom:8, textTransform:"uppercase"}}>{title}</div>
      <div style={{background:T.sf, borderRadius:16, padding:"16px 12px 8px", border:`2px solid ${color}33`, boxShadow:`0 8px 20px ${color}15`}}>
        <SVGChart points={pts} color={color}/>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
          <span style={{fontSize:10, color:T.ft}}>{pts[0].x}</span>
          <span style={{fontSize:10, color:T.ft}}>{pts[pts.length-1].x}</span>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, T, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
      <div onClick={e => e.stopPropagation()} style={{background:T.sf, borderRadius:"24px 24px 0 0", padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", borderTop:`3px solid ${T.br}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
          <span style={{fontWeight:800, fontSize:18, color:T.tx}}>{title}</span>
          <button onClick={onClose} style={{background:T.br, border:"none", color:T.tx, width:32, height:32, borderRadius:16, fontWeight:700, cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// MAIN APPLICATION
export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;
  const [tab, setTab] = useState("add");
  const [vid, setVid] = useState("v1");
  const [vehicles, setVehicles] = useState([{id:"v1", name:"Το Όχημά μου", icon:"🚗", color:"#3b82f6"}]);
  const [entries, setEntries] = useState({});
  const [fuelForm, setFuelForm] = useState({date:today(), fuelType:"unleaded95", liters:"", ppl:"", total:"", km:"", stLabel:""});

  useEffect(() => {
    const saved = localStorage.getItem("fuellog_pro_data");
    if (saved) {
      const d = JSON.parse(saved);
      if (d.entries) setEntries(d.entries);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fuellog_pro_data", JSON.stringify({ entries }));
  }, [entries]);

  const allFuel = (entries[vid] || []).sort((a,b) => new Date(a.date) - new Date(b.date));

  const hff = (f, v) => {
    let u = {...fuelForm, [f]:v};
    if (f==="liters" && u.ppl) u.total = (parseFloat(v) * parseFloat(u.ppl)).toFixed(2);
    if (f==="ppl" && u.liters) u.total = (parseFloat(u.liters) * parseFloat(v)).toFixed(2);
    if (f==="total" && u.liters) u.ppl = (parseFloat(v) / parseFloat(u.liters)).toFixed(3);
    setFuelForm(u);
  };

  const submitFuel = () => {
    if(!fuelForm.total || !fuelForm.liters) return;
    const newEntry = {...fuelForm, id:uid(), total:parseFloat(fuelForm.total), liters:parseFloat(fuelForm.liters), km:parseFloat(fuelForm.km)||0, ppl:parseFloat(fuelForm.ppl)};
    setEntries(p => ({...p, [vid]: [...(p[vid]||[]), newEntry]}));
    setFuelForm({date:today(), fuelType:"unleaded95", liters:"", ppl:"", total:"", km:"", stLabel:""});
    setTab("history");
  };

  return (
    <div style={{fontFamily:"'Inter', system-ui, sans-serif", minHeight:"100vh", background:T.bg, color:T.tx, maxWidth:480, margin:"0 auto", transition:"all 0.3s"}}>
      {/* HEADER */}
      <div style={{padding:"24px 20px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <b style={{fontSize:24, letterSpacing:"-1px"}}>⛽ FuelLog <span style={{color:T.br}}>PRO</span></b>
        <button onClick={()=>setDark(!dark)} style={{border:"none", background:T.sf, width:44, height:44, borderRadius:12, fontSize:20, boxShadow:`0 4px 10px rgba(0,0,0,0.2)`}}>
          {dark?"☀️":"🌙"}
        </button>
      </div>

      {/* NAVIGATION */}
      <div style={{display:"flex", margin:"0 20px 20px", background:T.sf, borderRadius:16, padding:6, border:`1px solid ${T.ib}`}}>
        {["add", "stats", "history"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:"12px 0", background:tab===t?"#3b82f6":"transparent", 
            border:"none", color:tab===t?"#fff":T.mt, borderRadius:12, fontWeight:700, 
            fontSize:13, transition:"all 0.2s", textTransform:"uppercase"
          }}>
            {t==="add"?"+ ΕΓΓΡΑΦΗ":t==="stats"?"ΣΤΑΤΙΣΤΙΚΑ":"ΙΣΤΟΡΙΚΟ"}
          </button>
        ))}
      </div>

      <div style={{padding:"0 20px 100px"}}>
        {tab==="add" && (
          <div style={{display:"grid", gap:16, background:T.sf, padding:20, borderRadius:24, border:`1px solid ${T.ib}`}}>
            <div>
              <label style={{fontSize:11, fontWeight:700, color:T.mt, marginBottom:6, display:"block"}}>ΗΜΕΡΟΜΗΝΙΑ</label>
              <input type="date" value={fuelForm.date} onChange={e=>hff("date", e.target.value)} style={{width:"100%", padding:14, borderRadius:12, background:T.inp, color:T.tx, border:`1px solid ${T.ib}`, boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex", gap:12}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11, fontWeight:700, color:T.mt, marginBottom:6, display:"block"}}>ΛΙΤΡΑ</label>
                <input type="number" placeholder="0.00" value={fuelForm.liters} onChange={e=>hff("liters", e.target.value)} style={{width:"100%", padding:14, borderRadius:12, background:T.inp, color:T.tx, border:`1px solid ${T.ib}`, boxSizing:"border-box"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11, fontWeight:700, color:T.mt, marginBottom:6, display:"block"}}>ΤΙΜΗ / L</label>
                <input type="number" placeholder="0.000" value={fuelForm.ppl} onChange={e=>hff("ppl", e.target.value)} style={{width:"100%", padding:14, borderRadius:12, background:T.inp, color:T.tx, border:`1px solid ${T.ib}`, boxSizing:"border-box"}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11, fontWeight:700, color:T.mt, marginBottom:6, display:"block"}}>ΣΥΝΟΛΙΚΟ ΠΟΣΟ (€)</label>
              <input type="number" placeholder="0.00" value={fuelForm.total} onChange={e=>hff("total", e.target.value)} style={{width:"100%", padding:16, borderRadius:12, background:T.inp, color:"#3b82f6", border:`2px solid #3b82f6`, fontWeight:800, fontSize:18, boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:11, fontWeight:700, color:T.mt, marginBottom:6, display:"block"}}>ΧΙΛΙΟΜΕΤΡΑ ΔΙΑΔΡΟΜΗΣ</label>
              <input type="number" placeholder="π.χ. 450" value={fuelForm.km} onChange={e=>hff("km", e.target.value)} style={{width:"100%", padding:14, borderRadius:12, background:T.inp, color:T.tx, border:`1px solid ${T.ib}`, boxSizing:"border-box"}}/>
            </div>
            <button onClick={submitFuel} style={{marginTop:10, padding:18, background:"#3b82f6", color:"#fff", border:"none", borderRadius:16, fontWeight:800, fontSize:16, boxShadow:"0 10px 20px rgba(59, 130, 246, 0.3)"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {tab==="stats" && (
          <div>
            {allFuel.length < 2 ? (
              <div style={{textAlign:"center", padding:40, color:T.mt}}>Χρειάζονται τουλάχιστον 2 εγγραφές για στατιστικά.</div>
            ) : (
              <>
                <ChartBlock title="Τάση Τιμής (€/L)" data={allFuel} dk="ppl" color="#3b82f6" T={T} />
                <ChartBlock title="Κατανάλωση (L/100km)" data={allFuel.filter(f=>f.km>0)} dk="cons" color="#10b981" T={T} 
                  data={allFuel.filter(f=>f.km>0).map(f=>({...f, cons:(f.liters/f.km)*100}))} />
                <ChartBlock title="Κόστος ανά Γέμισμα (€)" data={allFuel} dk="total" color="#f97316" T={T} />
              </>
            )}
          </div>
        )}

        {tab==="history" && (
          <div style={{display:"grid", gap:12}}>
            {allFuel.slice().reverse().map(f => (
              <div key={f.id} style={{padding:18, background:T.sf, borderRadius:20, border:`1px solid ${T.ib}`, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14, fontWeight:800}}>{new Date(f.date).toLocaleDateString('el-GR', {day:'numeric', month:'short'})}</div>
                  <div style={{fontSize:12, color:T.mt}}>{f.liters}L • {FTYPES.find(t=>t.id===f.fuelType)?.icon} {f.km}km</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18, fontWeight:900, color:"#3b82f6"}}>€{f.total.toFixed(2)}</div>
                  <div style={{fontSize:11, color:T.ft}}>€{f.ppl.toFixed(3)}/L</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
