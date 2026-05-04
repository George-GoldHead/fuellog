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
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 1 1 ${cx+R*Math.cos(eA)} ${cy+R*Math.sin(eA)}`} fill="none" stroke="#1e1e30" strokeWidth={6} strokeLinecap="round"/>
        <path d={`M ${cx+R*Math.cos(sA)} ${cy+R*Math.sin(sA)} A ${R} ${R} 0 ${pct>0.5?1:0} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={2.5} fill={color}/>
        <text x={cx} y={cy+4} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900" style={{filter:`drop-shadow(0 0 4px ${color})`}}>{fmt(value,1)}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="#9999bb" fontSize={5.5}>{unit}</text>
      </svg>
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
  const [openCat,setOpenCat]=useState({}); // drill-down κατηγορίας στα stats

  const [fuelForm,setFuelForm]=useState(emptyFuel("diesel"));
  const [expForm,setExpForm]=useState(emptyExp());

  const [showAddV,setShowAddV]=useState(false);
  const [newV,setNewV]=useState(defV());
  const [showVInfo,setShowVInfo]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [showIO,setShowIO]=useState(false);
  const [editFuelE,setEditFuelE]=useState(null);
  const [editExpE,setEditExpE]=useState(null);
  const [importText,setImportText]=useState("");
  const [importMsg,setImportMsg]=useState("");

  const av=vehicles.find(v=>v.id===vid)||vehicles[0];
  const col=av.color;

  useEffect(()=>{
    try{const s=localStorage.getItem("fuellog_data");if(s){const d=JSON.parse(s);if(d.vehicles)setVehicles(d.vehicles);if(d.entries)setEntries(d.entries);if(d.expenses)setExpenses(d.expenses);if(d.vid)setVid(d.vid);}}catch(e){}
  },[]);
  useEffect(()=>{localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,vid}));},[vehicles,entries,expenses,vid]);
  useEffect(()=>{setFuelForm(emptyFuel(av.fuelType||"diesel"));},[vid]);

  const allFuel=useMemo(()=>(entries[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExp=useMemo(()=>(expenses[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);

  const filtFuel=useMemo(()=>{let f=allFuel;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allFuel,fY,fM]);
  const filtExp=useMemo(()=>{let f=allExp;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allExp,fY,fM]);

  const stats=useMemo(()=>{
    const fuelSpent=filtFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const tL=filtFuel.reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const wK=filtFuel.filter(x=>parseFloat(x.km)>0||(parseFloat(x.liters)>0 && x.odo));
    const aC=wK.length?wK.reduce((s,x)=>s+(parseFloat(x.liters)/parseFloat(x.km||1)*100),0)/wK.length:0;
    const wP=filtFuel.filter(x=>parseFloat(x.ppl)>0);
    const aP=wP.length?+(wP.reduce((s,x)=>s+parseFloat(x.ppl),0)/wP.length).toFixed(3):0;
    const odoEntries=filtFuel.filter(x=>x.odo!=null).sort((a,b)=>a.odo-b.odo);
    const totalKm=odoEntries.length>=2?(odoEntries[odoEntries.length-1].odo-odoEntries[0].odo):0;
    const costPerKm=totalKm>0?((fuelSpent+expSpent)/totalKm):0;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP,totalKm,costPerKm};
  },[filtFuel,filtExp]);

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
    allFuel.forEach(e=>{
      const d=new Date(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,entries:[],totalAmt:0,totalL:0};
      map[k].entries.push(e);map[k].totalAmt+=(parseFloat(e.total)||0);map[k].totalL+=(parseFloat(e.liters)||0);
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
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{...expForm,id:uid(),amount:parseFloat(expForm.amount),icon:cat?.icon||"💸",label:expForm.label||cat?.label||"Άλλο"}]}));
    setExpForm(emptyExp());
  };
  const handleDelExp=id=>setExpenses(p=>({...p,[vid]:(p[vid]||[]).filter(e=>e.id!==id)}));
  const handleSaveEditExp=()=>{
    const cat=EXPENSE_CATS.find(c=>c.id===editExpE.category);
    setExpenses(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editExpE.id?{...editExpE,amount:parseFloat(editExpE.amount),icon:cat?.icon||editExpE.icon}:e)}));
    setEditExpE(null);
  };

  // CRUD Vehicles
  const handleAddVehicle=()=>{
    const v={...newV,id:uid()};setVehicles(p=>[...p,v]);setVid(v.id);setShowAddV(false);setNewV(defV());setTab("home");
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
          <button onClick={()=>setShowIO(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:14,cursor:"pointer"}}>💾</button>
          <button onClick={()=>setDark(!dark)} style={{border:"none",background:"none",fontSize:22,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </header>

      {/* Vehicle selector */}
      <div style={{display:"flex",gap:8,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,overflowX:"auto"}}>
        {vehicles.map(v=>(
          <button key={v.id} onClick={()=>setVid(v.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",background:vid===v.id?v.color:T.br,color:vid===v.id?"#fff":T.mt,fontWeight:"bold",fontSize:13}}>{v.icon} {v.name}</button>
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
              <div style={{fontSize:30,fontWeight:"bold",color:"#eab308"}}>{fmt(stats.totalSpent)}€</div>
              {av.info?.plate&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>{av.info.plate}</div>}
            </div>

            {reminders.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:"bold",color:"#eab308",marginBottom:8}}>🔔 Υπενθυμίσεις</div>
                {reminders.map((r,i)=>(
                  <div key={i} onClick={()=>{setVid(r.vid);setShowVInfo(true);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,marginBottom:6,cursor:"pointer",background:r.expired?"#2a0a0a":r.urgent?"#2a1200":T.sf,border:`1px solid ${r.expired?"#e11d48":r.urgent?"#f97316":T.br}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{r.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:"bold"}}>{r.label}</div>
                        <div style={{fontSize:11,color:T.mt}}>{r.vName} · {formatDate(r.date)}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right",fontSize:10,color:r.expired?"#ef4444":T.mt}}>
                      {r.expired?`Έληξε πριν ${Math.abs(r.days)} μέρες`:`Σε ${r.days} μέρες`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div onClick={()=>setTab("history")} style={{...CS({cursor:"pointer",borderLeft:`3px solid #3b82f6`})}}>
                <div style={{fontSize:10,color:T.mt}}>⛽ ΓΕΜΙΣΜΑΤΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#3b82f6"}}>{(entries[vid]||[]).length}</div>
              </div>
              <div onClick={()=>setTab("expenses")} style={{...CS({cursor:"pointer",borderLeft:`3px solid #e11d48`})}}>
                <div style={{fontSize:10,color:T.mt}}>📋 ΕΞΟΔΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#e11d48"}}>{(expenses[vid]||[]).length}</div>
              </div>
            </div>
          </div>
        )}

        {/* FUEL ENTRY */}
        {tab==="fuel"&&(
          <div style={CS()}>
            <h3 style={{marginTop:0,fontSize:16}}>⛽ Νέο Γέμισμα</h3>
            <input type="date" value={fuelForm.date} onChange={e=>setFuelForm({...fuelForm,date:e.target.value})} style={IS}/>
            <select value={fuelForm.fuelType} onChange={e=>setFuelForm({...fuelForm,fuelType:e.target.value})} style={IS}>
              {vFuelTypes.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <input type="number" step="0.001" placeholder="€/λίτρο" value={fuelForm.ppl} onChange={e=>setFuelForm({...fuelForm,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="Συνολικό Ποσό €" value={fuelForm.total} onChange={e=>setFuelForm({...fuelForm,total:e.target.value})} style={IS}/>
            <input type="number" placeholder="Odometer (χλμ)" value={fuelForm.odo} onChange={e=>setFuelForm({...fuelForm,odo:e.target.value})} style={IS}/>
            <button onClick={handleAddFuel} style={{width:"100%",padding:15,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:16}}>ΑΠΟΘΗΚΕΥΣΗ</button>
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
              {[{label:"ΣΥΝΟΛΟ ΠΕΡΙΟΔΟΥ",v:fmt(stats.totalSpent)+"€",color:"#eab308"},{label:"ΚΑΥΣΙΜΑ",v:fmt(stats.fuelSpent)+"€",color:"#3b82f6"},{label:"ΑΛΛΑ ΕΞΟΔΑ",v:fmt(stats.expSpent)+"€",color:"#e11d48"},{label:"ΚΟΣΤΟΣ / ΧΛΜ",v:fmt(stats.costPerKm,3)+"€",color:"#ec4899"}].map(({label,v,color})=>(
                <div key={label} style={CS()}><div style={{fontSize:9,color:T.mt,marginBottom:3}}>{label}</div><div style={{fontSize:18,fontWeight:"bold",color}}>{v}</div></div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
              <div style={{width:"100%",maxWidth:380,display:"flex",alignItems:"center",overflow:"visible"}}>
                <div style={{flex:"0 0 55%",zIndex:2,filter:"drop-shadow(3px 0 10px #10b98150)"}}><RoundCyberGauge value={stats.aC} min={0} max={15} color="#10b981" label="ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/></div>
                <div style={{flex:"0 0 55%",marginLeft:"-10%",zIndex:1,filter:"drop-shadow(-3px 0 10px #f9731650)"}}><RoundCyberGauge value={stats.aP} min={1} max={2.5} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/></div>
              </div>
            </div>

            <h4 style={{fontSize:13,color:T.mt,marginBottom:10}}>📈 Ανάλυση ανά Μήνα</h4>
            {(fY === "all" ? fuelByMonth : fuelByMonth.filter(m => m.key.startsWith(fY))).map(({ key, label }) => {
              const mF = allFuel.filter(e => e.date.startsWith(key));
              const mE = allExp.filter(e => e.date.startsWith(key));
              const mT = mF.reduce((s,x)=>s+(parseFloat(x.total)||0),0) + mE.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
              return (
                <MonthGroup key={key} monthKey={key} label={label} badge={`${mF.length + mE.length} εγγρ.`} total={`${fmt(mT)}€`} isOpen={!!openCat[key]} onToggle={()=>setOpenCat(p=>({...p,[key]:!p[key]}))} T={T}>
                  <div style={{padding:12,background:T.bg}}>
                    <div style={{marginBottom:10}}>
                      <div style={{width:"100%",height:6,background:T.ft,borderRadius:3,overflow:"hidden",display:"flex"}}>
                        <div style={{width:`${(mF.reduce((s,x)=>s+parseFloat(x.total),0)/ (mT||1))*100}%`,background:"#3b82f6"}}/>
                        <div style={{width:`${(mE.reduce((s,x)=>s+parseFloat(x.amount),0)/ (mT||1))*100}%`,background:"#e11d48"}}/>
                      </div>
                    </div>
                    {EXPENSE_CATS.map(c=>{
                      const amt=mE.filter(e=>e.category===c.id).reduce((s,x)=>s+x.amount,0);
                      return amt>0 && <div key={c.id} style={{fontSize:11,display:"flex",justifyContent:"space-between",marginBottom:4}}><span>{c.icon} {c.label}</span><b>{fmt(amt)}€</b></div>
                    })}
                  </div>
                </MonthGroup>
              );
            })}
          </div>
        )}

        {/* HISTORY */}
        {tab==="history"&&(
          <div>
            {fuelByMonth.map(({key,label,entries:me,totalAmt})=>(
              <MonthGroup key={key} label={label} badge={`${me.length} γεμ.` } total={`${fmt(totalAmt)}€`} isOpen={!!openFuelM[key]} onToggle={()=>setOpenFuelM(p=>({...p,[key]:!p[key]}))} T={T}>
                {me.slice().reverse().map((e,i)=>(
                  <div key={e.id} style={{padding:"12px 14px",background:i%2===0?T.sf:T.bg,borderBottom:`1px solid ${T.ft}`}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div style={{fontWeight:"bold"}}>{fmt(e.total)}€ <span style={{fontSize:11,color:T.mt}}>({fmt(e.liters)}L)</span></div>
                      <button onClick={()=>handleDelFuel(e.id)} style={{border:"none",background:"none",color:T.mt}}>✕</button>
                    </div>
                    <div style={{fontSize:11,color:T.mt}}>{formatDate(e.date)} • {e.odo?`${e.odo}km`:""}</div>
                  </div>
                ))}
              </MonthGroup>
            ))}
          </div>
        )}

        {/* EXPENSES TAB */}
        {tab==="expenses"&&(
          <div>
            <div style={CS({marginBottom:16})}>
              <h3 style={{marginTop:0,fontSize:15}}>➕ Νέο Έξοδο</h3>
              <input type="date" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} style={IS}/>
              <select value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})} style={IS}>
                {EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Ποσό €" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} style={IS}/>
              <button onClick={handleAddExp} style={{width:"100%",padding:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
            {expByMonth.map(({key,label,entries:me,total})=>(
              <MonthGroup key={key} label={label} badge={`${me.length} εγγρ.`} total={`-${fmt(total)}€`} isOpen={!!openExpM[key]} onToggle={()=>setOpenExpM(p=>({...p,[key]:!p[key]}))} T={T}>
                {me.slice().reverse().map((e,i)=>(
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:`1px solid ${T.ft}`}}>
                    <div><div style={{fontWeight:"bold",fontSize:13}}>{e.icon} {e.label||EXPENSE_CATS.find(c=>c.id===e.category)?.label}</div><div style={{fontSize:11,color:T.mt}}>{formatDate(e.date)}</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><b style={{color:"#e11d48"}}>-{fmt(e.amount)}€</b><button onClick={()=>handleDelExp(e.id)} style={{border:"none",background:"none",color:T.mt}}>✕</button></div>
                  </div>
                ))}
              </MonthGroup>
            ))}
          </div>
        )}
      </main>

      {/* MODALS */}
      <Modal open={showVInfo} onClose={()=>setShowVInfo(false)} title="Στοιχεία Οχήματος" T={T}>
        {REMINDER_FIELDS.map(rf => (
          <div key={rf.f} style={{marginBottom:10}}>
            <label style={{fontSize:11,color:T.mt}}>{rf.icon} {rf.label}</label>
            <input type="date" style={IS} value={av.info?.[rf.f]||""} onChange={e=>updateVInfo(rf.f, e.target.value)}/>
          </div>
        ))}
        <button onClick={()=>setShowVInfo(false)} style={{width:"100%",padding:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold"}}>ΚΛΕΙΣΙΜΟ</button>
      </Modal>

      <Modal open={showIO} onClose={()=>setShowIO(false)} title="Backup & Εισαγωγή" T={T}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:15}}>
          <button onClick={exportJSON} style={{padding:12,background:T.br,color:T.tx,border:"none",borderRadius:8}}>Export JSON</button>
          <button onClick={exportCSV} style={{padding:12,background:T.br,color:T.tx,border:"none",borderRadius:8}}>Export CSV</button>
        </div>
        <textarea style={{...IS,height:80}} placeholder="Επικολλήστε JSON για εισαγωγή..." value={importText} onChange={e=>setImportText(e.target.value)}/>
        <button onClick={handleImport} style={{width:"100%",padding:12,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold"}}>ΕΙΣΑΓΩΓΗ</button>
        {importMsg && <div style={{textAlign:"center",marginTop:10,fontSize:12}}>{importMsg}</div>}
      </Modal>

      <Modal open={showAddV} onClose={()=>setShowAddV(false)} title="Προσθήκη Οχήματος" T={T}>
        <input style={IS} placeholder="Όνομα (π.χ. Toyota)" value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})}/>
        <div style={{display:"flex",gap:5,marginBottom:10,overflowX:"auto",paddingBottom:5}}>
          {FUEL_COLORS.map(c=><div key={c} onClick={()=>setNewV({...newV,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:newV.color===c?"3px solid #fff":"none",flexShrink:0}}/>)}
        </div>
        <button onClick={handleAddVehicle} style={{width:"100%",padding:15,background:newV.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold"}}>ΔΗΜΙΟΥΡΓΙΑ</button>
      </Modal>
    </div>
  );
}
