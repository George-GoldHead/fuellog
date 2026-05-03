import React, { useState, useMemo, useEffect } from "react";
 
// ========== CONFIGURATIONS & CONSTANTS ==========
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
 
const EXPENSE_CATS = [
  { id:"service",  label:"Service",         icon:"🔧" },
  { id:"oil",      label:"Λάδια / Φίλτρα", icon:"🛢️" },
  { id:"tyres",    label:"Ελαστικά",        icon:"⚫" },
  { id:"parking",  label:"Parking",         icon:"🅿️" },
  { id:"tolls",    label:"Διόδια",          icon:"🛣️" },
  { id:"custom",   label:"Άλλο",            icon:"💸" },
];
 
const MONTHS_FULL = [
  "Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος",
  "Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"
];
const MONTHS = ["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];
 
// --- Utilities ---
const uid = () => Math.random().toString(36).substr(2, 9);
const fmt = (n, d=2) => (n != null && !isNaN(n)) ? (+n).toFixed(d) : "0.00";
const today = () => new Date().toISOString().split("T")[0];
 
// ✅ FIX: Format dd/mm/yy
const formatDate = (ds) => {
  if (!ds) return "--/--/--";
  const d = new Date(ds);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
};
 
const DK = { bg:"#080810", sf:"#10101c", br:"#1e1e30", tx:"#eeeeff", mt:"#7777aa", ft:"#33334a", inp:"#0d0d1a", ib:"#1e1e30" };
const LT = { bg:"#f0e8db", sf:"#faf3e8", br:"#d4c0a8", tx:"#1a1510", mt:"#5c4e3d", ft:"#9e8b74", inp:"#ffffff", ib:"#d4c0a8" };
 
const defV = () => ({
  id:"v1", name:"ΕΤΑΙΡΙΚΟ", icon:"🚗", color:"#f97316", category:"car",
  info:{ plate:"", chassis:"", fuelType:"diesel" },
  reminders:[], unitMiles:false,
});
 
const emptyFuel = (ft="diesel") => ({
  date:today(), fuelType:ft, liters:"", ppl:"", total:"", km:"", odo:"", notes:"", stId:"", stLabel:""
});
 
const emptyExp = () => ({
  date:today(), category:"tolls", label:"", amount:"", notes:""
});
 
// ========== GAUGE COMPONENT ==========
 
function RoundCyberGauge({ value, min, max, color, label, unit, T }) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R = 42, cx = 52, cy = 52;
  const startA = Math.PI * 0.7, endA = Math.PI * 2.3;
  const valA = startA + (endA - startA) * pct;
  const needleX = cx + (R - 11) * Math.cos(valA), needleY = cy + (R - 11) * Math.sin(valA);
 
  return (
    <div style={{ background:"#0a0a0f", borderRadius:"50%", padding:5, border:`2px solid ${color}`, width:"100%", aspectRatio:"1/1", position:"relative" }}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${cx + R*Math.cos(startA)} ${cy + R*Math.sin(startA)} A ${R} ${R} 0 1 1 ${cx + R*Math.cos(endA)} ${cy + R*Math.sin(endA)}`} fill="none" stroke={T.br} strokeWidth={6} strokeLinecap="round"/>
        <path d={`M ${cx + R*Math.cos(startA)} ${cy + R*Math.sin(startA)} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${cx + R*Math.cos(valA)} ${cy + R*Math.sin(valA)}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2}/>
        <text x={cx} y={cy+5} textAnchor="middle" fill={color} fontSize={10} fontWeight="800">{fmt(value,1)}</text>
        <text x={cx} y={cy+15} textAnchor="middle" fill={T.mt} fontSize={5}>{unit}</text>
      </svg>
      <div style={{ position:"absolute", bottom:8, width:"100%", textAlign:"center", fontSize:7, color, fontWeight:700 }}>{label}</div>
    </div>
  );
}
 
// ========== MAIN APP ==========
 
export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;
 
  const [vehicles, setVehicles] = useState([defV()]);
  const [vid, setVid] = useState("v1");
  const [entries, setEntries] = useState({});
  const [expenses, setExpenses] = useState({});
  const [tab, setTab] = useState("home");
  const [fM, setFM] = useState("all");
  const [fuelForm, setFuelForm] = useState(emptyFuel());
  const [expForm, setExpForm] = useState(emptyExp());
 
  // ✅ NEW: State για ανοιχτούς/κλειστούς μήνες στα Έξοδα
  const [openMonths, setOpenMonths] = useState({});
  const toggleMonth = (key) => setOpenMonths(p => ({ ...p, [key]: !p[key] }));
 
  const av = vehicles.find(v => v.id === vid) || vehicles[0];
  const col = av.color;
 
  // Φόρτωση
  useEffect(() => {
    const saved = localStorage.getItem("fuellog_data");
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.vehicles) setVehicles(d.vehicles);
        if (d.entries)  setEntries(d.entries);
        if (d.expenses) setExpenses(d.expenses);
      } catch(e) { console.error("Load error", e); }
    }
  }, []);
 
  // Αποθήκευση
  useEffect(() => {
    localStorage.setItem("fuellog_data", JSON.stringify({ vehicles, entries, expenses }));
  }, [vehicles, entries, expenses]);
 
  const allFuel = useMemo(() =>
    (entries[vid] || []).sort((a,b) => new Date(a.date) - new Date(b.date)),
    [entries, vid]
  );
  const allExp = useMemo(() =>
    (expenses[vid] || []).sort((a,b) => new Date(a.date) - new Date(b.date)),
    [expenses, vid]
  );
 
  const filtFuel = useMemo(() => {
    if (fM === "all") return allFuel;
    return allFuel.filter(e => e.date.slice(5,7) === fM);
  }, [allFuel, fM]);
 
  const filtExp = useMemo(() => {
    if (fM === "all") return allExp;
    return allExp.filter(e => e.date.slice(5,7) === fM);
  }, [allExp, fM]);
 
  // ✅ FIX: parseFloat + || 0, aP με toFixed(3)
  const stats = useMemo(() => {
    const fuelSpent = filtFuel.reduce((s,x) => s + (parseFloat(x.total)  || 0), 0);
    const expSpent  = filtExp.reduce( (s,x) => s + (parseFloat(x.amount) || 0), 0);
    const tL        = filtFuel.reduce((s,x) => s + (parseFloat(x.liters) || 0), 0);
 
    const wK = filtFuel.filter(x => parseFloat(x.km) > 0 && parseFloat(x.liters) > 0);
    const aC = wK.length
      ? wK.reduce((s,x) => s + (parseFloat(x.liters) / parseFloat(x.km) * 100), 0) / wK.length
      : 0;
 
    const wP = filtFuel.filter(x => parseFloat(x.ppl) > 0);
    // ✅ FIX: Στρογγυλοποίηση aP σε 3 δεκαδικά
    const aP = wP.length
      ? +(wP.reduce((s,x) => s + parseFloat(x.ppl), 0) / wP.length).toFixed(3)
      : 0;
 
    return { fuelSpent, expSpent, totalSpent: fuelSpent + expSpent, tL, aC, aP };
  }, [filtFuel, filtExp]);
 
  // ✅ NEW: Ομαδοποίηση εξόδων ανά μήνα
  const expByMonth = useMemo(() => {
    const map = {};
    allExp.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!map[key]) map[key] = { key, label: `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`, entries:[], total:0 };
      map[key].entries.push(e);
      map[key].total += parseFloat(e.amount) || 0;
    });
    // Ταξινόμηση μήνων από νεότερο → παλαιότερο
    return Object.values(map).sort((a,b) => b.key.localeCompare(a.key));
  }, [allExp]);
 
  const handleAddFuel = () => {
    if (!fuelForm.liters || !fuelForm.total) return;
    const liters = parseFloat(fuelForm.liters);
    const total  = parseFloat(fuelForm.total);
    const newEntry = {
      ...fuelForm,
      id:     uid(),
      total,
      liters,
      ppl:    liters > 0 ? +(total / liters).toFixed(4) : 0,
      odo:    fuelForm.odo ? parseFloat(fuelForm.odo) : null,
    };
    setEntries(p => ({ ...p, [vid]: [...(p[vid]||[]), newEntry] }));
    setFuelForm(emptyFuel());
    setTab("history");
  };
 
  const handleAddExp = () => {
    if (!expForm.amount) return;
    const cat = EXPENSE_CATS.find(c => c.id === expForm.category);
    const newExp = {
      ...expForm,
      id:     uid(),
      amount: parseFloat(expForm.amount),
      icon:   cat?.icon || "💸",
      label:  expForm.label || cat?.label || "Άλλο",
    };
    setExpenses(p => ({ ...p, [vid]: [...(p[vid]||[]), newExp] }));
    setExpForm(emptyExp());
  };
 
  const handleDelExp = (expId) => {
    setExpenses(p => ({ ...p, [vid]: (p[vid]||[]).filter(e => e.id !== expId) }));
  };
 
  const handleDelFuel = (fuelId) => {
    setEntries(p => ({ ...p, [vid]: (p[vid]||[]).filter(e => e.id !== fuelId) }));
  };
 
  // --- Tab definitions ---
  const tabs = [
    { id:"home",     label:"Αρχική",      icon:"🏠" },
    { id:"fuel",     label:"Καύσιμο",     icon:"⛽" },
    { id:"expenses", label:"Έξοδα",       icon:"📋" },
    { id:"stats",    label:"Στατιστικά",  icon:"📊" },
    { id:"history",  label:"Ιστορικό",    icon:"📅" },
  ];
 
  const inputStyle = {
    width:"100%", padding:12, marginBottom:10, borderRadius:8,
    background:T.inp, color:T.tx, border:`1px solid ${T.ib}`,
    boxSizing:"border-box", fontSize:14,
  };
  const selectStyle = { ...inputStyle, marginBottom:10 };
 
  return (
    <div style={{ backgroundColor:T.bg, color:T.tx, minHeight:"100vh", fontFamily:"sans-serif", paddingBottom:90 }}>
 
      {/* Header */}
      <header style={{ padding:"12px 15px", background:T.sf, borderBottom:`1px solid ${T.br}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>⛽</span>
          <h2 style={{ margin:0, fontSize:18 }}>FuelLog v2.3</h2>
        </div>
        <button onClick={() => setDark(!dark)} style={{ border:"none", background:"none", fontSize:22, cursor:"pointer" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </header>
 
      {/* Vehicle Tabs */}
      <div style={{ display:"flex", gap:8, padding:"10px 15px", background:T.sf, borderBottom:`1px solid ${T.br}`, overflowX:"auto" }}>
        {vehicles.map(v => (
          <button key={v.id} onClick={() => setVid(v.id)} style={{
            padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
            background: vid === v.id ? v.color : T.br,
            color: vid === v.id ? "#fff" : T.mt,
            fontWeight:"bold", fontSize:13, whiteSpace:"nowrap",
          }}>
            {v.icon} {v.name}
          </button>
        ))}
        <button style={{ padding:"6px 12px", borderRadius:20, border:`1px dashed ${T.mt}`, background:"none", color:T.mt, cursor:"pointer" }}>+</button>
      </div>
 
      {/* Bottom Nav Tabs */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        display:"flex", justifyContent:"space-around",
        background:T.sf, borderTop:`1px solid ${T.br}`,
        padding:"6px 0", zIndex:100,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            border:"none", background:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            color: tab === t.id ? col : T.mt,
            fontSize:10, fontWeight: tab === t.id ? "bold" : "normal",
            padding:"4px 8px",
          }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
 
      <main style={{ padding:15 }}>
 
        {/* ===== HOME TAB ===== */}
        {tab === "home" && (
          <div>
            <div style={{ background:T.sf, padding:15, borderRadius:15, marginBottom:15, border:`1px solid ${T.br}` }}>
              <div style={{ fontSize:12, color:T.mt, marginBottom:4 }}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ (ΟΛΟΙ ΟΙ ΜΗΝΕΣ)</div>
              <div style={{ fontSize:28, fontWeight:"bold", color:"#eab308" }}>{fmt(
                (entries[vid]||[]).reduce((s,x) => s+(parseFloat(x.total)||0),0) +
                (expenses[vid]||[]).reduce((s,x) => s+(parseFloat(x.amount)||0),0)
              )}€</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ background:T.sf, padding:12, borderRadius:12, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΓΕΜΙΣΜΑΤΑ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#3b82f6" }}>{(entries[vid]||[]).length}</div>
              </div>
              <div style={{ background:T.sf, padding:12, borderRadius:12, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΕΞΟΔΑ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#e11d48" }}>{(expenses[vid]||[]).length}</div>
              </div>
            </div>
          </div>
        )}
 
        {/* ===== FUEL TAB ===== */}
        {tab === "fuel" && (
          <div style={{ background:T.sf, padding:20, borderRadius:15, border:`1px solid ${T.br}` }}>
            <h3 style={{ marginTop:0 }}>⛽ Νέο Γέμισμα</h3>
            <input type="date" value={fuelForm.date}
              onChange={e => setFuelForm({...fuelForm, date:e.target.value})}
              style={inputStyle}/>
            <select value={fuelForm.fuelType}
              onChange={e => setFuelForm({...fuelForm, fuelType:e.target.value})}
              style={selectStyle}>
              {FTYPES.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <input type="number" placeholder="Λίτρα" value={fuelForm.liters}
              onChange={e => setFuelForm({...fuelForm, liters:e.target.value})}
              style={inputStyle}/>
            <input type="number" placeholder="Συνολικό Ποσό €" value={fuelForm.total}
              onChange={e => setFuelForm({...fuelForm, total:e.target.value})}
              style={inputStyle}/>
            <input type="number" placeholder="Odometer (Συνολικά χλμ)" value={fuelForm.odo}
              onChange={e => setFuelForm({...fuelForm, odo:e.target.value})}
              style={inputStyle}/>
            <input type="text" placeholder="Σημειώσεις (προαιρετικό)" value={fuelForm.notes}
              onChange={e => setFuelForm({...fuelForm, notes:e.target.value})}
              style={inputStyle}/>
            <button onClick={handleAddFuel} style={{
              width:"100%", padding:15, background:col, color:"#fff",
              border:"none", borderRadius:10, fontWeight:"bold", fontSize:16, cursor:"pointer",
            }}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}
 
        {/* ===== EXPENSES TAB ===== */}
        {tab === "expenses" && (
          <div>
            {/* Φόρμα προσθήκης εξόδου */}
            <div style={{ background:T.sf, padding:15, borderRadius:15, marginBottom:20, border:`1px solid ${T.br}` }}>
              <h3 style={{ marginTop:0, fontSize:15 }}>➕ Νέο Έξοδο</h3>
              <input type="date" value={expForm.date}
                onChange={e => setExpForm({...expForm, date:e.target.value})}
                style={inputStyle}/>
              <select value={expForm.category}
                onChange={e => setExpForm({...expForm, category:e.target.value})}
                style={selectStyle}>
                {EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <input type="text" placeholder="Τοποθεσία / Περιγραφή" value={expForm.label}
                onChange={e => setExpForm({...expForm, label:e.target.value})}
                style={inputStyle}/>
              <input type="number" placeholder="Ποσό €" value={expForm.amount}
                onChange={e => setExpForm({...expForm, amount:e.target.value})}
                style={inputStyle}/>
              <button onClick={handleAddExp} style={{
                width:"100%", padding:12, background:col, color:"#fff",
                border:"none", borderRadius:10, fontWeight:"bold", fontSize:15, cursor:"pointer",
              }}>ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
 
            {/* ✅ NEW: Λίστα εξόδων ανά μήνα - ΣΥΜΠΥΚΝΩΜΕΝΗ */}
            {expByMonth.length === 0 && (
              <div style={{ textAlign:"center", color:T.mt, padding:30 }}>Δεν υπάρχουν έξοδα ακόμα.</div>
            )}
 
            {expByMonth.map(({ key, label, entries: monthEntries, total }) => (
              <div key={key} style={{ marginBottom:10 }}>
 
                {/* Header μήνα — κλικάρεται για toggle */}
                <div
                  onClick={() => toggleMonth(key)}
                  style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"12px 16px",
                    background: openMonths[key] ? T.br : T.sf,
                    borderRadius: openMonths[key] ? "12px 12px 0 0" : 12,
                    border:`1px solid ${T.br}`,
                    cursor:"pointer",
                    userSelect:"none",
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:16 }}>📅</span>
                    <span style={{ fontWeight:"bold", fontSize:14 }}>{label}</span>
                    <span style={{ fontSize:11, color:T.mt, background:T.ft, padding:"2px 7px", borderRadius:10 }}>
                      {monthEntries.length} εγγραφές
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ color:"#e07b54", fontWeight:"bold", fontSize:15 }}>
                      -{fmt(total)}€
                    </span>
                    <span style={{ fontSize:12, color:T.mt }}>
                      {openMonths[key] ? "▲" : "▼"}
                    </span>
                  </div>
                </div>
 
                {/* Εγγραφές μήνα — εμφανίζονται μόνο αν είναι ανοιχτός */}
                {openMonths[key] && (
                  <div style={{
                    border:`1px solid ${T.br}`, borderTop:"none",
                    borderRadius:"0 0 12px 12px", overflow:"hidden",
                  }}>
                    {monthEntries.slice().reverse().map((e, i) => {
                      const cat = EXPENSE_CATS.find(c => c.id === e.category);
                      return (
                        <div key={e.id} style={{
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"10px 14px",
                          background: i % 2 === 0 ? T.sf : T.bg,
                          borderBottom: i < monthEntries.length - 1 ? `1px solid ${T.ft}` : "none",
                        }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:22 }}>{cat?.icon || e.icon || "💸"}</span>
                            <div>
                              <div style={{ fontWeight:"bold", fontSize:13 }}>{e.label || cat?.label}</div>
                              <div style={{ fontSize:11, color:T.mt }}>{formatDate(e.date)}</div>
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontWeight:"bold", color:"#e11d48", fontSize:14 }}>
                              -{fmt(e.amount)}€
                            </span>
                            <button onClick={() => handleDelExp(e.id)} style={{
                              border:"none", background:"none", color:T.mt,
                              cursor:"pointer", fontSize:16, padding:4,
                            }}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
 
        {/* ===== STATS TAB ===== */}
        {tab === "stats" && (
          <>
            {/* Φίλτρο μήνα */}
            <select value={fM} onChange={e => setFM(e.target.value)}
              style={{ ...selectStyle, marginBottom:20 }}>
              <option value="all">Όλοι οι μήνες</option>
              {MONTHS.map((m,i) => (
                <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>
              ))}
            </select>
 
            {/* Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
              <div style={{ background:T.sf, padding:14, borderRadius:14, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#eab308" }}>{fmt(stats.totalSpent)}€</div>
              </div>
              <div style={{ background:T.sf, padding:14, borderRadius:14, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΚΑΥΣΙΜΑ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#3b82f6" }}>{fmt(stats.fuelSpent)}€</div>
              </div>
              <div style={{ background:T.sf, padding:14, borderRadius:14, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΑΛΛΑ ΕΞΟΔΑ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#e11d48" }}>{fmt(stats.expSpent)}€</div>
              </div>
              <div style={{ background:T.sf, padding:14, borderRadius:14, border:`1px solid ${T.br}` }}>
                <div style={{ fontSize:10, color:T.mt }}>ΣΥΝΟΛΟ ΛΙΤΡΩΝ</div>
                <div style={{ fontSize:20, fontWeight:"bold", color:"#10b981" }}>{fmt(stats.tL)} L</div>
              </div>
            </div>
 
            {/* Gauges */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <RoundCyberGauge value={stats.aC} min={0} max={15} color="#10b981" label="ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>
              <RoundCyberGauge value={stats.aP} min={1} max={2.5} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>
            </div>
          </>
        )}
 
        {/* ===== HISTORY TAB ===== */}
        {tab === "history" && (
          <div>
            <h3 style={{ margin:"0 0 15px" }}>⛽ Ιστορικό Καυσίμων</h3>
            {allFuel.length === 0 && (
              <div style={{ textAlign:"center", color:T.mt, padding:30 }}>Δεν υπάρχουν εγγραφές ακόμα.</div>
            )}
            {allFuel.slice().reverse().map((e, idx, arr) => {
              const nextE = arr[idx + 1];
 
              // ✅ FIX: Χρήση != null αντί για truthy check (αποφεύγει bug με odo=0)
              const diffKm = (e.odo != null && nextE && nextE.odo != null)
                ? (e.odo - nextE.odo)
                : null;
 
              const ftype = FTYPES.find(f => f.id === e.fuelType);
 
              return (
                <div key={e.id} style={{
                  background:T.sf, padding:12, borderRadius:12, marginBottom:10,
                  borderLeft:`4px solid ${col}`, border:`1px solid ${T.br}`,
                  borderLeft:`4px solid ${col}`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:"bold" }}>{formatDate(e.date)}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {/* ✅ FIX: Εμφάνιση μόνο αν diffKm > 0 */}
                      {diffKm != null && diffKm > 0 && (
                        <span style={{ fontSize:11, color:"#10b981" }}>📍 {diffKm} χλμ</span>
                      )}
                      <span style={{ fontSize:11, color:T.mt }}>
                        {ftype ? `${ftype.icon} ${ftype.label}` : e.fuelType}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:16, fontWeight:"bold" }}>{fmt(e.liters,2)} L</span>
                      <span style={{ fontSize:12, marginLeft:10, color:T.mt }}>{fmt(e.ppl,3)} €/L</span>
                      {e.odo && <div style={{ fontSize:11, color:T.mt, marginTop:2 }}>ODO: {e.odo} km</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:"bold", color:"#ef4444" }}>{fmt(e.total)}€</div>
                      </div>
                      <button onClick={() => handleDelFuel(e.id)} style={{
                        border:"none", background:"none", color:T.mt,
                        cursor:"pointer", fontSize:16, padding:4,
                      }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
 
      </main>
    </div>
  );
}
 
