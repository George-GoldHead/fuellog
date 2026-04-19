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

const DK = { bg:"#080810", sf:"#10101c", br:"#1e1e30", tx:"#eeeeff", mt:"#7777aa", ft:"#33334a", inp:"#0d0d1a", ib:"#1e1e30" };
const LT = { bg:"#eef0fb", sf:"#ffffff",  br:"#d8daf0", tx:"#0d0d1a", mt:"#5555aa", ft:"#9090bb", inp:"#ffffff", ib:"#c5c8e8" };

const defV = () => ({
  id:"v1", name:"Αυτοκίνητο 1", icon:"🚗", color:"#3b82f6", category:"car",
  info:{ plate:"", chassis:"", brand:"", model:"", year:"", fuelType:"unleaded95", insurance:"", insuranceNo:"", notes:"" },
  reminders:[], unitMiles:false,
});

const emptyFuel = (ft="unleaded95", stId="", stLabel="") => ({
  date:today(), fuelType:ft, liters:"", ppl:"", total:"",
  km:"", odo:"", notes:"", stId, stLabel,
  dual:false, lpgL:"", lpgP:"", lpgT:"",
});

const emptyExpense = () => ({ date:today(), catId:"oil", customCat:"", amount:"", notes:"" });

function Gauge({ value, min, max, color, label, unit, T }) {
  if (value == null) return null;
  const pct    = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R = 70, cx = 100, cy = 90;
  const startA = Math.PI * 0.85, endA = Math.PI * 2.15;
  const totalA = endA - startA;
  const valA   = startA + totalA * pct;
  const arcPath = (r, a1, a2) => {
    const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const x2 = cx + r*Math.cos(a2), y2 = cy + r*Math.sin(a2);
    return "M " + x1 + " " + y1 + " A " + r + " " + r + " 0 " + ((a2-a1)>Math.PI?1:0) + " 1 " + x2 + " " + y2;
  };
  const needleX = cx + (R-10)*Math.cos(valA), needleY = cy + (R-10)*Math.sin(valA);
  const gid = "gauge_" + color.replace("#","");
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 200 110" style={{width:"100%",maxWidth:200,height:"auto",display:"block",margin:"0 auto"}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981"/><stop offset="50%" stopColor="#f97316"/><stop offset="100%" stopColor="#ef4444"/>
          </linearGradient>
        </defs>
        <path d={arcPath(R,startA,endA)} fill="none" stroke={T.br} strokeWidth={10} strokeLinecap="round"/>
        <path d={arcPath(R,startA,valA)} fill="none" stroke={"url(#"+gid+")"} strokeWidth={10} strokeLinecap="round"/>
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={cx} y={cy-14} textAnchor="middle" fill={color} fontSize={16} fontWeight="700">{(+value).toFixed(value>10?1:3)}</text>
        <text x={cx} y={cy-2} textAnchor="middle" fill={T.mt} fontSize={9}>{unit}</text>
      </svg>
      <div style={{fontSize:10,color:T.mt,letterSpacing:1,marginTop:-4}}>{label}</div>
    </div>
  );
}

function SVGChart({ points, color, type, unit }) {
  const [active, setActive] = useState(null);
  if (!points || points.length < 2) return null;
  const W=400, H=80, P=8;
  const vals = points.map(p=>p.y);
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV-minV||1;
  const sx = i => P+(i/(points.length-1))*(W-P*2);
  const sy = v => H-P-((v-minV)/range)*(H-P*2);

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = (clientX - rect.left) / rect.width * W;
    let closest = 0, minDist = Infinity;
    points.forEach((p,i) => { const d = Math.abs(sx(i)-relX); if(d<minDist){minDist=d;closest=i;} });
    setActive(closest);
  };

  const tip = active !== null ? points[active] : null;
  const tipX = active !== null ? sx(active) : 0;
  const tipY = active !== null ? sy(points[active].y) : 0;

  if (type==="bar") {
    const bw = Math.max(3,(W-P*2)/points.length-4);
    return (
      <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:80,display:"block",cursor:"crosshair"}}
        onMouseMove={handleMove} onMouseLeave={()=>setActive(null)}
        onTouchMove={handleMove} onTouchEnd={()=>setTimeout(()=>setActive(null),1500)}>
        {points.map((p,i)=>(
          <rect key={i} x={sx(i)-bw/2} y={sy(p.y)} width={bw} height={H-P-sy(p.y)}
            fill={color} opacity={active===i?1:0.75} rx={3}/>
        ))}
        {tip && (
          <g>
            <rect x={Math.min(tipX-28, W-60)} y={tipY-30} width={58} height={22} rx={5} fill="rgba(0,0,0,0.75)"/>
            <text x={Math.min(tipX, W-31)} y={tipY-15} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="700">{(+tip.y).toFixed(2)}{unit||""}</text>
            <text x={Math.min(tipX, W-31)} y={tipY-5}  textAnchor="middle" fill="#aaa" fontSize={8}>{tip.x}</text>
          </g>
        )}
      </svg>
    );
  }

  const d    = points.map((p,i)=>(i===0?"M":"L")+sx(i)+","+sy(p.y)).join(" ");
  const area = d+" L"+sx(points.length-1)+","+(H-P)+" L"+P+","+(H-P)+" Z";
  const gid  = "sp"+color.replace("#","");
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
          stroke={active===i?"#fff":"none"} strokeWidth={1.5} style={{transition:"r .1s"}}/>
      ))}
      {tip && active !== null && (
        <g>
          <line x1={tipX} y1={tipY+6} x2={tipX} y2={H-P} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5}/>
          <rect x={Math.min(Math.max(tipX-32,0), W-66)} y={tipY-34} width={64} height={26} rx={6} fill="rgba(0,0,0,0.8)"/>
          <text x={Math.min(Math.max(tipX,32), W-34)} y={tipY-18} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">{(+tip.y).toFixed(tip.y>10?1:3)}{unit||""}</text>
          <text x={Math.min(Math.max(tipX,32), W-34)} y={tipY-7}  textAnchor="middle" fill="#aaaacc" fontSize={8}>{tip.x}</text>
        </g>
      )}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, type, unit, T }) {
  const pts = data.filter(d=>d[dk]!=null).map(d=>({x:d.date,y:d[dk]}));
  if (pts.length < 2) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:T.mt,letterSpacing:1,marginBottom:6}}>{title}</div>
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

function Modal({ title, onClose, T, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.sf,borderRadius:"22px 22px 0 0",padding:"20px 20px 32px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",border:"1px solid "+T.br}}>
        <div style={{width:36,height:4,background:T.br,borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontWeight:700,fontSize:16,color:T.tx,letterSpacing:"-0.3px"}}>{title}</span>
          <button onClick={onClose} style={{background:T.br,border:"none",color:T.mt,width:28,height:28,borderRadius:"50%",fontSize:14,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StationModal({ current, onSelect, onClose, T }) {
  const [custom, setCustom] = useState(current.stId==="other" ? current.stLabel : "");
  return (
    <Modal title="🏪 Επιλογή Πρατηρίου" onClose={onClose} T={T}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {STATIONS.map(s=>(
          <button key={s.id} onClick={()=>{ s.id!=="other" ? onSelect(s.id,s.label) : onSelect("other",custom||"Άλλο"); }}
            style={{padding:"10px 8px",border:"2px solid "+(current.stId===s.id?s.bg:T.br),borderRadius:10,
              background:current.stId===s.id?s.bg:"transparent",color:current.stId===s.id?s.fg:T.tx,
              fontSize:13,fontWeight:current.stId===s.id?700:400,cursor:"pointer"}}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:T.mt,letterSpacing:1,marginBottom:4}}>Ή γράψε το όνομα</label>
        <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="π.χ. Μαμούθ Βενζινάδικο..."
          style={{width:"100%",padding:"10px 12px",background:T.inp,border:"1px solid "+T.ib,borderRadius:10,color:T.tx,fontSize:14,boxSizing:"border-box"}}/>
      </div>
      {custom.trim() && (
        <button onClick={()=>onSelect("other",custom.trim())}
          style={{width:"100%",padding:11,background:T.bg,border:"1px solid "+T.br,borderRadius:10,color:T.tx,fontSize:14,cursor:"pointer",marginBottom:8}}>
          ✓ Χρήση: "{custom.trim()}"
        </button>
      )}
    </Modal>
  );
}

function FtBadge({ ftId, size }) {
  const ft = FTYPES.find(f=>f.id===ftId);
  const fc = FT_COLORS[ftId]||{};
  if (!ft) return null;
  return (
    <span style={{fontSize:size||11,background:fc.bg,color:fc.color,padding:"2px 8px",borderRadius:6,fontWeight:700,whiteSpace:"nowrap"}}>
      {ft.icon} {ft.label}
    </span>
  );
}

function VehicleInfoModal({ av, onClose, onUpdate, onDelete, onAddReminder, onUpdateReminder, onDelReminder, T, dl }) {
  const upI = (f,v) => onUpdate({ info:{ ...av.info, [f]:v } });
  const upV = (f,v) => onUpdate({ [f]:v });
  const lS  = { display:"block", fontSize:11, color:T.mt, letterSpacing:1, marginBottom:4 };
  const iS  = { width:"100%", padding:"9px 11px", background:T.inp, border:"1px solid "+T.ib, borderRadius:9, color:T.tx, fontSize:13, boxSizing:"border-box" };
  const rst = r => {
    if (!r.dueDate) return null;
    const d = ddiff(r.dueDate);
    if (d<0)   return { c:"#ef4444", l:"Εκπρόθεσμο "+Math.abs(d)+" μ." };
    if (d<=30) return { c:"#f97316", l:"Σε "+d+" μέρες" };
    return { c:"#10b981", l:"Σε "+d+" μέρες" };
  };
  return (
    <Modal title={av.icon+" "+av.name} onClose={onClose} T={T}>
      <div style={{marginBottom:14}}>
        <label style={lS}>ΤΥΠΟΣ ΟΧΗΜΑΤΟΣ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {VCATS.map(c=>(
            <button key={c.id} onClick={()=>{upV("category",c.id);upV("icon",c.icons[0]);}}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(av.category===c.id?T.tx:T.br),
                background:av.category===c.id?T.tx+"22":"transparent",color:av.category===c.id?T.tx:T.mt,fontSize:12,cursor:"pointer"}}>
              {c.icons[0]} {c.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {(VCATS.find(c=>c.id===av.category)?.icons||["🚗"]).map(ic=>(
            <button key={ic} onClick={()=>upV("icon",ic)}
              style={{fontSize:22,padding:"6px 10px",border:"2px solid "+(av.icon===ic?T.tx:T.br),borderRadius:9,background:"transparent",cursor:"pointer"}}>{ic}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lS}>ΟΝΟΜΑ</label>
        <input value={av.name} onChange={e=>upV("name",e.target.value)} style={iS}/>
      </div>
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
      <div style={{borderTop:"1px solid "+T.br,paddingTop:16}}>
        <div style={{fontSize:12,color:T.mt,letterSpacing:1,marginBottom:10}}>ΥΠΕΝΘΥΜΙΣΕΙΣ</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
          {RTYPES.map(rt=>(
            <button key={rt.id} onClick={()=>onAddReminder(rt.id)}
              style={{padding:"8px 10px",border:"1px solid "+T.br,borderRadius:9,background:T.bg,color:T.tx,fontSize:11,textAlign:"left",cursor:"pointer"}}>
              {rt.icon} {rt.label}
            </button>
          ))}
        </div>
        {(av.reminders||[]).length===0 && <div style={{fontSize:12,color:T.ft,textAlign:"center",padding:10}}>Δεν υπάρχουν υπενθυμίσεις.</div>}
        {(av.reminders||[]).map(r=>{
          const rs=rst(r), rt=RTYPES.find(x=>x.id===r.type);
          return (
            <div key={r.id} style={{background:T.bg,borderRadius:11,padding:11,marginBottom:9,border:"1px solid "+(rs?rs.c+"44":T.br)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:13}}>{r.icon} {r.label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {rs&&<span style={{fontSize:11,color:rs.c,fontWeight:700}}>{rs.l}</span>}
                  <button onClick={()=>onDelReminder(r.id)} style={{background:"none",border:"none",color:T.ft,fontSize:16,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:rt?.hasDate&&rt?.hasKm?"1fr 1fr":"1fr",gap:8,marginBottom:6}}>
                {rt?.hasDate&&(<div><label style={{display:"block",fontSize:11,color:T.mt,marginBottom:2}}>Ημ/νία λήξης</label><input type="date" value={r.dueDate||""} onChange={e=>onUpdateReminder(r.id,"dueDate",e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/></div>)}
                {rt?.hasKm&&(<div><label style={{display:"block",fontSize:11,color:T.mt,marginBottom:2}}>Σε {dl}</label><input type="number" placeholder="π.χ. 40000" value={r.dueKm||""} onChange={e=>onUpdateReminder(r.id,"dueKm",e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/></div>)}
              </div>
              <input placeholder="Σημειώσεις..." value={r.notes||""} onChange={e=>onUpdateReminder(r.id,"notes",e.target.value)}
                style={{width:"100%",padding:"7px 9px",background:T.inp,border:"1px solid "+T.ib,borderRadius:8,color:T.tx,fontSize:12,boxSizing:"border-box"}}/>
            </div>
          );
        })}
      </div>
      <div style={{borderTop:"1px solid "+T.br,paddingTop:14,marginTop:6}}>
        <button onClick={()=>{ if(window.confirm("Διαγραφή οχήματος και όλων των δεδομένων του;")) onDelete(); }}
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
  const [tab, setTab]             = useState("home");
  const [modal, setModal]         = useState(null);
  const [newV, setNewV]           = useState({ name:"", icon:"🚗", category:"car" });
  const [fY, setFY]               = useState("all");
  const [fM, setFM]               = useState("all");
  const [lastFuel, setLastFuel]   = useState({});
  const [showStPicker, setShowStPicker] = useState(false);
  const [showFtPicker, setShowFtPicker] = useState(false);
  const [editEntry, setEditEntry]       = useState(null);
  const [editExpense, setEditExpense]   = useState(null);
  const [filterStation, setFilterStation] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showFilters, setShowFilters] = useState(false);
  const fref = useRef();

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

  const av  = vehicles.find(v=>v.id===vid)||vehicles[0];
  const col = av?.color||"#3b82f6";
  const mi  = av?.unitMiles||false;
  const dl  = mi ? "μίλια" : "km";
  const lf  = lastFuel[vid]||{ fuelType:"unleaded95", stId:"", stLabel:"" };

  const [fuelForm,    setFuelForm]    = useState(()=>emptyFuel(lf.fuelType,lf.stId,lf.stLabel));
  const [expenseForm, setExpenseForm] = useState(emptyExpense);

  const switchVehicle = id => {
    setVid(id);
    const lf2 = lastFuel[id]||{ fuelType:"unleaded95", stId:"", stLabel:"" };
    setFuelForm(emptyFuel(lf2.fuelType,lf2.stId,lf2.stLabel));
  };

  const allFuel    = useMemo(()=>(entries[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[entries,vid]);
  const allExpense = useMemo(()=>(expenses[vid]||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[expenses,vid]);
  const years      = useMemo(()=>[...new Set(allFuel.map(e=>e.date.slice(0,4)))].sort().reverse(),[allFuel]);

  const filtFuel = useMemo(()=>{
    let f=allFuel;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    if(filterStation!=="all") f=f.filter(e=>e.station===filterStation);
    if(dateRange.from) f=f.filter(e=>e.date>=dateRange.from);
    if(dateRange.to) f=f.filter(e=>e.date<=dateRange.to);
    return f;
  },[allFuel,fY,fM,filterStation,dateRange]);

  const filtExp = useMemo(()=>{
    let f=allExpense;
    if(fY!=="all") f=f.filter(e=>e.date.startsWith(fY));
    if(fM!=="all") f=f.filter(e=>e.date.slice(5,7)===fM);
    if(dateRange.from) f=f.filter(e=>e.date>=dateRange.from);
    if(dateRange.to) f=f.filter(e=>e.date<=dateRange.to);
    return f;
  },[allExpense,fY,fM,dateRange]);

  const dueR = useMemo(()=>(av?.reminders||[]).filter(r=>r.dueDate&&ddiff(r.dueDate)<=30),[av]);

  const lastOdo = useMemo(() => {
    if (!allFuel.length) return null;
    const withOdo = allFuel.filter(e => e.odo);
    if (!withOdo.length) return null;
    return withOdo[withOdo.length - 1].odo;
  }, [allFuel]);

  const uniqueStations = useMemo(() => {
    const stations = new Set();
    allFuel.forEach(f => { if (f.station) stations.add(f.station); });
    return ["all", ...Array.from(stations).sort()];
  }, [allFuel]);

  const hff = (field, val) => {
    const u = { ...fuelForm, [field]: val };
    if (field === "liters" && u.ppl) u.total = (parseFloat(val || 0) * parseFloat(u.ppl)).toFixed(2);
    if (field === "ppl" && u.liters) u.total = (parseFloat(u.liters) * parseFloat(val || 0)).toFixed(2);
    if (field === "total" && u.ppl && +u.ppl) u.liters = (parseFloat(val || 0) / parseFloat(u.ppl)).toFixed(2);
    if (field === "total" && u.liters && +u.liters && !(u.ppl && +u.ppl)) 
      u.ppl = (parseFloat(val || 0) / parseFloat(u.liters)).toFixed(3);
    if (field === "lpgL" && u.lpgP) u.lpgT = (parseFloat(val || 0) * parseFloat(u.lpgP)).toFixed(2);
    if (field === "lpgP" && u.lpgL) u.lpgT = (parseFloat(u.lpgL) * parseFloat(val || 0)).toFixed(2);
    if (field === "lpgT" && u.lpgL && +u.lpgL) u.lpgP = (parseFloat(val || 0) / parseFloat(u.lpgL)).toFixed(3);
    if (field === "odo" && lastOdo && +val > lastOdo) {
      const autoKm = (parseFloat(val) - lastOdo).toFixed(0);
      if (!u.km || u.km === "" || u.km === "0") {
        u.km = autoKm;
      }
    }
    setFuelForm(u);
  };

  const submitFuel = () => {
    if (!fuelForm.date||(!fuelForm.liters&&!fuelForm.total)) return;
    const liters=parseFloat(fuelForm.liters)||null, total=parseFloat(fuelForm.total)||null;
    const ppl=parseFloat(fuelForm.ppl)||(liters&&total?total/liters:null);
    const kmS=parseFloat(fuelForm.km)||null;
    setEntries(p=>({...p,[vid]:[...(p[vid]||[]),{
      id:uid(),date:fuelForm.date,fuelType:fuelForm.fuelType,liters,ppl,total,
      km:kmS,odo:parseFloat(fuelForm.odo)||null,notes:fuelForm.notes,
      stId:fuelForm.stId,station:fuelForm.stLabel,dual:fuelForm.dual,
      lpgL:parseFloat(fuelForm.lpgL)||null,lpgP:parseFloat(fuelForm.lpgP)||null,lpgT:parseFloat(fuelForm.lpgT)||null,
    }]}));
    setLastFuel(p=>({...p,[vid]:{fuelType:fuelForm.fuelType,stId:fuelForm.stId,stLabel:fuelForm.stLabel}}));
    setFuelForm(emptyFuel(fuelForm.fuelType,fuelForm.stId,fuelForm.stLabel));
    setTab("history");
  };

  const submitExpense = () => {
    if (!expenseForm.date||!expenseForm.amount) return;
    const cat=EXPENSE_CATS.find(c=>c.id===expenseForm.catId);
    let label=cat?.label||"";
    if (expenseForm.catId==="custom") {
      label = expenseForm.customCat?.trim() || "Άλλο";
    }
    setExpenses(p=>({...p,[vid]:[...(p[vid]||[]),{
      id:uid(),date:expenseForm.date,catId:expenseForm.catId,label,
      amount:parseFloat(expenseForm.amount)||0,notes:expenseForm.notes,
      customCat: expenseForm.catId==="custom" ? label : undefined
    }]}));
    setExpenseForm(emptyExpense());
  };

  const delFuel    = id => setEntries(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));
  const saveEdit   = (id, data) => {
    setEntries(p=>({...p,[vid]:p[vid].map(e=>e.id===id?{...e,...data}:e)}));
    setEditEntry(null);
  };
  const delExpense = id => setExpenses(p=>({...p,[vid]:p[vid].filter(e=>e.id!==id)}));
  const saveExpenseEdit = (id, data) => {
    setExpenses(p=>({...p,[vid]:p[vid].map(e=>e.id===id?{...e,...data}:e)}));
    setEditExpense(null);
  };

  const addVeh = () => {
    if (!newV.name.trim()) return;
    const v={id:uid(),name:newV.name.trim(),icon:newV.icon,color:FUEL_COLORS[vehicles.length%FUEL_COLORS.length],
      category:newV.category,
      info:{plate:"",chassis:"",brand:"",model:"",year:"",fuelType:"unleaded95",insurance:"",insuranceNo:"",notes:""},
      reminders:[],unitMiles:false};
    setVehicles(p=>[...p,v]);
    switchVehicle(v.id);
    setNewV({name:"",icon:"🚗",category:"car"});
    setModal(null);
  };

  const updateVehicle = fields => setVehicles(p=>p.map(x=>x.id===vid?{...x,...fields}:x));
  const upV = (f,v) => setVehicles(p=>p.map(x=>x.id===vid?{...x,[f]:v}:x));

  const deleteVehicle = () => {
    const remaining=vehicles.filter(v=>v.id!==vid);
    if (!remaining.length) return;
    setVehicles(remaining);
    setEntries(p=>Object.fromEntries(Object.entries(p).filter(([k])=>k!==vid)));
    setExpenses(p=>Object.fromEntries(Object.entries(p).filter(([k])=>k!==vid)));
    switchVehicle(remaining[0].id);
    setModal(null);
  };

  const addR = type=>{
    const rt=RTYPES.find(r=>r.id===type);
    setVehicles(p=>p.map(v=>v.id===vid?{...v,reminders:[...(v.reminders||[]),{id:uid(),type,label:rt.label,icon:rt.icon,dueDate:"",dueKm:"",notes:""}]}:v));
  };
  const upR  = (rid,f,v)=>setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.map(r=>r.id===rid?{...r,[f]:v}:r)}:x));
  const delR = rid=>setVehicles(p=>p.map(x=>x.id===vid?{...x,reminders:x.reminders.filter(r=>r.id!==rid)}:x));

  const stats = useMemo(()=>{
    if (!filtFuel.length&&!filtExp.length) return null;
    const fuelSpent=filtFuel.reduce((s,x)=>s+(x.total||0),0)+filtFuel.reduce((s,x)=>s+(x.lpgT||0),0);
    const expSpent=filtExp.reduce((s,x)=>s+x.amount,0);
    const tL=filtFuel.reduce((s,x)=>s+(x.liters||0),0);
    const wK=filtFuel.filter(x=>x.km&&x.liters), wP=filtFuel.filter(x=>x.ppl);
    const aC=wK.length?wK.reduce((s,x)=>s+(x.liters/x.km*100),0)/wK.length:null;
    const aP=wP.length?wP.reduce((s,x)=>s+x.ppl,0)/wP.length:null;
    const pr=wP.map(x=>x.ppl);
    const sc={};
    filtFuel.forEach(x=>{if(x.station) sc[x.station]=(sc[x.station]||0)+1;});
    const tSt=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const dE=filtFuel.filter(x=>x.dual&&x.lpgL&&x.km);
    const aLC=dE.length?dE.reduce((s,x)=>s+(x.lpgL/x.km*100),0)/dE.length:null;
    return{fuelSpent,expSpent,totalSpent:fuelSpent+expSpent,tL,aC,aP,
      minP:pr.length?Math.min(...pr):null,maxP:pr.length?Math.max(...pr):null,tSt,aLC};
  },[filtFuel,filtExp]);

  const cd = useMemo(()=>filtFuel.map(x=>({
    date:x.date.slice(5),
    price:x.ppl?+(+x.ppl).toFixed(3):null,
    cons:x.km&&x.liters?+(x.liters/x.km*100).toFixed(1):null,
    cost:x.total?+(+x.total).toFixed(2):null,
    lpgC:x.dual&&x.lpgL&&x.km?+(x.lpgL/x.km*100).toFixed(1):null,
  })),[filtFuel]);

  const loadDemo = () => {
    const demoFuel=[
      {id:uid(),date:"2025-09-05",fuelType:"unleaded95",liters:42,ppl:1.789,total:75.14,km:480,odo:51200,notes:"Πλήρες",stId:"shell",station:"Shell"},
      {id:uid(),date:"2025-10-08",fuelType:"unleaded98",liters:40,ppl:1.949,total:77.96,km:460,odo:52090,notes:"Αυτοκινητόδρομος",stId:"eko",station:"ΕΚΟ"},
      {id:uid(),date:"2025-11-14",fuelType:"unleaded95",liters:38,ppl:1.829,total:69.50,km:430,odo:52975,notes:"",stId:"avin",station:"Avin"},
      {id:uid(),date:"2025-12-20",fuelType:"diesel",liters:50,ppl:1.699,total:84.95,km:510,odo:54000,notes:"",stId:"bp",station:"BP"},
      {id:uid(),date:"2026-01-15",fuelType:"unleaded95",liters:40,ppl:1.849,total:73.96,km:450,odo:55035,notes:"",stId:"avin",station:"Avin"},
      {id:uid(),date:"2026-02-10",fuelType:"unleaded95",liters:41,ppl:1.869,total:76.63,km:470,odo:56200,notes:"",stId:"shell",station:"Shell"},
    ];
    setEntries(p=>({...p,[vid]:demoFuel}));
    setTab("stats");
  };

  const exJson = () => {
    const blob=new Blob([JSON.stringify({vehicles,entries,expenses,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="fuellog_backup_"+today()+".json"; a.click();
  };
  const exCsv = () => {
    const rows=allFuel.map(x=>[x.date,FTYPES.find(f=>f.id===x.fuelType)?.label||x.fuelType,
      x.liters||"",x.ppl?fmt(x.ppl,3):"",x.total?fmt(x.total):"",
      x.km?fmt(x.km,1):"",x.odo||"",x.km&&x.liters?fmt(x.liters/x.km*100,1):"",
      x.station||"",x.notes||""].map(v=>'"'+v+'"').join(","));
    if (!rows.length) return;
    const blob=new Blob([["Ημ/νία,Καύσιμο,Λίτρα,Τιμή/L,Σύνολο,km,Odo,L/100,Πρατήριο,Σημ."].concat(rows).join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="fuellog_"+today()+".csv"; a.click();
  };
  const imJson = ev => {
    const file=ev.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=e=>{ try {
      const d=JSON.parse(e.target.result);
      if(d.vehicles&&d.entries){setVehicles(d.vehicles);setEntries(d.entries);setExpenses(d.expenses||{});switchVehicle(d.vehicles[0]?.id);alert("✅ Εισαγωγή OK");}
      else alert("❌ Μη έγκυρο αρχείο.");
    } catch(err){alert("❌ Σφάλμα.");} };
    r.readAsText(file); ev.target.value="";
  };

  const exportToPDF = () => {
    alert("Για PDF export χρειάζεται η βιβλιοθήκη html2pdf.js\nΠρόσθεσε: <script src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'></script>\nΣτη συνέχεια θα δουλέψει!");
  };

  const iS  = on => ({width:"100%",padding:"12px 14px",background:T.inp,border:"1.5px solid "+(on?col+"cc":T.ib),borderRadius:12,color:T.tx,fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit"});
  const lS  = {display:"block",fontSize:11,color:T.mt,letterSpacing:"0.08em",marginBottom:5,fontWeight:600};
  const curSt=STATIONS.find(s=>s.id===fuelForm.stId);
  const prevCons=(fuelForm.km&&fuelForm.liters)?(parseFloat(fuelForm.liters)/parseFloat(fuelForm.km)*100).toFixed(1):null;
  const showPrev=!!(fuelForm.liters||fuelForm.ppl||fuelForm.total||fuelForm.km);

  const TABS = [
    {id:"home",    label:"🏠 Αρχική",   color:"#f97316"},
    {id:"add",     label:"⛽ Καύσιμα",   color:"#3b82f6"},
    {id:"expenses",label:"💸 Έξοδα",    color:"#10b981"},
    {id:"stats",   label:"📊 Στατιστικά",color:"#8b5cf6"},
    {id:"history", label:"📋 Ιστορικό",  color:"#f97316"},
  ];

  const FilterBar = () => (
    <div style={{marginBottom: 14}}>
      <div style={{display: "flex", gap: 8, marginBottom: 8}}>
        <select value={fY} onChange={e => setFY(e.target.value)} style={{padding: "8px 10px", background: T.inp, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.tx, fontSize: 13, flex: 1}}>
          <option value="all">Όλα τα χρόνια</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={fM} onChange={e => setFM(e.target.value)} style={{padding: "8px 10px", background: T.inp, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.tx, fontSize: 13, flex: 1}}>
          <option value="all">Όλοι οι μήνες</option>
          {MONTHS.map((m, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)} style={{padding: "8px 10px", background: T.bg, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.mt, fontSize: 13, cursor: "pointer"}}>
          {showFilters ? "▲" : "▼"} Φίλτρα
        </button>
      </div>
      {showFilters && (
        <div style={{background: T.bg, borderRadius: 12, padding: 12, border: "1px solid " + T.br, marginBottom: 8}}>
          {tab === "history" && (
            <div style={{marginBottom: 12}}>
              <label style={{...lS, fontSize: 10}}>ΠΡΑΤΗΡΙΟ</label>
              <select value={filterStation} onChange={e => setFilterStation(e.target.value)} style={{width: "100%", padding: "8px 10px", background: T.inp, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.tx, fontSize: 12}}>
                {uniqueStations.map(s => <option key={s} value={s}>{s === "all" ? "Όλα τα πρατήρια" : s}</option>)}
              </select>
            </div>
          )}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
            <div>
              <label style={{...lS, fontSize: 10}}>ΑΠΟ</label>
              <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} style={{width: "100%", padding: "8px 10px", background: T.inp, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.tx, fontSize: 12}}/>
            </div>
            <div>
              <label style={{...lS, fontSize: 10}}>ΕΩΣ</label>
              <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} style={{width: "100%", padding: "8px 10px", background: T.inp, border: "1.5px solid " + T.ib, borderRadius: 10, color: T.tx, fontSize: 12}}/>
            </div>
          </div>
          {(filterStation !== "all" || dateRange.from || dateRange.to) && (
            <button onClick={() => { setFilterStation("all"); setDateRange({ from: "", to: "" }); }} style={{marginTop: 10, fontSize: 11, color: T.mt, background: "none", border: "none", cursor: "pointer", textDecoration: "underline"}}>
              🗑️ Καθαρισμός φίλτρων
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter','SF Pro Display','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:T.bg,color:T.tx,maxWidth:480,margin:"0 auto"}}>

      <div style={{background:T.sf,borderBottom:"1px solid "+T.br,padding:"16px 16px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f97316,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⛽</div>
            <div><div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.5px",color:T.tx}}>FuelLog</div></div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {dueR.length>0 && (
              <button onClick={()=>setModal("vi")} style={{padding:"7px 10px",background:"#ef444422",border:"1px solid #ef444444",borderRadius:9,color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔔{dueR.length}</button>
            )}
            <button onClick={()=>setModal("vi")} style={{width:34,height:34,borderRadius:9,background:col+"22",border:"1px solid "+col+"44",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>📋</button>
            <button onClick={()=>setModal("bk")} style={{width:34,height:34,borderRadius:9,background:"#10b98122",border:"1px solid #10b98144",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>☁️</button>
            <button onClick={()=>setDark(!dark)} style={{width:34,height:34,borderRadius:9,background:T.bg,border:"1px solid "+T.br,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
          </div>
        </div>

        <div style={{display:"flex",gap:3,overflowX:"auto",marginBottom:12}}>
          {vehicles.map(v=>(
            <button key={v.id} onClick={()=>switchVehicle(v.id)} style={{
              padding:"6px 12px",borderRadius:8,border:"none",
              background:vid===v.id?v.color:"transparent",color:vid===v.id?"#fff":T.mt,
              fontWeight:vid===v.id?700:400,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",transition:"all .15s",
              fontFamily:"inherit",
            }}>{v.icon} {v.name}</button>
          ))}
          <button onClick={()=>setModal("av")} style={{padding:"6px 10px",background:"transparent",border:"1px dashed "+T.br,borderRadius:8,color:T.mt,fontSize:16,cursor:"pointer"}}>+</button>
        </div>

        <div style={{display:"flex",gap:4,marginBottom:-1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"9px 4px",border:"none",borderRadius:"10px 10px 0 0",
              background:tab===t.id?t.color:"transparent",
              color:tab===t.id?"#fff":T.mt,
              fontWeight:tab===t.id?700:400,fontSize:10,cursor:"pointer",
              transition:"all .15s",fontFamily:"inherit",letterSpacing:"0.02em",
              borderBottom:tab===t.id?"none":"1px solid "+T.br,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{background:T.sf,padding:"18px 16px 100px",minHeight:"70vh"}}>

        {tab === "home" && (
          <div>
            <div style={{marginBottom: 20}}>
              <div style={{fontSize: 24, fontWeight: 800, color: T.tx, marginBottom: 4}}>
                Γεια σου, {av.name} {av.icon}
              </div>
              <div style={{fontSize: 13, color: T.mt}}>
                {new Date().toLocaleDateString('el-GR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20}}>
              <button onClick={() => setTab("add")} style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                border: "none", borderRadius: 14, padding: "14px",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer"
              }}>
                ⛽ Νέο Γέμισμα
              </button>
              <button onClick={() => setTab("expenses")} style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none", borderRadius: 14, padding: "14px",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer"
              }}>
                💸 Νέο Έξοδο
              </button>
            </div>

            {allFuel.length === 0 && (
              <div style={{textAlign: "center", padding: 40, color: T.mt}}>
                <div style={{fontSize: 48, marginBottom: 12}}>📭</div>
                <div>Δεν υπάρχουν δεδομένα ακόμα</div>
                <button onClick={loadDemo} style={{marginTop: 16, padding: "10px 20px", background: col, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer"}}>
                  🚀 Φόρτωση Demo
                </button>
              </div>
            )}

            {allFuel.length > 0 && (() => {
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              const lastMonthExpenses = allExpense.filter(e => e.date >= lastMonth.toISOString().split("T")[0]).reduce((s, e) => s + e.amount, 0);
              const lastMonthFuel = allFuel.filter(e => e.date >= lastMonth.toISOString().split("T")[0]).reduce((s, e) => s + (e.total || 0), 0);
              const avgCons = allFuel.filter(f => f.km && f.liters).reduce((s, f, i, arr) => s + (f.liters / f.km * 100), 0) / (allFuel.filter(f => f.km && f.liters).length || 1);
              const last = allFuel[allFuel.length - 1];
              const ft = FTYPES.find(f => f.id === last.fuelType);
              return (
                <>
                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20}}>
                    <div style={{background: T.bg, borderRadius: 14, padding: 12, border: "1px solid " + T.br}}>
                      <div style={{fontSize: 11, color: T.mt, marginBottom: 4}}>💰 ΜΗΝΙΑΙΑ ΕΞΟΔΑ</div>
                      <div style={{fontSize: 22, fontWeight: 800, color: "#ef4444"}}>€{fmt(lastMonthFuel + lastMonthExpenses)}</div>
                      <div style={{fontSize: 10, color: T.mt}}>καύσιμα: €{fmt(lastMonthFuel)} | έξοδα: €{fmt(lastMonthExpenses)}</div>
                    </div>
                    <div style={{background: T.bg, borderRadius: 14, padding: 12, border: "1px solid " + T.br}}>
                      <div style={{fontSize: 11, color: T.mt, marginBottom: 4}}>⛽ ΜΕΣΗ ΚΑΤΑΝΑΛΩΣΗ</div>
                      <div style={{fontSize: 22, fontWeight: 800, color: "#10b981"}}>{fmt(avgCons, 1)} L/100km</div>
                      <div style={{fontSize: 10, color: T.mt}}>από {allFuel.filter(f => f.km && f.liters).length} γεμίσματα</div>
                    </div>
                  </div>

                  <div style={{background: T.bg, borderRadius: 14, padding: 14, border: "1px solid " + T.br, marginBottom: 20}}>
                    <div style={{fontSize: 12, color: T.mt, marginBottom: 8, display: "flex", justifyContent: "space-between"}}>
                      <span>🕒 ΤΕΛΕΥΤΑΙΟ ΓΕΜΙΣΜΑ</span>
                      <span style={{fontSize: 11}}>{last.date}</span>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <div>
                        <div style={{fontSize: 24, fontWeight: 800, color: col}}>{fmt(last.liters, 1)} L</div>
                        <div style={{fontSize: 12, color: T.mt}}>{ft?.icon} {ft?.label}</div>
                      </div>
                      <div style={{textAlign: "right"}}>
                        <div style={{fontSize: 18, fontWeight: 700}}>€{fmt(last.total)}</div>
                        <div style={{fontSize: 11, color: T.mt}}>{fmt(last.ppl, 3)} €/L</div>
                      </div>
                    </div>
                    {last.km && <div style={{marginTop: 8, fontSize: 11, color: T.mt}}>📍 {last.km} {dl} · {fmt(last.liters / last.km * 100, 1)} L/100km</div>}
                  </div>
                </>
              );
            })()}

            {dueR.length > 0 && (
              <div style={{background: "#ef444422", borderRadius: 14, padding: 14, border: "1px solid #ef444444", marginBottom: 20}}>
                <div style={{fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 10, display: "flex", alignItems: "center", gap: 6}}>
                  🔔 {dueR.length} ΕΠΕΡΧΟΜΕΝΕΣ ΥΠΕΝΘΥΜΙΣΕΙΣ
                </div>
                {dueR.slice(0, 3).map(r => {
                  const days = ddiff(r.dueDate);
                  return (
                    <div key={r.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12}}>
                      <span>{r.icon} {r.label}</span>
                      <span style={{color: days <= 7 ? "#ef4444" : "#f97316", fontWeight: 700}}>{days} μέρες</span>
                    </div>
                  );
                })}
                {dueR.length > 3 && <div style={{fontSize: 11, color: T.mt, textAlign: "center", marginTop: 6}}>+{dueR.length - 3} ακόμα</div>}
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {showPrev && (
              <div style={{background:"linear-gradient(135deg,"+col+"33,"+col+"08)",border:"1.5px solid "+col+"55",borderRadius:16,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:11,color:T.mt,letterSpacing:"0.08em",fontWeight:600}}>ΠΡΟΕΠΙΣΚΟΠΗΣΗ</span>
                  <FtBadge ftId={fuelForm.fuelType} size={12}/>
                </div>
                <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
                  {fuelForm.liters && <div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΛΙΤΡΑ</div><div style={{fontSize:20,fontWeight:800,color:col}}>{fuelForm.liters}L</div></div>}
                  {fuelForm.ppl    && <div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΤΙΜΗ/L</div><div style={{fontSize:20,fontWeight:800,color:col}}>€{fuelForm.ppl}</div></div>}
                  {fuelForm.total  && <div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΣΥΝΟΛΟ</div><div style={{fontSize:20,fontWeight:800,color:col}}>€{fuelForm.total}</div></div>}
                  {prevCons        && <div><div style={{fontSize:10,color:T.mt,fontWeight:600}}>ΚΑΤΑΝΑΛΩΣΗ</div><div style={{fontSize:20,fontWeight:800,color:"#10b981"}}>{prevCons}L/100</div></div>}
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={fuelForm.date} onChange={e=>hff("date",e.target.value)} style={iS(true)}/></div>
              <div><label style={lS}>ΚΑΥΣΙΜΟ</label><button onClick={()=>setShowFtPicker(true)} style={{...iS(false),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px"}}><FtBadge ftId={fuelForm.fuelType} size={13}/><span style={{color:T.mt,fontSize:11}}>▼</span></button></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΛΙΤΡΑ</label><input type="number" step="any" placeholder="0.00" value={fuelForm.liters} onChange={e=>hff("liters",e.target.value)} style={iS(!!fuelForm.liters)}/></div>
              <div><label style={lS}>ΤΙΜΗ / L</label><input type="number" step="any" placeholder="0.000" value={fuelForm.ppl} onChange={e=>hff("ppl",e.target.value)} style={iS(!!fuelForm.ppl)}/></div>
            </div>
            <div><label style={lS}>ΣΥΝΟΛΙΚΟ ΠΟΣΟ (€)</label><input type="number" step="any" placeholder="0.00" value={fuelForm.total} onChange={e=>hff("total",e.target.value)} style={{...iS(!!fuelForm.total), fontSize:16, fontWeight:600}}/></div>
            {fuelForm.dual && (
              <div style={{background:T.bg,borderRadius:14,padding:14,border:"2px solid #a78bfa44"}}>
                <div style={{fontSize:11,color:"#a78bfa",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>🟣 ΥΓΡΑΕΡΙΟ LPG</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div><label style={lS}>ΛΙΤΡΑ LPG</label><input type="number" step="any" value={fuelForm.lpgL} onChange={e=>hff("lpgL",e.target.value)} style={iS(!!fuelForm.lpgL)}/></div>
                  <div><label style={lS}>ΤΙΜΗ/L €</label><input type="number" step="any" value={fuelForm.lpgP} onChange={e=>hff("lpgP",e.target.value)} style={iS(!!fuelForm.lpgP)}/></div>
                </div>
                <div><label style={lS}>ΣΥΝΟΛΟ LPG €</label><input type="number" step="any" value={fuelForm.lpgT} onChange={e=>hff("lpgT",e.target.value)} style={iS(!!fuelForm.lpgT)}/></div>
              </div>
            )}
            <div><label style={lS}>{dl.toUpperCase()} ΔΙΑΔΡΟΜΗΣ</label><input type="number" placeholder={mi?"π.χ. 280":"π.χ. 450"} value={fuelForm.km} onChange={e=>hff("km",e.target.value)} style={iS(!!fuelForm.km)}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΧΙΛΙΟΜΕΤΡΗΤΗΣ</label><input type="number" placeholder="π.χ. 52300" value={fuelForm.odo} onChange={e=>hff("odo",e.target.value)} style={iS(!!fuelForm.odo)}/></div>
              <div><label style={lS}>ΠΡΑΤΗΡΙΟ</label><button onClick={()=>setShowStPicker(true)} style={{...iS(!!fuelForm.stId),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px"}}>{fuelForm.stLabel ? <span style={{fontWeight:700,background:curSt?curSt.bg:"#555",color:curSt?curSt.fg:"#fff",padding:"2px 10px",borderRadius:6,fontSize:12}}>{fuelForm.stLabel}</span> : <span style={{color:T.ft,fontSize:13}}>Επίλεξε...</span>}<span style={{color:T.mt,fontSize:11}}>▼</span></button></div>
            </div>
            <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input type="text" placeholder="π.χ. Full tank, αυτοκινητόδρομος..." value={fuelForm.notes} onChange={e=>hff("notes",e.target.value)} style={iS(!!fuelForm.notes)}/></div>
            <button onClick={()=>hff("dual",!fuelForm.dual)} style={{padding:"11px 14px",border:"1.5px solid "+(fuelForm.dual?"#a78bfa":T.br),borderRadius:12,background:fuelForm.dual?"#a78bfa22":"transparent",color:fuelForm.dual?"#a78bfa":T.mt,fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit"}}>🔘 Διπλή κατανάλωση (+ LPG){fuelForm.dual&&<span style={{marginLeft:"auto",fontSize:11,background:"#a78bfa",color:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>ON</span>}</button>
            <button onClick={submitFuel} style={{padding:16,background:"linear-gradient(135deg,"+col+","+col+"cc)",color:"#fff",border:"none",borderRadius:14,fontWeight:800,fontSize:15,cursor:"pointer",letterSpacing:"0.05em",fontFamily:"inherit",boxShadow:"0 4px 20px "+col+"55"}}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {tab === "expenses" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm,date:e.target.value})} style={iS(true)}/></div>
              <div><label style={lS}>ΠΟΣΟ €</label><input type="number" step="any" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})} style={iS(!!expenseForm.amount)}/></div>
            </div>
            <div><label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:7}}>
                {EXPENSE_CATS.map(c=>(
                  <button key={c.id} onClick={()=>setExpenseForm({...expenseForm,catId:c.id})} style={{padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(expenseForm.catId===c.id?"#10b981":T.br),background:expenseForm.catId===c.id?"#10b98122":"transparent",color:expenseForm.catId===c.id?"#10b981":T.mt,fontSize:11,cursor:"pointer",textAlign:"center",fontFamily:"inherit"}}><div style={{fontSize:20}}>{c.icon}</div><div style={{fontSize:10,marginTop:3,fontWeight:600}}>{c.label}</div></button>
                ))}
              </div>
            </div>
            {expenseForm.catId==="custom"&&(<div><label style={lS}>ΠΕΡΙΓΡΑΦΗ</label><input placeholder="π.χ. Μπαταρία..." value={expenseForm.customCat||""} onChange={e=>setExpenseForm({...expenseForm,customCat:e.target.value})} style={iS(true)}/></div>)}
            <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input type="text" placeholder="π.χ. Castrol 5W40..." value={expenseForm.notes} onChange={e=>setExpenseForm({...expenseForm,notes:e.target.value})} style={iS(false)}/></div>
            <button onClick={submitExpense} style={{padding:15,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:14,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px #10b98155"}}>ΠΡΟΣΘΗΚΗ ΕΞΟΔΟΥ</button>
            <div style={{marginTop:4}}>
              {allExpense.slice().reverse().map(ex=>{
                const cat=EXPENSE_CATS.find(c=>c.id===ex.catId);
                return (
                  <div key={ex.id} onClick={()=>setEditExpense({...ex})} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 4px",borderBottom:"1px solid "+T.br,cursor:"pointer",borderRadius:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22,width:32,textAlign:"center"}}>{cat?.icon||"💸"}</span>
                      <div><div style={{fontSize:13,fontWeight:700,color:T.tx}}>{ex.label}</div><div style={{fontSize:11,color:T.mt}}>{ex.date}{ex.notes?" · "+ex.notes:""}</div></div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontWeight:800,color:"#ef4444",fontSize:14}}>-€{fmt(ex.amount)}</span>
                      <button onClick={e=>{e.stopPropagation();delExpense(ex.id);}} style={{background:"none",border:"none",color:T.ft,cursor:"pointer",fontSize:18}}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div>
            <FilterBar/>
            {!stats ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div style={{marginBottom:16,fontSize:14}}>Δεν υπάρχουν δεδομένα ακόμα.</div>
                <button onClick={loadDemo} style={{padding:"11px 22px",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🚀 Φόρτωση demo</button>
              </div>
            ) : (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[
                    ["💰","Συνολικά έξοδα", stats.totalSpent?fmt(stats.totalSpent)+"€":"—", GRAD_COLS[0], null],
                    ["⛽","Καύσιμα",         stats.fuelSpent ?fmt(stats.fuelSpent)+"€" :"—", GRAD_COLS[1], "↑"],
                    ["🔥","Μέση κατανάλωση",stats.aC        ?fmt(stats.aC,1)+"L/100"  :"—", GRAD_COLS[2], "↓"],
                    ["📈","Μέση τιμή/L",     stats.aP        ?fmt(stats.aP,3)+"€"      :"—", GRAD_COLS[3], "↑"],
                    ["🔧","Άλλα έξοδα",     stats.expSpent  ?fmt(stats.expSpent)+"€"  :"—", GRAD_COLS[4], null],
                    ["💧","Συνολικά λίτρα",  stats.tL        ?fmt(stats.tL,1)+"L"      :"—", GRAD_COLS[5], "↑"],
                  ].map(([ic,lb,val,gc,trend])=>(
                    <div key={lb} style={{borderRadius:16,padding:14,position:"relative",overflow:"hidden",background:"linear-gradient(135deg,"+gc+"33,"+gc+"08)",border:"1.5px solid "+gc+"44",boxShadow:"0 2px 16px "+gc+"18"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                      <div style={{fontSize:18,fontWeight:800,color:gc,letterSpacing:"-0.5px"}}>{val}</div>
                      <div style={{fontSize:11,color:T.mt,marginTop:3,fontWeight:500}}>{lb}</div>
                      {trend&&<div style={{position:"absolute",top:10,right:10,fontSize:13,fontWeight:800,color:trend==="↑"?"#ef4444":"#10b981",background:(trend==="↑"?"#ef4444":"#10b981")+"22",borderRadius:6,padding:"2px 6px"}}>{trend}</div>}
                    </div>
                  ))}
                </div>
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
                <ChartBlock title="ΤΙΜΗ €/L" data={cd} dk="price" color={col} type="line" unit="€" T={T}/>
                <ChartBlock title="ΕΞΟΔΑ/ΓΕΜΙΣΜΑ" data={cd} dk="cost" color={col} type="bar" unit="€" T={T}/>
                {(stats.aC!=null||stats.aP!=null)&&(
                  <div style={{background:T.bg,borderRadius:14,padding:"14px 8px 8px",border:"1px solid "+T.br,marginBottom:14}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:"0.08em",fontWeight:700,marginBottom:8,paddingLeft:6}}>ΚΟΝΤΕΡ</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {stats.aC!=null&&<Gauge value={stats.aC} min={4} max={20} color="#10b981" label="ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T}/>}
                      {stats.aP!=null&&<Gauge value={stats.aP} min={1.4} max={2.4} color={col} label="ΜΕΣΗ ΤΙΜΗ/L" unit="€/L" T={T}/>}
                    </div>
                  </div>
                )}
                <ChartBlock title="ΚΑΤΑΝΑΛΩΣΗ" data={cd} dk="cons" color="#10b981" type="line" unit="L/100" T={T}/>
                <ChartBlock title="LPG L/100" data={cd} dk="lpgC" color="#a78bfa" type="line" unit="L/100" T={T}/>
                {stats.expSpent>0&&filtExp.length>0&&(
                  <div onClick={()=>setTab("expenses")} style={{cursor:"pointer",marginTop:6}}>
                    <div style={{fontSize:11,color:T.mt,letterSpacing:"0.08em",fontWeight:700,marginBottom:8}}>ΑΝΑΛΥΣΗ ΕΞΟΔΩΝ (πάτα για λεπτομέρειες)</div>
                    <div style={{background:T.bg,borderRadius:14,padding:14,border:"1px solid "+T.br}}>
                      {Object.entries(filtExp.reduce((acc,x)=>{acc[x.label]=(acc[x.label]||0)+x.amount;return acc;},{})).sort((a,b)=>b[1]-a[1]).map(([label,amount])=>{
                        const pct=amount/stats.expSpent*100;
                        const cat=EXPENSE_CATS.find(c=>c.label===label);
                        return(
                          <div key={label} style={{marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:12,color:T.tx,fontWeight:500}}>{cat?.icon||"💸"} {label}</span>
                              <span style={{fontSize:12,fontWeight:700,color:"#10b981"}}>{fmt(amount)}€</span>
                            </div>
                            <div style={{background:T.br,borderRadius:6,height:6}}><div style={{background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:6,height:6,width:pct+"%",transition:"width .5s"}}/></div>
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

        {tab === "history" && (
          <div>
            <FilterBar/>
            {filtFuel.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:T.ft}}><div style={{fontSize:48,marginBottom:12}}>📋</div><div>Δεν υπάρχουν καταχωρήσεις.</div></div>
            ) : [...filtFuel].reverse().map(f=>{
              const ft=FTYPES.find(x=>x.id===f.fuelType);
              const so=STATIONS.find(s=>s.id===f.stId);
              const fc=FT_COLORS[f.fuelType]||{color:col};
              return(
                <div key={f.id} onClick={()=>setEditEntry({...f})} style={{background:T.bg,borderRadius:14,padding:"13px 13px 13px 17px",marginBottom:10,border:"1px solid "+T.br,position:"relative",cursor:"pointer",transition:"border-color .15s"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,borderRadius:"14px 0 0 14px",background:fc.color||col}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                        <span style={{fontWeight:700,fontSize:13,color:T.tx}}>{f.date}</span>
                        {ft&&<FtBadge ftId={f.fuelType} size={11}/>}
                        {f.dual&&<span style={{fontSize:11,background:"#a78bfa22",color:"#a78bfa",padding:"2px 7px",borderRadius:6,fontWeight:700}}>Dual LPG</span>}
                        {f.station&&<span style={{fontSize:11,background:so?so.bg:"#555",color:so?so.fg:"#fff",padding:"2px 8px",borderRadius:6,fontWeight:700}}>{f.station}</span>}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
                        {f.liters&&<span style={{fontSize:12,color:T.tx}}>⛽ {fmt(f.liters,1)}L</span>}
                        {f.ppl   &&<span style={{fontSize:12,color:T.tx}}>💧 {fmt(f.ppl,3)}€/L</span>}
                        {f.total &&<span style={{fontSize:12,color:T.tx}}>💰 {fmt(f.total)}€</span>}
                        {f.km    &&<span style={{fontSize:12,color:T.tx}}>📍 {fmt(f.km,0)}{dl}</span>}
                        {f.km&&f.liters&&<span style={{fontSize:12,color:"#10b981",fontWeight:700}}>🔥 {fmt(f.liters/f.km*100,1)}L/100</span>}
                      </div>
                      {f.dual&&(f.lpgL||f.lpgT)&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",marginTop:4}}>
                          {f.lpgL&&<span style={{fontSize:12,color:"#a78bfa"}}>🟣 {fmt(f.lpgL,1)}L</span>}
                          {f.lpgP&&<span style={{fontSize:12,color:"#a78bfa"}}>💧 {fmt(f.lpgP,3)}€/L</span>}
                          {f.lpgT&&<span style={{fontSize:12,color:"#a78bfa"}}>💰 {fmt(f.lpgT)}€</span>}
                          {f.km&&f.lpgL&&<span style={{fontSize:12,color:"#a78bfa",fontWeight:700}}>🔥 {fmt(f.lpgL/f.km*100,1)}L/100</span>}
                        </div>
                      )}
                      {f.notes&&<div style={{marginTop:5,fontSize:11,color:T.mt}}>📝 {f.notes}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();delFuel(f.id);}} style={{background:"none",border:"none",color:T.ft,fontSize:18,paddingLeft:10,cursor:"pointer",lineHeight:1}}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{textAlign:"center",paddingTop:28}}>
          <div style={{display:"inline-block",padding:"6px 18px",borderRadius:20,background:T.bg,border:"1px solid "+T.br}}>
            <span style={{fontSize:13,fontWeight:800,background:"linear-gradient(90deg,#3b82f6,#8b5cf6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FuelLog v2.0</span>
            <span style={{fontSize:13,fontWeight:800,color:"#3b82f6"}}> · © Ταχμαζίδης Κ. Γιώργος</span>
          </div>
        </div>
      </div>

      {showFtPicker && (
        <Modal title="⛽ Είδος Καυσίμου" onClose={()=>setShowFtPicker(false)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FTYPES.map(ft=>{
              const fc=FT_COLORS[ft.id]||{}, sel=fuelForm.fuelType===ft.id;
              return(
                <button key={ft.id} onClick={()=>{setFuelForm({...fuelForm,fuelType:ft.id});setShowFtPicker(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 14px",border:"2px solid "+(sel?fc.color||col:T.br),borderRadius:12,background:sel?fc.bg||col+"22":T.bg,cursor:"pointer",fontFamily:"inherit"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:22}}>{ft.icon}</span><span style={{fontSize:14,fontWeight:sel?700:400,color:sel?fc.color||col:T.tx}}>{ft.label}</span></div>
                  <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(sel?fc.color||col:T.br),background:sel?fc.color||col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>{sel?"✓":""}</div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {showStPicker && (
        <StationModal current={{stId:fuelForm.stId,stLabel:fuelForm.stLabel}} onSelect={(id,lb)=>{setFuelForm({...fuelForm,stId:id,stLabel:lb});setShowStPicker(false);}} onClose={()=>setShowStPicker(false)} T={T}/>
      )}

      {modal==="av" && (
        <Modal title="🚗 Νέο Όχημα" onClose={()=>setModal(null)} T={T}>
          <div style={{marginBottom:12}}>
            <label style={lS}>ΚΑΤΗΓΟΡΙΑ</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {VCATS.map(c=>(<button key={c.id} onClick={()=>setNewV({...newV,category:c.id,icon:c.icons[0]})} style={{padding:"7px 13px",borderRadius:9,border:"1.5px solid "+(newV.category===c.id?col:T.br),background:newV.category===c.id?col+"22":"transparent",color:newV.category===c.id?col:T.mt,fontSize:12,fontWeight:newV.category===c.id?700:400,cursor:"pointer",fontFamily:"inherit"}}>{c.icons[0]} {c.label}</button>))}
            </div>
            <label style={lS}>ΕΙΚΟΝΙΔΙΟ</label>
            <div style={{display:"flex",gap:6,marginBottom:14}}>{(VCATS.find(c=>c.id===newV.category)?.icons||["🚗"]).map(ic=>(<button key={ic} onClick={()=>setNewV({...newV,icon:ic})} style={{fontSize:24,padding:"8px 12px",border:"2px solid "+(newV.icon===ic?col:T.br),borderRadius:10,background:"transparent",cursor:"pointer"}}>{ic}</button>))}</div>
            <label style={lS}>ΟΝΟΜΑ</label>
            <input value={newV.name} onChange={e=>setNewV({...newV,name:e.target.value})} placeholder="π.χ. Εταιρικό Βαν" style={{...iS(!!newV.name),marginBottom:16}}/>
          </div>
          <div style={{display:"flex",gap:10}}><button onClick={()=>setModal(null)} style={{flex:1,padding:13,background:"transparent",border:"1.5px solid "+T.br,borderRadius:12,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Ακύρωση</button><button onClick={addVeh} style={{flex:2,padding:13,background:col,color:"#fff",border:"none",borderRadius:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Προσθήκη</button></div>
        </Modal>
      )}

      {modal==="vi" && av && (
        <VehicleInfoModal av={av} onClose={()=>setModal(null)} onUpdate={updateVehicle} onDelete={deleteVehicle} onAddReminder={addR} onUpdateReminder={upR} onDelReminder={delR} T={T} dl={dl}/>
      )}

      {editEntry && (
        <Modal title="✏️ Επεξεργασία Καταχώρησης" onClose={()=>setEditEntry(null)} T={T}>
          {(()=>{
            const iSe=on=>({...iS(on),fontFamily:"inherit"});
            const upE=(f,v)=>{
              const u={...editEntry,[f]:v};
              if(f==="liters"&&u.ppl&&+u.ppl) u.total=(parseFloat(v||0)*parseFloat(u.ppl)).toFixed(2);
              if(f==="ppl"&&u.liters&&+u.liters) u.total=(parseFloat(u.liters)*parseFloat(v||0)).toFixed(2);
              if(f==="total"&&u.liters&&+u.liters) u.ppl=(parseFloat(v||0)/parseFloat(u.liters)).toFixed(3);
              setEditEntry(u);
            };
            return(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={editEntry.date} onChange={e=>upE("date",e.target.value)} style={iSe(true)}/></div>
                <div><label style={lS}>ΕΙΔΟΣ ΚΑΥΣΙΜΟΥ</label><select value={editEntry.fuelType} onChange={e=>upE("fuelType",e.target.value)} style={{...iSe(true),appearance:"none"}}>{FTYPES.map(f=><option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}</select></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lS}>ΛΙΤΡΑ</label><input type="number" step="any" value={editEntry.liters||""} onChange={e=>upE("liters",e.target.value)} style={iSe(!!editEntry.liters)}/></div><div><label style={lS}>ΤΙΜΗ/ΛΙΤΡΟ</label><input type="number" step="any" value={editEntry.ppl||""} onChange={e=>upE("ppl",e.target.value)} style={iSe(!!editEntry.ppl)}/></div></div>
                <div><label style={lS}>ΣΥΝΟΛΟ €</label><input type="number" step="any" value={editEntry.total||""} onChange={e=>upE("total",e.target.value)} style={iSe(!!editEntry.total)}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lS}>{dl.toUpperCase()} ΔΙΑΔΡΟΜΗΣ</label><input type="number" value={editEntry.km||""} onChange={e=>upE("km",e.target.value)} style={iSe(!!editEntry.km)}/></div><div><label style={lS}>ΧΙΛΙΟΜΕΤΡΗΤΗΣ</label><input type="number" value={editEntry.odo||""} onChange={e=>upE("odo",e.target.value)} style={iSe(!!editEntry.odo)}/></div></div>
                <div><label style={lS}>ΠΡΑΤΗΡΙΟ</label><input value={editEntry.station||""} onChange={e=>upE("station",e.target.value)} placeholder="π.χ. Shell" style={iSe(!!editEntry.station)}/></div>
                <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input value={editEntry.notes||""} onChange={e=>upE("notes",e.target.value)} style={iSe(!!editEntry.notes)}/></div>
                <div style={{display:"flex",gap:10,marginTop:4}}><button onClick={()=>setEditEntry(null)} style={{flex:1,padding:13,background:"transparent",border:"1.5px solid "+T.br,borderRadius:12,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Ακύρωση</button><button onClick={()=>saveEdit(editEntry.id,editEntry)} style={{flex:2,padding:13,background:"linear-gradient(135deg,"+col+","+col+"cc)",color:"#fff",border:"none",borderRadius:12,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✓ Αποθήκευση</button></div>
              </div>
            );
          })()}
        </Modal>
      )}

      {editExpense && (
        <Modal title="✏️ Επεξεργασία Εξόδου" onClose={()=>setEditExpense(null)} T={T}>
          {(()=>{
            const upEx=(f,v)=>{setEditExpense({...editExpense,[f]:v});};
            return(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={lS}>ΗΜΕΡΟΜΗΝΙΑ</label><input type="date" value={editExpense.date} onChange={e=>upEx("date",e.target.value)} style={iS(true)}/></div>
                <div><label style={lS}>ΠΟΣΟ (€)</label><input type="number" step="any" value={editExpense.amount} onChange={e=>upEx("amount",e.target.value)} style={iS(!!editExpense.amount)}/></div>
                <div><label style={lS}>ΚΑΤΗΓΟΡΙΑ</label><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:7}}>{EXPENSE_CATS.map(c=>(<button key={c.id} onClick={()=>upEx("catId",c.id)} style={{padding:"10px 4px",borderRadius:10,border:"1.5px solid "+(editExpense.catId===c.id?"#10b981":T.br),background:editExpense.catId===c.id?"#10b98122":"transparent",color:editExpense.catId===c.id?"#10b981":T.mt,fontSize:11,cursor:"pointer",textAlign:"center",fontFamily:"inherit"}}><div style={{fontSize:20}}>{c.icon}</div><div style={{fontSize:10,marginTop:3,fontWeight:600}}>{c.label}</div></button>))}</div></div>
                {editExpense.catId==="custom"&&(<div><label style={lS}>ΠΕΡΙΓΡΑΦΗ</label><input placeholder="π.χ. Μπαταρία..." value={editExpense.customCat||editExpense.label?.replace("Άλλο","")||""} onChange={e=>{upEx("customCat",e.target.value);upEx("label",e.target.value||"Άλλο");}} style={iS(true)}/></div>)}
                <div><label style={lS}>ΣΗΜΕΙΩΣΕΙΣ</label><input type="text" placeholder="π.χ. Castrol 5W40..." value={editExpense.notes||""} onChange={e=>upEx("notes",e.target.value)} style={iS(false)}/></div>
                <div style={{display:"flex",gap:10,marginTop:8}}><button onClick={()=>setEditExpense(null)} style={{flex:1,padding:13,background:"transparent",border:"1.5px solid "+T.br,borderRadius:12,color:T.mt,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>Ακύρωση</button><button onClick={()=>saveExpenseEdit(editExpense.id,editExpense)} style={{flex:2,padding:13,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:12,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✓ Αποθήκευση</button></div>
              </div>
            );
          })()}
        </Modal>
      )}

      {modal==="bk" && (
        <Modal title="☁️ Backup & Export" onClose={()=>setModal(null)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={lS}>ΕΞΑΓΩΓΗ</label>
            <button onClick={exCsv} style={{padding:"13px 16px",background:"#3b82f622",border:"1px solid #3b82f644",borderRadius:12,color:"#3b82f6",fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📄 Export CSV (καύσιμα)</button>
            <button onClick={exJson} style={{padding:"13px 16px",background:col+"22",border:"1px solid "+col+"44",borderRadius:12,color:col,fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📦 Backup JSON (όλα)</button>
            <button onClick={exportToPDF} style={{padding:"13px 16px",background:"#ef444422",border:"1px solid #ef444644",borderRadius:12,color:"#ef4444",fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📑 Export PDF (αναφορά)</button>
            <label style={{...lS,marginTop:8}}>ΕΠΑΝΑΦΟΡΑ</label>
            <input ref={fref} type="file" accept=".json" onChange={imJson} style={{display:"none"}}/>
            <button onClick={()=>fref.current?.click()} style={{padding:"13px 16px",background:T.bg,border:"1px solid "+T.br,borderRadius:12,color:T.tx,fontSize:14,fontWeight:700,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>📥 Εισαγωγή JSON backup</button>
            <div style={{borderTop:"1px solid "+T.br,paddingTop:12,marginTop:4}}><button onClick={loadDemo} style={{width:"100%",padding:11,background:T.br,color:T.tx,border:"none",borderRadius:10,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🚀 Φόρτωση demo δεδομένων</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
