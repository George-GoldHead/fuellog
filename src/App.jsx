import React, { useState, useMemo, useEffect } from "react";

// ========== CONSTANTS ==========
const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];

const VCATS = [
  { id:"car",    label:"ΙΧ",               icon:"🚗" },
  { id:"taxi",   label:"Taxi",             icon:"🚕" },
  { id:"moto",   label:"Μηχανή",           icon:"🏍️" },
  { id:"van",    label:"Βαν",              icon:"🚐" },
  { id:"ltruck", label:"Ελαφρύ Φορτηγό",  icon:"🚚" },
  { id:"truck",  label:"Βαρύ Φορτηγό",    icon:"🚛" },
  { id:"bus",    label:"Λεωφορείο",        icon:"🚌" },
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
const MONTHS_SHORT = ["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];

// ========== UTILITIES ==========
const uid  = () => Math.random().toString(36).substr(2,9);
const fmt  = (n,d=2) => (n!=null&&!isNaN(n)) ? (+n).toFixed(d) : "0.00";
const today = () => new Date().toISOString().split("T")[0];
const formatDate = (ds) => {
  if(!ds) return "--/--/--";
  const d = new Date(ds);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
};

// ========== THEME ==========
const DK = { bg:"#080810", sf:"#10101c", br:"#1e1e30", tx:"#eeeeff", mt:"#7777aa", ft:"#33334a", inp:"#0d0d1a", ib:"#1e1e30" };
const LT = { bg:"#f0e8db", sf:"#faf3e8", br:"#d4c0a8", tx:"#1a1510", mt:"#5c4e3d", ft:"#e0d0bc", inp:"#ffffff", ib:"#c4b098" };

// ========== DEFAULT DATA FACTORIES ==========
const defInfo = () => ({
  brand:"", model:"", year:"", cc:"", plate:"", chassis:"",
  insurance:"", insuranceExp:"", kteo:"", kek:"",
  tiresBrand:"", tiresSize:"", tiresDate:"", tiresNext:"",
  serviceDate:"", serviceNextDate:"", serviceKm:"", serviceNextKm:"", serviceNotes:"",
  driverMain:"", driverSecond:"",
});

const defV = (ov={}) => ({
  id:uid(), name:"ΝΕΟ ΟΧΗΜΑ", icon:"🚗", color:"#f97316",
  category:"car", fuelType:"diesel", fuelType2:"", unitMiles:false,
  info:defInfo(), ...ov,
});

const emptyFuel = (ft="diesel") => ({
  date:today(), fuelType:ft, ppl:"", total:"", odo:"", notes:"",
});
const emptyExp = () => ({
  date:today(), category:"tolls", label:"", amount:"", notes:"",
});

// ========== COMPONENTS ==========

function RoundCyberGauge({ value, min, max, color, label, unit, T }) {
  const pct = Math.min(1, Math.max(0,(value-min)/(max-min||1)));
  const R=42, cx=52, cy=52;
  const sA=Math.PI*0.7, eA=Math.PI*2.3;
  const vA=sA+(eA-sA)*pct;
  const nx=cx+(R-11)*Math.cos(vA), ny=cy+(R-11)*Math.sin(vA);
  return (
    <div style={{background:"#0a0a0f",borderRadius:"50%",padding:5,border:`2px solid ${color}`,width:"100%",aspectRatio:"1/1",position:"relative"}}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 1 1 ${cx+R*Math.cos(eA)} ${cy+R*Math.sin(eA)}`} fill="none" stroke={T.br} strokeWidth={6} strokeLinecap="round"/>
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 ${pct>0.5?1:0} 1 ${cx+R*Math.cos(vA)} ${cy+R*Math.sin(vA)}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2}/>
        <text x={cx} y={cy+5} textAnchor="middle" fill={color} fontSize={10} fontWeight="800">{fmt(value,1)}</text>
        <text x={cx} y={cy+15} textAnchor="middle" fill={T.mt} fontSize={5}>{unit}</text>
      </svg>
      <div style={{position:"absolute",bottom:8,width:"100%",textAlign:"center",fontSize:7,color,fontWeight:700}}>{label}</div>
    </div>
  );
}

function BarChart({ data, color, T }) {
  if(!data.length) return null;
  const max = Math.max(...data.map(d=>d.value), 0.01);
  const W=300, H=90;
  const bw = Math.floor(W/data.length)-4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+28}`} style={{overflow:"visible"}}>
      {data.map((d,i)=>{
        const h = (d.value/max)*H;
        const x = i*(W/data.length)+2;
        return (
          <g key={i}>
            <rect x={x} y={H-h} width={bw} height={Math.max(h,1)} fill={color} rx={3} opacity={0.8}/>
            <text x={x+bw/2} y={H+14} textAnchor="middle" fill={T.mt} fontSize={6.5}>{d.label}</text>
            {d.value>0&&<text x={x+bw/2} y={H-h-4} textAnchor="middle" fill={color} fontSize={6}>{d.value.toFixed(0)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Bottom-sheet modal
function Modal({ open, onClose, title, children, T }) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-end"}}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:T.sf,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",padding:"20px 16px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16}}>{title}</h3>
          <button onClick={onClose} style={{border:"none",background:"none",color:T.mt,fontSize:24,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;

  // Core data
  const [vehicles, setVehicles] = useState([{
    ...defV(), id:"v1", name:"ΕΤΑΙΡΙΚΟ", icon:"🚗", color:"#f97316", fuelType:"diesel"
  }]);
  const [vid,      setVid]      = useState("v1");
  const [entries,  setEntries]  = useState({});
  const [expenses, setExpenses] = useState({});

  // UI
  const [tab,        setTab]        = useState("home");
  const [fY,         setFY]         = useState(String(new Date().getFullYear()));
  const [fM,         setFM]         = useState("all");
  const [openMonths, setOpenMonths] = useState({});

  // Forms
  const [fuelForm, setFuelForm] = useState(emptyFuel());
  const [expForm,  setExpForm]  = useState(emptyExp());

  // Modals
  const [showAddV,     setShowAddV]     = useState(false);
  const [newV,         setNewV]         = useState(defV());
  const [showVInfo,    setShowVInfo]    = useState(false);
  const [editFuelE,    setEditFuelE]    = useState(null);
  const [editExpE,     setEditExpE]     = useState(null);

  const av  = vehicles.find(v=>v.id===vid) || vehicles[0];
  const col = av.color;

  // ---- Persist ----
  useEffect(()=>{
    try {
      const s = localStorage.getItem("fuellog_data");
      if(s){ const d=JSON.parse(s);
        if(d.vehicles) setVehicles(d.vehicles);
        if(d.entries)  setEntries(d.entries);
        if(d.expenses) setExpenses(d.expenses);
        if(d.vid)      setVid(d.vid);
      }
    } catch(e){}
  },[]);
  useEffect(()=>{
    localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,vid}));
  },[vehicles,entries,expenses,vid]);

  // Reset fuel form when vehicle changes
  useEffect(()=>{ setFuelForm(emptyFuel(av.fuelType)); },[vid]);

  // ---- Derived data ----
  const allFuel = useMemo(()=>(entries[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExp  = useMemo(()=>(expenses[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);

  const filtFuel = useMemo(()=>{
    let f=allFuel;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allFuel,fY,fM]);
  const filtExp = useMemo(()=>{
    let f=allExp;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allExp,fY,fM]);

  const stats = useMemo(()=>{
    const fuelSpent = filtFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const expSpent  = filtExp.reduce( (s,x)=>s+(parseFloat(x.amount)||0),0);
    const tL        = filtFuel.reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const wK = filtFuel.filter(x=>parseFloat(x.km)>0&&parseFloat(x.liters)>0);
    const aC = wK.length ? wK.reduce((s,x)=>s+(parseFloat(x.liters)/parseFloat(x.km)*100),0)/wK.length : 0;
    const wP = filtFuel.filter(x=>parseFloat(x.ppl)>0);
    const aP = wP.length ? +(wP.reduce((s,x)=>s+parseFloat(x.ppl),0)/wP.length).toFixed(3) : 0;
    return {fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP};
  },[filtFuel,filtExp]);

  const monthlyBarData = useMemo(()=>{
    const yF = fY==="all"?allFuel:allFuel.filter(e=>e.date.startsWith(fY));
    const yE = fY==="all"?allExp :allExp.filter(e=>e.date.startsWith(fY));
    return MONTHS_SHORT.map((label,i)=>{
      const m=String(i+1).padStart(2,"0");
      const v=yF.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.total)||0),0)
             +yE.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
      return {label,value:+v.toFixed(2)};
    });
  },[allFuel,allExp,fY]);

  const expByMonth = useMemo(()=>{
    const map={};
    allExp.forEach(e=>{
      const d=new Date(e.date);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k]) map[k]={key:k,label:`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,entries:[],total:0};
      map[k].entries.push(e);
      map[k].total+=(parseFloat(e.amount)||0);
    });
    return Object.values(map).sort((a,b)=>b.key.localeCompare(a.key));
  },[allExp]);

  const availYears = useMemo(()=>{
    const ys=new Set([String(new Date().getFullYear())]);
    [...allFuel,...allExp].forEach(e=>{ if(e.date) ys.add(e.date.slice(0,4)); });
    return [...ys].sort((a,b)=>b-a);
  },[allFuel,allExp]);

  const toggleMonth = k => setOpenMonths(p=>({...p,[k]:!p[k]}));

  // Fuel types available for this vehicle
  const vFuelTypes = [
    FTYPES.find(f=>f.id===av.fuelType),
    av.fuelType2 ? FTYPES.find(f=>f.id===av.fuelType2) : null,
  ].filter(Boolean);

  // ---- CRUD: Fuel ----
  const handleAddFuel = () => {
    const ppl=parseFloat(fuelForm.ppl), total=parseFloat(fuelForm.total);
    if(!total) return;
    const liters = ppl>0 ? +(total/ppl).toFixed(3) : 0;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{
      ...fuelForm, id:uid(), total, ppl:ppl||0, liters,
      odo:fuelForm.odo?parseFloat(fuelForm.odo):null,
    }]}));
    setFuelForm(emptyFuel(av.fuelType));
    setTab("history");
  };
  const handleDelFuel = id => setEntries(p=>({...p,[vid]:(p[vid]||[]).filter(e=>e.id!==id)}));
  const handleSaveEditFuel = () => {
    const ppl=parseFloat(editFuelE.ppl), total=parseFloat(editFuelE.total);
    const liters=ppl>0?+(total/ppl).toFixed(3):(parseFloat(editFuelE.liters)||0);
    setEntries(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editFuelE.id?{...editFuelE,total,ppl,liters,odo:editFuelE.odo?parseFloat(editFuelE.odo):null}:e)}));
    setEditFuelE(null);
  };

  // ---- CRUD: Expenses ----
  const handleAddExp = () => {
    if(!expForm.amount) return;
    const cat=EXPENSE_CATS.find(c=>c.id===expForm.category);
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{
      ...expForm, id:uid(), amount:parseFloat(expForm.amount),
      icon:cat?.icon||"💸", label:expForm.label||cat?.label||"Άλλο",
    }]}));
    setExpForm(emptyExp());
  };
  const handleDelExp = id => setExpenses(p=>({...p,[vid]:(p[vid]||[]).filter(e=>e.id!==id)}));
  const handleSaveEditExp = () => {
    const cat=EXPENSE_CATS.find(c=>c.id===editExpE.category);
    setExpenses(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editExpE.id?{...editExpE,amount:parseFloat(editExpE.amount),icon:cat?.icon||editExpE.icon}:e)}));
    setEditExpE(null);
  };

  // ---- CRUD: Vehicles ----
  const handleAddVehicle = () => {
    const v={...newV,id:uid()};
    setVehicles(p=>[...p,v]);
    setVid(v.id);
    setShowAddV(false);
    setNewV(defV());
    setTab("home");
  };
  const updateVInfo = (f,val) =>
    setVehicles(p=>p.map(v=>v.id===vid?{...v,info:{...v.info,[f]:val}}:v));

  // ---- Shared styles ----
  const IS = {
    width:"100%",padding:12,marginBottom:10,borderRadius:8,
    background:T.inp,color:T.tx,border:`1px solid ${T.ib}`,
    boxSizing:"border-box",fontSize:14,
  };
  const cardStyle = (extra={}) => ({
    background:T.sf,padding:14,borderRadius:14,
    border:`1px solid ${T.br}`,...extra,
  });

  const TABS = [
    {id:"home",    label:"Αρχική",    icon:"🏠"},
    {id:"fuel",    label:"Καύσιμο",   icon:"⛽"},
    {id:"expenses",label:"Έξοδα",     icon:"📋"},
    {id:"stats",   label:"Στατιστικά",icon:"📊"},
    {id:"history", label:"Ιστορικό",  icon:"📅"},
  ];

  // =================== RENDER ===================
  return (
    <div style={{backgroundColor:T.bg,color:T.tx,minHeight:"100vh",fontFamily:"sans-serif",paddingBottom:90}}>

      {/* ── Header ── */}
      <header style={{padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>⛽</span>
          <span style={{fontWeight:"bold",fontSize:17}}>FuelLog v2.4</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setShowVInfo(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>
            🔧 Στοιχεία
          </button>
          <button onClick={()=>setDark(!dark)} style={{border:"none",background:"none",fontSize:22,cursor:"pointer"}}>
            {dark?"☀️":"🌙"}
          </button>
        </div>
      </header>

      {/* ── Vehicle selector ── */}
      <div style={{display:"flex",gap:8,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,overflowX:"auto"}}>
        {vehicles.map(v=>(
          <button key={v.id} onClick={()=>setVid(v.id)} style={{
            padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",
            background:vid===v.id?v.color:T.br,
            color:vid===v.id?"#fff":T.mt,fontWeight:"bold",fontSize:13,
          }}>{v.icon} {v.name}</button>
        ))}
        <button onClick={()=>{setNewV(defV());setShowAddV(true);}} style={{
          padding:"6px 12px",borderRadius:20,border:`1px dashed ${T.mt}`,
          background:"none",color:T.mt,cursor:"pointer",fontSize:18,lineHeight:1,
        }}>+</button>
      </div>

      {/* ── Bottom nav ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",background:T.sf,borderTop:`1px solid ${T.br}`,padding:"5px 0",zIndex:100}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            border:"none",background:"none",cursor:"pointer",padding:"3px 6px",
            display:"flex",flexDirection:"column",alignItems:"center",gap:1,
            color:tab===t.id?col:T.mt,fontSize:9,fontWeight:tab===t.id?"bold":"normal",
          }}>
            <span style={{fontSize:19}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <main style={{padding:15}}>

        {/* ═══════════ HOME ═══════════ */}
        {tab==="home" && (
          <div>
            {/* Total summary */}
            <div style={{...cardStyle(),marginBottom:12}}>
              <div style={{fontSize:11,color:T.mt,marginBottom:4}}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ ΟΧΗΜΑΤΟΣ</div>
              <div style={{fontSize:28,fontWeight:"bold",color:"#eab308"}}>
                {fmt((entries[vid]||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0)+
                     (expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0))}€
              </div>
            </div>

            {/* Clickable shortcut cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div onClick={()=>setTab("history")} style={{...cardStyle({cursor:"pointer"})}}>
                <div style={{fontSize:10,color:T.mt}}>⛽ ΓΕΜΙΣΜΑΤΑ</div>
                <div style={{fontSize:24,fontWeight:"bold",color:"#3b82f6"}}>{(entries[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Ιστορικό</div>
              </div>
              <div onClick={()=>setTab("expenses")} style={{...cardStyle({cursor:"pointer"})}}>
                <div style={{fontSize:10,color:T.mt}}>📋 ΕΞΟΔΑ</div>
                <div style={{fontSize:24,fontWeight:"bold",color:"#e11d48"}}>{(expenses[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Έξοδα</div>
              </div>
            </div>

            {/* About */}
            <div style={{...cardStyle(),marginTop:4}}>
              <div style={{fontSize:13,fontWeight:"bold",marginBottom:8,color:col}}>ℹ️ Σχετικά</div>
              <div style={{fontSize:12,color:T.mt,lineHeight:1.7}}>
                Η <b style={{color:T.tx}}>FuelLog v2.4</b> παρακολουθεί γεμίσματα καυσίμου, διόδια,
                parking, service και όλα τα έξοδα για κάθε όχημά σας.
                Παρέχει στατιστικά, ιστορικό και γραφήματα.
              </div>
              <div style={{marginTop:12,fontSize:12,color:T.mt}}>
                Σχεδίαση &amp; Ανάπτυξη:<br/>
                <span style={{color:col,fontWeight:"bold",fontSize:14}}>Ταχμαζίδης Κ. Γιώργος</span>
                <span style={{color:T.mt}}> · v2.4</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ FUEL ═══════════ */}
        {tab==="fuel" && (
          <div style={{...cardStyle()}}>
            <h3 style={{marginTop:0,fontSize:16}}>⛽ Νέο Γέμισμα</h3>

            <input type="date" value={fuelForm.date}
              onChange={e=>setFuelForm({...fuelForm,date:e.target.value})} style={IS}/>

            {/* Fuel type — only vehicle's types */}
            <select value={fuelForm.fuelType}
              onChange={e=>setFuelForm({...fuelForm,fuelType:e.target.value})} style={IS}>
              {vFuelTypes.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>

            {/* Price per liter */}
            <input type="number" step="0.001" placeholder="⬡  Τιμή €/λίτρο" value={fuelForm.ppl}
              onChange={e=>setFuelForm({...fuelForm,ppl:e.target.value})} style={IS}/>

            {/* Total */}
            <input type="number" step="0.01" placeholder="💶  Συνολικό Ποσό €" value={fuelForm.total}
              onChange={e=>setFuelForm({...fuelForm,total:e.target.value})} style={IS}/>

            {/* ✅ Auto-calculated liters preview */}
            {fuelForm.ppl>0 && fuelForm.total>0 && (
              <div style={{
                background:dark?"#0d2010":"#d4eed8",color:"#10b981",
                padding:"9px 14px",borderRadius:8,marginBottom:10,
                fontSize:13,fontWeight:"bold",border:"1px solid #10b981",
              }}>
                🧮 Υπολογισμός: <b>{+(parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl)).toFixed(2)}</b> λίτρα
              </div>
            )}

            <input type="number" placeholder="🔢  Odometer (Συνολικά χλμ)" value={fuelForm.odo}
              onChange={e=>setFuelForm({...fuelForm,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder="📝  Σημειώσεις (προαιρετικό)" value={fuelForm.notes}
              onChange={e=>setFuelForm({...fuelForm,notes:e.target.value})} style={IS}/>

            <button onClick={handleAddFuel} style={{
              width:"100%",padding:15,background:col,color:"#fff",
              border:"none",borderRadius:10,fontWeight:"bold",fontSize:16,cursor:"pointer",
            }}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {/* ═══════════ EXPENSES ═══════════ */}
        {tab==="expenses" && (
          <div>
            {/* Add form */}
            <div style={{...cardStyle(),marginBottom:16}}>
              <h3 style={{marginTop:0,fontSize:15}}>➕ Νέο Έξοδο</h3>
              <input type="date" value={expForm.date}
                onChange={e=>setExpForm({...expForm,date:e.target.value})} style={IS}/>
              <select value={expForm.category}
                onChange={e=>setExpForm({...expForm,category:e.target.value})} style={IS}>
                {EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <input type="text" placeholder="Τοποθεσία / Περιγραφή" value={expForm.label}
                onChange={e=>setExpForm({...expForm,label:e.target.value})} style={IS}/>
              <input type="number" step="0.01" placeholder="Ποσό €" value={expForm.amount}
                onChange={e=>setExpForm({...expForm,amount:e.target.value})} style={IS}/>
              <button onClick={handleAddExp} style={{
                width:"100%",padding:12,background:col,color:"#fff",
                border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",
              }}>ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>

            {expByMonth.length===0 && (
              <div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν έξοδα ακόμα.</div>
            )}

            {/* ✅ Collapsed months */}
            {expByMonth.map(({key,label,entries:me,total})=>(
              <div key={key} style={{marginBottom:8}}>
                <div onClick={()=>toggleMonth(key)} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"12px 14px",cursor:"pointer",userSelect:"none",
                  background:openMonths[key]?T.br:T.sf,
                  border:`1px solid ${T.br}`,
                  borderRadius:openMonths[key]?"12px 12px 0 0":12,
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>📅</span>
                    <span style={{fontWeight:"bold",fontSize:14}}>{label}</span>
                    {/* ✅ CONTRAST FIX: crisp badge */}
                    <span style={{
                      fontSize:11,fontWeight:"bold",
                      background:dark?"#2a2a50":"#b8a48a",
                      color:dark?"#ccccff":"#2a1a08",
                      padding:"2px 8px",borderRadius:10,
                    }}>{me.length}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#e07b54",fontWeight:"bold",fontSize:15}}>-{fmt(total)}€</span>
                    <span style={{color:T.mt,fontSize:11}}>{openMonths[key]?"▲":"▼"}</span>
                  </div>
                </div>

                {openMonths[key] && (
                  <div style={{border:`1px solid ${T.br}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
                    {me.slice().reverse().map((e,i)=>{
                      const cat=EXPENSE_CATS.find(c=>c.id===e.category);
                      return (
                        <div key={e.id} style={{
                          display:"flex",justifyContent:"space-between",alignItems:"center",
                          padding:"10px 14px",
                          background:i%2===0?T.sf:T.bg,
                          borderBottom:i<me.length-1?`1px solid ${T.ft}`:"none",
                        }}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:20}}>{cat?.icon||e.icon||"💸"}</span>
                            <div>
                              <div style={{fontWeight:"bold",fontSize:13}}>{e.label||cat?.label}</div>
                              <div style={{fontSize:11,color:T.mt}}>{formatDate(e.date)}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontWeight:"bold",color:"#e11d48",fontSize:14}}>-{fmt(e.amount)}€</span>
                            <button onClick={()=>setEditExpE({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
                            <button onClick={()=>handleDelExp(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16,padding:2}}>✕</button>
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

        {/* ═══════════ STATS ═══════════ */}
        {tab==="stats" && (
          <div>
            {/* ✅ Year + Month filter */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              <select value={fY} onChange={e=>setFY(e.target.value)} style={IS}>
                <option value="all">Όλα τα έτη</option>
                {availYears.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fM} onChange={e=>setFM(e.target.value)} style={IS}>
                <option value="all">Όλοι οι μήνες</option>
                {MONTHS_SHORT.map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}
              </select>
            </div>

            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[
                {label:"ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ",value:fmt(stats.totalSpent)+"€",color:"#eab308"},
                {label:"ΚΑΥΣΙΜΑ",        value:fmt(stats.fuelSpent)+"€", color:"#3b82f6"},
                {label:"ΑΛΛΑ ΕΞΟΔΑ",     value:fmt(stats.expSpent)+"€",  color:"#e11d48"},
                {label:"ΣΥΝΟΛΟ ΛΙΤΡΩΝ",  value:fmt(stats.tL)+" L",       color:"#10b981"},
              ].map(({label,value,color})=>(
                <div key={label} style={cardStyle()}>
                  <div style={{fontSize:9,color:T.mt,marginBottom:3}}>{label}</div>
                  <div style={{fontSize:18,fontWeight:"bold",color}}>{value}</div>
                </div>
              ))}
            </div>

            {/* Gauges */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <RoundCyberGauge value={stats.aC} min={0} max={15}  color="#10b981" label="ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>
              <RoundCyberGauge value={stats.aP} min={1} max={2.5} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ/L"     unit="€/L"     T={T}/>
            </div>

            {/* ✅ Bar chart - monthly spending */}
            <div style={cardStyle()}>
              <div style={{fontSize:12,fontWeight:"bold",marginBottom:10,color:T.tx}}>
                📊 Μηνιαία Έξοδα · {fY!=="all"?fY:"Όλα τα έτη"}
              </div>
              <BarChart data={monthlyBarData} color={col} T={T}/>
            </div>
          </div>
        )}

        {/* ═══════════ HISTORY ═══════════ */}
        {tab==="history" && (
          <div>
            <h3 style={{margin:"0 0 14px"}}>⛽ Ιστορικό Καυσίμων</h3>
            {allFuel.length===0 && (
              <div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν εγγραφές ακόμα.</div>
            )}
            {allFuel.slice().reverse().map((e,idx,arr)=>{
              const nxt=arr[idx+1];
              // ✅ FIX: != null (handles odo=0 correctly)
              const diffKm=(e.odo!=null&&nxt?.odo!=null)?(e.odo-nxt.odo):null;
              const ftype=FTYPES.find(f=>f.id===e.fuelType);
              return (
                <div key={e.id} style={{
                  background:T.sf,padding:12,borderRadius:12,marginBottom:10,
                  border:`1px solid ${T.br}`,borderLeft:`4px solid ${col}`,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:"bold"}}>{formatDate(e.date)}</span>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {/* ✅ FIX: only show if > 0 */}
                      {diffKm!=null&&diffKm>0&&(
                        <span style={{fontSize:11,color:"#10b981"}}>📍 {diffKm} χλμ</span>
                      )}
                      <span style={{fontSize:11,color:T.mt}}>
                        {ftype?`${ftype.icon} ${ftype.label}`:e.fuelType}
                      </span>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{fontSize:15,fontWeight:"bold"}}>{fmt(e.liters,2)} L</span>
                      <span style={{fontSize:12,marginLeft:8,color:T.mt}}>{fmt(e.ppl,3)} €/L</span>
                      {e.odo&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>ODO: {e.odo} km</div>}
                      {e.notes&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>📝 {e.notes}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:16,fontWeight:"bold",color:"#ef4444"}}>{fmt(e.total)}€</span>
                      <button onClick={()=>setEditFuelE({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
                      <button onClick={()=>handleDelFuel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16}}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══════════ MODAL: ADD VEHICLE ══════════ */}
      <Modal open={showAddV} onClose={()=>setShowAddV(false)} title="➕ Νέο Όχημα" T={T}>
        <div>
          <input type="text" placeholder="Όνομα (π.χ. ΕΤΑΙΡΙΚΟ, ΤΑΞΙ)" value={newV.name}
            onChange={e=>setNewV({...newV,name:e.target.value})} style={IS}/>

          <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΚΑΤΗΓΟΡΙΑ</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
            {VCATS.map(c=>(
              <button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icon})} style={{
                padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,
                background:newV.category===c.id?col:T.br,
                color:newV.category===c.id?"#fff":T.mt,
              }}>{c.icon} {c.label}</button>
            ))}
          </div>

          <input type="text" placeholder="Αρ. Πινακίδας" value={newV.info.plate}
            onChange={e=>setNewV({...newV,info:{...newV.info,plate:e.target.value}})} style={IS}/>

          <div style={{fontSize:11,color:T.mt,marginBottom:6}}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</div>
          <select value={newV.fuelType} onChange={e=>setNewV({...newV,fuelType:e.target.value})} style={IS}>
            {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
          </select>

          <div style={{fontSize:11,color:T.mt,marginBottom:6}}>2ο ΚΑΥΣΙΜΟ (για diesel+LPG κ.λπ.)</div>
          <select value={newV.fuelType2} onChange={e=>setNewV({...newV,fuelType2:e.target.value})} style={IS}>
            <option value="">— Κανένα —</option>
            {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
          </select>

          <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΧΡΩΜΑ</div>
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            {FUEL_COLORS.map(c=>(
              <div key={c} onClick={()=>setNewV({...newV,color:c})} style={{
                width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",
                border:newV.color===c?"3px solid #fff":"3px solid transparent",
                boxSizing:"border-box",
              }}/>
            ))}
          </div>

          <button onClick={handleAddVehicle} style={{
            width:"100%",padding:14,background:newV.color,color:"#fff",
            border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",
          }}>ΠΡΟΣΘΗΚΗ ΟΧΗΜΑΤΟΣ</button>
        </div>
      </Modal>

      {/* ══════════ MODAL: VEHICLE INFO ══════════ */}
      <Modal open={showVInfo} onClose={()=>setShowVInfo(false)} title={`${av.icon} ${av.name} · Στοιχεία`} T={T}>
        <div>
          {[
            {f:"brand",        label:"Μάρκα",                    ph:"Toyota, BMW…",  type:"text"},
            {f:"model",        label:"Μοντέλο",                  ph:"Corolla, X5…",  type:"text"},
            {f:"year",         label:"Έτος",                     ph:"2020",           type:"number"},
            {f:"cc",           label:"Κυβικά (cc)",              ph:"1600",           type:"number"},
            {f:"plate",        label:"Αρ. Πινακίδας",            ph:"ΑΒΓ-1234",       type:"text"},
            {f:"chassis",      label:"Αρ. Πλαισίου (VIN)",       ph:"WBAFR7…",       type:"text"},
            {f:"insurance",    label:"Αρ. Ασφαλιστηρίου",        ph:"",               type:"text"},
            {f:"insuranceExp", label:"Λήξη Ασφάλειας",           ph:"",               type:"date"},
            {f:"kteo",         label:"Επόμενο ΚΤΕΟ",             ph:"",               type:"date"},
            {f:"kek",          label:"Επόμενο ΚΕΚ",              ph:"",               type:"date"},
            {f:"tiresBrand",   label:"Μάρκα Ελαστικών",          ph:"Michelin…",     type:"text"},
            {f:"tiresSize",    label:"Διαστάσεις Ελαστικών",     ph:"195/65R15",      type:"text"},
            {f:"tiresDate",    label:"Τελευταία Αλλαγή Ελαστ.",  ph:"",               type:"date"},
            {f:"tiresNext",    label:"Επόμενη Αλλαγή Ελαστ.",    ph:"",               type:"date"},
            {f:"serviceDate",  label:"Τελευταίο Service",        ph:"",               type:"date"},
            {f:"serviceNextDate",label:"Επόμενο Service (ημ.)",  ph:"",               type:"date"},
            {f:"serviceKm",    label:"Service στα (χλμ)",        ph:"150000",         type:"number"},
            {f:"serviceNextKm",label:"Επόμενο Service (χλμ)",    ph:"165000",         type:"number"},
            {f:"serviceNotes", label:"Σημ. Service",             ph:"Αλλαγή λαδιών…",type:"text"},
            {f:"driverMain",   label:"Κύριος Οδηγός",            ph:"Ονοματεπώνυμο",  type:"text"},
            {f:"driverSecond", label:"2ος Οδηγός",               ph:"Ονοματεπώνυμο",  type:"text"},
          ].map(({f,label,ph,type})=>(
            <div key={f} style={{marginBottom:12}}>
              <div style={{fontSize:10,color:T.mt,marginBottom:3,fontWeight:"bold"}}>{label.toUpperCase()}</div>
              <input type={type} placeholder={ph} value={(av.info||{})[f]||""}
                onChange={e=>updateVInfo(f,e.target.value)}
                style={{...IS,marginBottom:0}}/>
            </div>
          ))}
        </div>
      </Modal>

      {/* ══════════ MODAL: EDIT FUEL ══════════ */}
      <Modal open={!!editFuelE} onClose={()=>setEditFuelE(null)} title="✏️ Επεξεργασία Γεμίσματος" T={T}>
        {editFuelE && (
          <div>
            <input type="date" value={editFuelE.date} onChange={e=>setEditFuelE({...editFuelE,date:e.target.value})} style={IS}/>
            <select value={editFuelE.fuelType} onChange={e=>setEditFuelE({...editFuelE,fuelType:e.target.value})} style={IS}>
              {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <input type="number" step="0.001" placeholder="Τιμή €/λίτρο" value={editFuelE.ppl}
              onChange={e=>setEditFuelE({...editFuelE,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="Συνολικό Ποσό €" value={editFuelE.total}
              onChange={e=>setEditFuelE({...editFuelE,total:e.target.value})} style={IS}/>
            {editFuelE.ppl>0&&editFuelE.total>0&&(
              <div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,fontWeight:"bold"}}>
                🧮 {+(parseFloat(editFuelE.total)/parseFloat(editFuelE.ppl)).toFixed(2)} λίτρα
              </div>
            )}
            <input type="number" placeholder="Odometer" value={editFuelE.odo||""}
              onChange={e=>setEditFuelE({...editFuelE,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder="Σημειώσεις" value={editFuelE.notes||""}
              onChange={e=>setEditFuelE({...editFuelE,notes:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditFuel} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>
              ΑΠΟΘΗΚΕΥΣΗ
            </button>
          </div>
        )}
      </Modal>

      {/* ══════════ MODAL: EDIT EXPENSE ══════════ */}
      <Modal open={!!editExpE} onClose={()=>setEditExpE(null)} title="✏️ Επεξεργασία Εξόδου" T={T}>
        {editExpE && (
          <div>
            <input type="date" value={editExpE.date} onChange={e=>setEditExpE({...editExpE,date:e.target.value})} style={IS}/>
            <select value={editExpE.category} onChange={e=>setEditExpE({...editExpE,category:e.target.value})} style={IS}>
              {EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input type="text" placeholder="Τοποθεσία / Περιγραφή" value={editExpE.label||""}
              onChange={e=>setEditExpE({...editExpE,label:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="Ποσό €" value={editExpE.amount}
              onChange={e=>setEditExpE({...editExpE,amount:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditExp} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>
              ΑΠΟΘΗΚΕΥΣΗ
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
}
