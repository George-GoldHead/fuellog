import { useState, useMemo, useRef, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];
const VCATS = [
  { id:"car",  label:"Επιβατικό", icons:["🚗","🚙"] },
  { id:"moto", label:"Μηχανή",    icons:["🏍️"] },
  { id:"van",  label:"Βαν/Βαρύ",  icons:["🚐","🚚","🚛","🚜"] },
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
  { id:"shell",    label:"Shell",    bg:"#f5d000", fg:"#000" },
  { id:"bp",       label:"BP",       bg:"#00a650", fg:"#fff" },
  { id:"eko",      label:"ΕΚΟ",      bg:"#e30613", fg:"#fff" },
  { id:"revoil",   label:"Revoil",   bg:"#0055a5", fg:"#fff" },
  { id:"avin",     label:"Avin",     bg:"#ff6600", fg:"#fff" },
  { id:"cyclon",   label:"Cyclon",   bg:"#003087", fg:"#fff" },
  { id:"hellenic", label:"Ελληνικά", bg:"#00529b", fg:"#fff" },
  { id:"other",    label:"Άλλο",     bg:"#555",    fg:"#fff" },
];
// Reminders: type drives what fields appear
const RTYPES = [
  { id:"service",   label:"Service",         icon:"🔧", hasDate:true,  hasKm:true  },
  { id:"kteo",      label:"ΚΤΕΟ",            icon:"📋", hasDate:true,  hasKm:false },
  { id:"emissions", label:"Κάρτα Καυσαερίων",icon:"💨", hasDate:true,  hasKm:false },
  { id:"tyres",     label:"Αλλ. Ελαστικών",  icon:"🔄", hasDate:false, hasKm:true  },
  { id:"insurance", label:"Ασφάλεια",        icon:"🛡️", hasDate:true,  hasKm:false },
  { id:"custom",    label:"Άλλο",            icon:"📌", hasDate:true,  hasKm:true  },
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
  { id:"custom",   label:"Άλλο",            icon:"💸" },
];
const MONTHS = ["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];
const KM2MI = 0.621371;
const uid  = () => Math.random().toString(36).substr(2,9);
const fmt  = (n,d=2) => n!=null ? (+n).toFixed(d) : "—";
const today = () => new Date().toISOString().split("T")[0];
const ddiff = ds => Math.round((new Date(ds)-new Date())/86400000);

// ── Themes ───────────────────────────────────────────────────────────────────
const DK = { bg:"#0f0f13", sf:"#1a1a24", br:"#2a2a38", tx:"#e8e8f0", mt:"#777", ft:"#444", inp:"#0f0f13", ib:"#2a2a38" };
const LT = { bg:"#e8e8ed", sf:"#f2f2f5", br:"#d0d0d8", tx:"#1a1a1a", mt:"#3a3a3a", ft:"#777", inp:"#ffffff", ib:"#b8b8c0" };

// ── Default state factories ──────────────────────────────────────────────────
const defV = () => ({
  id:"v1", name:"Αυτοκίνητο 1", icon:"🚗", color:"#f97316", category:"car",
  info:{ plate:"", chassis:"", brand:"", model:"", year:"", fuelType:"unleaded95" },
  reminders:[], unitMiles:false,
});
const emptyFuel = (lastFuelType="unleaded95", lastStId="", lastStLabel="") => ({
  date:today(), fuelType:lastFuelType,
  liters:"", ppl:"", total:"",
  km:"", odo:"", notes:"",
  stId:lastStId, stCust:"", stLabel:lastStLabel,
  dual:false, lpgL:"", lpgP:"", lpgT:"",
});
const emptyExpense = () => ({
  date:today(), catId:"oil", customCat:"", amount:"", notes:"",
});

// ── SVG Sparkline ────────────────────────────────────────────────────────────
function SVGChart({ points, color, type="line" }) {
  if (!points || points.length < 2) return null;
  const W=400, H=80, P=6;
  const vals = points.map(p=>p.y);
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV-minV||1;
  const sx = i => P + (i/(points.length-1))*(W-P*2);
  const sy = v => H-P-((v-minV)/range)*(H-P*2);
  if (type==="bar") {
    const bw = Math.max(3,(W-P*2)/points.length-3);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:80,display:"block"}}>
        {points.map((p,i)=><rect key={i} x={sx(i)-bw/2} y={sy(p.y)} width={bw} height={H-P-sy(p.y)} fill={color} opacity={0.85} rx={2}/>)}
      </svg>
    );
  }
  const d = points.map((p,i)=>`${i===0?"M":"L"}${sx(i)},${sy(p.y)}`).join(" ");
  const area = `${d} L${sx(points.length-1)},${H-P} L${P},${H-P} Z`;
  const gid = `g${color.replace("#","")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:80,display:"block"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
      {points.map((p,i)=><circle key={i} cx={sx(i)} cy={sy(p.y)} r={3} fill={color}/>)}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, type="line", T }) {
  const pts = data.filter(d=>d[dk]!=null).map(d=>({x:d.date,y:d[dk]}));
  if (pts.length < 2) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:6}}>{title}</div>
      <div style={{background:T.bg,borderRadius:12,padding:"10px 8px 4px",border:`1px solid ${T.br}`}}>
        <SVGChart points={pts} color={color} type={type}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"2px 4px 0"}}>
          <span style={{fontSize:10,color:T.ft}}>{pts[0].x}</span>
          <span style={{fontSize:10,color:T.ft}}>{pts[pts.length-1].x}</span>
        </div>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, T, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.sf,borderRadius:"20px 20px 0 0",padding:22,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${T.br}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontWeight:700,fontSize:16,color:T.tx}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mt,fontSize:24,lineHeight:1,cursor:"pointer"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Station Picker Modal ─────────────────────────────────────────────────────
function StationModal({ current, onSelect, onClose, T }) {
  const [custom, setCustom] = useState(current.stId==="other" ? current.stLabel : "");
  return (
    <Modal title="🏪 Επιλογή Πρατηρίου" onClose={onClose} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {STATIONS.map(s=>(
          <button key={s.id} onClick={()=>{ if(s.id!=="other") onSelect(s.id,s.label); else onSelect("other", custom||"Άλλο"); }}
            style={{padding:"10px 8px",border:`2px solid ${current.stId===s.id?s.bg:T.br}`,borderRadius:10,
              background:current.stId===s.id?s.bg:"transparent",color:current.stId===s.id?s.fg:T.tx,
              fontSize:13,fontWeight:current.stId===s.id?700:400,cursor:"pointer"}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4}}>Ή γράψε το όνομα</label>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="π.χ. Μαμούθ Βενζινάδικο..."
          style={{width:"100%",padding:"10px 12px",background:T.inp,border:`1px solid ${T.ib}`,borderRadius:10,color:T.tx,fontSize:14,boxSizing:"border-box"}}/>
      </div>
      {custom.trim() && (
        <button onClick={()=>onSelect("other",custom.trim())}
          style={{width:"100%",padding:11,background:T.bg,border:`1px solid ${T.br}`,borderRadius:10,color:T.tx,fontSize:14,cursor:"pointer",marginBottom:8}}>
          ✓ Χρήση: "{custom.trim()}"
        </button>
      )}
      {current.stId && (
        <button onClick={()=>onSelect("","")}
          style={{width:"100%",padding:11,background:"transparent",border:`1px solid ${T.br}`,borderRadius:10,color:T.mt,fontSize:13,cursor:"pointer"}}>
          ✕ Καμία επιλογή
        </button>
      )}
    </Modal>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;

  const [vehicles, setVehicles]   = useState([defV()]);
  const [vid, setVid]             = useState("v1");
  const [entries, setEntries]     = useState({});   // fuel entries per vehicle
  const [expenses, setExpenses]   = useState({});   // expense entries per vehicle
  const [tab, setTab]             = useState("add");
  const [modal, setModal]         = useState(null);
  const [newV, setNewV]           = useState({name:"",icon:"🚗",category:"car"});
  const [fY, setFY]               = useState("all");
  const [fM, setFM]               = useState("all");
  const fref = useRef();

  // Last-used memory per vehicle
  const [lastFuel, setLastFuel] = useState({});   // vid -> { fuelType, stId, stLabel }

  const av  = vehicles.find(v=>v.id===vid)||vehicles[0];
  const col = av?.color||"#f97316";
  const mi  = av?.unitMiles||false;
  const dl  = mi?"μίλια":"km";
  const lf  = lastFuel[vid]||{fuelType:"unleaded95",stId:"",stLabel:""};

  const [fuelForm,    setFuelForm]    = useState(()=>emptyFuel(lf.fuelType,lf.stId,lf.stLabel));
  const [expenseForm, setExpenseForm] = useState(emptyExpense());
  const [showStPicker, setShowStPicker] = useState(false);

  // Sync fuelForm when switching vehicles
  const switchVehicle = id => {
    setVid(id);
    const lf2 = lastFuel[id]||{fuelType:"unleaded95",stId:"",stLabel:""};
    setFuelForm(emptyFuel(lf2.fuelType,lf2.stId,lf2.stLabel));
  };

  const allFuel    = useMemo(()=>(entries[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExpense = useMemo(()=>(expenses[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);
  const years      = useMemo(()=>[...new Set(allFuel.map(e=>e.date.slice(0,4)))].sort().reverse(),[allFuel]);
  const filtFuel   = useMemo(()=>{
    let f=allFuel;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allFuel,fY,fM]);
  const filtExp = useMemo(()=>{
    let f=allExpense;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allExpense,fY,fM]);
  const dueR = useMemo(()=>(av?.reminders||[]).filter(r=>{
    if(r.dueDate && ddiff(r.dueDate)<=30) return true;
    return false;
  }),[av]);

  // ── Fuel form ──────────────────────────────────────────────────────────────
  const hff = (field,val) => {
    const u={...fuelForm,[field]:val};
    if(field==="liters"&&u.ppl)                    u.total=(parseFloat(val||0)*parseFloat(u.ppl)).toFixed(2);
    if(field==="ppl"&&u.liters)                    u.total=(parseFloat(u.liters)*parseFloat(val||0)).toFixed(2);
    if(field==="total"&&u.liters&&+u.liters>0)     u.ppl  =(parseFloat(val||0)/parseFloat(u.liters)).toFixed(3);
    if(field==="lpgL"&&u.lpgP)                     u.lpgT =(parseFloat(val||0)*parseFloat(u.lpgP)).toFixed(2);
    if(field==="lpgP"&&u.lpgL)                     u.lpgT =(parseFloat(u.lpgL)*parseFloat(val||0)).toFixed(2);
    if(field==="lpgT"&&u.lpgL&&+u.lpgL>0)          u.lpgP =(parseFloat(val||0)/parseFloat(u.lpgL)).toFixed(3);
    setFuelForm(u);
  };

  const submitFuel = () => {
    if(!fuelForm.date||(!fuelForm.liters&&!fuelForm.total)) return;
    const liters=parseFloat(fuelForm.liters)||null;
    const total =parseFloat(fuelForm.total)||null;
    const ppl   =parseFloat(fuelForm.ppl)||(liters&&total?total/liters:null);
    const kmV   =parseFloat(fuelForm.km)||null;
    const kmS   =mi&&kmV?kmV/KM2MI:kmV;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{
      id:uid(),date:fuelForm.date,fuelType:fuelForm.fuelType,liters,ppl,total,
      km:kmS,odo:parseFloat(fuelForm.odo)||null,notes:fuelForm.notes,
      stId:fuelForm.stId,station:fuelForm.stLabel,dual:fuelForm.dual,
      lpgL:parseFloat(fuelForm.lpgL)||null,lpgP:parseFloat(fuelForm.lpgP)||null,lpgT:parseFloat(fuelForm.lpgT)||null,
    }]}));
    const mem={fuelType:fuelForm.fuelType,stId:fuelForm.stId,stLabel:fuelForm.stLabel};
    setLastFuel(p=>({...p,[vid]:mem}));
    setFuelForm(emptyFuel(fuelForm.fuelType,fuelForm.stId,fuelForm.stLabel));
  };

  const submitExpense = () => {
    if(!expenseForm.date||!expenseForm.amount) return;
    const cat = EXPENSE_CATS.find(c=>c.id===expenseForm.catId);
    const label = expenseForm.catId==="custom" ? (expenseForm.customCat||"Άλλο") : cat?.label||"";
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{
      id:uid(),date:expenseForm.date,catId:expenseForm.catId,label,
      amount:parseFloat(expenseForm.amount)||0,notes:expenseForm.notes,
    }]}));
    setExpenseForm(emptyExpense());
  };

  const delFuel    = id => setEntries(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));
  const delExpense = id => setExpenses(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const addVeh = () => {
    if(!newV.name.trim()) return;
    const v={id:uid(),name:newV.name.trim(),icon:newV.icon,color:FUEL_COLORS[vehicles.length%FUEL_COLORS.length],
      category:newV.category,info:{plate:"",chassis:"",brand:"",model:"",year:"",fuelType:"unleaded95"},reminders:[],unitMiles:false};
    setVehicles(p=>[...p,v]); switchVehicle(v.id);
    setNewV({name:"",icon:"🚗",category:"car"}); setModal(null);
  };
  const upI = (f,v) => setVehicles(p=>p.map(x=>x.id===vid?{...x,info:{...x.info,[f]:v}}:x));
  const upV = (f,v) => setVehicles(p=>p.map(x=>x.id===vid?{...x,[f]:v}:x));

  // ── Reminders ──────────────────────────────────────────────────────────────
  const addR = type => {
    const rt=RTYPES.find(r=>r.id===type);
    setVehicles(p=>p.map(v=>v.id===vid?{...v,reminders:[...(v.reminders||[]),
      {id:uid(),type,label:rt.label,icon:rt.icon,dueDate:"",dueKm:"",notes:""}]}:v));
  };
  const upR  = (rid,f,v) => setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.map(r=>r.id===rid?{...r,[f]:v}:r)}:x));
  const delR = rid => setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.filter(r=>r.id!==rid)}:x));
  const rst  = r => {
    if(!r.dueDate) return null;
    const d=ddiff(r.dueDate);
    if(d<0)   return {c:"#ef4444",l:`Εκπρόθεσμο ${Math.abs(d)}μ`};
    if(d<=30) return {c:"#f97316",l:`Σε ${d} μέρες`};
    return {c:"#10b981",l:`Σε ${d} μέρες`};
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(()=>{
    if(!filtFuel.length&&!filtExp.length) return null;
    const wC=filtFuel.filter(x=>x.total), wL=filtFuel.filter(x=>x.liters);
    const wK=filtFuel.filter(x=>x.km&&x.liters), wP=filtFuel.filter(x=>x.ppl);
    const fuelSpent=wC.reduce((s,x)=>s+x.total,0)+filtFuel.filter(x=>x.lpgT).reduce((s,x)=>s+x.lpgT,0);
    const expSpent=filtExp.reduce((s,x)=>s+x.amount,0);
    const tL=wL.reduce((s,x)=>s+x.liters,0);
    const aP=wP.length?wP.reduce((s,x)=>s+x.ppl,0)/wP.length:null;
    const aC=wK.length?wK.reduce((s,x)=>s+(x.liters/x.km*100),0)/wK.length:null;
    const pr=wP.map(x=>x.ppl);
    const sc={};filtFuel.forEach(x=>{if(x.station)sc[x.station]=(sc[x.station]||0)+1;});
    const tSt=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const dE=filtFuel.filter(x=>x.dual&&x.lpgL&&x.km);
    const aLC=dE.length?dE.reduce((s,x)=>s+(x.lpgL/x.km*100),0)/dE.length:null;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aP,aC,
      minP:pr.length?Math.min(...pr):null,maxP:pr.length?Math.max(...pr):null,tSt,aLC};
  },[filtFuel,filtExp]);

  const cd = useMemo(()=>filtFuel.map(x=>({
    date:x.date.slice(5),
    price:x.ppl?+x.ppl.toFixed(3):null,
    cons:x.km&&x.liters?+(x.liters/x.km*100).toFixed(1):null,
    cost:x.total?+x.total.toFixed(2):null,
    lpgC:x.dual&&x.lpgL&&x.km?+(x.lpgL/x.km*100).toFixed(1):null,
  })),[filtFuel]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const exJson = () => {
    const blob=new Blob([JSON.stringify({vehicles,entries,expenses,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`fuellog_backup_${today()}.json`;a.click();
  };
  const exCsv = () => {
    const rows=allFuel.map(x=>({
      "Ημερομηνία":x.date,"Καύσιμο":FTYPES.find(f=>f.id===x.fuelType)?.label||x.fuelType,
      "Λίτρα":x.liters||"","Τιμή/L":x.ppl?fmt(x.ppl,3):"","Σύνολο":x.total?fmt(x.total):"",
      [dl]:x.km?(mi?fmt(x.km*KM2MI,1):fmt(x.km,1)):"","Odo":x.odo||"",
      [`L/100${dl}`]:x.km&&x.liters?fmt(x.liters/x.km*100,1):"",
      "Πρατήριο":x.station||"","Σημ.":x.notes||"",
    }));
    if(!rows.length) return;
    const blob=new Blob([[Object.keys(rows[0]).join(","),...rows.map(r=>Object.values(r).map(v=>`"${v}"`).join(","))].join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`fuellog_${today()}.csv`;a.click();
  };
  const imJson = ev => {
    const file=ev.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=e=>{try{
      const d=JSON.parse(e.target.result);
      if(d.vehicles&&d.entries){setVehicles(d.vehicles);setEntries(d.entries);setExpenses(d.expenses||{});switchVehicle(d.vehicles[0]?.id);alert("✅ Επιτυχής εισαγωγή!");}
      else alert("❌ Μη έγκυρο αρχείο.");
    }catch{alert("❌ Σφάλμα.");}};
    r.readAsText(file); ev.target.value="";
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const iS  = on => ({width:"100%",padding:"10px 12px",background:T.inp,border:`1px solid ${on?col+"99":T.ib}`,borderRadius:10,color:T.tx,fontSize:14,boxSizing:"border-box"});
  const lS  = {display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4};
  const cardS = {background:T.bg,borderRadius:13,padding:13,border:`1px solid ${col}22`};

  const FBar = () => (
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <select value={fY} onChange={e=>setFY(e.target.value)} style={{padding:"8px 10px",background:T.inp,border:`1px solid ${col}44`,borderRadius:9,color:T.tx,fontSize:13,flex:1}}>
        <option value="all">Όλα τα χρόνια</option>
        {years.map(y=><option key={y} value={y}>{y}</option>)}
      </select>
      <select value={fM} onChange={e=>setFM(e.target.value)} style={{padding:"8px 10px",background:T.inp,border:`1px solid ${col}44`,borderRadius:9,color:T.tx,fontSize:13,flex:1}}>
        <option value="all">Όλοι οι μήνες</option>
        {MONTHS.map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
      </select>
    </div>
  );

  const curSt = STATIONS.find(s=>s.id===fuelForm.stId);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:T.bg,color:T.tx,maxWidth:480,margin:"0 auto"}}>

      {/* ── HEADER ── */}
      <div style={{background:`linear-gradient(135deg,${col}20,${T.bg})`,borderBottom:`1px solid ${col}30`,padding:"14px 14px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:26}}>⛽</span>
            <div>
              <div style={{fontSize:19,fontWeight:700,letterSpacing:"-0.5px",color:T.tx}}>FuelLog</div>
              <div style={{fontSize:10,color:T.mt,letterSpacing:1}}>ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΚΑΥΣΙΜΩΝ</div>
            </div>
          </div>
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            <button onClick={()=>setDark(d=>!d)} style={{padding:"6px 10px",background:T.sf,border:`1px solid ${T.br}`,borderRadius:9,fontSize:15,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
            {dueR.length>0&&<button onClick={()=>setModal("rem")} style={{padding:"6px 9px",background:"#ef444422",border:"1px solid #ef4444",borderRadius:9,color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔔{dueR.length}</button>}
            <button onClick={()=>setModal("rem")}  style={{padding:"6px 9px",background:T.sf,border:`1px solid ${T.br}`,borderRadius:9,color:T.mt,cursor:"pointer",fontSize:13}}>🔔</button>
            <button onClick={()=>setModal("vi")}   style={{padding:"6px 9px",background:T.sf,border:`1px solid ${col}44`,borderRadius:9,color:col,cursor:"pointer",fontSize:13}}>📋</button>
            <button onClick={()=>setModal("bk")}   style={{padding:"6px 9px",background:T.sf,border:`1px solid ${T.br}`,borderRadius:9,color:"#10b981",cursor:"pointer",fontSize:13}}>☁️</button>
          </div>
        </div>

        {/* km / miles */}
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:11,color:T.ft}}>Μονάδα:</span>
          {["km","μίλια"].map((u,i)=>{const on=i===0?!mi:mi;
            return <button key={u} onClick={()=>upV("unitMiles",i===1)} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${on?col:T.br}`,background:on?col+"22":"transparent",color:on?col:T.ft,fontSize:11,cursor:"pointer"}}>{u}</button>;
          })}
        </div>

        {/* Vehicle tabs */}
        <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:2}}>
          {vehicles.map(v=>(
            <button key={v.id} onClick={()=>switchVehicle(v.id)} style={{
              display:"flex",alignItems:"center",gap:4,padding:"7px 11px",borderRadius:"9px 9px 0 0",border:"none",
              background:vid===v.id?T.sf:"transparent",color:vid===v.id?v.color:T.ft,
              fontWeight:vid===v.id?700:400,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",
              borderBottom:vid===v.id?`2px solid ${v.color}`:"2px solid transparent",
            }}>{v.icon} {v.name}</button>
          ))}
          <button onClick={()=>setModal("av")} style={{padding:"7px 10px",borderRadius:"9px 9px 0 0",border:"none",background:"transparent",color:T.ft,fontSize:18,flexShrink:0,cursor:"pointer"}}>+</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{background:T.sf,padding:"0 14px 80px"}}>
        {/* Tab bar — now 5 tabs */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.br}`,marginBottom:16,overflowX:"auto"}}>
          {[["add","⛽ Καύσιμα"],["expenses","💸 Έξοδα"],["stats","📊 Στατιστικά"],["history","📋 Ιστορικό"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              flex:1,padding:"12px 6px",border:"none",background:"transparent",
              color:tab===id?col:T.mt,fontWeight:tab===id?700:400,fontSize:11,cursor:"pointer",
              borderBottom:`2px solid ${tab===id?col:"transparent"}`,marginBottom:-1,whiteSpace:"nowrap",
            }}>{lb}</button>
          ))}
        </div>

        {/* ════ TAB: ADD FUEL ════ */}
        {tab==="add" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label>
              <input type="date" value={fuelForm.date} onChange={e=>hff("date",e.target.value)} style={iS(true)}/>
            </div>

            {/* Fuel type dropdown */}
            <div>
              <label style={lS}>ΕΙΔΟΣ ΚΑΥΣΙΜΟΥ</label>
              <select value={fuelForm.fuelType} onChange={e=>hff("fuelType",e.target.value)} style={iS(true)}>
                {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
              </select>
            </div>

            {["unleaded95","unleaded98","unleaded100","diesel","diesel_plus"].includes(fuelForm.fuelType)&&(
              <button onClick={()=>hff("dual",!fuelForm.dual)} style={{padding:"9px 14px",border:`2px solid ${fuelForm.dual?"#a78bfa":T.br}`,borderRadius:10,background:fuelForm.dual?"#a78bfa22":T.bg,color:fuelForm.dual?"#a78bfa":T.mt,fontSize:12,fontWeight:fuelForm.dual?700:400,textAlign:"left",cursor:"pointer"}}>
                🟣 Διπλή κατανάλωση (+ Υγραέριο LPG)
              </button>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lS}>ΛΙΤΡΑ</label><input type="number" placeholder="π.χ. 40" value={fuelForm.liters} onChange={e=>hff("liters",e.target.value)} style={iS(!!fuelForm.liters)}/></div>
              <div><label style={lS}>ΤΙΜΗ/ΛΙΤΡΟ €</label><input type="number" placeholder="π.χ. 1.789" value={fuelForm.ppl} onChange={e=>hff("ppl",e.target.value)} style={iS(!!fuelForm.ppl)}/></div>
            </div>
            <div><label style={lS}>ΣΥΝΟΛΟ €</label><input type="number" placeholder="π.χ. 71.56" value={fuelForm.total} onChange={e=>hff("total",e.target.value)} style={iS(!!fuelForm.total)}/></div>

            {fuelForm.dual&&(
              <div style={{background:T.bg,borderRadius:12,padding:12,border:"2px solid #a78bfa44"}}>
                <div style={{fontSize:11,color:"#a78bfa",letterSpacing:1,marginBottom:10}}>🟣 ΥΓΡΑΕΡΙΟ (LPG)</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><label style={lS}>ΛΙΤΡΑ LPG</label><input type="number" placeholder="π.χ. 12" value={fuelForm.lpgL} onChange={e=>hff("lpgL",e.target.value)} style={iS(!!fuelForm.lpgL)}/></div>
                  <div><label style={lS}>ΤΙΜΗ/L €</label><input type="number" placeholder="π.χ. 0.85" value={fuelForm.lpgP} onChange={e=>hff("lpgP",e.target.value)} style={iS(!!fuelForm.lpgP)}/></div>
                </div>
                <div><label style={lS}>ΣΥΝΟΛΟ LPG €</label><input type="number" placeholder="π.χ. 10.20" value={fuelForm.lpgT} onChange={e=>hff("lpgT",e.target.value)} style={iS(!!fuelForm.lpgT)}/></div>
              </div>
            )}

            {/* KM */}
            <div style={{background:T.bg,borderRadius:12,padding:12,border:`1px solid ${T.br}`}}>
              <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:10}}>{dl.toUpperCase()} (ΠΡΟΑΙΡΕΤΙΚΟ)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lS}>{dl.toUpperCase()} ΑΠΟ ΤΟ ΠΡΟΗΓ. ΓΕΜΙΣΜΑ</label><input type="number" placeholder={mi?"π.χ. 280":"π.χ. 450"} value={fuelForm.km} onChange={e=>hff("km",e.target.value)} style={iS(!!fuelForm.km)}/><div style={{fontSize:10,color:T.ft,marginTop:3}}>Για υπολογισμό κατανάλωσης</div></div>
                <div><label style={lS}>Odometer</label><input type="number" placeholder="π.χ. 52300" value={fuelForm.odo} onChange={e=>hff("odo",e.target.value)} style={iS(!!fuelForm.odo)}/></div>
              </div>
            </div>

            {/* Station picker button */}
            <div>
              <label style={lS}>ΠΡΑΤΗΡΙΟ</label>
              <button onClick={()=>setShowStPicker(true)} style={{
                width:"100%",padding:"11px 14px",background:T.inp,
                border:`1px solid ${fuelForm.stId?col+"99":T.ib}`,
                borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",
              }}>
                {fuelForm.stLabel
                  ? <span style={{fontWeight:700,fontSize:14,background:curSt?curSt.bg:"#555",color:curSt?curSt.fg:"#fff",padding:"2px 10px",borderRadius:6}}>{fuelForm.stLabel}</span>
                  : <span style={{color:T.ft,fontSize:14}}>Επίλεξε πρατήριο...</span>
                }
                <span style={{color:T.mt,fontSize:12}}>▼</span>
              </button>
            </div>

            <div>
              <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ ΓΕΜΙΣΜΑΤΟΣ</label>
              <input type="text" placeholder="π.χ. Full tank, Αυτοκινητόδρομος..." value={fuelForm.notes} onChange={e=>hff("notes",e.target.value)} style={iS(!!fuelForm.notes)}/>
            </div>

            <button onClick={submitFuel} style={{width:"100%",padding:14,background:col,border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>
              ⛽ Αποθήκευση
            </button>
          </div>
        )}

        {/* ════ TAB: EXPENSES ════ */}
        {tab==="expenses" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:T.bg,borderRadius:14,padding:14,border:`1px solid ${T.br}`}}>
              <div style={{fontSize:12,color:T.mt,letterSpacing:1,marginBottom:12}}>ΝΕΟΣ ΕΞΟΔΟΣ</div>
              <div>
                <label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label>
                <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))} style={{...iS(true),marginBottom:10}}/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {EXPENSE_CATS.map(c=>(
                    <button key={c.id} onClick={()=>setExpenseForm(f=>({...f,catId:c.id}))}
                      style={{padding:"8px 4px",border:`2px solid ${expenseForm.catId===c.id?col:T.br}`,borderRadius:9,
                        background:expenseForm.catId===c.id?col+"22":"transparent",
                        color:expenseForm.catId===c.id?col:T.mt,fontSize:11,fontWeight:expenseForm.catId===c.id?700:400,cursor:"pointer",textAlign:"center"}}>
                      <div style={{fontSize:18}}>{c.icon}</div>
                      <div style={{fontSize:10,marginTop:2}}>{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              {expenseForm.catId==="custom"&&(
                <div style={{marginBottom:10}}>
                  <label style={lS}>ΠΕΡΙΓΡΑΦΗ</label>
                  <input placeholder="π.χ. Αντένα, Μπαταρία..." value={expenseForm.customCat} onChange={e=>setExpenseForm(f=>({...f,customCat:e.target.value}))} style={iS(!!expenseForm.customCat)}/>
                </div>
              )}
              <div style={{marginBottom:10}}>
                <label style={lS}>ΠΟΣΟ €</label>
                <input type="number" placeholder="π.χ. 45.00" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))} style={iS(!!expenseForm.amount)}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
                <input type="text" placeholder="π.χ. Castrol 5W40, 5L..." value={expenseForm.notes} onChange={e=>setExpenseForm(f=>({...f,notes:e.target.value}))} style={iS(!!expenseForm.notes)}/>
              </div>
              <button onClick={submitExpense} style={{width:"100%",padding:13,background:col,border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                💸 Αποθήκευση Εξόδου
              </button>
            </div>

            {/* Expense history */}
            {allExpense.length>0&&(
              <div>
                <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:10}}>ΙΣΤΟΡΙΚΟ ΕΞΟΔΩΝ</div>
                {[...allExpense].reverse().map(x=>{
                  const cat=EXPENSE_CATS.find(c=>c.id===x.catId);
                  return(
                    <div key={x.id} style={{background:T.bg,borderRadius:12,padding:11,marginBottom:8,border:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22}}>{cat?.icon||"💸"}</span>
                        <div>
                          <div style={{fontWeight:600,fontSize:13,color:T.tx}}>{x.label}</div>
                          <div style={{fontSize:11,color:T.mt}}>{x.date}{x.notes?` · ${x.notes}`:""}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontWeight:700,fontSize:15,color:col}}>{fmt(x.amount)}€</span>
                        <button onClick={()=>delExpense(x.id)} style={{background:"none",border:"none",color:T.ft,fontSize:18,cursor:"pointer"}}>×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════ TAB: STATS ════ */}
        {tab==="stats"&&(
          <div>
            <FBar/>
            {!stats?(
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div>Δεν υπάρχουν δεδομένα ακόμα.</div>
              </div>
            ):(
              <>
                {/* Summary cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    ["💰","Συνολικά έξοδα",    stats.totalSpent?`${fmt(stats.totalSpent)}€`:"—"],
                    ["⛽","Καύσιμα",            stats.fuelSpent ?`${fmt(stats.fuelSpent)}€`:"—"],
                    ["🔧","Άλλα έξοδα",         stats.expSpent  ?`${fmt(stats.expSpent)}€`:"—"],
                    ["🔥","Μέση κατανάλωση",    stats.aC        ?`${fmt(stats.aC,1)}L/100`:"—"],
                    ["📈","Μέση τιμή/L",         stats.aP        ?`${fmt(stats.aP,3)}€`:"—"],
                    ["⛽","Συνολικά λίτρα",      stats.tL        ?`${fmt(stats.tL,1)}L`:"—"],
                  ].map(([ic,lb,val])=>(
                    <div key={lb} style={cardS}>
                      <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                      <div style={{fontSize:16,fontWeight:700,color:col}}>{val}</div>
                      <div style={{fontSize:11,color:T.mt,marginTop:2}}>{lb}</div>
                    </div>
                  ))}
                </div>

                {stats.aLC&&(
                  <div style={{background:T.bg,borderRadius:13,padding:13,marginBottom:12,border:"2px solid #a78bfa44"}}>
                    <div style={{fontSize:11,color:"#a78bfa",letterSpacing:1,marginBottom:6}}>🟣 ΔΙΠΛΗ ΚΑΤΑΝΑΛΩΣΗ</div>
                    <div style={{display:"flex",gap:24}}>
                      <div><div style={{fontSize:11,color:T.mt}}>Βενζίνη</div><div style={{fontSize:15,fontWeight:700,color:col}}>{fmt(stats.aC,1)} L/100</div></div>
                      <div><div style={{fontSize:11,color:T.mt}}>LPG</div><div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>{fmt(stats.aLC,1)} L/100</div></div>
                    </div>
                  </div>
                )}

                {stats.minP&&(
                  <div style={{background:T.bg,borderRadius:13,padding:13,marginBottom:14,border:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:11,color:T.mt}}>MIN €/L</div><div style={{fontSize:15,fontWeight:700,color:"#10b981"}}>{fmt(stats.minP,3)}€</div></div>
                    {stats.tSt&&<div style={{textAlign:"center"}}><div style={{fontSize:11,color:T.mt}}>TOP ΠΡΑΤΗΡΙΟ</div><div style={{fontSize:11,fontWeight:700,color:"#a78bfa"}}>⭐ {stats.tSt}</div></div>}
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:T.mt}}>MAX €/L</div><div style={{fontSize:15,fontWeight:700,color:"#ef4444"}}>{fmt(stats.maxP,3)}€</div></div>
                  </div>
                )}

                <ChartBlock title="ΕΞΕΛΙΞΗ ΤΙΜΗΣ €/L"         data={cd} dk="price" color={col}     type="line" T={T}/>
                <ChartBlock title="ΕΞΟΔΑ ΑΝΑ ΓΕΜΙΣΜΑ €"       data={cd} dk="cost"  color={col}     type="bar"  T={T}/>
                <ChartBlock title={`ΚΑΤΑΝΑΛΩΣΗ L/100${dl}`}     data={cd} dk="cons"  color="#10b981" type="line" T={T}/>
                <ChartBlock title="LPG ΚΑΤΑΝΑΛΩΣΗ L/100"        data={cd} dk="lpgC"  color="#a78bfa" type="line" T={T}/>

                {/* Expense breakdown by category */}
                {stats.expSpent > 0 && filtExp.length > 0 && (
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:8}}>ΑΝΑΛΥΣΗ ΕΞΟΔΩΝ ΑΝΑ ΚΑΤΗΓΟΡΙΑ</div>
                    <div style={{background:T.bg,borderRadius:13,padding:13,border:`1px solid ${T.br}`}}>
                      {Object.entries(
                        filtExp.reduce((acc,x)=>{acc[x.label]=(acc[x.label]||0)+x.amount;return acc;},{})
                      ).sort((a,b)=>b[1]-a[1]).map(([label,amount])=>{
                        const pct = stats.expSpent>0 ? (amount/stats.expSpent*100) : 0;
                        const cat = EXPENSE_CATS.find(c=>c.label===label);
                        return (
                          <div key={label} style={{marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                              <span style={{fontSize:12,color:T.tx}}>{cat?.icon||"💸"} {label}</span>
                              <span style={{fontSize:12,fontWeight:700,color:col}}>{fmt(amount)}€</span>
                            </div>
                            <div style={{background:T.br,borderRadius:4,height:5}}>
                              <div style={{background:col,borderRadius:4,height:5,width:`${pct}%`,transition:"width 0.4s"}}/>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{borderTop:`1px solid ${T.br}`,paddingTop:8,marginTop:4,display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:12,color:T.mt}}>Σύνολο εξόδων</span>
                        <span style={{fontSize:13,fontWeight:700,color:col}}>{fmt(stats.expSpent)}€</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════ TAB: HISTORY ════ */}
        {tab==="history"&&(
          <div>
            <FBar/>
            {filtFuel.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div>Δεν υπάρχουν καταχωρήσεις.</div>
              </div>
            ):[...filtFuel].reverse().map(x=>{
              const ft=FTYPES.find(f=>f.id===x.fuelType);
              const so=STATIONS.find(s=>s.id===x.stId);
              const kd=x.km?(mi?fmt(x.km*KM2MI,1):fmt(x.km,1)):null;
              return(
                <div key={x.id} style={{background:T.bg,borderRadius:13,padding:12,marginBottom:9,border:`1px solid ${T.br}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:5}}>
                        <span style={{fontWeight:700,fontSize:13,color:col}}>{x.date}</span>
                        {ft&&<span style={{fontSize:11,background:col+"22",color:col,padding:"2px 7px",borderRadius:6}}>{ft.icon} {ft.label}</span>}
                        {x.dual&&<span style={{fontSize:11,background:"#a78bfa22",color:"#a78bfa",padding:"2px 7px",borderRadius:6}}>🟣 Dual</span>}
                        {x.station&&<span style={{fontSize:11,background:so?so.bg:"#555",color:so?so.fg:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>{x.station}</span>}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px"}}>
                        {x.liters&&<span style={{fontSize:12,color:T.tx}}>⛽ {fmt(x.liters,1)}L</span>}
                        {x.ppl   &&<span style={{fontSize:12,color:T.tx}}>💧 {fmt(x.ppl,3)}€/L</span>}
                        {x.total &&<span style={{fontSize:12,color:T.tx}}>💰 {fmt(x.total)}€</span>}
                        {kd      &&<span style={{fontSize:12,color:T.tx}}>📍 {kd}{dl}</span>}
                        {x.km&&x.liters&&<span style={{fontSize:12,color:"#10b981"}}>🔥 {fmt(x.liters/x.km*100,1)}L/100</span>}
                      </div>
                      {x.dual&&(x.lpgL||x.lpgT)&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px",marginTop:3}}>
                          {x.lpgL&&<span style={{fontSize:12,color:"#a78bfa"}}>🟣 {fmt(x.lpgL,1)}L</span>}
                          {x.lpgP&&<span style={{fontSize:12,color:"#a78bfa"}}>💧 {fmt(x.lpgP,3)}€/L</span>}
                          {x.lpgT&&<span style={{fontSize:12,color:"#a78bfa"}}>💰 {fmt(x.lpgT)}€</span>}
                          {x.km&&x.lpgL&&<span style={{fontSize:12,color:"#a78bfa"}}>🔥 {fmt(x.lpgL/x.km*100,1)}L/100</span>}
                        </div>
                      )}
                      {x.notes&&<div style={{marginTop:4,fontSize:11,color:T.mt}}>📝 {x.notes}</div>}
                    </div>
                    <button onClick={()=>delFuel(x.id)} style={{background:"none",border:"none",color:T.ft,fontSize:18,paddingLeft:8,cursor:"pointer"}}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{textAlign:"center",padding:"24px 0 8px",fontSize:11,color:T.ft}}>
          © Ταχμαζίδης Κ. Γιώργος — FuelLog v2.0
        </div>
      </div>

      {/* ════ STATION PICKER ════ */}
      {showStPicker&&(
        <StationModal
          current={{stId:fuelForm.stId,stLabel:fuelForm.stLabel}}
          onSelect={(id,label)=>{ hff("stId",id); setFuelForm(f=>({...f,stId:id,stLabel:label})); setShowStPicker(false); }}
          onClose={()=>setShowStPicker(false)}
          T={T}
        />
      )}

      {/* ════ MODAL: Add Vehicle ════ */}
      {modal==="av"&&(
        <Modal title="🚗 Νέο Όχημα" onClose={()=>setModal(null)} T={T}>
          <div style={{marginBottom:12}}>
            <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
            <div style={{display:"flex",gap:8}}>
              {VCATS.map(c=>(
                <button key={c.id} onClick={()=>setNewV(v=>({...v,category:c.id,icon:c.icons[0]}))}
                  style={{flex:1,padding:"8px 4px",border:`2px solid ${newV.category===c.id?col:T.br}`,borderRadius:9,
                    background:newV.category===c.id?col+"22":"transparent",color:newV.category===c.id?col:T.mt,
                    fontSize:11,fontWeight:newV.category===c.id?700:400,cursor:"pointer"}}>
                  {c.icons[0]} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {(VCATS.find(c=>c.id===newV.category)?.icons||[]).map(ic=>(
                <button key={ic} onClick={()=>setNewV(v=>({...v,icon:ic}))}
                  style={{fontSize:24,padding:"8px 10px",border:`2px solid ${newV.icon===ic?col:T.br}`,borderRadius:10,background:"transparent",cursor:"pointer"}}>{ic}</button>
              ))}
            </div>
          </div>
          <input value={newV.name} onChange={e=>setNewV(v=>({...v,name:e.target.value}))} placeholder="π.χ. Εταιρικό Βαν..."
            style={{...iS(!!newV.name),marginBottom:14}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:10,background:"transparent",border:`1px solid ${T.br}`,borderRadius:10,color:T.mt,cursor:"pointer"}}>Ακύρωση</button>
            <button onClick={addVeh} style={{flex:1,padding:10,background:col,border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer"}}>Προσθήκη</button>
          </div>
        </Modal>
      )}

      {/* ════ MODAL: Vehicle Info ════ */}
      {modal==="vi"&&(
        <Modal title={`${av?.icon} Στοιχεία Οχήματος`} onClose={()=>setModal(null)} T={T}>
          <label style={lS}>ΟΝΟΜΑ</label>
          <input value={av?.name||""} onChange={e=>setVehicles(p=>p.map(v=>v.id===vid?{...v,name:e.target.value}:v))} style={{...iS(true),marginBottom:14}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[["ΜΑΡΚΑ","brand","π.χ. Toyota"],["ΜΟΝΤΕΛΟ","model","π.χ. Corolla"],["ΕΤΟΣ","year","π.χ. 2020"],["ΑΡ. ΠΙΝΑΚΙΔΑΣ","plate","π.χ. ΑΒΓ-1234"]].map(([lb,f,ph])=>(
              <div key={f}><label style={lS}>{lb}</label><input value={av?.info?.[f]||""} onChange={e=>upI(f,e.target.value)} placeholder={ph} style={iS(!!av?.info?.[f])}/></div>
            ))}
          </div>
          <label style={lS}>ΑΡ. ΠΛΑΙΣΙΟΥ (VIN)</label>
          <input value={av?.info?.chassis||""} onChange={e=>upI("chassis",e.target.value)} placeholder="π.χ. WBA123..." style={{...iS(false),marginBottom:12}}/>
          <label style={lS}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</label>
          <select value={av?.info?.fuelType||"unleaded95"} onChange={e=>upI("fuelType",e.target.value)} style={{...iS(true),marginBottom:20}}>
            {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
          </select>
          <button onClick={()=>setModal(null)} style={{width:"100%",padding:13,background:col,border:"none",borderRadius:12,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>✓ Αποθήκευση</button>
        </Modal>
      )}

      {/* ════ MODAL: Reminders ════ */}
      {modal==="rem"&&(
        <Modal title="🔔 Υπενθυμίσεις" onClose={()=>setModal(null)} T={T}>
          <label style={lS}>ΠΡΟΣΘΗΚΗ</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
            {RTYPES.map(rt=>(
              <button key={rt.id} onClick={()=>addR(rt.id)}
                style={{padding:"8px 10px",border:`1px solid ${T.br}`,borderRadius:9,background:T.bg,color:T.tx,fontSize:12,textAlign:"left",cursor:"pointer"}}>
                {rt.icon} {rt.label}
              </button>
            ))}
          </div>
          {!(av?.reminders||[]).length&&<div style={{textAlign:"center",padding:"16px",color:T.ft,fontSize:13}}>Δεν υπάρχουν υπενθυμίσεις ακόμα.</div>}
          {(av?.reminders||[]).map(r=>{
            const rs=rst(r);
            const rt=RTYPES.find(x=>x.id===r.type);
            return(
              <div key={r.id} style={{background:T.bg,borderRadius:12,padding:12,marginBottom:10,border:`1px solid ${rs?rs.c+"44":T.br}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontWeight:700,fontSize:13}}>{r.icon} {r.label}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {rs&&<span style={{fontSize:11,color:rs.c,fontWeight:700}}>{rs.l}</span>}
                    <button onClick={()=>delR(r.id)} style={{background:"none",border:"none",color:T.ft,fontSize:16,cursor:"pointer"}}>×</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:`${rt?.hasDate&&rt?.hasKm?"1fr 1fr":rt?.hasDate||rt?.hasKm?"1fr":"1fr"}`,gap:8,marginBottom:8}}>
                  {rt?.hasDate&&(
                    <div>
                      <label style={{...lS,marginBottom:3}}>Ημ/νία λήξης</label>
                      <input type="date" value={r.dueDate||""} onChange={e=>upR(r.id,"dueDate",e.target.value)}
                        style={{width:"100%",padding:"7px 9px",background:T.inp,border:`1px solid ${T.ib}`,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                    </div>
                  )}
                  {rt?.hasKm&&(
                    <div>
                      <label style={{...lS,marginBottom:3}}>Σε {dl}</label>
                      <input type="number" placeholder="π.χ. 40000" value={r.dueKm||""} onChange={e=>upR(r.id,"dueKm",e.target.value)}
                        style={{width:"100%",padding:"7px 9px",background:T.inp,border:`1px solid ${T.ib}`,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                    </div>
                  )}
                </div>
                <input placeholder="Σημειώσεις..." value={r.notes||""} onChange={e=>upR(r.id,"notes",e.target.value)}
                  style={{width:"100%",padding:"7px 9px",background:T.inp,border:`1px solid ${T.ib}`,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
              </div>
            );
          })}
        </Modal>
      )}

      {/* ════ MODAL: Backup ════ */}
      {modal==="bk"&&(
        <Modal title="☁️ Backup & Export" onClose={()=>setModal(null)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={lS}>ΕΞΑΓΩΓΗ</label>
            {[{lb:"📄 Export CSV (καύσιμα)",ac:exCsv,cl:"#3b82f6"},{lb:"📦 Backup JSON (όλα)",ac:exJson,cl:"#f97316"}].map(b=>(
              <button key={b.lb} onClick={b.ac} style={{padding:"13px 16px",background:b.cl+"22",border:`1px solid ${b.cl}44`,borderRadius:11,color:b.cl,fontSize:14,fontWeight:600,textAlign:"left",cursor:"pointer"}}>{b.lb}</button>
            ))}
            <label style={{...lS,marginTop:8}}>ΕΠΑΝΑΦΟΡΑ</label>
            <input ref={fref} type="file" accept=".json" onChange={imJson} style={{display:"none"}}/>
            <button onClick={()=>fref.current.click()} style={{padding:"13px 16px",background:T.bg,border:`1px solid ${T.br}`,borderRadius:11,color:T.tx,fontSize:14,fontWeight:600,textAlign:"left",cursor:"pointer"}}>📥 Εισαγωγή JSON backup</button>
          </div>
        </Modal>
      )}

    </div>
  );
}
