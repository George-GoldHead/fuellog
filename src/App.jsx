import React, { useState, useMemo, useEffect, useRef } from "react";

// ========== CONSTANTS & CONFIG ==========
const FUEL_COLORS = ["#f97316", "#3b82f6", "#10b981", "#e11d48", "#8b5cf6", "#06b6d4", "#eab308", "#ec4899"];

const VCATS = [
  { id: "car", label: "ΙΧ", icon: "🚗" },
  { id: "taxi", label: "Taxi", icon: "🚕" },
  { id: "moto", label: "Μηχανή", icon: "🏍️" },
  { id: "van", label: "Βαν", icon: "🚐" },
  { id: "ltruck", label: "Ελαφρύ Φορτηγό", icon: "🚚" },
  { id: "truck", label: "Βαρύ Φορτηγό", icon: "🚛" },
  { id: "bus", label: "Λεωφορείο", icon: "🚌" },
];

const FTYPES = [
  { id: "unleaded95", label: "Αμόλυβδη 95", icon: "🟢" },
  { id: "unleaded98", label: "Αμόλυβδη 98", icon: "🔵" },
  { id: "unleaded100", label: "Αμόλυβδη 100", icon: "🔷" },
  { id: "diesel", label: "Diesel", icon: "🟡" },
  { id: "diesel_plus", label: "Diesel Plus", icon: "🟠" },
  { id: "lpg", label: "Υγραέριο (LPG)", icon: "🟣" },
  { id: "cng", label: "Φυσικό Αέριο", icon: "⚪" },
];

const EXPENSE_CATS = [
  { id: "service", label: "Service", icon: "🔧" },
  { id: "oil", label: "Λάδια/Φίλτρα", icon: "🛢️" },
  { id: "tyres", label: "Ελαστικά", icon: "⚫" },
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "tolls", label: "Διόδια", icon: "🛣️" },
  { id: "insurance", label: "Ασφάλεια", icon: "🛡️" },
  { id: "kteo", label: "ΚΤΕΟ", icon: "🔍" },
  { id: "taxes", label: "Τέλη Κυκλοφορίας", icon: "📜" },
  { id: "cleaning", label: "Πλύσιμο", icon: "🧼" },
  { id: "repairs", label: "Επισκευές", icon: "🛠️" },
  { id: "parts", label: "Ανταλλακτικά", icon: "⚙️" },
  { id: "fine", label: "Πρόστιμο", icon: "👮" },
  { id: "custom", label: "Άλλο", icon: "💸" },
];

const MONTHS_FULL = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
const MONTHS_SHORT = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαΐ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];

// ========== UTILITIES ==========
const uid = () => Math.random().toString(36).substr(2, 9);
const fmt = (n, d = 2) => (n !== null && !isNaN(n)) ? (+n).toFixed(d) : "0.00";
const today = () => new Date().toISOString().split("T")[0];

const formatDate = (dateStr) => {
  if (!dateStr) return "--/--/--";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
};

const daysUntil = (targetDate) => {
  if (!targetDate) return null;
  const diff = new Date(targetDate) - new Date(today());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const REMINDER_FIELDS = [
  { f: "insuranceExp", label: "Λήξη Ασφάλειας", icon: "🛡️" },
  { f: "kteo", label: "ΚΤΕΟ", icon: "🔍" },
  { f: "kek", label: "ΚΕΚ", icon: "🔬" },
  { f: "tiresNext", label: "Αλλαγή Ελαστικών", icon: "⚫" },
  { f: "serviceNextDate", label: "Επόμενο Service (Ημ/νία)", icon: "🔧" },
];

const WARN_DAYS = 30;

// ========== THEME DEFINITIONS ==========
const DK = {
  bg: "#080810",
  sf: "#10101c",
  br: "#1e1e30",
  tx: "#eeeeff",
  mt: "#7777aa",
  ft: "#33334a",
  inp: "#0d0d1a",
  ib: "#1e1e30",
  accent: "#f97316"
};

const LT = {
  bg: "#f0e8db",
  sf: "#faf3e8",
  br: "#d4c0a8",
  tx: "#1a1510",
  mt: "#5c4e3d",
  ft: "#e0d0bc",
  inp: "#ffffff",
  ib: "#c4b098",
  accent: "#f97316"
};

// ========== FACTORIES ==========
const defInfo = () => ({
  brand: "", model: "", year: "", cc: "", plate: "", chassis: "",
  insurance: "", insuranceExp: "", kteo: "", kek: "",
  tiresBrand: "", tiresSize: "", tiresDate: "", tiresNext: "",
  serviceDate: "", serviceNextDate: "", serviceKm: "", serviceNextKm: "", serviceNotes: "",
  driverMain: "", driverSecond: "",
});

const defV = (overrides = {}) => ({
  id: uid(),
  name: "ΝΕΟ ΟΧΗΜΑ",
  icon: "🚗",
  color: "#f97316",
  category: "car",
  fuelType: "diesel",
  fuelType2: "",
  unitMiles: false,
  info: defInfo(),
  ...overrides
});

const emptyFuel = (ft) => ({ date: today(), fuelType: ft || "diesel", ppl: "", total: "", odo: "", notes: "" });
const emptyExp = () => ({ date: today(), category: "tolls", label: "", amount: "", notes: "" });

// ========== REUSABLE COMPONENTS ==========

function Modal({ open, onClose, title, children, T }) {
  if (!open) return null;
  return (
    <div 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.sf, borderRadius: "22px 22px 0 0", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "20px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: T.tx }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", color: T.mt, fontSize: 26, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthGroup({ label, badge, total, isOpen, onToggle, T, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div 
        onClick={onToggle}
        style={{ 
          display: "flex", justifyContent: "space-between", alignItems: "center", 
          padding: "14px 16px", cursor: "pointer", 
          background: isOpen ? T.br : T.sf, borderRadius: isOpen ? "14px 14px 0 0" : "14px",
          border: `1px solid ${T.br}`, transition: "all 0.2s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: "bold", fontSize: 15, color: T.tx }}>{label}</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: T.ft, color: T.mt }}>{badge}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {total && <span style={{ fontWeight: "bold", color: "#eab308" }}>{total}</span>}
          <span style={{ color: T.mt, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>
      {isOpen && (
        <div style={{ background: T.bg, border: `1px solid ${T.br}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RoundCyberGauge({ value, min, max, color, label, unit, T }) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R = 42, cx = 52, cy = 52, sA = Math.PI * 0.7, eA = Math.PI * 2.3, vA = sA + (eA - sA) * pct;
  const nx = cx + (R - 11) * Math.cos(vA), ny = cy + (R - 11) * Math.sin(vA);

  return (
    <div style={{ background: "#0a0a0f", borderRadius: "50%", padding: 6, border: `2px solid ${color}`, width: "100%", aspectRatio: "1/1", position: "relative" }}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${cx + R * Math.cos(sA)} ${cy + R * Math.sin(sA)} A ${R} ${R} 0 1 1 ${cx + R * Math.cos(eA)} ${cy + R * Math.sin(eA)}`} fill="none" stroke="#1e1e30" strokeWidth={6} strokeLinecap="round" />
        <path d={`M ${cx + R * Math.cos(sA)} ${cy + R * Math.sin(sA)} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3} fill={color} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="900" style={{ filter: `drop-shadow(0 0 3px ${color})` }}>{fmt(value, 1)}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill={T.mt} fontSize={6} fontWeight="bold">{unit}</text>
      </svg>
      <div style={{ position: "absolute", bottom: 8, width: "100%", textAlign: "center", fontSize: 7, color, fontWeight: 800, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// ========== MAIN APPLICATION ==========

export default function FuelLog() {
  // --- STATE ---
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;

  const [vehicles, setVehicles] = useState([defV({ id: "v1", name: "ΕΤΑΙΡΙΚΟ", icon: "🚗", color: "#f97316" })]);
  const [vid, setVid] = useState("v1");
  const [entries, setEntries] = useState({});
  const [expenses, setExpenses] = useState({});

  const [tab, setTab] = useState("home");
  const [fY, setFY] = useState(String(new Date().getFullYear()));
  const [fM, setFM] = useState("all");

  const [openFuelM, setOpenFuelM] = useState({});
  const [openExpM, setOpenExpM] = useState({});
  const [openStatsM, setOpenStatsM] = useState({}); // New state for accordion in stats

  const [fuelForm, setFuelForm] = useState(emptyFuel("diesel"));
  const [expForm, setExpForm] = useState(emptyExp());

  const [showAddV, setShowAddV] = useState(false);
  const [newV, setNewV] = useState(defV());
  const [showVInfo, setShowVInfo] = useState(false);
  const [showIO, setShowIO] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const av = vehicles.find((v) => v.id === vid) || vehicles[0];
  const col = av.color;

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fuellog_data_full");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.entries) setEntries(parsed.entries);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.vid) setVid(parsed.vid);
      }
    } catch (e) { console.error("Load error", e); }
  }, []);

  useEffect(() => {
    localStorage.setItem("fuellog_data_full", JSON.stringify({ vehicles, entries, expenses, vid }));
  }, [vehicles, entries, expenses, vid]);

  // --- CALCULATIONS ---
  const allFuel = useMemo(() => (entries[vid] || []).sort((a, b) => new Date(b.date) - new Date(a.date)), [entries, vid]);
  const allExp = useMemo(() => (expenses[vid] || []).sort((a, b) => new Date(b.date) - new Date(a.date)), [expenses, vid]);

  const filtFuel = useMemo(() => {
    let f = allFuel;
    if (fY !== "all") f = f.filter(e => e.date.startsWith(fY));
    if (fM !== "all") f = f.filter(e => e.date.slice(5, 7) === fM);
    return f;
  }, [allFuel, fY, fM]);

  const filtExp = useMemo(() => {
    let f = allExp;
    if (fY !== "all") f = f.filter(e => e.date.startsWith(fY));
    if (fM !== "all") f = f.filter(e => e.date.slice(5, 7) === fM);
    return f;
  }, [allExp, fY, fM]);

  const stats = useMemo(() => {
    const fuelSpent = filtFuel.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
    const expSpent = filtExp.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
    const tL = filtFuel.reduce((s, x) => s + (parseFloat(x.liters) || 0), 0);
    
    // Average price
    const fuelWithPrice = filtFuel.filter(x => parseFloat(x.ppl) > 0);
    const aP = fuelWithPrice.length ? fuelWithPrice.reduce((s, x) => s + parseFloat(x.ppl), 0) / fuelWithPrice.length : 0;
    
    // Total KM & Consumption (based on ODO entries)
    const odoEntries = allFuel.filter(f => f.odo).sort((a, b) => a.odo - b.odo);
    let totalKm = 0;
    let avgCons = 0;
    if (odoEntries.length >= 2) {
      totalKm = odoEntries[odoEntries.length - 1].odo - odoEntries[0].odo;
      if (totalKm > 0) {
        const totalLitersInPeriod = odoEntries.slice(1).reduce((s, x) => s + (parseFloat(x.liters) || 0), 0);
        avgCons = (totalLitersInPeriod / totalKm) * 100;
      }
    }

    return { fuelSpent, expSpent, totalSpent: fuelSpent + expSpent, tL, aP, aC: avgCons, totalKm };
  }, [filtFuel, filtExp, allFuel]);

  const reminders = useMemo(() => {
    const list = [];
    vehicles.forEach(v => {
      REMINDER_FIELDS.forEach(({ f, label, icon }) => {
        const dStr = v.info?.[f];
        const days = daysUntil(dStr);
        if (days !== null && days <= WARN_DAYS) {
          list.push({ vid: v.id, vName: v.name, label, icon, days, date: dStr, urgent: days <= 7, expired: days < 0 });
        }
      });
    });
    return list.sort((a, b) => a.days - b.days);
  }, [vehicles]);

  const fuelByMonth = useMemo(() => {
    const map = {};
    allFuel.forEach(e => {
      const k = e.date.slice(0, 7);
      if (!map[k]) map[k] = { key: k, label: `${MONTHS_FULL[parseInt(k.slice(5)) - 1]} ${k.slice(0, 4)}`, entries: [], total: 0 };
      map[k].entries.push(e);
      map[k].total += (parseFloat(e.total) || 0);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [allFuel]);

  const expByMonth = useMemo(() => {
    const map = {};
    allExp.forEach(e => {
      const k = e.date.slice(0, 7);
      if (!map[k]) map[k] = { key: k, label: `${MONTHS_FULL[parseInt(k.slice(5)) - 1]} ${k.slice(0, 4)}`, entries: [], total: 0 };
      map[k].entries.push(e);
      map[k].total += (parseFloat(e.amount) || 0);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [allExp]);

  const availYears = useMemo(() => {
    const ys = new Set([String(new Date().getFullYear())]);
    [...allFuel, ...allExp].forEach(e => e.date && ys.add(e.date.slice(0, 4)));
    return [...ys].sort((a, b) => b - a);
  }, [allFuel, allExp]);

  // --- ACTIONS ---
  const updateVInfo = (f, val) => {
    setVehicles(prev => prev.map(v => v.id === vid ? { ...v, info: { ...v.info, [f]: val } } : v));
  };

  const handleAddFuel = () => {
    if (!fuelForm.total) return;
    const ppl = parseFloat(fuelForm.ppl) || 0;
    const total = parseFloat(fuelForm.total) || 0;
    const liters = ppl > 0 ? total / ppl : 0;
    const odo = fuelForm.odo ? parseFloat(fuelForm.odo) : null;
    
    const entry = { ...fuelForm, id: uid(), total, ppl, liters, odo };
    setEntries(p => ({ ...p, [vid]: [entry, ...(p[vid] || [])] }));
    setFuelForm(emptyFuel(av.fuelType));
    setTab("history");
  };

  const handleAddExp = () => {
    if (!expForm.amount) return;
    const cat = EXPENSE_CATS.find(c => c.id === expForm.category);
    const entry = { ...expForm, id: uid(), amount: parseFloat(expForm.amount), icon: cat?.icon || "💸", label: expForm.label || cat?.label };
    setExpenses(p => ({ ...p, [vid]: [entry, ...(p[vid] || [])] }));
    setExpForm(emptyExp());
    setTab("expenses");
  };

  const handleImport = () => {
    try {
      const d = JSON.parse(importText);
      if (d.vehicles) setVehicles(d.vehicles);
      if (d.entries) setEntries(d.entries);
      if (d.expenses) setExpenses(d.expenses);
      setImportMsg("✅ Επιτυχής εισαγωγή!");
    } catch (e) { setImportMsg("❌ Σφάλμα JSON"); }
  };

  // --- STYLES ---
  const IS = { width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 10, background: T.inp, color: T.tx, border: `1px solid ${T.ib}`, boxSizing: "border-box", fontSize: 14 };
  const CS = (extra = {}) => ({ background: T.sf, padding: 16, borderRadius: 18, border: `1px solid ${T.br}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", ...extra });
  const labelStyle = { fontSize: 11, color: T.mt, marginBottom: 5, display: "block", marginLeft: 4, fontWeight: "bold" };

  return (
    <div style={{ backgroundColor: T.bg, color: T.tx, minHeight: "100vh", fontFamily: "-apple-system, sans-serif", paddingBottom: 100 }}>
      
      {/* HEADER */}
      <header style={{ padding: "12px 16px", background: T.sf, borderBottom: `1px solid ${T.br}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⛽</span>
          <b style={{ fontSize: 18, letterSpacing: -0.5 }}>FuelLog <span style={{ color: col, fontSize: 12 }}>PRO</span></b>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowVInfo(true)} style={{ background: T.br, border: "none", color: T.tx, padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: "bold" }}>🔧 ΟΧΗΜΑ</button>
          <button onClick={() => setDark(!dark)} style={{ border: "none", background: "none", fontSize: 22 }}>{dark ? "☀️" : "🌙"}</button>
        </div>
      </header>

      {/* VEHICLE SELECTOR */}
      <div style={{ display: "flex", gap: 10, padding: "12px 16px", overflowX: "auto", background: T.bg }}>
        {vehicles.map(v => (
          <button 
            key={v.id} 
            onClick={() => setVid(v.id)}
            style={{ 
              padding: "8px 16px", borderRadius: 20, border: "none", whiteSpace: "nowrap", fontWeight: "bold", fontSize: 13,
              background: vid === v.id ? v.color : T.sf, color: vid === v.id ? "#fff" : T.mt,
              boxShadow: vid === v.id ? `0 4px 10px ${v.color}50` : "none"
            }}
          >
            {v.icon} {v.name}
          </button>
        ))}
        <button onClick={() => setShowAddV(true)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px dashed ${T.mt}`, background: "none", color: T.mt }}>+</button>
      </div>

      <main style={{ padding: "0 16px" }}>
        
        {/* HOME TAB */}
        {tab === "home" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ ...CS(), marginBottom: 16, marginTop: 10 }}>
              <div style={{ fontSize: 11, color: T.mt, textTransform: "uppercase", letterSpacing: 1 }}>Συνολικά Έξοδα</div>
              <div style={{ fontSize: 34, fontWeight: "900", color: "#eab308", margin: "4px 0" }}>{fmt(stats.totalSpent)}€</div>
              <div style={{ fontSize: 12, color: T.mt }}>Περίοδος: {fY === "all" ? "Όλα" : fY} {fM !== "all" && `/ Μήνας ${fM}`}</div>
            </div>

            {reminders.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#eab308", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🔔</span> ΥΠΕΝΘΥΜΙΣΕΙΣ
                </div>
                {reminders.map((r, i) => (
                  <div key={i} style={{ ...CS(), marginBottom: 8, padding: "12px 16px", borderLeft: `4px solid ${r.expired ? "#ef4444" : r.urgent ? "#f97316" : "#eab308"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <b style={{ fontSize: 14 }}>{r.icon} {r.label}</b>
                      <span style={{ fontSize: 11, color: r.expired ? "#ef4444" : T.mt }}>{r.expired ? "ΕΛΗΞΕ" : `σε ${r.days} μέρες`}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.mt, marginTop: 2 }}>{r.vName} • {formatDate(r.date)}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={CS()}>
                <div style={{ fontSize: 10, color: T.mt }}>ΚΑΥΣΙΜΑ</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#3b82f6" }}>{fmt(stats.fuelSpent)}€</div>
              </div>
              <div style={CS()}>
                <div style={{ fontSize: 10, color: T.mt }}>ΑΛΛΑ ΕΞΟΔΑ</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#e11d48" }}>{fmt(stats.expSpent)}€</div>
              </div>
            </div>
          </div>
        )}

        {/* FUEL ENTRY TAB */}
        {tab === "fuel" && (
          <div style={{ ...CS(), marginTop: 10 }}>
            <h3 style={{ marginTop: 0, fontSize: 18 }}>⛽ Νέο Γέμισμα</h3>
            <label style={labelStyle}>Ημερομηνία</label>
            <input type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} style={IS} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>€ / Λίτρο</label>
                <input type="number" step="0.001" placeholder="1.850" value={fuelForm.ppl} onChange={e => setFuelForm({ ...fuelForm, ppl: e.target.value })} style={IS} />
              </div>
              <div>
                <label style={labelStyle}>Συνολικό Ποσό €</label>
                <input type="number" step="0.01" placeholder="50.00" value={fuelForm.total} onChange={e => setFuelForm({ ...fuelForm, total: e.target.value })} style={IS} />
              </div>
            </div>

            <label style={labelStyle}>Χιλιόμετρα (Odometer)</label>
            <input type="number" placeholder="π.χ. 125400" value={fuelForm.odo} onChange={e => setFuelForm({ ...fuelForm, odo: e.target.value })} style={IS} />
            
            <label style={labelStyle}>Σημειώσεις</label>
            <textarea placeholder="..." value={fuelForm.notes} onChange={e => setFuelForm({ ...fuelForm, notes: e.target.value })} style={{ ...IS, height: 60 }} />

            <button onClick={handleAddFuel} style={{ width: "100%", padding: 16, background: col, color: "#fff", border: "none", borderRadius: 14, fontWeight: "bold", fontSize: 16, marginTop: 10 }}>ΚΑΤΑΧΩΡΗΣΗ</button>
          </div>
        )}

        {/* EXPENSES TAB */}
        {tab === "expenses" && (
          <div style={{ marginTop: 10 }}>
            <div style={CS()}>
              <h3 style={{ marginTop: 0, fontSize: 18 }}>📋 Άλλο Έξοδο</h3>
              <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} style={IS} />
              <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} style={IS}>
                {EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <input type="text" placeholder="Περιγραφή (π.χ. Πλύσιμο)" value={expForm.label} onChange={e => setExpForm({ ...expForm, label: e.target.value })} style={IS} />
              <input type="number" placeholder="Ποσό €" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} style={IS} />
              <button onClick={handleAddExp} style={{ width: "100%", padding: 15, background: "#e11d48", color: "#fff", border: "none", borderRadius: 12, fontWeight: "bold" }}>ΠΡΟΣΘΗΚΗ</button>
            </div>

            <div style={{ marginTop: 20 }}>
              {expByMonth.map(m => (
                <MonthGroup key={m.key} label={m.label} total={`-${fmt(m.total)}€`} isOpen={!!openExpM[m.key]} onToggle={() => setOpenExpM(p => ({ ...p, [m.key]: !p[m.key] }))} T={T}>
                  {m.entries.map((e, idx) => (
                    <div key={e.id} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", borderBottom: idx === m.entries.length - 1 ? "none" : `1px solid ${T.ft}` }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: 14 }}>{e.icon} {e.label}</div>
                        <div style={{ fontSize: 11, color: T.mt }}>{formatDate(e.date)}</div>
                      </div>
                      <div style={{ fontWeight: "bold", color: "#e11d48" }}>-{fmt(e.amount)}€</div>
                    </div>
                  ))}
                </MonthGroup>
              ))}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div style={{ marginTop: 10 }}>
            {/* Filter selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <select value={fY} onChange={e => setFY(e.target.value)} style={IS}>
                <option value="all">Όλα τα έτη</option>
                {availYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fM} onChange={e => setFM(e.target.value)} style={IS}>
                <option value="all">Όλοι οι μήνες</option>
                {MONTHS_SHORT.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
              </select>
            </div>

            {/* Gauges section */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, gap: 15 }}>
              <div style={{ flex: 1, maxWidth: 160 }}><RoundCyberGauge value={stats.aC} min={4} max={15} color="#10b981" label="ΚΑΤΑΝΑΛΩΣΗ" unit="L/100km" T={T} /></div>
              <div style={{ flex: 1, maxWidth: 160 }}><RoundCyberGauge value={stats.aP} min={1.4} max={2.3} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ" unit="€/L" T={T} /></div>
            </div>

            {/* --- ΚΑΤΑΝΟΜΗ ΑΝΑ ΜΗΝΑ (ACCORDION) --- */}
            <h4 style={{ fontSize: 13, color: T.mt, marginBottom: 12, paddingLeft: 4 }}>📊 ΑΝΑΛΥΣΗ ΑΝΑ ΜΗΝΑ</h4>
            
            {(fY === "all" ? fuelByMonth : fuelByMonth.filter(m => m.key.startsWith(fY))).map(m => {
              // Calculate specific stats for this month row
              const monthExpTotal = allExp.filter(e => e.date.startsWith(m.key)).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
              const monthGrandTotal = m.total + monthExpTotal;

              return (
                <MonthGroup 
                  key={m.key} 
                  label={m.label} 
                  badge={`${m.entries.length} γεμίσματα`} 
                  total={`${fmt(monthGrandTotal)}€`} 
                  isOpen={!!openStatsM[m.key]} 
                  onToggle={() => setOpenStatsM(p => ({ ...p, [m.key]: !p[m.key] }))} 
                  T={T}
                >
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: "#3b82f6" }}>⛽ Καύσιμα: {fmt(m.total)}€</span>
                      <span style={{ color: "#e11d48" }}>📋 Άλλα: {fmt(monthExpTotal)}€</span>
                    </div>
                    
                    {/* Visual bar */}
                    <div style={{ width: "100%", height: 8, background: T.ft, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 15 }}>
                      <div style={{ width: `${(m.total / (monthGrandTotal || 1)) * 100}%`, background: "#3b82f6" }} />
                      <div style={{ width: `${(monthExpTotal / (monthGrandTotal || 1)) * 100}%`, background: "#e11d48" }} />
                    </div>

                    {/* Breakdown of expenses if any */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {EXPENSE_CATS.map(cat => {
                        const amt = allExp.filter(e => e.date.startsWith(m.key) && e.category === cat.id).reduce((s, x) => s + x.amount, 0);
                        if (amt === 0) return null;
                        return (
                          <div key={cat.id} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                            <span>{cat.icon}</span>
                            <span style={{ flex: 1, color: T.mt }}>{cat.label}:</span>
                            <span style={{ fontWeight: "bold" }}>{fmt(amt)}€</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </MonthGroup>
              );
            })}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div style={{ marginTop: 10 }}>
            {fuelByMonth.map(m => (
              <MonthGroup key={m.key} label={m.label} total={`${fmt(m.total)}€`} isOpen={!!openFuelM[m.key]} onToggle={() => setOpenFuelM(p => ({ ...p, [m.key]: !p[m.key] }))} T={T}>
                {m.entries.map((e, idx) => (
                  <div key={e.id} style={{ padding: "14px 16px", borderBottom: idx === m.entries.length - 1 ? "none" : `1px solid ${T.ft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: "bold" }}>{fmt(e.total)}€</div>
                        <div style={{ fontSize: 12, color: T.mt }}>{fmt(e.liters)} L • {fmt(e.ppl, 3)} €/L</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: "bold" }}>{formatDate(e.date)}</div>
                        {e.odo && <div style={{ fontSize: 11, color: col }}>{e.odo.toLocaleString()} km</div>}
                      </div>
                    </div>
                    {e.notes && <div style={{ fontSize: 11, color: T.mt, marginTop: 8, fontStyle: "italic" }}>"{e.notes}"</div>}
                  </div>
                ))}
              </MonthGroup>
            ))}
          </div>
        )}

      </main>

      {/* FOOTER NAV */}
      <nav style={{ position: "fixed", bottom: 0, width: "100%", background: T.sf, display: "flex", justifyContent: "space-around", padding: "10px 0 25px", borderTop: `1px solid ${T.br}`, zIndex: 200 }}>
        {[
          { id: "home", icon: "🏠", label: "Αρχική" },
          { id: "fuel", icon: "⛽", label: "Καύσιμο" },
          { id: "expenses", icon: "📋", label: "Έξοδα" },
          { id: "stats", icon: "📊", label: "Stats" },
          { id: "history", icon: "📅", label: "Ιστορικό" }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id)}
            style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: tab === item.id ? col : T.mt, cursor: "pointer" }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: "bold" }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS (VEHICLE INFO, ADD VEHICLE, BACKUP) */}
      <Modal open={showVInfo} onClose={() => setShowVInfo(false)} title="Στοιχεία Οχήματος" T={T}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>ΜΑΡΚΑ</label><input style={IS} value={av.info?.brand} onChange={e => updateVInfo("brand", e.target.value)} /></div>
          <div><label style={labelStyle}>ΜΟΝΤΕΛΟ</label><input style={IS} value={av.info?.model} onChange={e => updateVInfo("model", e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>ΠΙΝΑΚΙΔΑ</label><input style={IS} value={av.info?.plate} onChange={e => updateVInfo("plate", e.target.value)} /></div>
          <div><label style={labelStyle}>ΑΡ. ΠΛΑΙΣΙΟΥ</label><input style={IS} value={av.info?.chassis} onChange={e => updateVInfo("chassis", e.target.value)} /></div>
        </div>
        
        <h4 style={{ color: col, borderBottom: `1px solid ${T.br}`, paddingBottom: 5, marginTop: 20 }}>📅 Υπενθυμίσεις & Λήξεις</h4>
        {REMINDER_FIELDS.map(rf => (
          <div key={rf.f}>
            <label style={labelStyle}>{rf.icon} {rf.label}</label>
            <input type="date" style={IS} value={av.info?.[rf.f] || ""} onChange={e => updateVInfo(rf.f, e.target.value)} />
          </div>
        ))}

        <h4 style={{ color: col, borderBottom: `1px solid ${T.br}`, paddingBottom: 5, marginTop: 20 }}>🔧 Service & Ελαστικά</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>KM SERVICE</label><input type="number" style={IS} value={av.info?.serviceKm} onChange={e => updateVInfo("serviceKm", e.target.value)} /></div>
          <div><label style={labelStyle}>ΕΠΟΜΕΝΟ KM</label><input type="number" style={IS} value={av.info?.serviceNextKm} onChange={e => updateVInfo("serviceNextKm", e.target.value)} /></div>
        </div>
        
        <button onClick={() => setShowIO(true)} style={{ width: "100%", padding: 12, background: T.br, color: T.tx, border: "none", borderRadius: 10, marginTop: 20 }}>💾 BACKUP / ΕΞΑΓΩΓΗ</button>
      </Modal>

      <Modal open={showAddV} onClose={() => setShowAddV(false)} title="Προσθήκη Οχήματος" T={T}>
        <label style={labelStyle}>ΟΝΟΜΑ ΟΧΗΜΑΤΟΣ</label>
        <input style={IS} placeholder="π.χ. My Car" value={newV.name} onChange={e => setNewV({ ...newV, name: e.target.value })} />
        <label style={labelStyle}>ΧΡΩΜΑ</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {FUEL_COLORS.map(c => (
            <div 
              key={c} 
              onClick={() => setNewV({ ...newV, color: c })}
              style={{ width: 35, height: 35, borderRadius: "50%", background: c, border: newV.color === c ? "4px solid #fff" : "none", cursor: "pointer" }}
            />
          ))}
        </div>
        <button 
          onClick={() => { setVehicles([...vehicles, { ...newV, id: uid() }]); setShowAddV(false); }}
          style={{ width: "100%", padding: 16, background: newV.color, color: "#fff", border: "none", borderRadius: 12, fontWeight: "bold" }}
        >
          ΔΗΜΙΟΥΡΓΙΑ
        </button>
      </Modal>

      <Modal open={showIO} onClose={() => setShowIO(false)} title="Διαχείριση Δεδομένων" T={T}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <button 
            onClick={() => {
              const data = JSON.stringify({ vehicles, entries, expenses });
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `fuellog_backup_${today()}.json`; a.click();
            }}
            style={{ padding: 12, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: "bold" }}
          >
            ΕΞΑΓΩΓΗ (JSON)
          </button>
          <button 
             onClick={handleImport}
             style={{ padding: 12, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: "bold" }}
          >
            ΕΙΣΑΓΩΓΗ
          </button>
        </div>
        <label style={labelStyle}>ΕΠΙΚΟΛΛΗΣΗ JSON ΓΙΑ ΕΙΣΑΓΩΓΗ</label>
        <textarea 
          style={{ ...IS, height: 120, fontSize: 10 }} 
          value={importText} 
          onChange={e => setImportText(e.target.value)} 
          placeholder='{"vehicles": [...]}'
        />
        {importMsg && <div style={{ fontSize: 12, textAlign: "center", color: importMsg.includes("✅") ? "#10b981" : "#ef4444" }}>{importMsg}</div>}
      </Modal>

    </div>
  );
}
