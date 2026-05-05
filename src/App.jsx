import React, { useState, useMemo, useEffect, useRef } from "react";

// ========== CONSTANTS ==========
const FUEL_COLORS = ["#f97316","#3b82f6","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899"];
const VCATS = [
  {id:"car",label:"ΙΧ",icon:"🚗"},{id:"taxi",label:"Taxi",icon:"🚕"},
  {id:"moto",label:"Μηχανή",icon:"🏍️"},{id:"van",label:"Βαν",icon:"🚐"},
  {id:"ltruck",label:"Ελαφρύ Φορτηγό",icon:"🚚"},{id:"truck",label:"Βαρύ Φορτηγό",icon:"🚛"},
  {id:"bus",label:"Λεωφορείο",icon:"🚌"},
];
const FTYPES = [
  {id:"unleaded95",label:"Αμόλυβδη 95",icon:"🟢"},{id:"unleaded98",label:"Αμόλυβδη 98",icon:"🔵"},
  {id:"unleaded100",label:"Αμόλυβδη 100",icon:"🔷"},{id:"diesel",label:"Diesel",icon:"🟡"},
  {id:"diesel_plus",label:"Diesel Plus",icon:"🟠"},{id:"lpg",label:"Υγραέριο (LPG)",icon:"🟣"},
  {id:"cng",label:"Φυσικό Αέριο",icon:"⚪"},
];
const EXPENSE_CATS = [
  {id:"service",label:"Service",icon:"🔧"},{id:"oil",label:"Λάδια/Φίλτρα",icon:"🛢️"},
  {id:"tyres",label:"Ελαστικά",icon:"⚫"},{id:"parking",label:"Parking",icon:"🅿️"},
  {id:"tolls",label:"Διόδια",icon:"🛣️"},{id:"custom",label:"Άλλο",icon:"💸"},
];
const MONTHS_FULL=["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];
const MONTHS_SHORT=["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];

// ========== UTILITIES ==========
const uid=()=>Math.random().toString(36).substr(2,9);
const fmt=(n,d=2)=>(n!=null&&!isNaN(n))?(+n).toFixed(d):"0.00";
const today=()=>new Date().toISOString().split("T")[0];
const formatDate=ds=>{
  if(!ds)return"--/--/--";
  const d=new Date(ds);
  return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
};
const daysUntil=ds=>{
  if(!ds)return null;
  return Math.ceil((new Date(ds)-new Date(today()))/86400000);
};
const REMINDER_FIELDS=[
  {f:"insuranceExp",label:"Λήξη Ασφάλειας",icon:"🛡️"},
  {f:"kteo",label:"ΚΤΕΟ",icon:"🔍"},
  {f:"kek",label:"ΚΕΚ",icon:"🔬"},
  {f:"tiresNext",label:"Αλλαγή Ελαστικών",icon:"⚫"},
  {f:"serviceNextDate",label:"Επόμενο Service",icon:"🔧"},
];
const WARN_DAYS=30;

// ========== THEME ==========
const DK={bg:"#080810",sf:"#10101c",br:"#1e1e30",tx:"#eeeeff",mt:"#7777aa",ft:"#33334a",inp:"#0d0d1a",ib:"#1e1e30"};
const LT={bg:"#f0e8db",sf:"#faf3e8",br:"#d4c0a8",tx:"#1a1510",mt:"#5c4e3d",ft:"#e0d0bc",inp:"#ffffff",ib:"#c4b098"};

// ========== DEFAULT FACTORIES ==========
const defInfo=()=>({
  brand:"",model:"",year:"",cc:"",plate:"",chassis:"",
  insurance:"",insuranceExp:"",kteo:"",kek:"",
  tiresBrand:"",tiresSize:"",tiresDate:"",tiresNext:"",
  serviceDate:"",serviceNextDate:"",serviceKm:"",serviceNextKm:"",serviceNotes:"",
  driverMain:"",driverSecond:"",
});
const defV=(ov={})=>({id:uid(),name:"ΝΕΟ ΟΧΗΜΑ",icon:"🚗",color:"#f97316",category:"car",fuelType:"diesel",fuelType2:"",unitMiles:false,info:defInfo(),...ov});
const emptyFuel=ft=>({date:today(),fuelType:ft||"diesel",ppl:"",total:"",odo:"",notes:""});
const emptyExp=()=>({date:today(),category:"tolls",label:"",amount:"",notes:""});

// ========== COMPONENTS ==========
function RoundCyberGauge({value,min,max,color,label,unit,T}){
  const pct=Math.min(1,Math.max(0,(value-min)/(max-min||1)));
  const R=42,cx=52,cy=52,sA=Math.PI*0.7,eA=Math.PI*2.3,vA=sA+(eA-sA)*pct;
  const nx=cx+(R-11)*Math.cos(vA),ny=cy+(R-11)*Math.sin(vA);
  return(
    <div style={{background:"#0a0a0f",borderRadius:"50%",padding:5,border:`2px solid ${color}`,width:"100%",aspectRatio:"1/1",position:"relative"}}>
      <svg viewBox="0 0 104 104">
        {/* Track */}
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 1 1 ${cx+R*Math.cos(eA)} ${cy+R*Math.sin(eA)}`} fill="none" stroke="#1e1e30" strokeWidth={6} strokeLinecap="round"/>
        {/* Arc */}
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 ${pct>0.5?1:0} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2.5} fill={color}/>
        {/* Value — λευκό με glow */}
        <text x={cx} y={cy+4} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900"
          style={{filter:`drop-shadow(0 0 4px ${color})`}}>{fmt(value,1)}</text>
        {/* Unit — ανοιχτό γκρι */}
        <text x={cx} y={cy+14} textAnchor="middle" fill="#9999bb" fontSize={5.5}>{unit}</text>
      </svg>
      {/* Label — accent color */}
      <div style={{position:"absolute",bottom:6,width:"100%",textAlign:"center",fontSize:7,color,fontWeight:700,letterSpacing:0.5}}>{label}</div>
    </div>
  );
}

function BarChart({data,color,T}){
  if(!data.length)return null;
  const max=Math.max(...data.map(d=>d.value),0.01),W=300,H=90,bw=Math.floor(W/data.length)-4;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H+28}`} style={{overflow:"visible"}}>
      {data.map((d,i)=>{const h=(d.value/max)*H,x=i*(W/data.length)+2;return(
        <g key={i}>
          <rect x={x} y={H-h} width={bw} height={Math.max(h,1)} fill={color} rx={3} opacity={0.8}/>
          <text x={x+bw/2} y={H+14} textAnchor="middle" fill={T.mt} fontSize={6.5}>{d.label}</text>
          {d.value>0&&<text x={x+bw/2} y={H-h-4} textAnchor="middle" fill={color} fontSize={6}>{d.value.toFixed(0)}</text>}
        </g>
      );})}
    </svg>
  );
}

function Modal({open,onClose,title,children,T}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-end"}}
         onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.sf,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",padding:"20px 16px 36px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16}}>{title}</h3>
          <button onClick={onClose} style={{border:"none",background:"none",color:T.mt,fontSize:26,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthGroup({monthKey,label,badge,total,isOpen,onToggle,T,children}){
  return(
    <div style={{marginBottom:8}}>
      <div onClick={onToggle} style={{
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"12px 14px",cursor:"pointer",userSelect:"none",
        background:isOpen?T.br:T.sf,border:`1px solid ${T.br}`,
        borderRadius:isOpen?"12px 12px 0 0":12,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:15}}>📅</span>
          <span style={{fontWeight:"bold",fontSize:14}}>{label}</span>
          <span style={{fontSize:11,fontWeight:"bold",padding:"2px 8px",borderRadius:10,background:"rgba(127,127,200,0.2)",color:T.mt}}>{badge}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {total!=null&&<span style={{color:"#e07b54",fontWeight:"bold",fontSize:14}}>{total}</span>}
          <span style={{color:T.mt,fontSize:12}}>{isOpen?"▲":"▼"}</span>
        </div>
      </div>
      {isOpen&&(
        <div style={{border:`1px solid ${T.br}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>
          {children}
        </div>
      )}
    </div>
  );
}

// ========== MAIN APP ==========
export default function FuelLog(){
  const [dark,setDark]=useState(true);
  const T=dark?DK:LT;

  const [vehicles,setVehicles]=useState([{...defV(),id:"v1",name:"ΕΤΑΙΡΙΚΟ",icon:"🚗",color:"#f97316",fuelType:"diesel",fuelType2:""}]);
  const [vid,setVid]=useState("v1");
  const [entries,setEntries]=useState({});
  const [expenses,setExpenses]=useState({});

  const [tab,setTab]=useState("home");
  const [fY,setFY]=useState(String(new Date().getFullYear()));
  const [fM,setFM]=useState("all");
  const [openFuelM,setOpenFuelM]=useState({});
  const [openExpM,setOpenExpM]=useState({});
  const [openCat,setOpenCat]=useState(null); // drill-down κατηγορίας

  const [fuelForm,setFuelForm]=useState(emptyFuel("diesel"));
  const [expForm,setExpForm]=useState(emptyExp());

  const [showAddV,setShowAddV]=useState(false);
  const [newV,setNewV]=useState(defV());
  const [showVInfo,setShowVInfo]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [showIO,setShowIO]=useState(false);
  const [showEditV,setShowEditV]=useState(false); // ✅ edit vehicle
  const [editVData,setEditVData]=useState(null);
  const [editFuelE,setEditFuelE]=useState(null);
  const [editExpE,setEditExpE]=useState(null);
  const [importText,setImportText]=useState("");
  const [importMsg,setImportMsg]=useState("");
  const importRef=useRef();

  const av=vehicles.find(v=>v.id===vid)||vehicles[0];
  const col=av.color;

  // Persist
  useEffect(()=>{
    try{const s=localStorage.getItem("fuellog_data");if(s){const d=JSON.parse(s);if(d.vehicles)setVehicles(d.vehicles);if(d.entries)setEntries(d.entries);if(d.expenses)setExpenses(d.expenses);if(d.vid)setVid(d.vid);}}catch(e){}
  },[]);
  useEffect(()=>{localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,vid}));},[vehicles,entries,expenses,vid]);
  useEffect(()=>{setFuelForm(emptyFuel(av.fuelType||"diesel"));},[vid]);

  // Derived
  const allFuel=useMemo(()=>(entries[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExp=useMemo(()=>(expenses[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);

  const filtFuel=useMemo(()=>{let f=allFuel;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allFuel,fY,fM]);
  const filtExp=useMemo(()=>{let f=allExp;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allExp,fY,fM]);

  const stats=useMemo(()=>{
    const fuelSpent=filtFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const tL=filtFuel.reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const wK=filtFuel.filter(x=>parseFloat(x.km)>0&&parseFloat(x.liters)>0);
    const aC=wK.length?wK.reduce((s,x)=>s+(parseFloat(x.liters)/parseFloat(x.km)*100),0)/wK.length:0;
    const wP=filtFuel.filter(x=>parseFloat(x.ppl)>0);
    const aP=wP.length?+(wP.reduce((s,x)=>s+parseFloat(x.ppl),0)/wP.length).toFixed(3):0;
    // ✅ NEW: Κόστος ανά χλμ — από ODO readings
    const odoEntries=filtFuel.filter(x=>x.odo!=null).sort((a,b)=>a.odo-b.odo);
    const totalKm=odoEntries.length>=2?(odoEntries[odoEntries.length-1].odo-odoEntries[0].odo):0;
    const costPerKm=totalKm>0?((fuelSpent+expSpent)/totalKm):0;
    const fuelCostPerKm=totalKm>0?(fuelSpent/totalKm):0;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP,totalKm,costPerKm,fuelCostPerKm};
  },[filtFuel,filtExp]);

  // Reminders — ALL vehicles, 30 days ahead
  const reminders=useMemo(()=>{
    const list=[];
    vehicles.forEach(v=>{
      REMINDER_FIELDS.forEach(({f,label,icon})=>{
        const ds=(v.info||{})[f];
        const days=daysUntil(ds);
        if(days===null)return;
        if(days<=WARN_DAYS)list.push({vid:v.id,vName:v.name,vIcon:v.icon,vColor:v.color,label,icon,days,date:ds,urgent:days<=7,expired:days<0});
      });
    });
    return list.sort((a,b)=>a.days-b.days);
  },[vehicles]);

  const monthlyBarData=useMemo(()=>{
    const yF=fY==="all"?allFuel:allFuel.filter(e=>e.date.startsWith(fY));
    const yE=fY==="all"?allExp:allExp.filter(e=>e.date.startsWith(fY));
    return MONTHS_SHORT.map((label,i)=>{
      const m=String(i+1).padStart(2,"0");
      const v=yF.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.total)||0),0)+yE.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
      return{label,value:+v.toFixed(2)};
    });
  },[allFuel,allExp,fY]);

  const expByMonth=useMemo(()=>{
    const map={};
    allExp.forEach(e=>{
      const d=new Date(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,entries:[],total:0,byCategory:{}};
      map[k].entries.push(e);map[k].total+=(parseFloat(e.amount)||0);
      const cat=e.category||"custom";map[k].byCategory[cat]=(map[k].byCategory[cat]||0)+(parseFloat(e.amount)||0);
    });
    return Object.values(map).sort((a,b)=>b.key.localeCompare(a.key));
  },[allExp]);

  const fuelByMonth=useMemo(()=>{
    const map={};
    // allFuel is already sorted by date asc
    allFuel.forEach((e,globalIdx)=>{
      const d=new Date(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,entries:[],totalAmt:0,totalL:0};
      // store globalIdx so we can look up previous fill across months
      map[k].entries.push({...e,_gi:globalIdx});
      map[k].totalAmt+=(parseFloat(e.total)||0);map[k].totalL+=(parseFloat(e.liters)||0);
    });
    return Object.values(map).sort((a,b)=>b.key.localeCompare(a.key));
  },[allFuel]);

  const availYears=useMemo(()=>{
    const ys=new Set([String(new Date().getFullYear())]);
    [...allFuel,...allExp].forEach(e=>{if(e.date)ys.add(e.date.slice(0,4));});
    return[...ys].sort((a,b)=>b-a);
  },[allFuel,allExp]);

  const vFuelTypes=useMemo(()=>{
    const ft=av.fuelType||"diesel",ft2=av.fuelType2;
    const list=[FTYPES.find(f=>f.id===ft)].filter(Boolean);
    if(ft2){const x=FTYPES.find(f=>f.id===ft2);if(x)list.push(x);}
    return list.length?list:FTYPES;
  },[av]);

  // CRUD Fuel
  const handleAddFuel=()=>{
    const ppl=parseFloat(fuelForm.ppl),total=parseFloat(fuelForm.total);
    if(!total)return;
    const liters=ppl>0?+(total/ppl).toFixed(3):0;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{...fuelForm,id:uid(),total,ppl:ppl||0,liters,odo:fuelForm.odo?parseFloat(fuelForm.odo):null}]}));
    setFuelForm(emptyFuel(av.fuelType||"diesel"));setTab("history");
  };
  const handleDelFuel=id=>setEntries(p=>({...p,[vid]:(p[vid]||[]).filter(e=>e.id!==id)}));
  const handleSaveEditFuel=()=>{
    const ppl=parseFloat(editFuelE.ppl),total=parseFloat(editFuelE.total),liters=ppl>0?+(total/ppl).toFixed(3):(parseFloat(editFuelE.liters)||0);
    setEntries(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editFuelE.id?{...editFuelE,total,ppl,liters,odo:editFuelE.odo?parseFloat(editFuelE.odo):null}:e)}));
    setEditFuelE(null);
  };

  // CRUD Expenses
  const handleAddExp=()=>{
    if(!expForm.amount)return;
    const cat=EXPENSE_CATS.find(c=>c.id===expForm.category);
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{...expForm,id:uid(),amount:parseFloat(expForm.amount),icon:cat && cat.icon||"💸",label:expForm.label||cat && cat.label||"Άλλο"}]}));
    setExpForm(emptyExp());
  };
  const handleDelExp=id=>setExpenses(p=>({...p,[vid]:(p[vid]||[]).filter(e=>e.id!==id)}));
  const handleSaveEditExp=()=>{
    const cat=EXPENSE_CATS.find(c=>c.id===editExpE.category);
    setExpenses(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editExpE.id?{...editExpE,amount:parseFloat(editExpE.amount),icon:cat && cat.icon||editExpE.icon}:e)}));
    setEditExpE(null);
  };

  // CRUD Vehicles
  const handleAddVehicle=()=>{
    const v={...newV,id:uid()};setVehicles(p=>[...p,v]);setVid(v.id);setShowAddV(false);setNewV(defV());setTab("home");
  };
  const handleSaveEditV=()=>{
    setVehicles(p=>p.map(v=>v.id===editVData.id?{...v,name:editVData.name,color:editVData.color,icon:editVData.icon,category:editVData.category,fuelType:editVData.fuelType,fuelType2:editVData.fuelType2}:v));
    setShowEditV(false);setEditVData(null);
  };
  const handleDeleteV=()=>{
    if(vehicles.length<=1){window.alert("Δεν μπορείς να διαγράψεις το μοναδικό όχημα.");return;}
    if(!window.confirm("Διαγραφή οχήματος " + editVData.name + "; Θα διαγραφούν και όλα τα δεδομένα του!"))return;
    setVehicles(p=>p.filter(v=>v.id!==editVData.id));
    setEntries(p=>{const n={...p};delete n[editVData.id];return n;});
    setExpenses(p=>{const n={...p};delete n[editVData.id];return n;});
    setVid((vehicles.find(v=>v.id!==editVData.id)||{}).id||"v1");
    setShowEditV(false);setEditVData(null);
  };
  const updateVInfo=(f,val)=>setVehicles(p=>p.map(v=>v.id===vid?{...v,info:{...v.info,[f]:val}}:v));

  // Export/Import
  const exportJSON=()=>{
    const a=document.createElement("a");
    a.href="data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify({vehicles,entries,expenses},null,2));
    a.download=`fuellog_${today()}.json`;a.click();
  };
  const exportCSV=()=>{
    let csv="Τύπος,Όχημα,Ημερομηνία,Κατηγορία,Λίτρα,€/L,Σύνολο€,ODO,Σημειώσεις\n";
    vehicles.forEach(v=>{
      (entries[v.id]||[]).forEach(e=>{csv+=`Καύσιμο,${v.name},${e.date},${e.fuelType},${fmt(e.liters)},${fmt(e.ppl,3)},${fmt(e.total)},${e.odo||""},${(e.notes||"").replace(/,/g,"")}\n`;});
      (expenses[v.id]||[]).forEach(e=>{csv+=`Έξοδο,${v.name},${e.date},${e.category},,,${fmt(e.amount)},,${(e.label||"").replace(/,/g," ")}\n`;});
    });
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
    a.download=`fuellog_${today()}.csv`;a.click();
  };
  const handleImport=()=>{
    try{
      const d=JSON.parse(importText);
      if(d.vehicles)setVehicles(d.vehicles);if(d.entries)setEntries(d.entries);if(d.expenses)setExpenses(d.expenses);
      setImportMsg("✅ Εισαγωγή επιτυχής!");setImportText("");
    }catch(e){setImportMsg("❌ Σφάλμα: Μη έγκυρο JSON.");}
  };
  const handleImportFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setImportText(ev.target.result);setImportMsg("");};r.readAsText(f);};

  const IS={width:"100%",padding:12,marginBottom:10,borderRadius:8,background:T.inp,color:T.tx,border:`1px solid ${T.ib}`,boxSizing:"border-box",fontSize:14};
  const CS=(extra={})=>({background:T.sf,padding:14,borderRadius:14,border:`1px solid ${T.br}`,...extra});

  const TABS=[{id:"home",label:"Αρχική",icon:"🏠"},{id:"fuel",label:"Καύσιμο",icon:"⛽"},{id:"expenses",label:"Έξοδα",icon:"📋"},{id:"stats",label:"Στατιστικά",icon:"📊"},{id:"history",label:"Ιστορικό",icon:"📅"}];

  return(
    <div style={{backgroundColor:T.bg,color:T.tx,minHeight:"100vh",fontFamily:"sans-serif",paddingBottom:90}}>

      {/* Header */}
      <header style={{padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>⛽</span>
          <span style={{fontWeight:"bold",fontSize:17}}>FuelLog v2.4</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setShowVInfo(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>🔧 Στοιχεία</button>
          <button onClick={()=>setShowIO(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:14,cursor:"pointer"}} title="Import/Export">💾</button>
          <button onClick={()=>setShowAbout(true)} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}} title="Σχετικά">ℹ️</button>
          <button onClick={()=>setDark(!dark)} style={{border:"none",background:"none",fontSize:22,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </header>

      {/* Vehicle selector */}
      <div style={{display:"flex",gap:8,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,overflowX:"auto"}}>
        {vehicles.map(v=>(
          <div key={v.id} style={{display:"flex",alignItems:"center",gap:0,borderRadius:20,background:vid===v.id?v.color:T.br,overflow:"hidden"}}>
            <button onClick={()=>setVid(v.id)} style={{padding:"6px 12px",border:"none",cursor:"pointer",whiteSpace:"nowrap",background:"transparent",color:vid===v.id?"#fff":T.mt,fontWeight:"bold",fontSize:13}}>
              {v.icon} {v.name}
            </button>
            {/* ✅ Edit button — only for active vehicle */}
            {vid===v.id&&(
              <button onClick={()=>{setEditVData({...v});setShowEditV(true);}}
                style={{border:"none",background:"rgba(0,0,0,0.2)",color:"#fff",cursor:"pointer",padding:"6px 8px",fontSize:12,borderLeft:"1px solid rgba(255,255,255,0.2)"}}>
                ✏️
              </button>
            )}
          </div>
        ))}
        <button onClick={()=>{setNewV(defV());setShowAddV(true);}} style={{padding:"6px 12px",borderRadius:20,border:`1px dashed ${T.mt}`,background:"none",color:T.mt,cursor:"pointer",fontSize:18,lineHeight:1}}>+</button>
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",background:T.sf,borderTop:`1px solid ${T.br}`,padding:"5px 0",zIndex:100}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{border:"none",background:"none",cursor:"pointer",padding:"3px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:1,color:tab===t.id?col:T.mt,fontSize:9,fontWeight:tab===t.id?"bold":"normal",position:"relative"}}>
            <span style={{fontSize:19}}>{t.icon}</span>{t.label}
            {t.id==="home"&&reminders.length>0&&(
              <span style={{position:"absolute",top:0,right:2,background:reminders.some(r=>r.expired||r.urgent)?"#e11d48":"#eab308",color:"#fff",fontSize:8,fontWeight:"bold",padding:"1px 4px",borderRadius:8,minWidth:14,textAlign:"center"}}>{reminders.length}</span>
            )}
          </button>
        ))}
      </div>

      <main style={{padding:15}}>

        {/* HOME */}
        {tab==="home"&&(
          <div>
            <div style={{...CS(),marginBottom:12}}>
              <div style={{fontSize:11,color:T.mt,marginBottom:4}}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ · {av.icon} {av.name}</div>
              <div style={{fontSize:30,fontWeight:"bold",color:"#eab308"}}>{fmt((entries[vid]||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0)+(expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0))}€</div>
              {(av.info&&av.info.plate)&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>{av.info.plate}</div>}
            </div>

            {/* Reminders */}
            {reminders.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:"bold",color:"#eab308",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  🔔 Υπενθυμίσεις
                  <span style={{background:"#e11d48",color:"#fff",fontSize:10,fontWeight:"bold",padding:"1px 7px",borderRadius:10}}>{reminders.length}</span>
                </div>
                {reminders.map((r,i)=>{
                  const bgC=r.expired?"#2a0a0a":r.urgent?"#2a1200":dark?"#1a1a10":"#fdf3d0";
                  const bC=r.expired?"#e11d48":r.urgent?"#f97316":"#eab308";
                  const tC=r.expired?"#ef4444":r.urgent?"#f97316":"#eab308";
                  const st=r.expired?`⚠️ Έληξε πριν ${Math.abs(r.days)} μέρες`:r.days===0?"⚠️ Λήγει ΣΗΜΕΡΑ":`⏰ Λήγει σε ${r.days} μέρες`;
                  return(
                    <div key={i} onClick={()=>{setVid(r.vid);setShowVInfo(true);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,marginBottom:6,cursor:"pointer",background:bgC,border:`1px solid ${bC}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22}}>{r.icon}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:"bold",color:tC}}>{r.label}</div>
                          <div style={{fontSize:11,color:T.mt}}>{r.vIcon} {r.vName} · {formatDate(r.date)}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,fontWeight:"bold",color:tC}}>{st}</div>
                        <div style={{fontSize:10,color:T.mt}}>→ Στοιχεία</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div onClick={()=>setTab("history")} style={{...CS({cursor:"pointer",borderLeft:`3px solid #3b82f6`})}}>
                <div style={{fontSize:10,color:T.mt}}>⛽ ΓΕΜΙΣΜΑΤΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#3b82f6"}}>{(entries[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Ιστορικό</div>
              </div>
              <div onClick={()=>setTab("expenses")} style={{...CS({cursor:"pointer",borderLeft:`3px solid #e11d48`})}}>
                <div style={{fontSize:10,color:T.mt}}>📋 ΕΞΟΔΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#e11d48"}}>{(expenses[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Έξοδα</div>
              </div>
            </div>
          </div>
        )}

        {/* FUEL */}
        {tab==="fuel"&&(
          <div style={CS()}>
            <h3 style={{marginTop:0,fontSize:16}}>⛽ Νέο Γέμισμα</h3>
            <input type="date" value={fuelForm.date} onChange={e=>setFuelForm({...fuelForm,date:e.target.value})} style={IS}/>
            <select value={fuelForm.fuelType} onChange={e=>setFuelForm({...fuelForm,fuelType:e.target.value})} style={IS}>
              {vFuelTypes.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <input type="number" step="0.001" placeholder="⬡  Τιμή €/λίτρο" value={fuelForm.ppl} onChange={e=>setFuelForm({...fuelForm,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="💶  Συνολικό Ποσό €" value={fuelForm.total} onChange={e=>setFuelForm({...fuelForm,total:e.target.value})} style={IS}/>
            {parseFloat(fuelForm.ppl)>0&&parseFloat(fuelForm.total)>0&&(
              <div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"9px 14px",borderRadius:8,marginBottom:10,fontSize:13,fontWeight:"bold",border:"1px solid #10b981"}}>
                🧮 Υπολογισμός: <b>{+(parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl)).toFixed(2)}</b> λίτρα
              </div>
            )}
            <input type="number" placeholder="🔢  Odometer (Συνολικά χλμ)" value={fuelForm.odo} onChange={e=>setFuelForm({...fuelForm,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder="📝  Σημειώσεις (προαιρετικό)" value={fuelForm.notes} onChange={e=>setFuelForm({...fuelForm,notes:e.target.value})} style={IS}/>
            <button onClick={handleAddFuel} style={{width:"100%",padding:15,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:16,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {/* EXPENSES */}
        {tab==="expenses"&&(
          <div>
            <div style={{...CS(),marginBottom:16}}>
              <h3 style={{marginTop:0,fontSize:15}}>➕ Νέο Έξοδο</h3>
              <input type="date" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} style={IS}/>
              <select value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})} style={IS}>
                {EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <input type="text" placeholder="Τοποθεσία / Περιγραφή" value={expForm.label} onChange={e=>setExpForm({...expForm,label:e.target.value})} style={IS}/>
              <input type="number" step="0.01" placeholder="Ποσό €" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} style={IS}/>
              <button onClick={handleAddExp} style={{width:"100%",padding:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
            {expByMonth.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν έξοδα ακόμα.</div>}
            {expByMonth.map(({key,label,entries:me,total,byCategory})=>(
              <MonthGroup key={key} monthKey={key} label={label} badge={`${me.length} εγγρ.`} total={`-${fmt(total)}€`} isOpen={!!openExpM[key]} onToggle={()=>setOpenExpM(p=>({...p,[key]:!p[key]}))} T={T}>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 12px",background:T.bg,borderBottom:`1px solid ${T.ft}`}}>
                  {Object.entries(byCategory).map(([catId,amt])=>{const cat=EXPENSE_CATS.find(c=>c.id===catId);return(
                    <div key={catId} style={{background:T.sf,borderRadius:8,padding:"4px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                      <span>{cat && cat.icon||"💸"}</span><span style={{color:T.mt}}>{cat && cat.label||catId}</span><span style={{fontWeight:"bold",color:"#e07b54"}}>{fmt(amt)}€</span>
                    </div>
                  );})}
                </div>
                {me.slice().reverse().map((e,i)=>{const cat=EXPENSE_CATS.find(c=>c.id===e.category);return(
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<me.length-1?`1px solid ${T.ft}`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{cat && cat.icon||e.icon||"💸"}</span>
                      <div><div style={{fontWeight:"bold",fontSize:13}}>{e.label||cat && cat.label}</div><div style={{fontSize:11,color:T.mt}}>{formatDate(e.date)}</div></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontWeight:"bold",color:"#e11d48",fontSize:14}}>-{fmt(e.amount)}€</span>
                      <button onClick={()=>setEditExpE({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
                      <button onClick={()=>handleDelExp(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16,padding:2}}>✕</button>
                    </div>
                  </div>
                );})}
              </MonthGroup>
            ))}
          </div>
        )}

        {/* STATS */}
        {tab==="stats"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <select value={fY} onChange={e=>setFY(e.target.value)} style={IS}>
                <option value="all">Όλα τα έτη</option>
                {availYears.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fM} onChange={e=>setFM(e.target.value)} style={IS}>
                <option value="all">Όλοι οι μήνες</option>
                {MONTHS_SHORT.map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{label:"ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ",v:fmt(stats.totalSpent)+"€",color:"#eab308"},{label:"ΚΑΥΣΙΜΑ",v:fmt(stats.fuelSpent)+"€",color:"#3b82f6"},{label:"ΑΛΛΑ ΕΞΟΔΑ",v:fmt(stats.expSpent)+"€",color:"#e11d48"},{label:"ΣΥΝΟΛΟ ΛΙΤΡΩΝ",v:fmt(stats.tL)+" L",color:"#10b981"}].map(({label,v,color})=>(
                <div key={label} style={CS()}><div style={{fontSize:9,color:T.mt,marginBottom:3}}>{label}</div><div style={{fontSize:18,fontWeight:"bold",color}}>{v}</div></div>
              ))}
            </div>
            {/* ✅ GAUGES: flex overlap, maxWidth για desktop, σωστό flow για content κάτω */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <div style={{width:"100%",maxWidth:380,display:"flex",alignItems:"center",overflow:"visible"}}>
                <div style={{flex:"0 0 55%",zIndex:2,filter:"drop-shadow(3px 0 10px #10b98150)"}}>
                  <RoundCyberGauge value={stats.aC} min={0} max={15} color="#10b981" label="ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>
                </div>
                <div style={{flex:"0 0 55%",marginLeft:"-10%",zIndex:1,filter:"drop-shadow(-3px 0 10px #f9731650)"}}>
                  <RoundCyberGauge value={stats.aP} min={1} max={2.5} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>
                </div>
              </div>
            </div>

            {/* ✅ NEW: Κόστος ανά χλμ */}
            {stats.totalKm>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{...CS(),textAlign:"center",padding:10}}>
                  <div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΣΥΝΟΛΟ ΧΛΜ</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:"#06b6d4"}}>{stats.totalKm.toLocaleString()}</div>
                  <div style={{fontSize:9,color:T.mt}}>km</div>
                </div>
                <div style={{...CS(),textAlign:"center",padding:10,border:`1px solid ${col}44`}}>
                  <div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΚΟΣΤΟΣ/ΧΛΜ</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:col}}>{fmt(stats.costPerKm,3)}</div>
                  <div style={{fontSize:9,color:T.mt}}>€/km (ολικό)</div>
                </div>
                <div style={{...CS(),textAlign:"center",padding:10}}>
                  <div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΚΑΥΣΙΜΟ/ΧΛΜ</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:"#3b82f6"}}>{fmt(stats.fuelCostPerKm,3)}</div>
                  <div style={{fontSize:9,color:T.mt}}>€/km (καύσιμο)</div>
                </div>
              </div>
            )}
            <div style={{...CS(),marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:"bold",marginBottom:8,color:T.tx}}>📊 Μηνιαία Έξοδα · {fY!=="all"?fY:"Όλα τα έτη"}</div>
              <BarChart data={monthlyBarData} color={col} T={T}/>
            </div>
            {/* ΚΑΤΑΝΟΜΗ with drill-down */}
            {allExp.length>0&&(
              <div style={CS()}>
                <div style={{fontSize:12,fontWeight:"bold",marginBottom:4,color:T.tx}}>🗂️ Κατανομή Εξόδων</div>
                <div style={{fontSize:10,color:T.mt,marginBottom:10}}>Σύνολο οχήματος · {(expenses[vid]||[]).length} εγγραφές · tap για ανάλυση</div>
                {EXPENSE_CATS.map(cat=>{
                  const catEntries=(expenses[vid]||[]).filter(e=>(e.category||"custom")===cat.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
                  const tot=catEntries.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
                  if(!tot)return null;
                  const grandTotal=(expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
                  const pct=grandTotal>0?(tot/grandTotal*100):0;
                  const isOpen=openCat===cat.id;
                  return(
                    <div key={cat.id} style={{marginBottom:10}}>
                      <div onClick={()=>setOpenCat(isOpen?null:cat.id)}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,cursor:"pointer",padding:"4px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>{cat.icon}</span>
                          <span style={{fontSize:13,fontWeight:"bold"}}>{cat.label}</span>
                          <span style={{fontSize:10,color:T.mt,background:T.br,padding:"1px 6px",borderRadius:8}}>{catEntries.length}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13,fontWeight:"bold"}}>{fmt(tot)}€</span>
                          <span style={{color:T.mt,fontSize:11}}>({pct.toFixed(0)}%)</span>
                          <span style={{fontSize:11,color:T.mt}}>{isOpen?"▲":"▼"}</span>
                        </div>
                      </div>
                      <div style={{background:T.br,borderRadius:4,height:7,overflow:"hidden",marginBottom:isOpen?8:0}}>
                        <div style={{background:col,width:`${pct}%`,height:7,borderRadius:4,transition:"width 0.5s ease"}}/>
                      </div>
                      {isOpen&&(
                        <div style={{background:T.bg,borderRadius:8,overflow:"hidden",border:`1px solid ${T.br}`}}>
                          {/* Ομαδοποίηση ανά μήνα */}
                          {(()=>{
                            const byMonth={};
                            catEntries.forEach(e=>{
                              const d=new Date(e.date);
                              const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                              const lbl=`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
                              if(!byMonth[k])byMonth[k]={lbl,entries:[],total:0};
                              byMonth[k].entries.push(e);
                              byMonth[k].total+=(parseFloat(e.amount)||0);
                            });
                            return Object.entries(byMonth).map(([mk,{lbl,entries:me,total:mt}],mi)=>(
                              <div key={mk}>
                                {/* Month header */}
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:T.br}}>
                                  <span style={{fontSize:11,fontWeight:"bold",color:T.tx}}>📅 {lbl}</span>
                                  <span style={{fontSize:11,fontWeight:"bold",color:col}}>-{fmt(mt)}€</span>
                                </div>
                                {/* Entries */}
                                {me.map((e,i)=>(
                                  <div key={e.id} style={{
                                    display:"flex",justifyContent:"space-between",alignItems:"center",
                                    padding:"7px 16px",
                                    background:i%2===0?T.bg:T.sf,
                                    borderBottom:i<me.length-1?`1px solid ${T.ft}`:"none",
                                  }}>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:"bold"}}>{e.label||cat.label}</div>
                                      <div style={{fontSize:10,color:T.mt}}>{formatDate(e.date)}</div>
                                    </div>
                                    <span style={{fontSize:13,fontWeight:"bold",color:"#e11d48"}}>-{fmt(e.amount)}€</span>
                                  </div>
                                ))}
                              </div>
                            ));
                          })()}
                          {/* Grand total footer */}
                          <div style={{padding:"8px 12px",background:T.ft,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:11,color:T.mt,fontWeight:"bold"}}>ΣΥΝΟΛΟ {cat.label.toUpperCase()}</span>
                            <span style={{fontSize:14,fontWeight:"bold",color:col}}>{fmt(tot)}€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab==="history"&&(
          <div>
            <h3 style={{margin:"0 0 14px"}}>⛽ Ιστορικό Καυσίμων</h3>
            {allFuel.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν εγγραφές ακόμα.</div>}
            {fuelByMonth.map(({key,label,entries:me,totalAmt,totalL})=>{
              const reversed=[...me].reverse();
              return(
                <MonthGroup key={key} monthKey={key} label={label} badge={`${me.length} γεμ. · ${fmt(totalL,1)}L`} total={`${fmt(totalAmt)}€`} isOpen={!!openFuelM[key]} onToggle={()=>setOpenFuelM(p=>({...p,[key]:!p[key]}))} T={T}>
                  {reversed.map((e,i)=>{
                    // ✅ FIX: lookup previous fill globally (works across months)
                    const prevGlobal=e._gi>0?allFuel[e._gi-1]:null;
                    const diffKm=(e.odo!=null&&(prevGlobal&&prevGlobal.odo)!=null&&e.odo>prevGlobal.odo)?(e.odo-prevGlobal.odo):null;
                    const ftype=FTYPES.find(f=>f.id===e.fuelType);
                    return(
                      <div key={e.id} style={{padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<reversed.length-1?`1px solid ${T.ft}`:"none"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:"bold"}}>{formatDate(e.date)}</span>
                          <div style={{display:"flex",gap:8,alignItems:"center"}}>
                            {diffKm!=null&&diffKm>0&&<span style={{fontSize:11,color:"#10b981"}}>📍{diffKm}χλμ</span>}
                            <span style={{fontSize:11,color:T.mt}}>{ftype?`${ftype.icon} ${ftype.label}`:e.fuelType}</span>
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
                </MonthGroup>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: ADD VEHICLE */}
      <Modal open={showAddV} onClose={()=>setShowAddV(false)} title="➕ Νέο Όχημα" T={T}>
        <input type="text" placeholder="Όνομα (π.χ. ΕΤΑΙΡΙΚΟ, ΤΑΞΙ)" value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} style={IS}/>
        <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΚΑΤΗΓΟΡΙΑ</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
          {VCATS.map(c=><button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,background:newV.category===c.id?col:T.br,color:newV.category===c.id?"#fff":T.mt}}>{c.icon} {c.label}</button>)}
        </div>
        <input type="text" placeholder="Αρ. Πινακίδας" value={newV.info.plate} onChange={e=>setNewV({...newV,info:{...newV.info,plate:e.target.value}})} style={IS}/>
        <div style={{fontSize:11,color:T.mt,marginBottom:6}}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</div>
        <select value={newV.fuelType} onChange={e=>setNewV({...newV,fuelType:e.target.value})} style={IS}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
        <div style={{fontSize:11,color:T.mt,marginBottom:6}}>2ο ΚΑΥΣΙΜΟ (π.χ. LPG)</div>
        <select value={newV.fuelType2} onChange={e=>setNewV({...newV,fuelType2:e.target.value})} style={IS}><option value="">— Κανένα —</option>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
        <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΧΡΩΜΑ</div>
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
          {FUEL_COLORS.map(c=><div key={c} onClick={()=>setNewV({...newV,color:c})} style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:newV.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}
        </div>
        <button onClick={handleAddVehicle} style={{width:"100%",padding:14,background:newV.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΠΡΟΣΘΗΚΗ ΟΧΗΜΑΤΟΣ</button>
      </Modal>

      {/* MODAL: VEHICLE INFO */}
      <Modal open={showVInfo} onClose={()=>setShowVInfo(false)} title={`${av.icon} ${av.name} · Στοιχεία`} T={T}>
        <button onClick={()=>setShowVInfo(false)} style={{display:"flex",alignItems:"center",gap:6,border:"none",background:T.br,color:T.tx,borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",marginBottom:16}}>← Επιστροφή</button>
        {[
          {f:"brand",label:"Μάρκα",type:"text",ph:"Toyota, BMW…"},{f:"model",label:"Μοντέλο",type:"text",ph:"Corolla, X5…"},
          {f:"year",label:"Έτος",type:"number",ph:"2020"},{f:"cc",label:"Κυβικά (cc)",type:"number",ph:"1600"},
          {f:"plate",label:"Αρ. Πινακίδας",type:"text",ph:"ΑΒΓ-1234"},{f:"chassis",label:"Αρ. Πλαισίου (VIN)",type:"text",ph:"WBA…"},
          {f:"insurance",label:"Αρ. Ασφαλιστηρίου",type:"text",ph:""},{f:"insuranceExp",label:"Λήξη Ασφάλειας",type:"date",ph:""},
          {f:"kteo",label:"Επόμενο ΚΤΕΟ",type:"date",ph:""},{f:"kek",label:"Επόμενο ΚΕΚ",type:"date",ph:""},
          {f:"tiresBrand",label:"Μάρκα Ελαστικών",type:"text",ph:"Michelin…"},{f:"tiresSize",label:"Διαστάσεις Ελαστικών",type:"text",ph:"195/65R15"},
          {f:"tiresDate",label:"Τελευταία Αλλαγή Ελαστ.",type:"date",ph:""},{f:"tiresNext",label:"Επόμενη Αλλαγή Ελαστ.",type:"date",ph:""},
          {f:"serviceDate",label:"Τελευταίο Service",type:"date",ph:""},{f:"serviceNextDate",label:"Επόμενο Service (ημ.)",type:"date",ph:""},
          {f:"serviceKm",label:"Service στα (χλμ)",type:"number",ph:"150000"},{f:"serviceNextKm",label:"Επόμενο Service (χλμ)",type:"number",ph:"165000"},
          {f:"serviceNotes",label:"Σημ. Service",type:"text",ph:"Αλλαγή λαδιών…"},
          {f:"driverMain",label:"Κύριος Οδηγός",type:"text",ph:"Ονοματεπώνυμο"},{f:"driverSecond",label:"2ος Οδηγός",type:"text",ph:"Ονοματεπώνυμο"},
        ].map(({f,label,type,ph})=>(
          <div key={f} style={{marginBottom:12}}>
            <div style={{fontSize:10,color:T.mt,marginBottom:3,fontWeight:"bold"}}>{label.toUpperCase()}</div>
            <input type={type} placeholder={ph} value={(av.info||{})[f]||""} onChange={e=>updateVInfo(f,e.target.value)} style={{...IS,marginBottom:0}}/>
          </div>
        ))}
        <button onClick={()=>setShowVInfo(false)} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",marginTop:8}}>✅ Αποθήκευση &amp; Κλείσιμο</button>
      </Modal>

      {/* MODAL: IMPORT/EXPORT */}
      <Modal open={showIO} onClose={()=>setShowIO(false)} title="💾 Εισαγωγή / Εξαγωγή" T={T}>
        <div style={{fontSize:13,fontWeight:"bold",marginBottom:10}}>Εξαγωγή Δεδομένων</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <button onClick={exportJSON} style={{padding:14,background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:14}}>⬇️ JSON</button>
          <button onClick={exportCSV} style={{padding:14,background:"#10b981",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:14}}>⬇️ CSV</button>
        </div>
        <div style={{fontSize:13,fontWeight:"bold",marginBottom:8}}>Εισαγωγή (JSON)</div>
        <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{...IS,marginBottom:10}}/>
        <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Ή επικόλλησε JSON εδώ…" rows={4} style={{...IS,resize:"vertical",fontFamily:"monospace",fontSize:12}}/>
        {importMsg&&<div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,fontWeight:"bold",background:importMsg.startsWith("✅")?"#0d2010":"#2a0a0a",color:importMsg.startsWith("✅")?"#10b981":"#ef4444"}}>{importMsg}</div>}
        <button onClick={handleImport} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>⬆️ Εισαγωγή Δεδομένων</button>
        <div style={{fontSize:10,color:T.mt,marginTop:8,textAlign:"center"}}>⚠️ Η εισαγωγή αντικαθιστά όλα τα υπάρχοντα δεδομένα.</div>
      </Modal>

      {/* MODAL: EDIT FUEL */}
      <Modal open={!!editFuelE} onClose={()=>setEditFuelE(null)} title="✏️ Επεξεργασία Γεμίσματος" T={T}>
        {editFuelE&&(
          <div>
            <input type="date" value={editFuelE.date} onChange={e=>setEditFuelE({...editFuelE,date:e.target.value})} style={IS}/>
            <select value={editFuelE.fuelType} onChange={e=>setEditFuelE({...editFuelE,fuelType:e.target.value})} style={IS}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
            <input type="number" step="0.001" placeholder="Τιμή €/λίτρο" value={editFuelE.ppl} onChange={e=>setEditFuelE({...editFuelE,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="Συνολικό Ποσό €" value={editFuelE.total} onChange={e=>setEditFuelE({...editFuelE,total:e.target.value})} style={IS}/>
            {parseFloat(editFuelE.ppl)>0&&parseFloat(editFuelE.total)>0&&<div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,fontWeight:"bold"}}>🧮 {+(parseFloat(editFuelE.total)/parseFloat(editFuelE.ppl)).toFixed(2)} λίτρα</div>}
            <input type="number" placeholder="Odometer" value={editFuelE.odo||""} onChange={e=>setEditFuelE({...editFuelE,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder="Σημειώσεις" value={editFuelE.notes||""} onChange={e=>setEditFuelE({...editFuelE,notes:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditFuel} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}
      </Modal>

      {/* MODAL: EDIT EXPENSE */}
      <Modal open={!!editExpE} onClose={()=>setEditExpE(null)} title="✏️ Επεξεργασία Εξόδου" T={T}>
        {editExpE&&(
          <div>
            <input type="date" value={editExpE.date} onChange={e=>setEditExpE({...editExpE,date:e.target.value})} style={IS}/>
            <select value={editExpE.category} onChange={e=>setEditExpE({...editExpE,category:e.target.value})} style={IS}>{EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <input type="text" placeholder="Τοποθεσία / Περιγραφή" value={editExpE.label||""} onChange={e=>setEditExpE({...editExpE,label:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="Ποσό €" value={editExpE.amount} onChange={e=>setEditExpE({...editExpE,amount:e.target.value})} style={IS}/>
            <button onClick={handleSaveEditExp} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}
      </Modal>

      {/* MODAL: ABOUT */}
      <Modal open={showAbout} onClose={()=>setShowAbout(false)} title="ℹ️ Σχετικά" T={T}>
        <div style={{textAlign:"center",padding:"10px 0 20px"}}>
          <div style={{fontSize:48,marginBottom:8}}>⛽</div>
          <div style={{fontSize:22,fontWeight:"bold",marginBottom:4}}>FuelLog</div>
          <div style={{fontSize:14,color:col,marginBottom:20}}>v2.4</div>
          <div style={{fontSize:13,color:T.mt,lineHeight:1.9,marginBottom:20,textAlign:"left"}}>
            ⛽ Γεμίσματα καυσίμου με αυτόματο υπολογισμό λίτρων<br/>
            🛣️ Διόδια, Parking, Service, Ελαστικά &amp; άλλα έξοδα<br/>
            📊 Στατιστικά, γραφήματα &amp; ανάλυση κατανάλωσης<br/>
            🚗 Υποστήριξη πολλαπλών οχημάτων &amp; 2 καυσίμων<br/>
            🔔 Υπενθυμίσεις ΚΤΕΟ, ασφάλειας, service<br/>
            💾 Εξαγωγή σε JSON &amp; CSV · Εισαγωγή αρχείου<br/>
          </div>
          <div style={{borderTop:`1px solid ${T.br}`,paddingTop:16}}>
            <div style={{fontSize:12,color:T.mt,marginBottom:4}}>Σχεδίαση &amp; Ανάπτυξη</div>
            <div style={{fontSize:18,fontWeight:"bold",color:col}}>Ταχμαζίδης Κ. Γιώργος</div>
            <div style={{fontSize:12,color:T.mt,marginTop:4}}>© 2026 · Όλα τα δικαιώματα διατηρούνται</div>
          </div>
        </div>
      </Modal>

      {/* MODAL: EDIT VEHICLE */}
      <Modal open={showEditV&&!!editVData} onClose={()=>{setShowEditV(false);setEditVData(null);}} title="✏️ Επεξεργασία Οχήματος" T={T}>
        {editVData&&(
          <div>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>ΟΝΟΜΑ</div>
            <input type="text" value={editVData.name} onChange={e=>setEditVData({...editVData,name:e.target.value})} style={IS}/>
            <div style={{fontSize:11,color:T.mt,marginBottom:8,fontWeight:"bold"}}>ΚΑΤΗΓΟΡΙΑ</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
              {VCATS.map(c=><button key={c.id} onClick={()=>setEditVData({...editVData,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,background:editVData.category===c.id?editVData.color:T.br,color:editVData.category===c.id?"#fff":T.mt}}>{c.icon} {c.label}</button>)}
            </div>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</div>
            <select value={editVData.fuelType} onChange={e=>setEditVData({...editVData,fuelType:e.target.value})} style={IS}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>2ο ΚΑΥΣΙΜΟ</div>
            <select value={editVData.fuelType2||""} onChange={e=>setEditVData({...editVData,fuelType2:e.target.value})} style={IS}><option value="">— Κανένα —</option>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
            <div style={{fontSize:11,color:T.mt,marginBottom:8,fontWeight:"bold"}}>ΧΡΩΜΑ</div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
              {FUEL_COLORS.map(c=><div key={c} onClick={()=>setEditVData({...editVData,color:c})} style={{width:34,height:34,borderRadius:"50%",background:c,cursor:"pointer",border:editVData.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}
            </div>
            <button onClick={handleSaveEditV} style={{width:"100%",padding:14,background:editVData.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",marginBottom:10}}>✅ Αποθήκευση</button>
            <button onClick={handleDeleteV} style={{width:"100%",padding:12,background:"none",color:"#e11d48",border:"2px solid #e11d48",borderRadius:10,fontWeight:"bold",fontSize:14,cursor:"pointer"}}>🗑️ Διαγραφή Οχήματος</button>
          </div>
        )}
      </Modal>

    </div>
  );
}
