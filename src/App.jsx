import { useState, useMemo, useRef, useEffect } from "react";

const FUEL_COLORS = ["#3b82f6","#f97316","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308","#ec4899","#14b8a6","#f43f5e","#84cc16","#a855f7"];
const GRAD_COLS   = ["#f97316","#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4"];

const VCATS = [
  { id:"car",   label:"ΙΧ",        icons:["🚗","🚙"] },
  { id:"suv",   label:"SUV/4x4",   icons:["🚙","🛻"] },
  { id:"moto",  label:"Μηχανή",    icons:["🏍️"] },
  { id:"van",   label:"Βαν/Βαρύ",  icons:["🚐","🚚"] },
  { id:"truck", label:"Φορτηγό",   icons:["🚛"] },
  { id:"bus",   label:"Λεωφ.",     icons:["🚌"] },
  { id:"taxi",  label:"Ταξί",      icons:["🚕"] },
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

const DK = { bg:"#080810", sf:"#10101c", br:"#1e1e30", tx:"#eeeeff", mt:"#7777aa", ft:"#33334a", inp:"#0d0d1a", ib:"#1e1e30" };
const LT = { bg:"#eef0fb", sf:"#ffffff",  br:"#d8daf0", tx:"#0d0d1a", mt:"#5555aa", ft:"#9090bb", inp:"#ffffff", ib:"#c5c8e8" };

const defV = () => ({
  id:"v1", name:"Αυτοκίνητο 1", icon:"🚗", color:"#3b82f6", category:"car",
  info:{ plate:"", chassis:"", brand:"", model:"", year:"", fuelType:"unleaded95", insurance:"", insuranceNo:"", notes:"" },
  drivers:[{ id:"d1", name:"Οδηγός 1", color:"#3b82f6" }],
  reminders:[], unitMiles:false,
});

const emptyFuel = (ft="unleaded95", stId="", stLabel="", driverId="d1") => ({
  date:today(), fuelType:ft, liters:"", ppl:"", total:"",
  km:"", odo:"", notes:"", stId, stLabel,
  dual:false, lpgL:"", lpgP:"", lpgT:"",
  driverId,
});

const emptyExpense = () => ({ date:today(), catId:"oil", customCat:"", amount:"", notes:"" });

// ── Gauge ────────────────────────────────────────────────────────────────────
function Gauge({ value, min, max, color, label, unit, T }) {
  if (value == null) return null;
  const pct  = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R=70, cx=100, cy=90;
  const startA=Math.PI*0.85, endA=Math.PI*2.15, totalA=endA-startA;
  const valA = startA + totalA * pct;
  const arc = (r,a1,a2) => {
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
    return "M "+x1+" "+y1+" A "+r+" "+r+" 0 "+((a2-a1)>Math.PI?1:0)+" 1 "+x2+" "+y2;
  };
  const nx=cx+(R-10)*Math.cos(valA), ny=cy+(R-10)*Math.sin(valA);
  const gid="gauge_"+color.replace("#","");
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 200 110" style={{width:"100%",maxWidth:200,height:"auto",display:"block",margin:"0 auto"}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981"/><stop offset="50%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/>
          </linearGradient>
        </defs>
        <path d={arc(R,startA,endA)} fill="none" stroke={T.br} strokeWidth={10} strokeLinecap="round"/>
        <path d={arc(R,startA,valA)} fill="none" stroke={"url(#"+gid+")"} strokeWidth={10} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={cx} y={cy-14} textAnchor="middle" fill={color} fontSize={16} fontWeight="700">{(+value).toFixed(value>10?1:3)}</text>
        <text x={cx} y={cy-2}  textAnchor="middle" fill={T.mt} fontSize={9}>{unit}</text>
      </svg>
      <div style={{fontSize:10,color:T.mt,letterSpacing:1,marginTop:-4}}>{label}</div>
    </div>
  );
}

// ── SVG Chart with tooltip ───────────────────────────────────────────────────
function SVGChart({ points, color, type, unit }) {
  const [active, setActive] = useState(null);
  if (!points || points.length < 2) return null;
  const W=400, H=80, P=8;
  const vals=points.map(p=>p.y);
  const minV=Math.min(...vals), maxV=Math.max(...vals), range=maxV-minV||1;
  const sx=i=>P+(i/(points.length-1))*(W-P*2);
  const sy=v=>H-P-((v-minV)/range)*(H-P*2);
  const handleMove=e=>{
    const rect=e.currentTarget.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    const relX=(cx-rect.left)/rect.width*W;
    let best=0,bestD=Infinity;
    points.forEach((p,i)=>{const d=Math.abs(sx(i)-relX);if(d<bestD){bestD=d;best=i;}});
    setActive(best);
  };
  const tip=active!==null?points[active]:null;
  if (type==="bar") {
    const bw=Math.max(3,(W-P*2)/points.length-4);
    return (
      <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:80,display:"block",cursor:"crosshair"}}
        onMouseMove={handleMove} onMouseLeave={()=>setActive(null)}
        onTouchMove={handleMove} onTouchEnd={()=>setTimeout(()=>setActive(null),1500)}>
        {points.map((p,i)=><rect key={i} x={sx(i)-bw/2} y={sy(p.y)} width={bw} height={H-P-sy(p.y)} fill={color} opacity={active===i?1:0.75} rx={3}/>)}
        {tip&&active!==null&&(
          <g>
            <rect x={Math.min(Math.max(sx(active)-32,0),W-66)} y={sy(tip.y)-34} width={64} height={26} rx={6} fill="rgba(0,0,0,0.82)"/>
            <text x={Math.min(Math.max(sx(active),32),W-34)} y={sy(tip.y)-18} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">{(+tip.y).toFixed(2)}{unit||""}</text>
            <text x={Math.min(Math.max(sx(active),32),W-34)} y={sy(tip.y)-7}  textAnchor="middle" fill="#aaa" fontSize={8}>{tip.x}</text>
          </g>
        )}
      </svg>
    );
  }
  const d=points.map((p,i)=>(i===0?"M":"L")+sx(i)+","+sy(p.y)).join(" ");
  const area=d+" L"+sx(points.length-1)+","+(H-P)+" L"+P+","+(H-P)+" Z";
  const gid="sp"+color.replace("#","");
  return (
    <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:80,display:"block",cursor:"crosshair"}}
      onMouseMove={handleMove} onMouseLeave={()=>setActive(null)}
      onTouchMove={handleMove} onTouchEnd={()=>setTimeout(()=>setActive(null),1500)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4}/><stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#"+gid+")"}/>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p,i)=>(
        <circle key={i} cx={sx(i)} cy={sy(p.y)} r={active===i?5.5:3} fill={color}
          stroke={active===i?"#fff":"none"} strokeWidth={1.5}/>
      ))}
      {tip&&active!==null&&(
        <g>
          <line x1={sx(active)} y1={sy(tip.y)+6} x2={sx(active)} y2={H-P} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5}/>
          <rect x={Math.min(Math.max(sx(active)-32,0),W-66)} y={sy(tip.y)-34} width={64} height={26} rx={6} fill="rgba(0,0,0,0.82)"/>
          <text x={Math.min(Math.max(sx(active),32),W-34)} y={sy(tip.y)-18} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">{(+tip.y).toFixed(tip.y>10?1:3)}{unit||""}</text>
          <text x={Math.min(Math.max(sx(active),32),W-34)} y={sy(tip.y)-7}  textAnchor="middle" fill="#aaaacc" fontSize={8}>{tip.x}</text>
        </g>
      )}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, type, unit, T }) {
  const pts=data.filter(d=>d[dk]!=null).map(d=>({x:d.date,y:d[dk]}));
  if (pts.length < 2) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:6,fontWeight:600}}>{title}</div>
      <div style={{background:T.bg,borderRadius:12,padding:"10px 8px 4px",border:"1px solid "+T.br}}>
        <SVGChart points={pts} color={color} type={type||"line"} unit={unit}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"2px 4px 2px"}}>
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.sf,borderRadius:"22px 22px 0 0",padding:"8px 20px 36px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",border:"1px solid "+T.br}}>
        <div style={{width:36,height:4,background:T.br,borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontWeight:700,fontSize:16,color:T.tx,letterSpacing:"-0.3px"}}>{title}</span>
          <button onClick={onClose} style={{background:T.br,border:"none",color:T.mt,width:28,height:28,borderRadius:"50%",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Station Picker ───────────────────────────────────────────────────────────
function StationModal({ current, onSelect, onClose, T }) {
  const [custom, setCustom] = useState(current.stId==="other"?current.stLabel:"");
  return (
    <Modal title="🏪 Επιλογή Πρατηρίου" onClose={onClose} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {STATIONS.map(s=>(
          <button key={s.id} onClick={()=>{s.id!=="other"?onSelect(s.id,s.label):onSelect("other",custom||"Άλλο");}}
            style={{padding:"10px 8px",border:"2px solid "+(current.stId===s.id?s.bg:T.br),borderRadius:10,
              background:current.stId===s.id?s.bg:"transparent",color:current.stId===s.id?s.fg:T.tx,
              fontSize:13,fontWeight:current.stId===s.id?700:400,cursor:"pointer"}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4,fontWeight:600}}>Ή γράψε το όνομα</label>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="π.χ. Μαμούθ Βενζινάδικο..."
          style={{width:"100%",padding:"10px 12px",background:T.inp,border:"1px solid "+T.ib,borderRadius:10,color:T.tx,fontSize:14,boxSizing:"border-box"}}/>
      </div>
      {custom.trim()&&(
        <button onClick={()=>onSelect("other",custom.trim())}
          style={{width:"100%",padding:11,background:T.bg,border:"1px solid "+T.br,borderRadius:10,color:T.tx,fontSize:14,cursor:"pointer",marginBottom:8}}>
          ✓ Χρήση: "{custom.trim()}"
        </button>
      )}
    </Modal>
  );
}

// ── FtBadge ──────────────────────────────────────────────────────────────────
function FtBadge({ ftId, size }) {
  const ft=FTYPES.find(f=>f.id===ftId), fc=FT_COLORS[ftId]||{};
  if (!ft) return null;
  return (
    <span style={{fontSize:size||11,background:fc.bg,color:fc.color,padding:"2px 8px",borderRadius:6,fontWeight:700,whiteSpace:"nowrap"}}>
      {ft.icon} {ft.label}
    </span>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ entries, col, T }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year=viewDate.getFullYear(), month=viewDate.getMonth();
  const firstDay=(new Date(year,month,1).getDay()+6)%7; // Mon=0
  const daysInMonth=new Date(year,month+1,0).getDate();
  const byDay={};
  entries.forEach(e=>{
    const d=e.date.slice(8,10);
    if (e.date.startsWith(year+"-"+String(month+1).padStart(2,"0"))) {
      if (!byDay[d]) byDay[d]=[];
      byDay[d].push(e);
    }
  });
  const prevMonth=()=>setViewDate(new Date(year,month-1,1));
  const nextMonth=()=>setViewDate(new Date(year,month+1,1));
  const days=["Δε","Τρ","Τε","Πε","Πα","Σα","Κυ"];
  return (
    <div style={{background:T.bg,borderRadius:14,padding:14,border:"1px solid "+T.br,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={prevMonth} style={{background:"none",border:"none",color:T.mt,fontSize:20,cursor:"pointer",padding:"4px 8px"}}>‹</button>
        <span style={{fontWeight:700,fontSize:14,color:T.tx}}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{background:"none",border:"none",color:T.mt,fontSize:20,cursor:"pointer",padding:"4px 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {days.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:T.mt,fontWeight:700,padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const day=String(i+1).padStart(2,"0");
          const dayEntries=byDay[day]||[];
          const hasEntry=dayEntries.length>0;
          const isToday=today()===year+"-"+String(month+1).padStart(2,"0")+"-"+day;
          return (
            <div key={i} style={{
              aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              borderRadius:8,background:hasEntry?col+"22":isToday?T.br+"88":"transparent",
              border:isToday?"1.5px solid "+col+"66":"1px solid transparent",
              position:"relative",cursor:hasEntry?"pointer":"default",
            }}>
              <span style={{fontSize:11,fontWeight:hasEntry||isToday?700:400,color:hasEntry?col:T.tx}}>{i+1}</span>
              {hasEntry&&<div style={{width:4,height:4,borderRadius:"50%",background:col,marginTop:1}}/>}
              {dayEntries.length>1&&<div style={{position:"absolute",top:2,right:2,fontSize:8,background:col,color:"#fff",borderRadius:4,padding:"0 3px",fontWeight:700}}>{dayEntries.length}</div>}
            </div>
          );
        })}
      </div>
      {Object.keys(byDay).length===0&&<div style={{textAlign:"center",padding:"10px 0",fontSize:12,color:T.ft}}>Καμία καταχώρηση αυτό το μήνα</div>}
    </div>
  );
}

// ── Vehicle Info Modal ────────────────────────────────────────────────────────
function VehicleInfoModal({ av, onClose, onUpdate, onDelete, onAddReminder, onUpdateReminder, onDelReminder, T, dl }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const upI=(f,v)=>onUpdate({info:{...av.info,[f]:v}});
  const upV=(f,v)=>onUpdate({[f]:v});
  const lS={display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4,fontWeight:600};
  const iS={width:"100%",padding:"9px 11px",background:T.inp,border:"1px solid "+T.ib,borderRadius:9,color:T.tx,fontSize:13,boxSizing:"border-box",fontFamily:"inherit"};
  const drivers=av.drivers||[{id:"d1",name:"Οδηγός 1",color:"#3b82f6"}];

  const addDriver=()=>{
    const colors=["#f97316","#10b981","#e11d48","#8b5cf6","#06b6d4","#eab308"];
    const newD={id:uid(),name:"Οδηγός "+(drivers.length+1),color:colors[drivers.length%colors.length]};
    onUpdate({drivers:[...drivers,newD]});
  };
  const updDriver=(id,f,v)=>onUpdate({drivers:drivers.map(d=>d.id===id?{...d,[f]:v}:d)});
  const delDriver=id=>{ if(drivers.length<=1) return; onUpdate({drivers:drivers.filter(d=>d.id!==id)}); };

  const rst=r=>{
    if (!r.dueDate) return null;
    const d=ddiff(r.dueDate);
    if (d<0)   return {c:"#ef4444",l:"Εκπρόθεσμο "+Math.abs(d)+" μ."};
    if (d<=7)  return {c:"#ef4444",l:"Σε "+d+" μέρες!"};
    if (d<=30) return {c:"#f97316",l:"Σε "+d+" μέρες"};
    return {c:"#10b981",l:"Σε "+d+" μέρες"};
  };

  return (
    <Modal title={av.icon+" "+av.name} onClose={onClose} T={T}>
      {/* Category */}
      <div style={{marginBottom:14}}>
        <label style={lS}>ΤΥΠΟΣ ΟΧΗΜΑΤΟΣ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {VCATS.map(c=>(
            <button key={c.id} onClick={()=>{upV("category",c.id);upV("icon",c.icons[0]);}}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(av.category===c.id?T.tx:T.br),
                background:av.category===c.id?T.tx+"22":"transparent",color:av.category===c.id?T.tx:T.mt,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              {c.icons[0]} {c.label}
            </button>
          ))}
        </div>
      </div>
      {/* Icon */}
      <div style={{marginBottom:14}}>
        <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(VCATS.find(c=>c.id===av.category)?.icons||["🚗"]).map(ic=>(
            <button key={ic} onClick={()=>upV("icon",ic)}
              style={{fontSize:22,padding:"6px 10px",border:"2px solid "+(av.icon===ic?T.tx:T.br),borderRadius:9,background:"transparent",cursor:"pointer"}}>{ic}</button>
          ))}
        </div>
      </div>
      {/* Name */}
      <div style={{marginBottom:12}}>
        <label style={lS}>ΟΝΟΜΑ</label>
        <input value={av.name} onChange={e=>upV("name",e.target.value)} style={iS}/>
      </div>
      {/* Info grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[["ΜΑΡΚΑ","brand","π.χ. Toyota"],["ΜΟΝΤΕΛΟ","model","π.χ. Corolla"],["ΕΤΟΣ","year","π.χ. 2020"],["ΠΙΝΑΚΙΔΑ","plate","π.χ. ΑΒΓ-1234"]].map(([lb,f,ph])=>(
          <div key={f}><label style={lS}>{lb}</label><input value={av.info?.[f]||""} onChange={e=>upI(f,e.target.value)} placeholder={ph} style={iS}/></div>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <label style={lS}>ΑΡ. ΠΛΑΙΣΙΟΥ / VIN</label>
        <input value={av.info?.chassis||""} onChange={e=>upI("chassis",e.target.value)} placeholder="π.χ. WBA3A5C51DF..." style={iS}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><label style={lS}>ΑΣΦΑΛΙΣΤΙΚΗ</label><input value={av.info?.insurance||""} onChange={e=>upI("insurance",e.target.value)} placeholder="π.χ. Interamerican" style={iS}/></div>
        <div><label style={lS}>ΑΡ. ΑΣΦΑΛΙΣΤΗΡΙΟΥ</label><input value={av.info?.insuranceNo||""} onChange={e=>upI("insuranceNo",e.target.value)} placeholder="π.χ. 12345678" style={iS}/></div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lS}>ΚΥΡΙΟ ΚΑΥΣΙΜΟ</label>
        <select value={av.info?.fuelType||"unleaded95"} onChange={e=>upI("fuelType",e.target.value)} style={{...iS,appearance:"none"}}>
          {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
        </select>
      </div>
      <div style={{marginBottom:20}}>
        <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
        <input value={av.info?.notes||""} onChange={e=>upI("notes",e.target.value)} placeholder="π.χ. Χειμερινά λάδια..." style={iS}/>
      </div>

      {/* Drivers */}
      <div style={{borderTop:"1px solid "+T.br,paddingTop:16,marginBottom:4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,color:T.mt,letterSpacing:1,fontWeight:700}}>ΟΔΗΓΟΙ</div>
          <button onClick={addDriver} style={{padding:"5px 12px",background:av.color+"22",border:"1px solid "+av.color+"44",borderRadius:8,color:av.color,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Προσθήκη</button>
        </div>
        {drivers.map((d,i)=>(
          <div key={d.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:d.color,flexShrink:0,border:"2px solid "+T.br}}/>
            <input value={d.name} onChange={e=>updDriver(d.id,"name",e.target.value)}
              style={{...iS,flex:1,padding:"7px 10px"}}/>
            {/* Color picker */}
            <input type="color" value={d.color} onChange={e=>updDriver(d.id,"color",e.target.value)}
              style={{width:32,height:32,borderRadius:8,border:"1px solid "+T.br,padding:2,background:"transparent",cursor:"pointer"}}/>
            {drivers.length>1&&(
              <button onClick={()=>delDriver(d.id)} style={{background:"none",border:"none",color:"#ef4444",fontSize:18,cursor:"pointer",padding:"0 4px"}}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Reminders */}
      <div style={{borderTop:"1px solid "+T.br,paddingTop:16}}>
        <div style={{fontSize:12,color:T.mt,letterSpacing:1,marginBottom:10,fontWeight:700}}>ΥΠΕΝΘΥΜΙΣΕΙΣ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
          {RTYPES.map(rt=>(
            <button key={rt.id} onClick={()=>onAddReminder(rt.id)}
              style={{padding:"8px 10px",border:"1px solid "+T.br,borderRadius:9,background:T.bg,color:T.tx,fontSize:11,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>
              {rt.icon} {rt.label}
            </button>
          ))}
        </div>
        {(av.reminders||[]).length===0&&<div style={{fontSize:12,color:T.ft,textAlign:"center",padding:10}}>Δεν υπάρχουν υπενθυμίσεις.</div>}
        {(av.reminders||[]).map(r=>{
          const rs=rst(r), rt=RTYPES.find(x=>x.id===r.type);
          return(
            <div key={r.id} style={{background:T.bg,borderRadius:11,padding:11,marginBottom:9,border:"1.5px solid "+(rs&&ddiff(r.dueDate)<=7?rs.c+"88":rs?rs.c+"44":T.br)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{r.icon} {r.label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {rs&&<span style={{fontSize:11,color:rs.c,fontWeight:700,background:rs.c+"22",padding:"2px 8px",borderRadius:6}}>{rs.l}</span>}
                  <button onClick={()=>onDelReminder(r.id)} style={{background:"none",border:"none",color:T.ft,fontSize:16,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:rt?.hasDate&&rt?.hasKm?"1fr 1fr":"1fr",gap:8,marginBottom:6}}>
                {rt?.hasDate&&(<div>
                  <label style={{display:"block",fontSize:11,color:T.mt,marginBottom:2,fontWeight:600}}>Ημ/νία λήξης</label>
                  <input type="date" value={r.dueDate||""} onChange={e=>onUpdateReminder(r.id,"dueDate",e.target.value)}
                    style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                </div>)}
                {rt?.hasKm&&(<div>
                  <label style={{display:"block",fontSize:11,color:T.mt,marginBottom:2,fontWeight:600}}>Σε {dl}</label>
                  <input type="number" placeholder="π.χ. 40000" value={r.dueKm||""} onChange={e=>onUpdateReminder(r.id,"dueKm",e.target.value)}
                    style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
                </div>)}
              </div>
              <input placeholder="Σημειώσεις..." value={r.notes||""} onChange={e=>onUpdateReminder(r.id,"notes",e.target.value)}
                style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
            </div>
          );
        })}
      </div>
      {/* Delete */}
      <div style={{borderTop:"1px solid "+T.br,paddingTop:14,marginTop:6}}>
        {!confirmDelete ? (
          <button onClick={()=>setConfirmDelete(true)}
            style={{width:"100%",padding:11,background:"#ef444412",border:"1px solid #ef444444",borderRadius:10,color:"#ef4444",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            🗑️ Διαγραφή Οχήματος
          </button>
        ) : (
          <div style={{background:"#ef444415",borderRadius:12,padding:14,border:"1.5px solid #ef444466"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#ef4444",marginBottom:4}}>Είσαι σίγουρος;</div>
            <div style={{fontSize:12,color:T.mt,marginBottom:12}}>Θα διαγραφούν όλα τα δεδομένα του οχήματος.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setConfirmDelete(false)}
                style={{flex:1,padding:10,background:"transparent",border:"1px solid "+T.br,borderRadius:9,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
                Ακύρωση
              </button>
              <button onClick={onDelete}
                style={{flex:1,padding:10,background:"#ef4444",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
                Διαγραφή
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;

  const [vehicles, setVehicles]   = useState([defV()]);
  const [vid, setVid]             = useState("v1");
  const [entries, setEntries]     = useState({});
  const [expenses, setExpenses]   = useState({});
  const [tab, setTab]             = useState("add");
  const [modal, setModal]         = useState(null);
  const [newV, setNewV]           = useState({name:"",icon:"🚗",category:"car"});
  const [fY, setFY]               = useState("all");
  const [fM, setFM]               = useState("all");
  const [lastFuel, setLastFuel]   = useState({});
  const [showStPicker, setShowStPicker] = useState(false);
  const [showFtPicker, setShowFtPicker] = useState(false);
  const [editEntry, setEditEntry]       = useState(null);
  const [histView, setHistView]         = useState("list"); // "list" | "calendar"
  const fref = useRef();

  // Persistence
  useEffect(()=>{
    try {
      const saved=localStorage.getItem("fuellog_data");
      if (saved) {
        const d=JSON.parse(saved);
        if (d.vehicles) setVehicles(d.vehicles);
        if (d.entries)  setEntries(d.entries);
        if (d.expenses) setExpenses(d.expenses);
        if (d.lastFuel) setLastFuel(d.lastFuel);
        if (d.vid)      setVid(d.vid);
      }
    } catch(e) {}
  },[]);

  useEffect(()=>{
    try { localStorage.setItem("fuellog_data",JSON.stringify({vehicles,entries,expenses,lastFuel,vid})); }
    catch(e) {}
  },[vehicles,entries,expenses,lastFuel,vid]);

  const av      = vehicles.find(v=>v.id===vid)||vehicles[0];
  const col     = av?.color||"#3b82f6";
  const mi      = av?.unitMiles||false;
  const dl      = mi?"μίλια":"km";
  const drivers = av?.drivers||[{id:"d1",name:"Οδηγός 1",color:"#3b82f6"}];
  const lf      = lastFuel[vid]||{fuelType:"unleaded95",stId:"",stLabel:"",driverId:drivers[0]?.id||"d1"};

  const [fuelForm,    setFuelForm]    = useState(()=>emptyFuel(lf.fuelType,lf.stId,lf.stLabel,lf.driverId));
  const [expenseForm, setExpenseForm] = useState(emptyExpense);

  const switchVehicle=id=>{
    setVid(id);
    const lf2=lastFuel[id]||{fuelType:"unleaded95",stId:"",stLabel:"",driverId:"d1"};
    setFuelForm(emptyFuel(lf2.fuelType,lf2.stId,lf2.stLabel,lf2.driverId));
  };

  const allFuel    = useMemo(()=>(entries[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExpense = useMemo(()=>(expenses[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);
  const years      = useMemo(()=>[...new Set(allFuel.map(e=>e.date.slice(0,4)))].sort().reverse(),[allFuel]);

  const filtFuel=useMemo(()=>{
    let f=allFuel;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allFuel,fY,fM]);

  const filtExp=useMemo(()=>{
    let f=allExpense;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    return f;
  },[allExpense,fY,fM]);

  // Badge count — reminders expiring ≤30 days
  const dueR=useMemo(()=>(av?.reminders||[]).filter(r=>r.dueDate&&ddiff(r.dueDate)<=30),[av]);
  const urgentR=useMemo(()=>(av?.reminders||[]).filter(r=>r.dueDate&&ddiff(r.dueDate)<=7),[av]);

  const hff=(field,val)=>{
    // Replace comma with dot for Greek keyboard users (1,810 → 1.810)
    val = val.replace(",", ".");
    if (val !== "" && parseFloat(val) < 0) val = "0";
    const u={...fuelForm,[field]:val};
    const L=f=>parseFloat(String(f).replace(",","."))||0;
    const lv=L(val);

    // liters changed → total = liters × ppl
    if (field==="liters" && lv>0 && L(u.ppl)>0)
      u.total=(lv*L(u.ppl)).toFixed(2);

    // ppl changed → if liters exist: calc total. If total exists but no liters: calc liters
    if (field==="ppl" && lv>0) {
      if (L(u.liters)>0)       u.total =(L(u.liters)*lv).toFixed(2);
      else if (L(u.total)>0)   u.liters=(L(u.total)/lv).toFixed(2);
    }

    // total changed → ALWAYS recalc liters if ppl exists, else recalc ppl if liters exists
    if (field==="total" && lv>0) {
      if (L(u.ppl)>0)          u.liters=(lv/L(u.ppl)).toFixed(2);
      else if (L(u.liters)>0)  u.ppl   =(lv/L(u.liters)).toFixed(3);
    }

    if (field==="lpgL" && lv>0 && L(u.lpgP)>0)               u.lpgT=(lv*L(u.lpgP)).toFixed(2);
    if (field==="lpgP" && lv>0 && L(u.lpgL)>0)               u.lpgT=(L(u.lpgL)*lv).toFixed(2);
    if (field==="lpgT" && lv>0 && L(u.lpgL)>0)               u.lpgP=(lv/L(u.lpgL)).toFixed(3);
    if (field==="lpgT" && lv>0 && !L(u.lpgL) && L(u.lpgP)>0) u.lpgL=(lv/L(u.lpgP)).toFixed(2);
    setFuelForm(u);
  };

  const submitFuel=()=>{
    if (!fuelForm.date||(!fuelForm.liters&&!fuelForm.total)) return;
    const liters=parseFloat(fuelForm.liters)||null, total=parseFloat(fuelForm.total)||null;
    const ppl=parseFloat(fuelForm.ppl)||(liters&&total?total/liters:null);
    const kmS=parseFloat(fuelForm.km)||null;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{
      id:uid(),date:fuelForm.date,fuelType:fuelForm.fuelType,liters,ppl,total,
      km:kmS,odo:parseFloat(fuelForm.odo)||null,notes:fuelForm.notes,
      stId:fuelForm.stId,station:fuelForm.stLabel,dual:fuelForm.dual,
      lpgL:parseFloat(fuelForm.lpgL)||null,lpgP:parseFloat(fuelForm.lpgP)||null,lpgT:parseFloat(fuelForm.lpgT)||null,
      driverId:fuelForm.driverId,
    }]}));
    setLastFuel(p=>({...p,[vid]:{fuelType:fuelForm.fuelType,stId:fuelForm.stId,stLabel:fuelForm.stLabel,driverId:fuelForm.driverId}}));
    setFuelForm(emptyFuel(fuelForm.fuelType,fuelForm.stId,fuelForm.stLabel,fuelForm.driverId));
    // stay on add tab - don't redirect
  };

  const submitExpense=()=>{
    if (!expenseForm.date||!expenseForm.amount) return;
    const cat=EXPENSE_CATS.find(c=>c.id===expenseForm.catId);
    const label=expenseForm.catId==="custom"?(expenseForm.customCat||"Άλλο"):cat?.label||"";
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{id:uid(),date:expenseForm.date,catId:expenseForm.catId,label,amount:parseFloat(expenseForm.amount)||0,notes:expenseForm.notes}]}));
    setExpenseForm(emptyExpense());
  };

  const delFuel    = id=>setEntries(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));
  const saveEdit   = (id,data)=>{setEntries(p=>({...p,[vid]:p[vid].map(e=>e.id===id?{...e,...data}:e)}));setEditEntry(null);};
  const delExpense = id=>setExpenses(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));

  const addVeh=()=>{
    if (!newV.name.trim()) return;
    const v={id:uid(),name:newV.name.trim(),icon:newV.icon,color:FUEL_COLORS[vehicles.length%FUEL_COLORS.length],
      category:newV.category,
      info:{plate:"",chassis:"",brand:"",model:"",year:"",fuelType:"unleaded95",insurance:"",insuranceNo:"",notes:""},
      drivers:[{id:uid(),name:"Οδηγός 1",color:FUEL_COLORS[vehicles.length%FUEL_COLORS.length]}],
      reminders:[],unitMiles:false};
    setVehicles(p=>[...p,v]);
    switchVehicle(v.id);
    setNewV({name:"",icon:"🚗",category:"car"});
    setModal(null);
  };

  const updateVehicle=fields=>setVehicles(p=>p.map(x=>x.id===vid?{...x,...fields}:x));
  const deleteVehicle=()=>{
    const rem=vehicles.filter(v=>v.id!==vid);
    if (!rem.length) return;
    setVehicles(rem);
    setEntries(p=>Object.fromEntries(Object.entries(p).filter(([k])=>k!==vid)));
    setExpenses(p=>Object.fromEntries(Object.entries(p).filter(([k])=>k!==vid)));
    setModal(null);
    // switch after state updates
    setTimeout(()=>switchVehicle(rem[0].id), 50);
  };

  const addR=type=>{
    const rt=RTYPES.find(r=>r.id===type);
    setVehicles(p=>p.map(v=>v.id===vid?{...v,reminders:[...(v.reminders||[]),{id:uid(),type,label:rt.label,icon:rt.icon,dueDate:"",dueKm:"",notes:""}]}:v));
  };
  const upR=(rid,f,v)=>setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.map(r=>r.id===rid?{...r,[f]:v}:r)}:x));
  const delR=rid=>setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.filter(r=>r.id!==rid)}:x));

  const stats=useMemo(()=>{
    if (!filtFuel.length&&!filtExp.length) return null;
    const fuelSpent=filtFuel.reduce((s,x)=>s+(x.total||0),0)+filtFuel.reduce((s,x)=>s+(x.lpgT||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+x.amount,0);
    const tL=filtFuel.reduce((s,x)=>s+(x.liters||0),0);
    const wK=filtFuel.filter(x=>x.km&&x.liters), wP=filtFuel.filter(x=>x.ppl);
    const aC=wK.length?wK.reduce((s,x)=>s+(x.liters/x.km*100),0)/wK.length:null;
    const aP=wP.length?wP.reduce((s,x)=>s+x.ppl,0)/wP.length:null;
    const pr=wP.map(x=>x.ppl);
    const sc={};filtFuel.forEach(x=>{if(x.station) sc[x.station]=(sc[x.station]||0)+1;});
    const tSt=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const dE=filtFuel.filter(x=>x.dual&&x.lpgL&&x.km);
    const aLC=dE.length?dE.reduce((s,x)=>s+(x.lpgL/x.km*100),0)/dE.length:null;
    // Per-driver stats
    const byDriver={};
    drivers.forEach(d=>{
      const df=filtFuel.filter(x=>x.driverId===d.id);
      const dK=df.filter(x=>x.km&&x.liters);
      byDriver[d.id]={name:d.name,color:d.color,count:df.length,
        spent:df.reduce((s,x)=>s+(x.total||0),0),
        aC:dK.length?dK.reduce((s,x)=>s+(x.liters/x.km*100),0)/dK.length:null};
    });
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP,
      minP:pr.length?Math.min(...pr):null,maxP:pr.length?Math.max(...pr):null,tSt,aLC,byDriver};
  },[filtFuel,filtExp,drivers]);

  const cd=useMemo(()=>filtFuel.map(x=>({
    date:x.date.slice(5),
    price:x.ppl?+(+x.ppl).toFixed(3):null,
    cons:x.km&&x.liters?+(x.liters/x.km*100).toFixed(1):null,
    cost:x.total?+(+x.total).toFixed(2):null,
    lpgC:x.dual&&x.lpgL&&x.km?+(x.lpgL/x.km*100).toFixed(1):null,
  })),[filtFuel]);

  const loadDemo=()=>{
    const d1=drivers[0]?.id||"d1", d2=drivers[1]?.id||"d1";
    setEntries(p=>({...p,[vid]:[
      {id:uid(),date:"2025-09-05",fuelType:"unleaded95",liters:42,ppl:1.789,total:75.14,km:480,odo:51200,notes:"Πλήρες",stId:"shell",station:"Shell",driverId:d1},
      {id:uid(),date:"2025-10-08",fuelType:"unleaded98",liters:40,ppl:1.949,total:77.96,km:460,odo:52090,notes:"Αυτοκ/δρομος",stId:"eko",station:"ΕΚΟ",driverId:d2},
      {id:uid(),date:"2025-11-14",fuelType:"unleaded95",liters:38,ppl:1.829,total:69.50,km:430,odo:52975,notes:"",stId:"avin",station:"Avin",driverId:d1},
      {id:uid(),date:"2025-12-20",fuelType:"diesel",liters:50,ppl:1.699,total:84.95,km:510,odo:54000,notes:"",stId:"bp",station:"BP",driverId:d2},
      {id:uid(),date:"2026-01-15",fuelType:"unleaded95",liters:40,ppl:1.849,total:73.96,km:450,odo:55035,notes:"",stId:"avin",station:"Avin",driverId:d1},
      {id:uid(),date:"2026-02-10",fuelType:"unleaded95",liters:41,ppl:1.869,total:76.63,km:470,odo:56200,notes:"",stId:"shell",station:"Shell",driverId:d1},
    ]}));
    setTab("stats");
  };

  const exJson=()=>{
    const blob=new Blob([JSON.stringify({vehicles,entries,expenses,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fuellog_backup_"+today()+".json";a.click();
  };
  const exCsv=()=>{
    const rows=allFuel.map(x=>[x.date,FTYPES.find(f=>f.id===x.fuelType)?.label||x.fuelType,
      x.liters||"",x.ppl?fmt(x.ppl,3):"",x.total?fmt(x.total):"",
      x.km?fmt(x.km,1):"",x.odo||"",x.km&&x.liters?fmt(x.liters/x.km*100,1):"",
      x.station||"",drivers.find(d=>d.id===x.driverId)?.name||"",x.notes||""].map(v=>'"'+v+'"').join(","));
    if (!rows.length) return;
    const blob=new Blob([["Ημ/νία,Καύσιμο,Λίτρα,Τιμή/L,Σύνολο,km,Odo,L/100,Πρατήριο,Οδηγός,Σημ."].concat(rows).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fuellog_"+today()+".csv";a.click();
  };
  const imJson=ev=>{
    const file=ev.target.files[0];if(!file)return;
    const r=new FileReader();
    r.onload=e=>{try{
      const d=JSON.parse(e.target.result);
      if(d.vehicles&&d.entries){setVehicles(d.vehicles);setEntries(d.entries);setExpenses(d.expenses||{});switchVehicle(d.vehicles[0]?.id);alert("✅ Εισαγωγή OK");}
      else alert("❌ Μη έγκυρο αρχείο.");
    }catch(err){alert("❌ Σφάλμα.");}};
    r.readAsText(file);ev.target.value="";
  };

  // Styles
  const iS=on=>({width:"100%",padding:"12px 14px",background:T.inp,border:"1.5px solid "+(on?col+"cc":T.ib),borderRadius:12,color:T.tx,fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit"});
  const lS={display:"block",fontSize:11,color:T.mt,letterSpacing:"0.08em",marginBottom:5,fontWeight:600};
  const curSt=STATIONS.find(s=>s.id===fuelForm.stId);
  const prevCons=(fuelForm.km&&fuelForm.liters)?(parseFloat(fuelForm.liters)/parseFloat(fuelForm.km)*100).toFixed(1):null;
  const showPrev=!!(fuelForm.liters||fuelForm.ppl||fuelForm.total||fuelForm.km);
  const TABS=[
    {id:"add",    label:"⛽ Καύσιμα",   color:"#3b82f6"},
    {id:"expenses",label:"💸 Έξοδα",   color:"#10b981"},
    {id:"stats",  label:"📊 Στατιστικά",color:"#8b5cf6"},
    {id:"history",label:"📋 Ιστορικό", color:"#f97316"},
  ];

  const FBar=()=>(
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[
        {val:fY,set:setFY,opts:[["all","Όλα τα χρόνια"],...years.map(y=>[y,y])]},
        {val:fM,set:setFM,opts:[["all","Όλοι οι μήνες"],...MONTHS.map((m,i)=>[String(i+1).padStart(2,"0"),m])]},
      ].map((s,i)=>(
        <select key={i} value={s.val} onChange={e=>s.set(e.target.value)}
          style={{padding:"8px 10px",background:T.inp,border:"1.5px solid "+T.ib,borderRadius:10,color:T.tx,fontSize:13,flex:1,fontFamily:"inherit"}}>
          {s.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      ))}
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter','SF Pro Display','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:T.bg,color:T.tx,maxWidth:480,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{background:T.sf,borderBottom:"1px solid "+T.br,padding:"16px 16px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f97316,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⛽</div>
            <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.5px",color:T.tx}}>FuelLog</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {urgentR.length>0&&(
              <button onClick={()=>setModal("vi")} style={{padding:"5px 10px",background:"#ef444422",border:"1.5px solid #ef4444",borderRadius:9,color:"#ef4444",fontSize:12,fontWeight:800,cursor:"pointer",position:"relative"}}>
                🔔 <span style={{background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:11,fontWeight:800}}>{urgentR.length}</span>
              </button>
            )}
            {!urgentR.length&&dueR.length>0&&(
              <button onClick={()=>setModal("vi")} style={{padding:"5px 10px",background:"#f9731622",border:"1.5px solid #f97316",borderRadius:9,color:"#f97316",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                🔔{dueR.length}
              </button>
            )}
            <button onClick={()=>setModal("vi")} style={{width:34,height:34,borderRadius:9,background:col+"22",border:"1px solid "+col+"44",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>📋</button>
            <button onClick={()=>setModal("bk")} style={{width:34,height:34,borderRadius:9,background:"#10b98122",border:"1px solid #10b98144",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>☁️</button>
            <button onClick={()=>setDark(!dark)} style={{width:34,height:34,borderRadius:9,background:T.bg,border:"1px solid "+T.br,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
          </div>
        </div>

        {/* Vehicle tabs */}
        <div style={{display:"flex",gap:3,overflowX:"auto",marginBottom:12,scrollbarWidth:"none"}}>
          {vehicles.map(v=>(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:0}}>
              <button onClick={()=>switchVehicle(v.id)} style={{
                padding:"6px 10px",borderRadius:vid===v.id?"8px 0 0 8px":8,border:"none",
                background:vid===v.id?v.color:"transparent",color:vid===v.id?"#fff":T.mt,
                fontWeight:vid===v.id?700:400,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",fontFamily:"inherit",
              }}>{v.icon} {v.name}</button>
              {vid===v.id&&(
                <button onClick={()=>setModal("vi")} style={{
                  padding:"6px 7px",borderRadius:"0 8px 8px 0",border:"none",
                  background:v.color+"cc",color:"#fff",fontSize:11,cursor:"pointer",lineHeight:1,
                }}>✏️</button>
              )}
            </div>
          ))}
          <button onClick={()=>setModal("av")} style={{padding:"6px 10px",background:"transparent",border:"1px dashed "+T.br,borderRadius:8,color:T.mt,fontSize:16,cursor:"pointer",flexShrink:0}}>+</button>
        </div>

        {/* Nav tabs */}
        <div style={{display:"flex",gap:4,marginBottom:-1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"9px 4px",border:"none",borderRadius:"10px 10px 0 0",
              background:tab===t.id?t.color:"transparent",
              color:tab===t.id?"#fff":T.mt,
              fontWeight:tab===t.id?700:400,fontSize:12,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.02em",
              borderBottom:tab===t.id?"none":"1px solid "+T.br,transition:"all .15s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{background:T.sf,padding:"18px 16px 100px",minHeight:"70vh"}}>

        {/* ── TAB: ADD FUEL ── */}
        {tab==="add"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {showPrev&&(
              <div style={{background:"linear-gradient(135deg,"+col+"33,"+col+"08)",border:"1.5px solid "+col+"55",borderRadius:16,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,color:T.mt,letterSpacing:"0.08em",fontWeight:600}}>ΠΡΟΕΠΙΣΚΟΠΗΣΗ</span>
                  <FtBadge ftId={fuelForm.fuelType} size={12}/>
                </div>
                <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
                  {fuelForm.liters&&<div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΛΙΤΡΑ</div><div style={{fontSize:20,fontWeight:800,color:col}}>{fuelForm.liters}L</div></div>}
                  {fuelForm.ppl   &&<div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΤΙΜΗ/L</div><div style={{fontSize:20,fontWeight:800,color:col}}>€{fuelForm.ppl}</div></div>}
                  {fuelForm.total &&<div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΣΥΝΟΛΟ</div><div style={{fontSize:20,fontWeight:800,color:col}}>€{fuelForm.total}</div></div>}
                  {prevCons       &&<div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΚΑΤΑΝΑΛΩΣΗ</div><div style={{fontSize:20,fontWeight:800,color:"#10b981"}}>{prevCons}L/100</div></div>}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={fuelForm.date} onChange={e=>hff("date",e.target.value)} style={iS(true)}/></div>
              <div>
                <label style={lS}>ΚΑΥΣΙΜΟ</label>
                <button onClick={()=>setShowFtPicker(true)} style={{...iS(false),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px"}}>
                  <FtBadge ftId={fuelForm.fuelType} size={13}/><span style={{color:T.mt,fontSize:11}}>▼</span>
                </button>
              </div>
            </div>

            {/* Driver selector */}
            {drivers.length>1&&(
              <div>
                <label style={lS}>ΟΔΗΓΟΣ</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {drivers.map(d=>(
                    <button key={d.id} onClick={()=>hff("driverId",d.id)}
                      style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(fuelForm.driverId===d.id?d.color:T.br),
                        background:fuelForm.driverId===d.id?d.color+"22":"transparent",
                        color:fuelForm.driverId===d.id?d.color:T.mt,fontWeight:fuelForm.driverId===d.id?700:400,
                        fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:d.color}}/>
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΛΙΤΡΑ</label><input type="number" step="any" placeholder="π.χ. 40" value={fuelForm.liters} onChange={e=>hff("liters",e.target.value)} style={iS(!!fuelForm.liters)}/></div>
              <div><label style={lS}>ΤΙΜΗ / L (€)</label><input type="number" step="any" placeholder="π.χ. 1.789" value={fuelForm.ppl} onChange={e=>hff("ppl",e.target.value)} style={iS(!!fuelForm.ppl)}/></div>
            </div>

            <div>
              <label style={lS}>ΣΥΝΟΛΙΚΟ ΠΟΣΟ (€)</label>
              <input type="number" step="any" placeholder="π.χ. 70.00" value={fuelForm.total} onChange={e=>hff("total",e.target.value)}
                style={{...iS(!!fuelForm.total),fontSize:16,fontWeight:600}}/>
            </div>

            {fuelForm.dual&&(
              <div style={{background:T.bg,borderRadius:14,padding:14,border:"2px solid #a78bfa44"}}>
                <div style={{fontSize:11,color:"#a78bfa",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>🟣 ΥΓΡΑΕΡΙΟ LPG</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><label style={lS}>ΛΙΤΡΑ LPG</label><input type="number" step="any" value={fuelForm.lpgL} onChange={e=>hff("lpgL",e.target.value)} style={iS(!!fuelForm.lpgL)}/></div>
                  <div><label style={lS}>ΤΙΜΗ/L €</label><input type="number" step="any" value={fuelForm.lpgP} onChange={e=>hff("lpgP",e.target.value)} style={iS(!!fuelForm.lpgP)}/></div>
                </div>
                <div><label style={lS}>ΣΥΝΟΛΟ LPG €</label><input type="number" step="any" value={fuelForm.lpgT} onChange={e=>hff("lpgT",e.target.value)} style={iS(!!fuelForm.lpgT)}/></div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={lS}>{"ΧΙΛΙΟΜΕΤΡΑ ΔΙΑΔΡΟΜΗΣ"}</label>
                <input type="number" placeholder="π.χ. 450" value={fuelForm.km} onChange={e=>hff("km",e.target.value)} style={iS(!!fuelForm.km)}/>
              </div>
              <div>
                <label style={lS}>ΧΙΛΙΟΜΕΤΡΗΤΗΣ</label>
                <input type="number" placeholder="π.χ. 52300" value={fuelForm.odo} onChange={e=>hff("odo",e.target.value)} style={iS(!!fuelForm.odo)}/>
              </div>
            </div>

            <div>
              <label style={lS}>ΠΡΑΤΗΡΙΟ</label>
              <button onClick={()=>setShowStPicker(true)} style={{...iS(!!fuelForm.stId),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px"}}>
                {fuelForm.stLabel
                  ? <span style={{fontWeight:700,background:curSt?curSt.bg:"#555",color:curSt?curSt.fg:"#fff",padding:"2px 10px",borderRadius:6,fontSize:12}}>{fuelForm.stLabel}</span>
                  : <span style={{color:T.ft,fontSize:13}}>Επίλεξε...</span>
                }
                <span style={{color:T.mt,fontSize:11}}>▼</span>
              </button>
            </div>

            <div>
              <label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label>
              <input type="text" placeholder="π.χ. Full tank, αυτοκινητόδρομος..." value={fuelForm.notes} onChange={e=>hff("notes",e.target.value)} style={iS(!!fuelForm.notes)}/>
            </div>

            <button onClick={()=>hff("dual",!fuelForm.dual)}
              style={{padding:"11px 14px",border:"1.5px solid "+(fuelForm.dual?"#a78bfa":T.br),borderRadius:12,
                background:fuelForm.dual?"#a78bfa22":"transparent",color:fuelForm.dual?"#a78bfa":T.mt,
                fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit"}}>
              🔘 Διπλή κατανάλωση (+ LPG)
              {fuelForm.dual&&<span style={{marginLeft:"auto",fontSize:11,background:"#a78bfa",color:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>ON</span>}
            </button>

            <button onClick={submitFuel} style={{padding:16,background:"linear-gradient(135deg,"+col+","+col+"cc)",color:"#fff",border:"none",borderRadius:14,fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px "+col+"55"}}>
              ⛽ ΑΠΟΘΗΚΕΥΣΗ
            </button>
          </div>
        )}

        {/* ── TAB: EXPENSES ── */}
        {tab==="expenses"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})} style={iS(true)}/></div>
              <div><label style={lS}>ΠΟΣΟ €</label><input type="number" step="any" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} style={iS(!!expenseForm.amount)}/></div>
            </div>
            <div>
              <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:7}}>
                {EXPENSE_CATS.map(c=>(
                  <button key={c.id} onClick={()=>setExpenseForm({...expenseForm,catId:c.id})}
                    style={{padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(expenseForm.catId===c.id?"#10b981":T.br),
                      background:expenseForm.catId===c.id?"#10b98122":"transparent",
                      color:expenseForm.catId===c.id?"#10b981":T.mt,fontSize:11,cursor:"pointer",textAlign:"center",fontFamily:"inherit"}}>
                    <div style={{fontSize:20}}>{c.icon}</div>
                    <div style={{fontSize:10,marginTop:3,fontWeight:600}}>{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            {expenseForm.catId==="custom"&&(
              <div><label style={lS}>ΠΕΡΙΓΡΑΦΗ</label><input placeholder="π.χ. Μπαταρία..." value={expenseForm.customCat||""} onChange={e=>setExpenseForm({...expenseForm,customCat:e.target.value})} style={iS(true)}/></div>
            )}
            <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input type="text" placeholder="π.χ. Castrol 5W40..." value={expenseForm.notes} onChange={e=>setExpenseForm({...expenseForm,notes:e.target.value})} style={iS(false)}/></div>
            <button onClick={submitExpense} style={{padding:15,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:14,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px #10b98155"}}>
              💸 ΠΡΟΣΘΗΚΗ ΕΞΟΔΟΥ
            </button>
            <div style={{marginTop:4}}>
              {allExpense.slice().reverse().map(ex=>{
                const cat=EXPENSE_CATS.find(c=>c.id===ex.catId);
                return(
                  <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 4px",borderBottom:"1px solid "+T.br}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22,width:32,textAlign:"center"}}>{cat?.icon||"💸"}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.tx}}>{ex.label}</div>
                        <div style={{fontSize:11,color:T.mt}}>{ex.date}{ex.notes?" · "+ex.notes:""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontWeight:800,color:"#ef4444",fontSize:14}}>-€{fmt(ex.amount)}</span>
                      <button onClick={()=>delExpense(ex.id)} style={{background:"#ef444422",border:"1px solid #ef444444",color:"#ef4444",fontSize:14,padding:"4px 8px",borderRadius:8,cursor:"pointer",lineHeight:1}}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB: STATS ── */}
        {tab==="stats"&&(
          <div>
            <FBar/>
            {!stats?(
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div style={{marginBottom:16,fontSize:14}}>Δεν υπάρχουν δεδομένα ακόμα.</div>
                <button onClick={loadDemo} style={{padding:"11px 22px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🚀 Φόρτωση demo</button>
              </div>
            ):(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[
                    ["💰","Συνολικά έξοδα", stats.totalSpent?fmt(stats.totalSpent)+"€":"—",GRAD_COLS[0],null],
                    ["⛽","Καύσιμα",        stats.fuelSpent ?fmt(stats.fuelSpent)+"€" :"—",GRAD_COLS[1],"↑"],
                    ["🔥","Μέση κατανάλωση",stats.aC       ?fmt(stats.aC,1)+"L/100"  :"—",GRAD_COLS[2],"↓"],
                    ["📈","Μέση τιμή/L",    stats.aP       ?fmt(stats.aP,3)+"€"       :"—",GRAD_COLS[3],"↑"],
                    ["🔧","Άλλα έξοδα",    stats.expSpent ?fmt(stats.expSpent)+"€"   :"—",GRAD_COLS[4],null],
                    ["💧","Συνολικά λίτρα", stats.tL       ?fmt(stats.tL,1)+"L"       :"—",GRAD_COLS[5],"↑"],
                  ].map(([ic,lb,val,gc,trend])=>(
                    <div key={lb} style={{borderRadius:16,padding:14,position:"relative",overflow:"hidden",
                      background:"linear-gradient(135deg,"+gc+"33,"+gc+"08)",border:"1.5px solid "+gc+"44",boxShadow:"0 2px 16px "+gc+"18"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                      <div style={{fontSize:18,fontWeight:800,color:gc,letterSpacing:"-0.5px"}}>{val}</div>
                      <div style={{fontSize:11,color:T.mt,marginTop:3,fontWeight:500}}>{lb}</div>
                      {trend&&<div style={{position:"absolute",top:10,right:10,fontSize:12,fontWeight:800,color:trend==="↑"?"#ef4444":"#10b981",background:(trend==="↑"?"#ef4444":"#10b981")+"22",borderRadius:6,padding:"2px 6px"}}>{trend}</div>}
                    </div>
                  ))}
                </div>

                {/* Per-driver stats */}
                {drivers.length>1&&stats.byDriver&&(
                  <div style={{background:T.bg,borderRadius:14,padding:14,marginBottom:14,border:"1px solid "+T.br}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,fontWeight:700,marginBottom:10}}>ΑΝΑ ΟΔΗΓΟ</div>
                    {drivers.map(d=>{
                      const ds=stats.byDriver[d.id];
                      if (!ds||!ds.count) return null;
                      return(
                        <div key={d.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"10px 12px",background:d.color+"11",borderRadius:10,border:"1px solid "+d.color+"33"}}>
                          <div style={{width:12,height:12,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:13,color:T.tx}}>{d.name}</div>
                            <div style={{fontSize:11,color:T.mt}}>{ds.count} γεμίσματα · {fmt(ds.spent)}€{ds.aC?" · "+fmt(ds.aC,1)+"L/100":""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {stats.aLC&&(
                  <div style={{background:T.bg,borderRadius:14,padding:14,marginBottom:12,border:"2px solid #a78bfa44"}}>
                    <div style={{fontSize:11,color:"#a78bfa",letterSpacing:"0.08em",fontWeight:700,marginBottom:6}}>🟣 ΔΙΠΛΗ ΚΑΤΑΝΑΛΩΣΗ</div>
                    <div style={{display:"flex",gap:24}}>
                      <div><div style={{fontSize:11,color:T.mt}}>Βενζίνη</div><div style={{fontSize:15,fontWeight:700,color:col}}>{fmt(stats.aC,1)} L/100</div></div>
                      <div><div style={{fontSize:11,color:T.mt}}>LPG</div><div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>{fmt(stats.aLC,1)} L/100</div></div>
                    </div>
                  </div>
                )}

                {stats.minP&&(
                  <div style={{background:T.bg,borderRadius:14,padding:14,marginBottom:14,border:"1px solid "+T.br,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:11,color:T.mt,fontWeight:600}}>MIN €/L</div><div style={{fontSize:16,fontWeight:800,color:"#10b981"}}>{fmt(stats.minP,3)}€</div></div>
                    {stats.tSt&&<div style={{textAlign:"center"}}><div style={{fontSize:11,color:T.mt,fontWeight:600}}>TOP ΠΡΑΤΗΡΙΟ</div><div style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{stats.tSt}</div></div>}
                    <div style={{textAlign:"right"}}><div style={{fontSize:11,color:T.mt,fontWeight:600}}>MAX €/L</div><div style={{fontSize:16,fontWeight:800,color:"#ef4444"}}>{fmt(stats.maxP,3)}€</div></div>
                  </div>
                )}

                <ChartBlock title="ΤΙΜΗ €/L"      data={cd} dk="price" color={col}     type="line" unit="€"     T={T}/>
                <ChartBlock title="ΕΞΟΔΑ/ΓΕΜΙΣΜΑ" data={cd} dk="cost"  color={col}     type="bar"  unit="€"     T={T}/>
                {(stats.aC!=null||stats.aP!=null)&&(
                  <div style={{background:T.bg,borderRadius:14,padding:"14px 8px 8px",border:"1px solid "+T.br,marginBottom:14}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,fontWeight:700,marginBottom:8,paddingLeft:6}}>ΚΟΝΤΕΡ</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {stats.aC!=null&&<Gauge value={stats.aC} min={4} max={20} color="#10b981" label="ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>}
                      {stats.aP!=null&&<Gauge value={stats.aP} min={1.4} max={2.4} color={col} label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>}
                    </div>
                  </div>
                )}
                <ChartBlock title="ΚΑΤΑΝΑΛΩΣΗ"    data={cd} dk="cons"  color="#10b981" type="line" unit="L/100" T={T}/>
                <ChartBlock title="LPG L/100"      data={cd} dk="lpgC"  color="#a78bfa" type="line" unit="L/100" T={T}/>

                {stats.expSpent>0&&filtExp.length>0&&(
                  <div style={{marginTop:6}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:1,fontWeight:700,marginBottom:8}}>ΑΝΑΛΥΣΗ ΕΞΟΔΩΝ</div>
                    <div style={{background:T.bg,borderRadius:14,padding:14,border:"1px solid "+T.br}}>
                      {Object.entries(filtExp.reduce((acc,x)=>{acc[x.label]=(acc[x.label]||0)+x.amount;return acc;},{}))
                        .sort((a,b)=>b[1]-a[1]).map(([label,amount])=>{
                          const pct=amount/stats.expSpent*100;
                          const cat=EXPENSE_CATS.find(c=>c.label===label);
                          return(
                            <div key={label} style={{marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                <span style={{fontSize:12,color:T.tx,fontWeight:500}}>{cat?.icon||"💸"} {label}</span>
                                <span style={{fontSize:12,fontWeight:700,color:"#10b981"}}>{fmt(amount)}€</span>
                              </div>
                              <div style={{background:T.br,borderRadius:6,height:6}}>
                                <div style={{background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:6,height:6,width:pct+"%"}}/>
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

        {/* ── TAB: HISTORY ── */}
        {tab==="history"&&(
          <div>
            <FBar/>
            {/* View toggle */}
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {[["list","📋 Λίστα"],["calendar","📅 Ημερολόγιο"]].map(([v,l])=>(
                <button key={v} onClick={()=>setHistView(v)}
                  style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid "+(histView===v?col:T.br),
                    background:histView===v?col+"22":"transparent",color:histView===v?col:T.mt,
                    fontWeight:histView===v?700:400,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  {l}
                </button>
              ))}
            </div>

            {histView==="calendar"&&<CalendarView entries={filtFuel} col={col} T={T}/>}

            {filtFuel.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div>Δεν υπάρχουν καταχωρήσεις.</div>
              </div>
            ):[...filtFuel].reverse().map(f=>{
              const ft=FTYPES.find(x=>x.id===f.fuelType);
              const so=STATIONS.find(s=>s.id===f.stId);
              const fc=FT_COLORS[f.fuelType]||{color:col};
              const drv=drivers.find(d=>d.id===f.driverId);
              return(
                <div key={f.id} onClick={()=>setEditEntry({...f})} style={{background:T.bg,borderRadius:14,padding:"13px 13px 13px 17px",marginBottom:10,border:"1px solid "+T.br,position:"relative",cursor:"pointer"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,borderRadius:"14px 0 0 14px",background:fc.color||col}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                        <span style={{fontWeight:700,fontSize:13,color:T.tx}}>{f.date}</span>
                        {ft&&<FtBadge ftId={f.fuelType} size={11}/>}
                        {f.dual&&<span style={{fontSize:11,background:"#a78bfa22",color:"#a78bfa",padding:"2px 7px",borderRadius:6,fontWeight:700}}>Dual LPG</span>}
                        {f.station&&<span style={{fontSize:11,background:so?so.bg:"#555",color:so?so.fg:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>{f.station}</span>}
                        {drv&&drivers.length>1&&<span style={{fontSize:11,background:drv.color+"22",color:drv.color,padding:"2px 7px",borderRadius:6,fontWeight:700}}>👤 {drv.name}</span>}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
                        {f.liters&&<span style={{fontSize:12,color:T.tx}}>⛽ {fmt(f.liters,1)}L</span>}
                        {f.ppl   &&<span style={{fontSize:12,color:T.tx}}>💧 {fmt(f.ppl,3)}€/L</span>}
                        {f.total &&<span style={{fontSize:12,color:T.tx}}>💰 {fmt(f.total)}€</span>}
                        {f.km    &&<span style={{fontSize:12,color:T.tx}}>📍 {fmt(f.km,0)}{dl}</span>}
                        {f.km&&f.liters&&<span style={{fontSize:12,color:"#10b981",fontWeight:700}}>🔥 {fmt(f.liters/f.km*100,1)}L/100</span>}
                      </div>
                      {f.notes&&<div style={{marginTop:5,fontSize:11,color:T.mt}}>📝 {f.notes}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();delFuel(f.id);}} style={{background:"#ef444422",border:"1px solid #ef444444",color:"#ef4444",fontSize:14,paddingLeft:8,paddingRight:8,paddingTop:4,paddingBottom:4,borderRadius:8,cursor:"pointer",lineHeight:1}}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:"center",paddingTop:28}}>
          <div style={{display:"inline-block",padding:"6px 18px",borderRadius:20,background:T.bg,border:"1px solid "+T.br}}>
            <span style={{fontSize:13,fontWeight:800,background:"linear-gradient(90deg,#3b82f6,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FuelLog v1.1</span>
            <span style={{fontSize:13,fontWeight:700,color:"#3b82f6"}}> · © Ταχμαζίδης Κ. Γιώργος</span>
          </div>
        </div>
      </div>

      {/* FUEL TYPE PICKER */}
      {showFtPicker&&(
        <Modal title="⛽ Είδος Καυσίμου" onClose={()=>setShowFtPicker(false)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FTYPES.map(ft=>{
              const fc=FT_COLORS[ft.id]||{}, sel=fuelForm.fuelType===ft.id;
              return(
                <button key={ft.id} onClick={()=>{setFuelForm({...fuelForm,fuelType:ft.id});setShowFtPicker(false);}}
                  style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 14px",
                    border:"2px solid "+(sel?fc.color||col:T.br),borderRadius:12,
                    background:sel?fc.bg||col+"22":T.bg,cursor:"pointer",fontFamily:"inherit"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{ft.icon}</span>
                    <span style={{fontSize:14,fontWeight:sel?700:400,color:sel?fc.color||col:T.tx}}>{ft.label}</span>
                  </div>
                  <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(sel?fc.color||col:T.br),
                    background:sel?fc.color||col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>
                    {sel?"✓":""}
                  </div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* STATION PICKER */}
      {showStPicker&&(
        <StationModal current={{stId:fuelForm.stId,stLabel:fuelForm.stLabel}}
          onSelect={(id,lb)=>{setFuelForm({...fuelForm,stId:id,stLabel:lb});setShowStPicker(false);}}
          onClose={()=>setShowStPicker(false)} T={T}/>
      )}

      {/* MODAL: Add Vehicle */}
      {modal==="av"&&(
        <Modal title="🚗 Νέο Όχημα" onClose={()=>setModal(null)} T={T}>
          <div style={{marginBottom:12}}>
            <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {VCATS.map(c=>(
                <button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icons[0]})}
                  style={{padding:"7px 13px",borderRadius:9,border:"1.5px solid "+(newV.category===c.id?col:T.br),
                    background:newV.category===c.id?col+"22":"transparent",color:newV.category===c.id?col:T.mt,
                    fontSize:12,fontWeight:newV.category===c.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                  {c.icons[0]} {c.label}
                </button>
              ))}
            </div>
            <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {(VCATS.find(c=>c.id===newV.category)?.icons||["🚗"]).map(ic=>(
                <button key={ic} onClick={()=>setNewV({...newV,icon:ic})}
                  style={{fontSize:24,padding:"8px 12px",border:"2px solid "+(newV.icon===ic?col:T.br),borderRadius:10,background:"transparent",cursor:"pointer"}}>{ic}</button>
              ))}
            </div>
            <label style={lS}>ΟΝΟΜΑ</label>
            <input value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} placeholder="π.χ. Εταιρικό Βαν"
              style={{...iS(!!newV.name),marginBottom:16}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setModal(null)} style={{flex:1,padding:13,background:"transparent",border:"1.5px solid "+T.br,borderRadius:12,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Ακύρωση</button>
            <button onClick={addVeh} style={{flex:2,padding:13,background:col,color:"#fff",border:"none",borderRadius:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Προσθήκη</button>
          </div>
        </Modal>
      )}

      {/* MODAL: Vehicle Info */}
      {modal==="vi"&&av&&(
        <VehicleInfoModal av={av} onClose={()=>setModal(null)} onUpdate={updateVehicle} onDelete={deleteVehicle}
          onAddReminder={addR} onUpdateReminder={upR} onDelReminder={delR} T={T} dl={dl}/>
      )}

      {/* MODAL: Edit Entry */}
      {editEntry&&(()=>{
        const iSe=on=>({...iS(on),fontFamily:"inherit"});
        const upE=(f,v)=>{
          const u={...editEntry,[f]:v};
          const L=x=>parseFloat(x)||0;
          if(f==="liters"){if(u.ppl&&+u.ppl) u.total=(L(v)*L(u.ppl)).toFixed(2);}
          if(f==="ppl"&&u.liters&&+u.liters) u.total=(L(u.liters)*L(v)).toFixed(2);
          if(f==="total"&&u.liters&&+u.liters&&L(v)>0) u.ppl=(L(v)/L(u.liters)).toFixed(3);
          setEditEntry(u);
        };
        return(
          <Modal title="✏️ Επεξεργασία" onClose={()=>setEditEntry(null)} T={T}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={editEntry.date} onChange={e=>upE("date",e.target.value)} style={iSe(true)}/></div>
              <div><label style={lS}>ΕΙΔΟΣ ΚΑΥΣΙΜΟΥ</label>
                <select value={editEntry.fuelType} onChange={e=>upE("fuelType",e.target.value)} style={{...iSe(true),appearance:"none"}}>
                  {FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
                </select>
              </div>
              {drivers.length>1&&(
                <div><label style={lS}>ΟΔΗΓΟΣ</label>
                  <select value={editEntry.driverId||""} onChange={e=>upE("driverId",e.target.value)} style={{...iSe(true),appearance:"none"}}>
                    {drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={lS}>ΛΙΤΡΑ</label><input type="number" step="any" value={editEntry.liters||""} onChange={e=>upE("liters",e.target.value)} style={iSe(!!editEntry.liters)}/></div>
                <div><label style={lS}>ΤΙΜΗ/L</label><input type="number" step="any" value={editEntry.ppl||""} onChange={e=>upE("ppl",e.target.value)} style={iSe(!!editEntry.ppl)}/></div>
              </div>
              <div><label style={lS}>ΣΥΝΟΛΟ €</label><input type="number" step="any" value={editEntry.total||""} onChange={e=>upE("total",e.target.value)} style={iSe(!!editEntry.total)}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={lS}>ΧΛΜ ΔΙΑΔΡΟΜΗΣ</label><input type="number" value={editEntry.km||""} onChange={e=>upE("km",e.target.value)} style={iSe(!!editEntry.km)}/></div>
                <div><label style={lS}>ΧΙΛΙΟΜΕΤΡΗΤΗΣ</label><input type="number" value={editEntry.odo||""} onChange={e=>upE("odo",e.target.value)} style={iSe(!!editEntry.odo)}/></div>
              </div>
              <div><label style={lS}>ΠΡΑΤΗΡΙΟ</label><input value={editEntry.station||""} onChange={e=>upE("station",e.target.value)} placeholder="π.χ. Shell" style={iSe(!!editEntry.station)}/></div>
              <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input value={editEntry.notes||""} onChange={e=>upE("notes",e.target.value)} style={iSe(!!editEntry.notes)}/></div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={()=>setEditEntry(null)} style={{flex:1,padding:13,background:"transparent",border:"1.5px solid "+T.br,borderRadius:12,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Ακύρωση</button>
                <button onClick={()=>saveEdit(editEntry.id,editEntry)} style={{flex:2,padding:13,background:"linear-gradient(135deg,"+col+","+col+"cc)",color:"#fff",border:"none",borderRadius:12,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✓ Αποθήκευση</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MODAL: Backup */}
      {modal==="bk"&&(
        <Modal title="☁️ Backup & Export" onClose={()=>setModal(null)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={lS}>ΕΞΑΓΩΓΗ</label>
            <button onClick={exCsv}  style={{padding:"13px 16px",background:"#3b82f622",border:"1px solid #3b82f644",borderRadius:12,color:"#3b82f6",fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📄 Export CSV</button>
            <button onClick={exJson} style={{padding:"13px 16px",background:col+"22",border:"1px solid "+col+"44",borderRadius:12,color:col,fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📦 Backup JSON</button>
            <label style={{...lS,marginTop:8}}>ΕΠΑΝΑΦΟΡΑ</label>
            <input ref={fref} type="file" accept=".json" onChange={imJson} style={{display:"none"}}/>
            <button onClick={()=>fref.current?.click()} style={{padding:"13px 16px",background:T.bg,border:"1px solid "+T.br,borderRadius:12,color:T.tx,fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📥 Εισαγωγή JSON</button>
            <div style={{borderTop:"1px solid "+T.br,paddingTop:12,marginTop:4}}>
              <button onClick={loadDemo} style={{width:"100%",padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🚀 Demo δεδομένα</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
