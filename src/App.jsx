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
  {id:"tolls",label:"Διόδια",icon:"🛣️"},
  {id:"transponder",label:"Πομποδέκτης Ε.Ο.",icon:"📡"},
  {id:"parking",label:"Parking",icon:"🅿️"},
  {id:"car_wash",label:"Πλύσιμο",icon:"🚿"},
  {id:"car_clean",label:"Καθαρισμός",icon:"🧹"},
  {id:"glass",label:"Τζάμια",icon:"🪟"},
  {id:"kek",label:"ΚΕΚ",icon:"🚗💨"},
  {id:"kteo",label:"ΚΤΕΟ",icon:"🚗✅"},
  {id:"road_tax",label:"Τέλη Κυκλοφορίας",icon:"🚘"},
  {id:"insurance",label:"Ασφάλεια",icon:"🛡️"},
  {id:"repair",label:"Επισκευή",icon:"🔩"},
  {id:"service",label:"Service",icon:"🔧"},
  {id:"oil",label:"Λάδια/Φίλτρα",icon:"🛢️"},
  {id:"parts",label:"Ανταλλακτικά",icon:"⚙️"},
  {id:"battery",label:"Μπαταρία",icon:"🔋"},
  {id:"electrical",label:"Ηλεκτρολογικά",icon:"💡"},
  {id:"tyres",label:"Ελαστικά",icon:"🛞"},
  {id:"alignment",label:"Ζυγοστάθμιση",icon:"⚖️"},
  {id:"fine",label:"Πρόστιμο",icon:"🚔"},
  {id:"custom",label:"Άλλο",icon:"💸"},
];

const MONTHS_FULL=["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];
const MONTHS_SHORT=["Ιαν","Φεβ","Μαρ","Απρ","Μαΐ","Ιουν","Ιουλ","Αυγ","Σεπ","Οκτ","Νοε","Δεκ"];
const WEEKDAYS=["Δε","Τρ","Τε","Πε","Πα","Σα","Κυ"];

// ========== UTILITIES ==========
const uid=()=>Math.random().toString(36).substr(2,9);
const calcConsumption=(entry,prevEntry)=>{
  if(!entry||!prevEntry)return null;
  const curOdo=parseFloat(entry.odo),prevOdo=parseFloat(prevEntry.odo),liters=parseFloat(entry.liters);
  if(!curOdo||!prevOdo||curOdo<=prevOdo||!liters)return null;
  return liters/(curOdo-prevOdo)*100;
};
const fmt=(n,d=2)=>(n!=null&&!isNaN(n))?(+n).toFixed(d):"0.00";
const today=()=>new Date().toISOString().split("T")[0];
const formatDate=ds=>{
  if(!ds)return"--/--/--";
  const d=new Date(ds);
  return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
};
const daysUntil=ds=>{if(!ds)return null;return Math.ceil((new Date(ds)-new Date(today()))/86400000);};
const REMINDER_FIELDS=[
  {f:"insuranceExp",label:"Λήξη Ασφάλειας",icon:"🛡️"},{f:"kteo",label:"ΚΤΕΟ",icon:"🔍"},
  {f:"kek",label:"ΚΕΚ",icon:"🔬"},{f:"tiresNext",label:"Αλλαγή Ελαστικών",icon:"⚫"},
  {f:"serviceNextDate",label:"Επόμενο Service",icon:"🔧"},
];
const WARN_DAYS=30;
const WARN_KM=1000;

// ========== THEME ==========
const DK={bg:"#080810",sf:"#10101c",br:"#1e1e30",tx:"#eeeeff",mt:"#7777aa",ft:"#33334a",inp:"#0d0d1a",ib:"#1e1e30"};
const LT={bg:"#f0e8db",sf:"#faf3e8",br:"#d4c0a8",tx:"#1a1510",mt:"#5c4e3d",ft:"#e0d0bc",inp:"#ffffff",ib:"#c4b098"};

// ========== DEFAULT FACTORIES ==========
const defInfo=()=>({brand:"",model:"",year:"",cc:"",plate:"",chassis:"",insurance:"",insuranceExp:"",kteo:"",kek:"",tiresBrand:"",tiresSize:"",tiresDate:"",tiresNext:"",serviceDate:"",serviceNextDate:"",serviceKm:"",serviceNextKm:"",serviceNotes:"",driverMain:"",driverSecond:""});
const defV=(ov={})=>({id:uid(),name:"ΝΕΟ ΟΧΗΜΑ",icon:"🚗",color:"#f97316",category:"car",fuelType:"",fuelType2:"",unitMiles:false,info:defInfo(),...ov});
const emptyFuel=ft=>({date:today(),fuelType:ft||"diesel",ppl:"",total:"",odo:"",notes:""});
const emptyExp=()=>({date:today(),category:"tolls",label:"",amount:"",notes:""});

// ========== COMPONENTS ==========
function RoundCyberGauge({value,min,max,color,label,unit,T}){
  const pct=Math.min(1,Math.max(0,(value-min)/(max-min||1)));
  const R=42,cx=52,cy=52,sA=Math.PI*0.7,eA=Math.PI*2.3,totalArc=eA-sA,vA=sA+totalArc*pct;
  const arcX=a=>cx+R*Math.cos(a),arcY=a=>cy+R*Math.sin(a);
  const nx=cx+R*Math.cos(vA),ny=cy+R*Math.sin(vA);
  const trackLargeArc=totalArc>Math.PI?1:0,valueArcAngle=totalArc*pct,valueLargeArc=valueArcAngle>Math.PI?1:0;
  return(
    <div style={{background:"#0a0a0f",borderRadius:"50%",padding:5,border:`2px solid ${color}`,width:"100%",aspectRatio:"1/1",position:"relative"}}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${trackLargeArc} 1 ${arcX(eA)} ${arcY(eA)}`} fill="none" stroke="#1e1e30" strokeWidth={6} strokeLinecap="round"/>
        {pct>0.005&&<path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${valueLargeArc} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>}
        {pct>0.005&&<path d={`M ${arcX(sA)} ${arcY(sA)} A ${R} ${R} 0 ${valueLargeArc} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" opacity={0.15}/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={3} fill={color}/><circle cx={cx} cy={cy} r={1.5} fill="#0a0a0f"/>
        <text x={cx} y={cy+4} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900" style={{filter:`drop-shadow(0 0 4px ${color})`}}>{fmt(value,1)}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="#9999bb" fontSize={5.5}>{unit}</text>
      </svg>
      <div style={{position:"absolute",bottom:6,width:"100%",textAlign:"center",fontSize:7,color,fontWeight:700,letterSpacing:0.5}}>{label}</div>
    </div>
  );
}

function StackedBarChart({data,T}){
  const [sel,setSel]=useState(null);
  if(!data.length)return null;
  const max=Math.max(...data.map(d=>d.fuel+d.exp),0.01),W=300,H=90,bw=Math.floor(W/data.length)-4;
  const s=sel!=null?data[sel]:null;
  return(
    <div>
      <div style={{display:"flex",gap:14,fontSize:10,color:T.mt,marginBottom:6}}><span>🟦 Καύσιμα</span><span>🟥 Λοιπά έξοδα</span></div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+28}`} style={{overflow:"visible"}}>
        {data.map((d,i)=>{
          const x=i*(W/data.length)+2,hf=(d.fuel/max)*H,he=(d.exp/max)*H,op=sel===null||sel===i?0.9:0.35,tot=d.fuel+d.exp;
          return(
            <g key={i} onClick={()=>setSel(sel===i?null:i)} style={{cursor:"pointer"}}>
              <rect x={x-1} y={0} width={bw+2} height={H+20} fill="transparent"/>
              <rect x={x} y={H-hf} width={bw} height={hf} fill="#3b82f6" opacity={op}/>
              <rect x={x} y={H-hf-he} width={bw} height={he} fill="#e11d48" opacity={op}/>
              <text x={x+bw/2} y={H+14} textAnchor="middle" fill={sel===i?T.tx:T.mt} fontSize={6.5} fontWeight={sel===i?"bold":"normal"}>{d.label}</text>
              {tot>0&&<text x={x+bw/2} y={H-hf-he-4} textAnchor="middle" fill={T.mt} fontSize={6}>{tot.toFixed(0)}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{fontSize:11,color:T.mt,textAlign:"center",marginTop:4}}>
        {s?<span><b style={{color:T.tx}}>{s.label}</b> · ⛽ <b style={{color:"#3b82f6"}}>{fmt(s.fuel)}€</b> · 📋 <b style={{color:"#e11d48"}}>{fmt(s.exp)}€</b> · Σύνολο <b style={{color:T.tx}}>{fmt(s.fuel+s.exp)}€</b></span>:"Πάτα μια στήλη για λεπτομέρειες"}
      </div>
    </div>
  );
}

function LineChart({data,color,avg,T}){
  const [sel,setSel]=useState(null);
  const W=300,H=100,pad=8;
  const vals=data.map(d=>d.value),mn=Math.min(...vals),mx=Math.max(...vals),span=(mx-mn)||1,lo=mn-span*0.2,hi=mx+span*0.2;
  const X=i=>pad+(data.length>1?i*(W-2*pad)/(data.length-1):0),Y=v=>H-pad-((v-lo)/(hi-lo))*(H-2*pad);
  const path=data.map((d,i)=>`${i?"L":"M"}${X(i)} ${Y(d.value)}`).join(" ");
  const s=sel!=null?data[sel]:null;
  return(
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {avg>0&&avg>=lo&&avg<=hi&&<line x1={pad} x2={W-pad} y1={Y(avg)} y2={Y(avg)} stroke={T.mt} strokeDasharray="3 3" strokeWidth={0.8}/>}
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round"/>
        {data.map((d,i)=>(
          <g key={i} onClick={()=>setSel(sel===i?null:i)} style={{cursor:"pointer"}}>
            <circle cx={X(i)} cy={Y(d.value)} r={sel===i?5:3} fill={color}/>
            <circle cx={X(i)} cy={Y(d.value)} r={10} fill="transparent"/>
          </g>
        ))}
      </svg>
      <div style={{fontSize:11,color:T.mt,textAlign:"center"}}>
        {s?<span><b style={{color}}>{s.value} L/100km</b> · {s.label}</span>:`Μέση: ${fmt(avg,1)} L/100km (διακεκομμένη) · πάτα ένα σημείο`}
      </div>
    </div>
  );
}

function Modal({open,onClose,title,children,T,locked}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={e=>{if(!locked&&e.target===e.currentTarget)onClose();}}>
      <div style={{background:T.sf,borderRadius:"22px 22px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",padding:"20px 16px 36px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:16}}>{title}</h3>
          {!locked&&<button onClick={onClose} style={{border:"none",background:"none",color:T.mt,fontSize:26,cursor:"pointer",lineHeight:1}}>✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthGroup({monthKey,label,badge,total,isOpen,onToggle,T,children}){
  return(
    <div style={{marginBottom:8}}>
      <div onClick={onToggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer",userSelect:"none",background:isOpen?T.br:T.sf,border:`1px solid ${T.br}`,borderRadius:isOpen?"12px 12px 0 0":12}}>
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
      {isOpen&&<div style={{border:`1px solid ${T.br}`,borderTop:"none",borderRadius:"0 0 12px 12px",overflow:"hidden"}}>{children}</div>}
    </div>
  );
}

function FuelEntryRow({e,i,total,allFuel,T,col,swipeId,setSwipeId,swipeStartX,onEdit,onDel}){
  const ftype=FTYPES.find(f=>f.id===e.fuelType);
  const prev=e._gi>0?allFuel[e._gi-1]:null;
  const diffKm=(e.odo!=null&&prev&&prev.odo!=null&&e.odo>prev.odo)?(e.odo-prev.odo):null;
  const cons=e._cons!=null?e._cons:calcConsumption(e,prev);
  const isSwipe=swipeId===e.id;
  return(
    <div style={{position:"relative",overflow:"hidden"}}
      onTouchStart={ev=>{swipeStartX.current=ev.touches[0].clientX;}}
      onTouchEnd={ev=>{
        if(swipeStartX.current===null)return;
        const dx=swipeStartX.current-ev.changedTouches[0].clientX;
        if(dx>60)setSwipeId(e.id);else if(dx<-20)setSwipeId(null);
        swipeStartX.current=null;
      }}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:90,background:"#e11d48",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={()=>{onDel(e.id);setSwipeId(null);}}>
        <span style={{color:"#fff",fontSize:22}}>🗑️</span>
      </div>
      <div style={{padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none",transform:isSwipe?"translateX(-90px)":"translateX(0)",transition:"transform 0.25s ease",position:"relative",zIndex:1}}>
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
            {cons!=null&&<span style={{fontSize:11,marginLeft:8,color:col,fontWeight:"bold"}}>{fmt(cons,1)} L/100km</span>}
            {e.odo&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>ODO: {Number(e.odo).toLocaleString()} km</div>}
            {e.notes&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>📝 {e.notes}</div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16,fontWeight:"bold",color:"#ef4444"}}>{fmt(e.total)}€</span>
            <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
            <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseEntryRow({e,i,total,T,onEdit,onDel}){
  const cat=EXPENSE_CATS.find(c=>c.id===e.category);
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{cat&&cat.icon||e.icon||"💸"}</span>
        <div>
          <div style={{fontWeight:"bold",fontSize:13}}>{e.label||cat&&cat.label}</div>
          <div style={{fontSize:11,color:T.mt}}>{formatDate(e.date)}{cat&&e.label&&e.label!==cat.label?` · ${cat.label}`:""}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontWeight:"bold",color:"#e11d48",fontSize:14}}>-{fmt(e.amount)}€</span>
        <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
        <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16,padding:2}}>✕</button>
      </div>
    </div>
  );
}

function NoteEntryRow({e,i,total,T,onEdit,onDel}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,padding:"10px 14px",background:i%2===0?T.sf:T.bg,borderBottom:i<total-1?`1px solid ${T.ft}`:"none"}}>
      <div style={{display:"flex",gap:10,minWidth:0}}>
        <span style={{fontSize:20}}>📝</span>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,color:T.mt,marginBottom:2}}>{formatDate(e.date)}</div>
          <div style={{fontSize:13,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{e.text}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
        <button onClick={()=>onEdit({...e})} style={{border:"none",background:T.br,color:T.mt,cursor:"pointer",fontSize:12,padding:"4px 7px",borderRadius:6}}>✏️</button>
        <button onClick={()=>onDel(e.id)} style={{border:"none",background:"none",color:T.mt,cursor:"pointer",fontSize:16,padding:2}}>✕</button>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function FuelLog(){
  const [dark,setDark]=useState(true);
  const T=dark?DK:LT;
  const [vehicles,setVehicles]=useState([{...defV(),id:"v1",name:"ΟΧΗΜΑ",icon:"🚗",color:"#f97316",fuelType:"diesel",fuelType2:""}]);
  const [vid,setVid]=useState("v1");
  const [entries,setEntries]=useState({});
  const [expenses,setExpenses]=useState({});
  const [notes,setNotes]=useState({});
  const [noteEdit,setNoteEdit]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [setupMode,setSetupMode]=useState(false);
  const [doneRem,setDoneRem]=useState(null);
  const askDel=(title,detail,fn)=>setConfirmDel({title,detail,fn});
  const [lastBackup,setLastBackup]=useState(()=>{try{return localStorage.getItem("fuellog_last_backup")||"";}catch(e){return "";}});
  const [hideBackup,setHideBackup]=useState(false);
  const [expCatFilter,setExpCatFilter]=useState("all");
  const [tab,setTab]=useState("home");
  const [fY,setFY]=useState(String(new Date().getFullYear()));
  const [fM,setFM]=useState("all");
  const [openFuelM,setOpenFuelM]=useState({});
  const [openExpM,setOpenExpM]=useState({});
  const [openCat,setOpenCat]=useState(null);
  const [openCatMonth,setOpenCatMonth]=useState({});
  const [histSort,setHistSort]=useState("date_desc");
  const [movFilter,setMovFilter]=useState("all");
  const [movView,setMovView]=useState("list");
  const [calY,setCalY]=useState(new Date().getFullYear());
  const [calM,setCalM]=useState(new Date().getMonth());
  const [selDay,setSelDay]=useState(null);
  const [swipeId,setSwipeId]=useState(null);
  const swipeStartX=useRef(null);
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone;
  const [showInstallBanner,setShowInstallBanner]=useState(false);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [fuelForm,setFuelForm]=useState(emptyFuel("diesel"));
  const [expForm,setExpForm]=useState(emptyExp());
  const [showAddV,setShowAddV]=useState(false);
  const [newV,setNewV]=useState(defV());
  const [showVInfo,setShowVInfo]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [showIO,setShowIO]=useState(false);
  const [showEditV,setShowEditV]=useState(false);
  const [editVData,setEditVData]=useState(null);
  const [editFuelE,setEditFuelE]=useState(null);
  const [editExpE,setEditExpE]=useState(null);
  const [importText,setImportText]=useState("");
  const [importMsg,setImportMsg]=useState("");
  const importRef=useRef();

  const av=vehicles.find(v=>v.id===vid)||vehicles[0];
  const col=av.color;

  useEffect(()=>{
    let first=true;
    try{
      const s=localStorage.getItem("fuellog_data");
      if(s){
        const d=JSON.parse(s);
        if(d.vehicles)setVehicles(d.vehicles);if(d.entries)setEntries(d.entries);if(d.expenses)setExpenses(d.expenses);if(d.notes)setNotes(d.notes);if(d.vid)setVid(d.vid);
        const hasAny=o=>!!o&&Object.values(o).some(a=>a&&a.length);
        const onlyPlaceholder=!!d.vehicles&&d.vehicles.length===1&&["ΟΧΗΜΑ","ΕΤΑΙΡΙΚΟ"].includes(d.vehicles[0].name)&&d.vehicles[0].id==="v1"&&Object.values(d.vehicles[0].info||{}).every(x=>!x)&&!hasAny(d.entries)&&!hasAny(d.expenses)&&!hasAny(d.notes);
        first=!d.vehicles||d.vehicles.length===0||onlyPlaceholder;
      }
    }catch(e){}
    if(first){setSetupMode(true);setNewV(defV({name:""}));setShowAddV(true);}
  },[]);

  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallPrompt(e);if(!isStandalone)setShowInstallBanner(true);};
    window.addEventListener('beforeinstallprompt',handler);
    if(isIOS&&!isStandalone)setShowInstallBanner(true);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);

  useEffect(()=>{localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,notes,vid}));},[vehicles,entries,expenses,notes,vid]);
  useEffect(()=>{setFuelForm(emptyFuel(av.fuelType||"diesel"));},[vid]);

  const allFuel=useMemo(()=>(entries[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allNotes=useMemo(()=>(notes[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[notes,vid]);
  const allExp=useMemo(()=>(expenses[vid]||[]).sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);

  const filtFuel=useMemo(()=>{let f=allFuel;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allFuel,fY,fM]);
  const filtExp=useMemo(()=>{let f=allExp;if(fY!=="all")f=f.filter(e=>e.date.startsWith(fY));if(fM!=="all")f=f.filter(e=>e.date.slice(5,7)===fM);return f;},[allExp,fY,fM]);

  const stats=useMemo(()=>{
    const fuelSpent=filtFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const tL=filtFuel.reduce((s,x)=>s+(parseFloat(x.liters)||0),0);
    const withOdo=filtFuel.filter(x=>x.odo!=null&&parseFloat(x.odo)>0);
    let totalConsL=0,totalConsKm=0;
    for(let i=1;i<withOdo.length;i++){const p=parseFloat(withOdo[i-1].odo),c=parseFloat(withOdo[i].odo),l=parseFloat(withOdo[i].liters)||0;if(c>p&&l>0){totalConsKm+=(c-p);totalConsL+=l;}}
    const aC=totalConsKm>0?(totalConsL/totalConsKm*100):0;
    const wP=filtFuel.filter(x=>parseFloat(x.ppl)>0);
    const aP=wP.length?+(wP.reduce((s,x)=>s+parseFloat(x.ppl),0)/wP.length).toFixed(3):0;
    const odoEntries=filtFuel.filter(x=>x.odo!=null&&parseFloat(x.odo)>0).sort((a,b)=>parseFloat(a.odo)-parseFloat(b.odo));
    const totalKm=odoEntries.length>=2?(parseFloat(odoEntries[odoEntries.length-1].odo)-parseFloat(odoEntries[0].odo)):0;
    const costPerKm=totalKm>0?((fuelSpent+expSpent)/totalKm):0;
    const fuelCostPerKm=totalKm>0?(fuelSpent/totalKm):0;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP,totalKm,costPerKm,fuelCostPerKm};
  },[filtFuel,filtExp]);

  const gaugeRanges=useMemo(()=>{
    const ppls=allFuel.map(x=>parseFloat(x.ppl)).filter(x=>x>0);
    const pplMin=ppls.length?Math.max(0.5,Math.min(...ppls)-0.2):0.8;
    const pplMax=ppls.length?Math.max(...ppls)+0.3:3.0;
    return{consMin:0,consMax:20,pplMin,pplMax};
  },[allFuel]);

  const reminders=useMemo(()=>{
    const list=[];
    vehicles.forEach(v=>{REMINDER_FIELDS.forEach(({f,label,icon})=>{const ds=(v.info||{})[f],days=daysUntil(ds);if(days===null)return;if(days<=WARN_DAYS)list.push({vid:v.id,vName:v.name,vIcon:v.icon,vColor:v.color,f,label,icon,days,date:ds,urgent:days<=7,expired:days<0});});});
    vehicles.forEach(v=>{
      const nk=parseFloat((v.info||{}).serviceNextKm);
      const odos=(entries[v.id]||[]).map(e=>parseFloat(e.odo)).filter(x=>x>0);
      if(nk>0&&odos.length){
        const left=nk-Math.max(...odos);
        if(left<=WARN_KM)list.push({vid:v.id,vName:v.name,vIcon:v.icon,vColor:v.color,label:"Service (χλμ)",icon:"🔧",isKm:true,f:"serviceNextKm",odo:Math.max(...odos),kmLeft:left,days:Math.max(0,Math.round(left/50)),date:String(nk),urgent:left<=300,expired:left<=0});
      }
    });
    return list.sort((a,b)=>a.days-b.days);
  },[vehicles,entries]);

  const monthlyBarData=useMemo(()=>{
    const yF=fY==="all"?allFuel:allFuel.filter(e=>e.date.startsWith(fY));
    const yE=fY==="all"?allExp:allExp.filter(e=>e.date.startsWith(fY));
    return MONTHS_SHORT.map((label,i)=>{
      const m=String(i+1).padStart(2,"0");
      const f=yF.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.total)||0),0);
      const x=yE.filter(e=>e.date.slice(5,7)===m).reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
      return{label,fuel:+f.toFixed(2),exp:+x.toFixed(2)};
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

  // Fuel entries with their index and consumption (used by Κινήσεις)
  const fuelMeta=useMemo(()=>allFuel.map((e,gi)=>({...e,_gi:gi,_cons:calcConsumption(e,gi>0?allFuel[gi-1]:null)})),[allFuel]);

  const consSeries=useMemo(()=>fuelMeta.filter(e=>e._cons!=null&&(fY==="all"||e.date.startsWith(fY))).map(e=>({label:formatDate(e.date),value:+e._cons.toFixed(2)})),[fuelMeta,fY]);

  // Unified movements (fuel + expenses) grouped by month
  const movesByMonth=useMemo(()=>{
    const items=[];
    if(movFilter==="all"||movFilter==="fuel")fuelMeta.forEach(e=>items.push({kind:"fuel",e}));
    if(movFilter==="all"||movFilter==="exp")allExp.forEach(e=>items.push({kind:"exp",e}));
    if(movFilter==="all"||movFilter==="note")allNotes.forEach(e=>items.push({kind:"note",e}));
    const dir=histSort==="date_asc"?1:-1;
    items.sort((a,b)=>dir*(new Date(a.e.date)-new Date(b.e.date)));
    const map={};
    items.forEach(it=>{
      const d=new Date(it.e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!map[k])map[k]={key:k,label:`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`,items:[],nF:0,nE:0,nN:0,total:0};
      map[k].items.push(it);
      if(it.kind==="fuel"){map[k].nF++;map[k].total+=(parseFloat(it.e.total)||0);}
      else if(it.kind==="note"){map[k].nN++;}
      else{map[k].nE++;map[k].total+=(parseFloat(it.e.amount)||0);}
    });
    return Object.values(map).sort((a,b)=>dir*a.key.localeCompare(b.key));
  },[fuelMeta,allExp,allNotes,movFilter,histSort]);

  // Per-day lookup for the calendar
  const dayMap=useMemo(()=>{
    const m={};
    fuelMeta.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).f.push(e);});
    allExp.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).x.push(e);});
    allNotes.forEach(e=>{(m[e.date]=m[e.date]||{f:[],x:[],n:[]}).n.push(e);});
    return m;
  },[fuelMeta,allExp,allNotes]);

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

  const handleInstall=async()=>{if(installPrompt){installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted"){setShowInstallBanner(false);setInstallPrompt(null);}}};

  // ── CRUD Fuel ──
  const handleAddFuel=()=>{
    const ppl=parseFloat(fuelForm.ppl),total=parseFloat(fuelForm.total);
    if(!total)return;
    const liters=ppl>0?+(total/ppl).toFixed(3):0;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{...fuelForm,id:uid(),total,ppl:ppl||0,liters,odo:fuelForm.odo?parseFloat(fuelForm.odo):null}]}));
    setFuelForm(emptyFuel(av.fuelType||"diesel"));setTab("home");
  };
  const handleDelFuel=id=>{const e=allFuel.find(x=>x.id===id);askDel("Γέμισμα καυσίμου",e?`${formatDate(e.date)} · ${fmt(e.total)}€`:"",()=>setEntries(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};
  const handleSaveEditFuel=()=>{
    const ppl=parseFloat(editFuelE.ppl),total=parseFloat(editFuelE.total),liters=ppl>0?+(total/ppl).toFixed(3):(parseFloat(editFuelE.liters)||0);
    setEntries(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editFuelE.id?{...editFuelE,total,ppl,liters,odo:editFuelE.odo?parseFloat(editFuelE.odo):null}:e)}));
    setEditFuelE(null);
  };

  // ── CRUD Expenses ──
  const handleAddExp=()=>{
    if(!expForm.amount)return;
    const cat=EXPENSE_CATS.find(c=>c.id===expForm.category);
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{...expForm,id:uid(),amount:parseFloat(expForm.amount),icon:cat&&cat.icon||"💸",label:expForm.label||cat&&cat.label||"Άλλο"}]}));
    setExpForm(emptyExp());
  };
  const handleDelExp=id=>{const e=allExp.find(x=>x.id===id),c=e&&EXPENSE_CATS.find(k=>k.id===e.category);askDel("Έξοδο",e?`${(e.label||(c&&c.label)||"")} · ${formatDate(e.date)} · -${fmt(e.amount)}€`:"",()=>setExpenses(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};

  // ── CRUD Notes ──
  const handleSaveNote=()=>{
    const text=(noteEdit.text||"").trim();if(!text)return;
    setNotes(p=>{const list=p[vid]||[];const n={...noteEdit,text};return{...p,[vid]:n.id?list.map(x=>x.id===n.id?n:x):[...list,{...n,id:uid()}]};});
    setNoteEdit(null);
  };
  const handleDelNote=id=>{const e=allNotes.find(x=>x.id===id);askDel("Σημείωση",e?`${formatDate(e.date)} · ${(e.text||"").slice(0,50)}${(e.text||"").length>50?"…":""}`:"",()=>setNotes(p=>({...p,[vid]:(p[vid]||[]).filter(x=>x.id!==id)})));};
  const handleSaveEditExp=()=>{
    const cat=EXPENSE_CATS.find(c=>c.id===editExpE.category);
    setExpenses(p=>({...p,[vid]:(p[vid]||[]).map(e=>e.id===editExpE.id?{...editExpE,amount:parseFloat(editExpE.amount),icon:cat&&cat.icon||editExpE.icon}:e)}));
    setEditExpE(null);
  };

  // ── Reminder done: set next date / km (empty = remove reminder) ──
  const saveDoneRem=()=>{
    const r=doneRem;if(!r)return;
    setVehicles(p=>p.map(v=>{
      if(v.id!==r.vid)return v;
      const info={...v.info,[r.f]:r.value||""};
      if(r.f==="serviceNextDate")info.serviceDate=today();
      if(r.f==="tiresNext")info.tiresDate=today();
      if(r.f==="serviceNextKm"){if(r.odo)info.serviceKm=String(r.odo);info.serviceDate=today();}
      return{...v,info};
    }));
    setDoneRem(null);
  };

  // ── CRUD Vehicles ──
  const handleAddVehicle=()=>{
    if(!newV.fuelType)return;
    const v={...newV,id:uid(),name:(newV.name||"").trim()||"ΟΧΗΜΑ 1"};
    if(setupMode){setVehicles([v]);setEntries({});setExpenses({});setNotes({});setSetupMode(false);}
    else setVehicles(p=>[...p,v]);
    setVid(v.id);setShowAddV(false);setNewV(defV());setTab("home");
  };
  const handleSaveEditV=()=>{
    setVehicles(p=>p.map(v=>v.id===editVData.id?{...v,name:editVData.name,color:editVData.color,icon:editVData.icon,category:editVData.category,fuelType:editVData.fuelType,fuelType2:editVData.fuelType2}:v));
    setShowEditV(false);setEditVData(null);
  };
  const handleDeleteV=()=>{
    if(vehicles.length<=1){setConfirmDel({info:true,title:"Δεν μπορείς να διαγράψεις το μοναδικό όχημα."});return;}
    askDel("Όχημα",editVData.name+" — θα διαγραφούν και όλα τα δεδομένα του.",()=>{
    setVehicles(p=>p.filter(v=>v.id!==editVData.id));
    setEntries(p=>{const n={...p};delete n[editVData.id];return n;});
    setExpenses(p=>{const n={...p};delete n[editVData.id];return n;});
    setNotes(p=>{const n={...p};delete n[editVData.id];return n;});
    setVid((vehicles.find(v=>v.id!==editVData.id)||{}).id||"v1");
    setShowEditV(false);setEditVData(null);
    });
  };
  const updateVInfo=(f,val)=>setVehicles(p=>p.map(v=>v.id===vid?{...v,info:{...v.info,[f]:val}}:v));

  // ── Export / Import ──
  const exportJSON=()=>{
    const a=document.createElement("a");
    a.href="data:application/json;charset=utf-8,"+encodeURIComponent(JSON.stringify({vehicles,entries,expenses,notes},null,2));
    a.download=`fuellog_${today()}.json`;a.click();
    try{localStorage.setItem("fuellog_last_backup",today());}catch(e){}
    setLastBackup(today());
  };
  const exportCSV=()=>{
    let csv="Τύπος,Όχημα,Ημερομηνία,Κατηγορία,Λίτρα,€/L,Σύνολο€,ODO,Σημειώσεις\n";
    vehicles.forEach(v=>{
      (entries[v.id]||[]).forEach(e=>{csv+=`Καύσιμο,${v.name},${e.date},${e.fuelType},${fmt(e.liters)},${fmt(e.ppl,3)},${fmt(e.total)},${e.odo||""},${(e.notes||"").replace(/,/g,"")}\n`;});
      (expenses[v.id]||[]).forEach(e=>{csv+=`Έξοδο,${v.name},${e.date},${e.category},,,${fmt(e.amount)},,${(e.label||"").replace(/,/g," ")}\n`;});
      (notes[v.id]||[]).forEach(e=>{csv+=`Σημείωση,${v.name},${e.date},,,,,,${(e.text||"").replace(/[,\n]/g," ")}\n`;});
    });
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,\uFEFF"+encodeURIComponent(csv);
    a.download=`fuellog_${today()}.csv`;a.click();
  };
  const exportExcel=()=>{
    const sep="\t";
    let out="FuelLog - "+av.name+"\r\n\r\nΓΕΜΙΣΜΑΤΑ ΚΑΥΣΙΜΟΥ\r\n";
    out+=["Ημερομηνια","Τυπος","Λιτρα","Τιμη/L","Συνολο EUR","ODO","L/100km","Σημειωσεις"].join(sep)+"\r\n";
    allFuel.forEach((e,gi)=>{
      const prev=gi>0?allFuel[gi-1]:null,cons=calcConsumption(e,prev),ftype=FTYPES.find(f=>f.id===e.fuelType);
      out+=[(formatDate(e.date)),(ftype?ftype.label:e.fuelType),(fmt(e.liters)),(fmt(e.ppl,3)),(fmt(e.total)),(e.odo||""),(cons?fmt(cons,1):""),(e.notes||"")].join(sep)+"\r\n";
    });
    if(allExp.length>0){
      out+="\r\nΛΟΙΠΑ ΕΞΟΔΑ\r\n"+["Ημερομηνια","Κατηγορια","Περιγραφη","Ποσο EUR"].join(sep)+"\r\n";
      allExp.forEach(e=>{const cat=EXPENSE_CATS.find(c=>c.id===e.category);out+=[(formatDate(e.date)),(cat?cat.label:e.category),(e.label||""),(fmt(e.amount))].join(sep)+"\r\n";});
    }
    const a=document.createElement("a");
    a.href="data:text/tab-separated-values;charset=utf-8,\uFEFF"+encodeURIComponent(out);
    a.download=`fuellog_${av.name}_${today()}.xls`;a.click();
  };

  const exportPDF=()=>{
    const totalFuel=allFuel.reduce((s,x)=>s+(parseFloat(x.total)||0),0);
    const totalExp=allExp.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
    const fuelRows=allFuel.map((e,gi)=>{
      const prev=gi>0?allFuel[gi-1]:null,cons=calcConsumption(e,prev),ftype=FTYPES.find(f=>f.id===e.fuelType);
      return`<tr><td>${formatDate(e.date)}</td><td>${ftype?ftype.label:e.fuelType}</td><td>${fmt(e.liters,2)}</td><td>${fmt(e.ppl,3)}</td><td><b>${fmt(e.total)}€</b></td><td>${e.odo?Number(e.odo).toLocaleString():"-"}</td><td>${cons?fmt(cons,1):"-"}</td><td>${e.notes||""}</td></tr>`;
    }).join("");
    const expRows=allExp.map(e=>{
      const cat=EXPENSE_CATS.find(c=>c.id===e.category);
      return`<tr><td>${formatDate(e.date)}</td><td>${cat?cat.label:e.category}</td><td>${e.label||""}</td><td style="color:#c00;font-weight:bold">-${fmt(e.amount)}€</td></tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8"><title>FuelLog - ${av.name}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:20px}.hdr{margin-bottom:14px;border-bottom:3px solid #f97316;padding-bottom:8px}.hdr h1{font-size:19px;color:#f97316}.hdr p{font-size:10px;color:#555;margin-top:4px}.totals{background:#f5f5f5;border-radius:6px;padding:8px 14px;display:flex;gap:24px;font-size:12px;margin-bottom:14px}.totals b{color:#f97316}h2{font-size:13px;margin:16px 0 7px;color:#1e1e30;border-left:4px solid #f97316;padding-left:8px}table{width:100%;border-collapse:collapse;margin-bottom:14px}thead tr{background:#1e1e30;color:#fff}th{padding:6px 8px;text-align:left;font-size:10px}td{padding:5px 8px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f8f8fc}.footer{margin-top:18px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}@media print{body{padding:8px}}</style></head><body><div class="hdr"><h1>⛽ FuelLog — ${av.name}${av.info&&av.info.plate?" ("+av.info.plate+")":""}</h1><p>Εξαγωγή: ${today()} &nbsp;|&nbsp; Γεμίσματα: ${allFuel.length} &nbsp;|&nbsp; Λίτρα: ${fmt(allFuel.reduce((s,x)=>s+(parseFloat(x.liters)||0),0),1)} L &nbsp;|&nbsp; Σύνολο: ${fmt(totalFuel+totalExp)}€</p></div><div class="totals"><div>Καύσιμα: <b>${fmt(totalFuel)}€</b></div><div>Άλλα έξοδα: <b>${fmt(totalExp)}€</b></div><div>Σύνολο: <b>${fmt(totalFuel+totalExp)}€</b></div></div><h2>⛽ Γεμίσματα Καυσίμου</h2><table><thead><tr><th>Ημερομηνία</th><th>Τύπος</th><th>Λίτρα</th><th>€/L</th><th>Σύνολο</th><th>ODO (km)</th><th>L/100km</th><th>Σημειώσεις</th></tr></thead><tbody>${fuelRows}</tbody></table>${allExp.length>0?"<h2>📋 Λοιπά Έξοδα</h2><table><thead><tr><th>Ημερομηνία</th><th>Κατηγορία</th><th>Περιγραφή</th><th>Ποσό</th></tr></thead><tbody>"+expRows+"</tbody></table>":""}<div class="footer">Δημιουργήθηκε από FuelLog v2.10 — Ταχμαζίδης Κ. Γιώργος</div><script>window.onload=function(){window.print();};<\/script></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(!win){const a=document.createElement("a");a.href=url;a.download=`fuellog_${av.name}_${today()}.html`;a.click();}
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  };

  const handleImport=()=>{
    const text=importText.trim();
    if(!text){setImportMsg("❌ Δεν έχεις επιλέξει αρχείο.");return;}
    try{
      const d=JSON.parse(text);
      if(!d.vehicles&&!d.entries&&!d.expenses){setImportMsg("❌ Μη έγκυρη μορφή FuelLog.");return;}
      if(d.vehicles)setVehicles(d.vehicles);if(d.entries)setEntries(d.entries);if(d.expenses)setExpenses(d.expenses);if(d.notes)setNotes(d.notes);
      if(d.vehicles&&d.vehicles.length>0){const sv=d.vid||(d.vehicles[0].id);setVid(d.vehicles.find(v=>v.id===sv)?sv:d.vehicles[0].id);}
      setImportMsg("✅ Εισαγωγή επιτυχής!");setImportText("");
    }catch(e){setImportMsg("❌ Μη έγκυρο JSON.");}
  };
  const handleImportFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setImportText(ev.target.result);setImportMsg("");};r.readAsText(f);};

  // Inputs get a coloured (vehicle colour) border so they stand out
  const IS={width:"100%",padding:12,marginBottom:10,borderRadius:8,background:T.inp,color:T.tx,border:`2px solid ${col}`,boxSizing:"border-box",fontSize:14};
  const CS=(extra={})=>({background:T.sf,padding:14,borderRadius:14,border:`1px solid ${T.br}`,...extra});
  const TABS=[{id:"home",label:"Αρχική",icon:"🏠"},{id:"fuel",label:"Καύσιμο",icon:"⛽"},{id:"expenses",label:"Έξοδα",icon:"📋"},{id:"stats",label:"Στατιστικά",icon:"📊"},{id:"history",label:"Κινήσεις",icon:"🧾"}];
  const curMonthKey=today().slice(0,7);
  const hasData=Object.values(entries).some(a=>a&&a.length)||Object.values(expenses).some(a=>a&&a.length)||Object.values(notes).some(a=>a&&a.length);
  const backupAge=lastBackup?-daysUntil(lastBackup):null;
  const needBackup=hasData&&!hideBackup&&(backupAge===null||backupAge>=30);
  const chipStyle=on=>({padding:"6px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:12,fontWeight:"bold",background:on?col:T.br,color:on?"#fff":T.mt});

  return(
    <div className="fl-root" style={{backgroundColor:T.bg,color:T.tx,minHeight:"100vh",fontFamily:"sans-serif",paddingBottom:90}}>
      <style>{`.fl-root input:focus,.fl-root select:focus,.fl-root textarea:focus{outline:none;box-shadow:0 0 0 3px ${col}55}${setupMode?".fl-root header,.fl-root main,.fl-root .fl-hide{visibility:hidden}":""}`}</style>

      {/* Header */}
      <header style={{padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>⛽</span>
          <span style={{fontWeight:"bold",fontSize:17}}>FuelLog v2.10</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={()=>setShowVInfo(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer"}}>🗂️ Αρχείο</button>
          <button onClick={()=>setShowIO(true)} style={{border:`1px solid ${T.br}`,background:T.br,color:T.mt,borderRadius:8,padding:"5px 8px",fontSize:14,cursor:"pointer"}}>💾</button>
          <button onClick={()=>setShowAbout(true)} style={{border:"none",background:"none",fontSize:20,cursor:"pointer"}}>ℹ️</button>
          <button onClick={()=>setDark(!dark)} style={{border:"none",background:"none",fontSize:22,cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </header>

      {/* Vehicle selector */}
      <div className="fl-hide" style={{display:"flex",gap:8,padding:"10px 15px",background:T.sf,borderBottom:`1px solid ${T.br}`,overflowX:"auto"}}>
        {vehicles.map(v=>(
          <div key={v.id} style={{display:"flex",alignItems:"center",borderRadius:20,background:vid===v.id?v.color:T.br,overflow:"hidden"}}>
            <button onClick={()=>setVid(v.id)} style={{padding:"6px 12px",border:"none",cursor:"pointer",whiteSpace:"nowrap",background:"transparent",color:vid===v.id?"#fff":T.mt,fontWeight:"bold",fontSize:13}}>{v.icon} {v.name}</button>
            {vid===v.id&&<button onClick={()=>{setEditVData({...v});setShowEditV(true);}} style={{border:"none",background:"rgba(0,0,0,0.2)",color:"#fff",cursor:"pointer",padding:"6px 8px",fontSize:12,borderLeft:"1px solid rgba(255,255,255,0.2)"}}>✏️</button>}
          </div>
        ))}
        <button onClick={()=>{setNewV(defV());setShowAddV(true);}} style={{padding:"6px 12px",borderRadius:20,border:`1px dashed ${T.mt}`,background:"none",color:T.mt,cursor:"pointer",fontSize:18,lineHeight:1}}>+</button>
      </div>

      {/* Bottom nav */}
      <div className="fl-hide" style={{position:"fixed",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",background:T.sf,borderTop:`1px solid ${T.br}`,padding:"5px 0",zIndex:100}}>
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

        {/* ══ HOME ══ */}
        {tab==="home"&&(
          <div>
            <div style={{...CS(),marginBottom:12}}>
              <div style={{fontSize:11,color:T.mt,marginBottom:4}}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ · {av.icon} {av.name}</div>
              <div style={{fontSize:30,fontWeight:"bold",color:"#eab308"}}>{fmt((entries[vid]||[]).reduce((s,x)=>s+(parseFloat(x.total)||0),0)+(expenses[vid]||[]).reduce((s,x)=>s+(parseFloat(x.amount)||0),0))}€</div>
              {av.info&&av.info.plate&&<div style={{fontSize:11,color:T.mt,marginTop:2}}>{av.info.plate}</div>}
            </div>
            {showInstallBanner&&!isStandalone&&(
              <div style={{background:dark?"#1a1a10":"#fff8e7",border:`1px solid ${col}`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>📲</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:"bold",color:col}}>Εγκατέστησε το FuelLog!</div>
                  {isIOS?<div style={{fontSize:11,color:T.mt}}>Πάτα <b>Share</b> → <b>"Add to Home Screen"</b> για offline χρήση</div>:<div style={{fontSize:11,color:T.mt}}>Γρήγορη πρόσβαση &amp; χρήση χωρίς internet</div>}
                </div>
                {!isIOS&&<button onClick={handleInstall} style={{padding:"7px 12px",background:col,color:"#fff",border:"none",borderRadius:8,fontWeight:"bold",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>Εγκατάσταση</button>}
                <button onClick={()=>setShowInstallBanner(false)} style={{border:"none",background:"none",color:T.mt,fontSize:20,cursor:"pointer",lineHeight:1,padding:4}}>✕</button>
              </div>
            )}
            {needBackup&&(
              <div style={{background:dark?"#101a24":"#e6f0fb",border:"1px solid #3b82f6",borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:26}}>💾</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:"bold",color:"#3b82f6"}}>Κάνε αντίγραφο ασφαλείας</div>
                  <div style={{fontSize:11,color:T.mt}}>{backupAge===null?"Δεν έχεις κατεβάσει ποτέ αντίγραφο.":`Το τελευταίο ήταν πριν ${backupAge} μέρες.`} Τα δεδομένα μένουν μόνο σε αυτό το κινητό.</div>
                </div>
                <button onClick={exportJSON} style={{padding:"7px 12px",background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,fontWeight:"bold",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>Λήψη JSON</button>
                <button onClick={()=>setHideBackup(true)} style={{border:"none",background:"none",color:T.mt,fontSize:20,cursor:"pointer",lineHeight:1,padding:4}}>✕</button>
              </div>
            )}
            {reminders.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:"bold",color:"#eab308",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  🔔 Υπενθυμίσεις <span style={{background:"#e11d48",color:"#fff",fontSize:10,fontWeight:"bold",padding:"1px 7px",borderRadius:10}}>{reminders.length}</span>
                </div>
                {reminders.map((r,i)=>{
                  const bgC=r.expired?"#2a0a0a":r.urgent?"#2a1200":dark?"#1a1a10":"#fdf3d0";
                  const bC=r.expired?"#e11d48":r.urgent?"#f97316":"#eab308";
                  const tC=r.expired?"#ef4444":r.urgent?"#f97316":"#eab308";
                  const st=r.isKm?(r.expired?`⚠️ Πέρασες το όριο κατά ${Math.abs(Math.round(r.kmLeft)).toLocaleString()} χλμ`:`⏰ Σε ${Math.round(r.kmLeft).toLocaleString()} χλμ`):r.expired?`⚠️ Έληξε πριν ${Math.abs(r.days)} μέρες`:r.days===0?"⚠️ Λήγει ΣΗΜΕΡΑ":`⏰ Λήγει σε ${r.days} μέρες`;
                  return(
                    <div key={i} onClick={()=>setDoneRem({...r,value:""})} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,marginBottom:6,cursor:"pointer",background:bgC,border:`1px solid ${bC}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22}}>{r.icon}</span>
                        <div><div style={{fontSize:13,fontWeight:"bold",color:tC}}>{r.label}</div><div style={{fontSize:11,color:T.mt}}>{r.vIcon} {r.vName} · {r.isKm?`όριο ${Number(r.date).toLocaleString()} χλμ`:formatDate(r.date)}</div></div>
                      </div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:"bold",color:tC}}>{st}</div><div style={{fontSize:10,color:T.mt}}>✔ Έγινε;</div></div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div onClick={()=>{setMovFilter("fuel");setTab("history");}} style={{...CS({cursor:"pointer",borderLeft:`3px solid #3b82f6`})}}>
                <div style={{fontSize:10,color:T.mt}}>⛽ ΓΕΜΙΣΜΑΤΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#3b82f6"}}>{(entries[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Κινήσεις</div>
              </div>
              <div onClick={()=>{setMovFilter("exp");setTab("history");}} style={{...CS({cursor:"pointer",borderLeft:`3px solid #e11d48`})}}>
                <div style={{fontSize:10,color:T.mt}}>📋 ΕΞΟΔΑ</div>
                <div style={{fontSize:26,fontWeight:"bold",color:"#e11d48"}}>{(expenses[vid]||[]).length}</div>
                <div style={{fontSize:10,color:col,marginTop:6}}>→ Κινήσεις</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FUEL ══ */}
        {tab==="fuel"&&(
          <div style={CS({border:`2px solid ${col}`})}>
            <h3 style={{marginTop:0,fontSize:16}}>⛽ Νέο Γέμισμα</h3>
            <input type="date" value={fuelForm.date} onChange={e=>setFuelForm({...fuelForm,date:e.target.value})} style={IS}/>
            <select value={fuelForm.fuelType} onChange={e=>setFuelForm({...fuelForm,fuelType:e.target.value})} style={IS}>
              {vFuelTypes.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
            <input type="number" step="0.001" placeholder="⬡  Τιμή €/λίτρο" value={fuelForm.ppl} onChange={e=>setFuelForm({...fuelForm,ppl:e.target.value})} style={IS}/>
            <input type="number" step="0.01" placeholder="💶  Συνολικό Ποσό €" value={fuelForm.total} onChange={e=>setFuelForm({...fuelForm,total:e.target.value})} style={IS}/>
            {parseFloat(fuelForm.ppl)>0&&parseFloat(fuelForm.total)>0&&(
              <div style={{background:dark?"#0d2010":"#d4eed8",color:"#10b981",padding:"9px 14px",borderRadius:8,marginBottom:10,fontSize:13,border:"1px solid #10b981"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>🧮 <b>{+(parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl)).toFixed(2)}</b> λίτρα</span>
                  <span style={{fontSize:11,opacity:0.8}}>{fmt(parseFloat(fuelForm.ppl),3)} €/L</span>
                </div>
                {(()=>{
                  const prevE=allFuel.length>0?allFuel[allFuel.length-1]:null;
                  const curOdo=parseFloat(fuelForm.odo),prevOdo=prevE?parseFloat(prevE.odo):null;
                  const liters=parseFloat(fuelForm.total)/parseFloat(fuelForm.ppl);
                  if(curOdo>0&&prevOdo>0&&curOdo>prevOdo&&liters>0){
                    const cons=(liters/(curOdo-prevOdo)*100).toFixed(1),diffKm=curOdo-prevOdo;
                    return<div style={{marginTop:6,paddingTop:6,borderTop:"1px solid #10b98140",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11}}>📍 {diffKm} χλμ</span><span style={{fontSize:12,fontWeight:"bold"}}>{cons} L/100km</span></div>;
                  }return null;
                })()}
              </div>
            )}
            <input type="number" placeholder="🔢  Odometer (Συνολικά χλμ)" value={fuelForm.odo} onChange={e=>setFuelForm({...fuelForm,odo:e.target.value})} style={IS}/>
            <input type="text" placeholder="📝  Σημειώσεις (προαιρετικό)" value={fuelForm.notes} onChange={e=>setFuelForm({...fuelForm,notes:e.target.value})} style={IS}/>
            <button onClick={handleAddFuel} style={{width:"100%",padding:15,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:16,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {/* ══ EXPENSES ══ */}
        {tab==="expenses"&&(
          <div>
            <div style={{...CS({border:`2px solid ${col}`}),marginBottom:16}}>
              <h3 style={{margin:"0 0 12px",fontSize:15}}>➕ Νέο Έξοδο</h3>
              <input type="date" value={expForm.date} onChange={e=>setExpForm({...expForm,date:e.target.value})} style={IS}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {EXPENSE_CATS.map(cat=>(
                  <div key={cat.id} onClick={()=>setExpForm({...expForm,category:cat.id,label:""})}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px",borderRadius:10,cursor:"pointer",
                      background:expForm.category===cat.id?col:T.bg,
                      border:`2px solid ${expForm.category===cat.id?col:T.br}`,
                      transition:"all 0.15s"}}>
                    <span style={{fontSize:22}}>{cat.icon}</span>
                    <span style={{fontSize:9,fontWeight:"bold",textAlign:"center",lineHeight:1.2,color:expForm.category===cat.id?"#fff":T.tx}}>{cat.label}</span>
                  </div>
                ))}
              </div>
              <input type="text" placeholder="Περιγραφή / Τοποθεσία (προαιρετικό)" value={expForm.label} onChange={e=>setExpForm({...expForm,label:e.target.value})} style={IS}/>
              <input type="number" step="0.01" placeholder="Ποσό €" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} style={{...IS,fontSize:20,fontWeight:"bold",textAlign:"center"}}/>
              <button onClick={handleAddExp} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>✅ ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>

            {/* Category filter chips */}
            {allExp.length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                <button onClick={()=>setExpCatFilter("all")} style={{padding:"5px 10px",borderRadius:16,border:"none",cursor:"pointer",fontSize:11,fontWeight:"bold",background:expCatFilter==="all"?col:T.br,color:expCatFilter==="all"?"#fff":T.mt}}>Όλα</button>
                {EXPENSE_CATS.filter(c=>(expenses[vid]||[]).some(e=>e.category===c.id)).map(c=>(
                  <button key={c.id} onClick={()=>setExpCatFilter(expCatFilter===c.id?"all":c.id)}
                    style={{padding:"5px 10px",borderRadius:16,border:"none",cursor:"pointer",fontSize:11,fontWeight:"bold",
                      background:expCatFilter===c.id?col:T.br,color:expCatFilter===c.id?"#fff":T.mt}}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            )}

            {expByMonth.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν έξοδα ακόμα.</div>}

            {expByMonth.map(({key,label,entries:me,total,byCategory})=>{
              const filtMe=expCatFilter==="all"?me:me.filter(e=>e.category===expCatFilter);
              if(!filtMe.length)return null;
              const filtTotal=filtMe.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
              return(
                <MonthGroup key={key} monthKey={key} label={label} badge={`${filtMe.length} εγγρ.`} total={`-${fmt(filtTotal)}€`} isOpen={!!openExpM[key]} onToggle={()=>setOpenExpM(p=>({...p,[key]:!p[key]}))} T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 12px",background:T.bg,borderBottom:`1px solid ${T.ft}`}}>
                    {Object.entries(byCategory).filter(([catId])=>expCatFilter==="all"||catId===expCatFilter).map(([catId,amt])=>{
                      const cat=EXPENSE_CATS.find(c=>c.id===catId);
                      return(
                        <div key={catId} style={{background:T.sf,borderRadius:8,padding:"4px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                          <span>{cat&&cat.icon||"💸"}</span>
                          <span style={{color:T.mt}}>{cat&&cat.label||catId}</span>
                          <span style={{fontWeight:"bold",color:"#e07b54"}}>{fmt(amt)}€</span>
                        </div>
                      );
                    })}
                  </div>
                  {filtMe.slice().reverse().map((e,i)=>(
                    <ExpenseEntryRow key={e.id} e={e} i={i} total={filtMe.length} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>
                  ))}
                </MonthGroup>
              );
            })}
          </div>
        )}

        {/* ══ STATS ══ */}
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
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <div style={{width:"100%",maxWidth:380,display:"flex",alignItems:"center",overflow:"visible"}}>
                <div style={{flex:"0 0 55%",zIndex:2,filter:"drop-shadow(3px 0 10px #10b98150)"}}>
                  <RoundCyberGauge value={stats.aC} min={gaugeRanges.consMin} max={gaugeRanges.consMax} color="#10b981" label="ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>
                </div>
                <div style={{flex:"0 0 55%",marginLeft:"-10%",zIndex:1,filter:"drop-shadow(-3px 0 10px #f9731650)"}}>
                  <RoundCyberGauge value={stats.aP} min={gaugeRanges.pplMin} max={gaugeRanges.pplMax} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>
                </div>
              </div>
            </div>
            {stats.totalKm>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{...CS(),textAlign:"center",padding:10}}><div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΣΥΝΟΛΟ ΧΛΜ</div><div style={{fontSize:15,fontWeight:"bold",color:"#06b6d4"}}>{stats.totalKm.toLocaleString()}</div><div style={{fontSize:9,color:T.mt}}>km</div></div>
                <div style={{...CS(),textAlign:"center",padding:10,border:`1px solid ${col}44`}}><div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΚΟΣΤΟΣ/ΧΛΜ</div><div style={{fontSize:15,fontWeight:"bold",color:col}}>{fmt(stats.costPerKm,3)}</div><div style={{fontSize:9,color:T.mt}}>€/km (ολικό)</div></div>
                <div style={{...CS(),textAlign:"center",padding:10}}><div style={{fontSize:9,color:T.mt,marginBottom:4}}>ΚΑΥΣΙΜΟ/ΧΛΜ</div><div style={{fontSize:15,fontWeight:"bold",color:"#3b82f6"}}>{fmt(stats.fuelCostPerKm,3)}</div><div style={{fontSize:9,color:T.mt}}>€/km</div></div>
              </div>
            )}
            <div style={{...CS(),marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:"bold",marginBottom:8,color:T.tx}}>📊 Μηνιαία Έξοδα · {fY!=="all"?fY:"Όλα τα έτη"}</div>
              <StackedBarChart data={monthlyBarData} T={T}/>
            </div>
            {consSeries.length>=2&&(
              <div style={{...CS(),marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:"bold",marginBottom:8,color:T.tx}}>⛽ Κατανάλωση ανά γέμισμα · {fY!=="all"?fY:"Όλα τα έτη"}</div>
                <LineChart data={consSeries} color="#10b981" avg={stats.aC} T={T}/>
              </div>
            )}
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
                  const byMonth={};
                  catEntries.forEach(e=>{
                    const d=new Date(e.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                    const lbl=`${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
                    if(!byMonth[k])byMonth[k]={lbl,entries:[],total:0};
                    byMonth[k].entries.push(e);byMonth[k].total+=(parseFloat(e.amount)||0);
                  });
                  const monthKeys=Object.keys(byMonth);
                  return(
                    <div key={cat.id} style={{marginBottom:10}}>
                      <div onClick={()=>setOpenCat(isOpen?null:cat.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,cursor:"pointer",padding:"6px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:16}}>{cat.icon}</span>
                          <span style={{fontSize:13,fontWeight:"bold"}}>{cat.label}</span>
                          <span style={{fontSize:10,color:T.mt,background:T.br,padding:"1px 6px",borderRadius:8}}>{catEntries.length}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13,fontWeight:"bold"}}>{fmt(tot)}€</span>
                          <span style={{fontSize:11,color:T.mt}}>({pct.toFixed(0)}%)</span>
                          <span style={{fontSize:11,color:T.mt}}>{isOpen?"▲":"▼"}</span>
                        </div>
                      </div>
                      <div style={{background:T.br,borderRadius:4,height:7,overflow:"hidden",marginBottom:isOpen?8:0}}>
                        <div style={{background:col,width:`${pct}%`,height:7,borderRadius:4,transition:"width 0.5s ease"}}/>
                      </div>
                      {isOpen&&(
                        <div style={{background:T.bg,borderRadius:8,overflow:"hidden",border:`1px solid ${T.br}`}}>
                          {monthKeys.map((mk)=>{
                            const {lbl,entries:me,total:mt}=byMonth[mk];
                            const mKey=cat.id+"_"+mk;
                            const mOpen=!!openCatMonth[mKey];
                            return(
                              <div key={mk}>
                                <div onClick={()=>setOpenCatMonth(p=>({...p,[mKey]:!p[mKey]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:mOpen?T.br:T.ft,cursor:"pointer",borderBottom:`1px solid ${T.br}`}}>
                                  <span style={{fontSize:11,fontWeight:"bold",color:T.tx}}>📅 {lbl} <span style={{color:T.mt,fontWeight:"normal"}}>({me.length})</span></span>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <span style={{fontSize:11,fontWeight:"bold",color:col}}>-{fmt(mt)}€</span>
                                    <span style={{fontSize:10,color:T.mt}}>{mOpen?"▲":"▼"}</span>
                                  </div>
                                </div>
                                {mOpen&&me.map((e,i)=>(
                                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 20px",background:i%2===0?T.bg:T.sf,borderBottom:i<me.length-1?`1px solid ${T.ft}`:"none"}}>
                                    <div>
                                      <div style={{fontSize:12,fontWeight:"bold"}}>{e.label||cat.label}</div>
                                      <div style={{fontSize:10,color:T.mt}}>{formatDate(e.date)}</div>
                                    </div>
                                    <span style={{fontSize:13,fontWeight:"bold",color:"#e11d48"}}>-{fmt(e.amount)}€</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
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

        {/* ══ ΚΙΝΗΣΕΙΣ (unified history + calendar) ══ */}
        {tab==="history"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{margin:0}}>🧾 Κινήσεις</h3>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setMovView("list")} style={chipStyle(movView==="list")}>📃 Λίστα</button>
                <button onClick={()=>setMovView("cal")} style={chipStyle(movView==="cal")}>🗓️ Ημερολόγιο</button>
              </div>
            </div>

            <button onClick={()=>setNoteEdit({date:(movView==="cal"&&selDay)||today(),text:""})} style={{width:"100%",padding:11,marginBottom:12,background:"none",color:col,border:`2px dashed ${col}`,borderRadius:10,fontWeight:"bold",fontSize:14,cursor:"pointer"}}>📝 Νέα σημείωση</button>

            {movView==="list"&&(
              <div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
                  <button onClick={()=>setMovFilter("all")} style={chipStyle(movFilter==="all")}>Όλα</button>
                  <button onClick={()=>setMovFilter("fuel")} style={chipStyle(movFilter==="fuel")}>⛽ Καύσιμα</button>
                  <button onClick={()=>setMovFilter("exp")} style={chipStyle(movFilter==="exp")}>📋 Έξοδα</button>
                  <button onClick={()=>setMovFilter("note")} style={chipStyle(movFilter==="note")}>📝 Σημειώσεις</button>
                  <select value={histSort} onChange={e=>setHistSort(e.target.value)} style={{...IS,marginBottom:0,marginLeft:"auto",padding:"5px 8px",fontSize:11,width:"auto"}}>
                    <option value="date_desc">📅 Νεότερο</option><option value="date_asc">📅 Παλαιότερο</option>
                  </select>
                </div>
                {movesByMonth.length===0&&<div style={{textAlign:"center",color:T.mt,padding:30}}>Δεν υπάρχουν εγγραφές ακόμα.</div>}
                {movesByMonth.map(({key,label,items,nF,nE,nN,total})=>{
                  const isO=openFuelM[key]===undefined?key===curMonthKey:openFuelM[key];
                  const badge=[nF>0?`⛽ ${nF}`:null,nE>0?`📋 ${nE}`:null,nN>0?`📝 ${nN}`:null].filter(Boolean).join(" · ");
                  return(
                    <MonthGroup key={key} monthKey={key} label={label} badge={badge} total={total>0?`${fmt(total)}€`:null} isOpen={isO} onToggle={()=>setOpenFuelM(p=>({...p,[key]:!isO}))} T={T}>
                      {items.map((it,i)=>(
                        <div key={it.e.id} style={{borderLeft:`4px solid ${it.kind==="fuel"?"#3b82f6":it.kind==="note"?"#eab308":"#e11d48"}`}}>
                          {it.kind==="fuel"
                            ?<FuelEntryRow e={it.e} i={i} total={items.length} allFuel={allFuel} T={T} col={col} swipeId={swipeId} setSwipeId={setSwipeId} swipeStartX={swipeStartX} onEdit={setEditFuelE} onDel={handleDelFuel}/>
                            :it.kind==="note"
                            ?<NoteEntryRow e={it.e} i={i} total={items.length} T={T} onEdit={setNoteEdit} onDel={handleDelNote}/>
                            :<ExpenseEntryRow e={it.e} i={i} total={items.length} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>}
                        </div>
                      ))}
                    </MonthGroup>
                  );
                })}
              </div>
            )}

            {movView==="cal"&&(()=>{
              const first=(new Date(calY,calM,1).getDay()+6)%7,nd=new Date(calY,calM+1,0).getDate();
              const cells=[];for(let i=0;i<first;i++)cells.push(null);for(let d=1;d<=nd;d++)cells.push(d);
              const mk=`${calY}-${String(calM+1).padStart(2,"0")}`;
              const dk=d=>`${mk}-${String(d).padStart(2,"0")}`;
              const shiftM=n=>{const d=new Date(calY,calM+n,1);setCalY(d.getFullYear());setCalM(d.getMonth());setSelDay(null);};
              let mTotal=0;
              for(let d=1;d<=nd;d++){const x=dayMap[dk(d)];if(x){mTotal+=x.f.reduce((s,e)=>s+(parseFloat(e.total)||0),0)+x.x.reduce((s,e)=>s+(parseFloat(e.amount)||0),0);}}
              const sel=selDay?dayMap[selDay]:null;
              const selCount=sel?sel.f.length+sel.x.length+sel.n.length:0;
              return(
                <div>
                  <div style={{...CS(),marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <button onClick={()=>shiftM(-1)} style={{...chipStyle(false),fontSize:16}}>◀</button>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontWeight:"bold",fontSize:15}}>{MONTHS_FULL[calM]} {calY}</div>
                        <div style={{fontSize:11,color:T.mt}}>Σύνολο μήνα: <b style={{color:"#e07b54"}}>{fmt(mTotal)}€</b></div>
                      </div>
                      <button onClick={()=>shiftM(1)} style={{...chipStyle(false),fontSize:16}}>▶</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
                      {WEEKDAYS.map(w=><div key={w} style={{textAlign:"center",fontSize:10,color:T.mt,fontWeight:"bold"}}>{w}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                      {cells.map((d,i)=>{
                        if(d===null)return<div key={"e"+i}/>;
                        const k=dk(d),x=dayMap[k],isToday=k===today(),isSel=k===selDay;
                        const firstCat=x&&x.x.length?EXPENSE_CATS.find(c=>c.id===x.x[0].category):null;
                        return(
                          <div key={k} onClick={()=>setSelDay(isSel?null:k)} style={{aspectRatio:"1/1",borderRadius:8,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",paddingTop:3,boxSizing:"border-box",
                            background:isSel?col:x?T.bg:"transparent",border:`2px solid ${isToday?col:x?T.br:"transparent"}`}}>
                            <span style={{fontSize:11,fontWeight:isToday?"bold":"normal",color:isSel?"#fff":T.tx}}>{d}</span>
                            <div style={{display:"flex",gap:1,fontSize:11,lineHeight:1.1,marginTop:1}}>
                              {x&&x.f.length>0&&<span>⛽</span>}
                              {x&&x.x.length>0&&<span>{firstCat?firstCat.icon:"💸"}</span>}
                              {x&&x.n.length>0&&<span>📝</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:10,color:T.mt,marginTop:8,textAlign:"center"}}>⛽ γέμισμα · 📝 σημείωση · άλλα εικονίδια = έξοδο (service, διόδια κ.λπ.) · πάτα μια μέρα για λεπτομέρειες</div>
                  </div>
                  {selDay&&(
                    <div>
                      <div style={{fontSize:13,fontWeight:"bold",marginBottom:8}}>📌 {formatDate(selDay)}</div>
                      {selCount===0&&<div style={{textAlign:"center",color:T.mt,padding:16,fontSize:13}}>Καμία κίνηση αυτή τη μέρα.</div>}
                      {selCount>0&&(
                        <div style={{borderRadius:12,overflow:"hidden",border:`1px solid ${T.br}`}}>
                          {sel.f.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:"4px solid #3b82f6"}}>
                              <FuelEntryRow e={e} i={i} total={selCount} allFuel={allFuel} T={T} col={col} swipeId={swipeId} setSwipeId={setSwipeId} swipeStartX={swipeStartX} onEdit={setEditFuelE} onDel={handleDelFuel}/>
                            </div>
                          ))}
                          {sel.x.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:"4px solid #e11d48"}}>
                              <ExpenseEntryRow e={e} i={sel.f.length+i} total={selCount} T={T} onEdit={setEditExpE} onDel={handleDelExp}/>
                            </div>
                          ))}
                          {sel.n.map((e,i)=>(
                            <div key={e.id} style={{borderLeft:"4px solid #eab308"}}>
                              <NoteEntryRow e={e} i={sel.f.length+sel.x.length+i} total={selCount} T={T} onEdit={setNoteEdit} onDel={handleDelNote}/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ══ MODALS ══ */}

      <Modal open={showAddV} onClose={()=>setShowAddV(false)} locked={setupMode} title={setupMode?"🚗 Καλώς ήρθες! Πρόσθεσε το όχημά σου":"➕ Νέο Όχημα"} T={T}>
        <input type="text" placeholder="Όνομα (π.χ. ΕΤΑΙΡΙΚΟ)" value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} style={IS}/>
        <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΚΑΤΗΓΟΡΙΑ</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{VCATS.map(c=><button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,background:newV.category===c.id?col:T.br,color:newV.category===c.id?"#fff":T.mt}}>{c.icon} {c.label}</button>)}</div>
        <input type="text" placeholder="Αρ. Πινακίδας" value={newV.info.plate} onChange={e=>setNewV({...newV,info:{...newV.info,plate:e.target.value}})} style={IS}/>
        <div style={{fontSize:11,color:T.mt,marginBottom:6}}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ (υποχρεωτικό)</div>
        <select value={newV.fuelType} onChange={e=>setNewV({...newV,fuelType:e.target.value})} style={IS}><option value="">— Επίλεξε καύσιμο —</option>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
        <div style={{fontSize:11,color:T.mt,marginBottom:6}}>2ο ΚΑΥΣΙΜΟ</div>
        <select value={newV.fuelType2} onChange={e=>setNewV({...newV,fuelType2:e.target.value})} style={IS}><option value="">— Κανένα —</option>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
        <div style={{fontSize:11,color:T.mt,marginBottom:8}}>ΧΡΩΜΑ</div>
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>{FUEL_COLORS.map(c=><div key={c} onClick={()=>setNewV({...newV,color:c})} style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:newV.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}</div>
        <button onClick={handleAddVehicle} disabled={!newV.fuelType} style={{opacity:newV.fuelType?1:0.4,width:"100%",padding:14,background:newV.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΠΡΟΣΘΗΚΗ ΟΧΗΜΑΤΟΣ</button>
      </Modal>

      <Modal open={showVInfo} onClose={()=>setShowVInfo(false)} title={`${av.icon} ${av.name} · Αρχείο αυτοκινήτου`} T={T}>
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

      <Modal open={showIO} onClose={()=>setShowIO(false)} title="💾 Εισαγωγή / Εξαγωγή" T={T}>
        <div style={{fontSize:13,fontWeight:"bold",marginBottom:10}}>Εξαγωγή Δεδομένων</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <button onClick={exportJSON} style={{padding:12,background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:13}}>⬇️ JSON</button>
          <button onClick={exportCSV} style={{padding:12,background:"#10b981",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:13}}>⬇️ CSV</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <button onClick={exportExcel} style={{padding:12,background:"#22c55e",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:13}}>📊 Excel (.xls)</button>
          <button onClick={exportPDF} style={{padding:12,background:"#e11d48",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:13}}>📄 PDF</button>
        </div>
        <div style={{fontSize:13,fontWeight:"bold",marginBottom:8}}>Εισαγωγή (JSON)</div>
        <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{...IS,marginBottom:10}}/>
        <textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Ή επικόλλησε JSON εδώ…" rows={4} style={{...IS,resize:"vertical",fontFamily:"monospace",fontSize:12}}/>
        {importMsg&&<div style={{padding:"8px 12px",borderRadius:8,marginBottom:10,fontSize:13,fontWeight:"bold",background:importMsg.startsWith("✅")?"#0d2010":"#2a0a0a",color:importMsg.startsWith("✅")?"#10b981":"#ef4444"}}>{importMsg}</div>}
        <button onClick={handleImport} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>⬆️ Εισαγωγή Δεδομένων</button>
        <div style={{fontSize:10,color:T.mt,marginTop:8,textAlign:"center"}}>⚠️ Η εισαγωγή αντικαθιστά όλα τα υπάρχοντα δεδομένα.</div>
      </Modal>

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

      {doneRem&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setDoneRem(null);}}>
          <div style={{background:T.sf,border:"2px solid #10b981",borderRadius:18,padding:"22px 18px 18px",width:"100%",maxWidth:340,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:4}}>{doneRem.icon}</div>
            <div style={{fontSize:16,fontWeight:"bold",marginBottom:2}}>✅ Έγινε: {doneRem.label}</div>
            <div style={{fontSize:12,color:T.mt,marginBottom:14}}>{doneRem.vIcon} {doneRem.vName}</div>
            <div style={{fontSize:10,color:T.mt,fontWeight:"bold",marginBottom:4,textAlign:"left"}}>{doneRem.isKm?"ΝΕΟ ΟΡΙΟ ΕΠΟΜΕΝΟΥ SERVICE (ΧΛΜ)":"ΝΕΑ ΗΜΕΡΟΜΗΝΙΑ"}</div>
            <input type={doneRem.isKm?"number":"date"} placeholder={doneRem.isKm?"π.χ. 165000":""} value={doneRem.value} onChange={e=>setDoneRem({...doneRem,value:e.target.value})} style={{...IS,marginBottom:6}}/>
            <div style={{fontSize:11,color:T.mt,marginBottom:14,textAlign:"left"}}>Άφησέ το κενό αν δεν θες νέα υπενθύμιση. Η τωρινή θα σβηστεί.</div>
            <button onClick={saveDoneRem} style={{width:"100%",padding:13,background:"#10b981",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",marginBottom:10}}>✅ Αποθήκευση</button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setDoneRem(null)} style={{padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:13,cursor:"pointer"}}>Ακύρωση</button>
              <button onClick={()=>{setVid(doneRem.vid);setShowVInfo(true);setDoneRem(null);}} style={{padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:13,cursor:"pointer"}}>🗂️ Αρχείο</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)setConfirmDel(null);}}>
          <div style={{background:T.sf,border:`2px solid ${confirmDel.info?col:"#e11d48"}`,borderRadius:18,padding:"22px 18px 18px",width:"100%",maxWidth:340,textAlign:"center"}}>
            {confirmDel.info?(
              <div>
                <div style={{fontSize:36,marginBottom:8}}>ℹ️</div>
                <div style={{fontSize:15,fontWeight:"bold",marginBottom:16}}>{confirmDel.title}</div>
                <button onClick={()=>setConfirmDel(null)} style={{width:"100%",padding:13,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΟΚ</button>
              </div>
            ):(
              <div>
                <div style={{fontSize:40,marginBottom:6}}>🗑️</div>
                <div style={{fontSize:17,fontWeight:"bold",marginBottom:8}}>Είσαι σίγουρος για τη διαγραφή;</div>
                <div style={{fontSize:13,fontWeight:"bold",marginBottom:4}}>{confirmDel.title}</div>
                {confirmDel.detail&&<div style={{fontSize:12,color:T.mt,marginBottom:8,wordBreak:"break-word"}}>{confirmDel.detail}</div>}
                <div style={{fontSize:12,color:"#e11d48",fontWeight:"bold",marginBottom:16}}>Δεν μπορεί να αναιρεθεί.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>setConfirmDel(null)} style={{padding:13,background:T.br,color:T.tx,border:"none",borderRadius:10,fontWeight:"bold",fontSize:14,cursor:"pointer"}}>Ακύρωση</button>
                  <button onClick={()=>{const f=confirmDel.fn;setConfirmDel(null);if(f)f();}} style={{padding:13,background:"#e11d48",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:14,cursor:"pointer"}}>Διαγραφή</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={!!noteEdit} onClose={()=>setNoteEdit(null)} title={noteEdit&&noteEdit.id?"✏️ Επεξεργασία Σημείωσης":"📝 Νέα Σημείωση"} T={T}>
        {noteEdit&&(
          <div>
            <input type="date" value={noteEdit.date} onChange={e=>setNoteEdit({...noteEdit,date:e.target.value})} style={IS}/>
            <textarea rows={6} placeholder="Γράψε ό,τι θέλεις να θυμάσαι (π.χ. θόρυβος στα φρένα, ξέχασα να ελέγξω τα λάδια…)" value={noteEdit.text} onChange={e=>setNoteEdit({...noteEdit,text:e.target.value})} style={{...IS,resize:"vertical",fontFamily:"inherit"}}/>
            <button onClick={handleSaveNote} style={{width:"100%",padding:14,background:col,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}
      </Modal>

      <Modal open={showAbout} onClose={()=>setShowAbout(false)} title="ℹ️ Σχετικά" T={T}>
        <div style={{textAlign:"center",padding:"10px 0 20px"}}>
          <div style={{fontSize:48,marginBottom:8}}>⛽</div>
          <div style={{fontSize:22,fontWeight:"bold",marginBottom:4}}>FuelLog</div>
          <div style={{fontSize:14,color:col,marginBottom:20}}>v2.10</div>
          <div style={{fontSize:13,color:T.mt,lineHeight:1.9,marginBottom:20,textAlign:"left"}}>
            ⛽ Γεμίσματα καυσίμου με αυτόματο υπολογισμό λίτρων<br/>
            🛣️ Διόδια, Πομποδέκτης, Parking, Service, Ελαστικά &amp; άλλα έξοδα<br/>
            🧾 Κινήσεις: ενιαίο ιστορικό &amp; ημερολόγιο<br/>
            📊 Στατιστικά, γραφήματα &amp; ανάλυση κατανάλωσης<br/>
            🚗 Υποστήριξη πολλαπλών οχημάτων &amp; 2 καυσίμων<br/>
            🔔 Υπενθυμίσεις ΚΤΕΟ, ασφάλειας, service<br/>
            💾 Εξαγωγή σε JSON, CSV, Excel, PDF<br/>
          </div>
          <div style={{borderTop:`1px solid ${T.br}`,paddingTop:16}}>
            <div style={{fontSize:12,color:T.mt,marginBottom:4}}>Σχεδίαση &amp; Ανάπτυξη</div>
            <div style={{fontSize:18,fontWeight:"bold",color:col}}>Ταχμαζίδης Κ. Γιώργος</div>
            <div style={{fontSize:12,color:T.mt,marginTop:4}}>© 2026 · Όλα τα δικαιώματα διατηρούνται</div>
          </div>
        </div>
      </Modal>

      <Modal open={showEditV&&!!editVData} onClose={()=>{setShowEditV(false);setEditVData(null);}} title="✏️ Επεξεργασία Οχήματος" T={T}>
        {editVData&&(
          <div>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>ΟΝΟΜΑ</div>
            <input type="text" value={editVData.name} onChange={e=>setEditVData({...editVData,name:e.target.value})} style={IS}/>
            <div style={{fontSize:11,color:T.mt,marginBottom:8,fontWeight:"bold"}}>ΚΑΤΗΓΟΡΙΑ</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{VCATS.map(c=><button key={c.id} onClick={()=>setEditVData({...editVData,category:c.id,icon:c.icon})} style={{padding:"7px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:13,background:editVData.category===c.id?editVData.color:T.br,color:editVData.category===c.id?"#fff":T.mt}}>{c.icon} {c.label}</button>)}</div>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</div>
            <select value={editVData.fuelType} onChange={e=>setEditVData({...editVData,fuelType:e.target.value})} style={IS}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
            <div style={{fontSize:11,color:T.mt,marginBottom:6,fontWeight:"bold"}}>2ο ΚΑΥΣΙΜΟ</div>
            <select value={editVData.fuelType2||""} onChange={e=>setEditVData({...editVData,fuelType2:e.target.value})} style={IS}><option value="">— Κανένα —</option>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select>
            <div style={{fontSize:11,color:T.mt,marginBottom:8,fontWeight:"bold"}}>ΧΡΩΜΑ</div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>{FUEL_COLORS.map(c=><div key={c} onClick={()=>setEditVData({...editVData,color:c})} style={{width:34,height:34,borderRadius:"50%",background:c,cursor:"pointer",border:editVData.color===c?"3px solid #fff":"3px solid transparent",boxSizing:"border-box"}}/>)}</div>
            <button onClick={handleSaveEditV} style={{width:"100%",padding:14,background:editVData.color,color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",fontSize:15,cursor:"pointer",marginBottom:10}}>✅ Αποθήκευση</button>
            <button onClick={handleDeleteV} style={{width:"100%",padding:12,background:"none",color:"#e11d48",border:"2px solid #e11d48",borderRadius:10,fontWeight:"bold",fontSize:14,cursor:"pointer"}}>🗑️ Διαγραφή Οχήματος</button>
          </div>
        )}
      </Modal>

    </div>
  );
}
