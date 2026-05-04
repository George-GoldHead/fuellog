import React, { useState, useMemo, useEffect, useRef } from "react";

// ========== CONSTANTS ==========
const FUEL_COLORS = ["#f97316", "#3b82f6", "#10b981", "#e11d48", "#8b5cf6", "#06b6d4", "#eab308", "#ec4899"];
const VCATS = [
  { id: "car", label: "ΙΧ", icon: "🚗" }, { id: "taxi", label: "Taxi", icon: "🚕" },
  { id: "moto", label: "Μηχανή", icon: "🏍️" }, { id: "van", label: "Βαν", icon: "🚐" },
  { id: "ltruck", label: "Ελαφρύ Φορτηγό", icon: "🚚" }, { id: "truck", label: "Βαρύ Φορτηγό", icon: "🚛" },
  { id: "bus", label: "Λεωφορείο", icon: "🚌" },
];
const FTYPES = [
  { id: "unleaded95", label: "Αμόλυβδη 95", icon: "🟢" }, { id: "unleaded98", label: "Αμόλυβδη 98", icon: "🔵" },
  { id: "unleaded100", label: "Αμόλυβδη 100", icon: "🔷" }, { id: "diesel", label: "Diesel", icon: "🟡" },
  { id: "diesel_plus", label: "Diesel Plus", icon: "🟠" }, { id: "lpg", label: "Υγραέριο (LPG)", icon: "🟣" },
  { id: "cng", label: "Φυσικό Αέριο", icon: "⚪" },
];
const EXPENSE_CATS = [
  { id: "service", label: "Service", icon: "🔧" }, { id: "oil", label: "Λάδια/Φίλτρα", icon: "🛢️" },
  { id: "tyres", label: "Ελαστικά", icon: "⚫" }, { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "tolls", label: "Διόδια", icon: "🛣️" }, { id: "custom", label: "Άλλο", icon: "💸" },
];
const MONTHS_FULL = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
const MONTHS_SHORT = ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαΐ", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"];

// ========== UTILITIES ==========
const uid = () => Math.random().toString(36).substr(2, 9);
const fmt = (n, d = 2) => (n != null && !isNaN(n)) ? (+n).toFixed(d) : "0.00";
const today = () => new Date().toISOString().split("T")[0];
const formatDate = ds => {
  if (!ds) return "--/--/--";
  const d = new Date(ds);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
};
const daysUntil = ds => {
  if (!ds) return null;
  return Math.ceil((new Date(ds) - new Date(today())) / 86400000);
};

// ========== THEME ==========
const DK = { bg: "#080810", sf: "#10101c", br: "#1e1e30", tx: "#eeeeff", mt: "#7777aa", ft: "#33334a", inp: "#0d0d1a", ib: "#1e1e30" };
const LT = { bg: "#f0e8db", sf: "#faf3e8", br: "#d4c0a8", tx: "#1a1510", mt: "#5c4e3d", ft: "#e0d0bc", inp: "#ffffff", ib: "#c4b098" };

// ========== DEFAULT FACTORIES ==========
const defInfo = () => ({
  brand: "", model: "", year: "", cc: "", plate: "", chassis: "",
  insurance: "", insuranceExp: "", kteo: "", kek: "",
  tiresBrand: "", tiresSize: "", tiresDate: "", tiresNext: "",
  serviceDate: "", serviceNextDate: "", serviceKm: "", serviceNextKm: "", serviceNotes: "",
  driverMain: "", driverSecond: "",
});
const defV = (ov = {}) => ({ id: uid(), name: "ΝΕΟ ΟΧΗΜΑ", icon: "🚗", color: "#f97316", category: "car", fuelType: "diesel", fuelType2: "", unitMiles: false, info: defInfo(), ...ov });
const emptyFuel = ft => ({ date: today(), fuelType: ft || "diesel", ppl: "", total: "", odo: "", notes: "" });
const emptyExp = () => ({ date: today(), category: "tolls", label: "", amount: "", notes: "" });

// ========== COMPONENTS ==========
function RoundCyberGauge({ value, min, max, color, label, unit, T }) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const R = 42, cx = 52, cy = 52, sA = Math.PI * 0.7, eA = Math.PI * 2.3, vA = sA + (eA - sA) * pct;
  const nx = cx + (R - 11) * Math.cos(vA), ny = cy + (R - 11) * Math.sin(vA);
  return (
    <div style={{ background: "#0a0a0f", borderRadius: "50%", padding: 5, border: `2px solid ${color}`, width: "100%", aspectRatio: "1/1", position: "relative" }}>
      <svg viewBox="0 0 104 104">
        <path d={`M ${cx + R * Math.cos(sA)} ${cy + R * Math.sin(sA)} A ${R} ${R} 0 1 1 ${cx + R * Math.cos(eA)} ${cy + R * Math.sin(eA)}`} fill="none" stroke="#1e1e30" strokeWidth={6} strokeLinecap="round" />
        <path d={`M ${cx + R * Math.cos(sA)} ${cy + R * Math.sin(sA)} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={2.5} fill={color} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="900">{fmt(value, 1)}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#9999bb" fontSize={5.5}>{unit}</text>
      </svg>
      <div style={{ position: "absolute", bottom: 6, width: "100%", textAlign: "center", fontSize: 7, color, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children, T }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.sf, borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", color: T.mt, fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MonthGroup({ label, badge, total, isOpen, onToggle, T, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={onToggle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: isOpen ? T.br : T.sf, borderRadius: isOpen ? "12px 12px 0 0" : 12, cursor: "pointer", border: `1px solid ${T.br}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: "bold", fontSize: 14 }}>{label}</span>
          <span style={{ fontSize: 10, background: T.ft, padding: "2px 6px", borderRadius: 8 }}>{badge}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "#eab308", fontWeight: "bold" }}>{total}</span>
          <span>{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>
      {isOpen && <div style={{ border: `1px solid ${T.br}`, borderTop: "none", borderRadius: "0 0 12px 12px", background: T.bg }}>{children}</div>}
    </div>
  );
}

export default function FuelLog() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;
  const [vehicles, setVehicles] = useState([defV({ id: "v1", name: "ΕΤΑΙΡΙΚΟ" })]);
  const [vid, setVid] = useState("v1");
  const [entries, setEntries] = useState({});
  const [expenses, setExpenses] = useState({});
  const [tab, setTab] = useState("home");
  const [fY, setFY] = useState(String(new Date().getFullYear()));
  const [fM, setFM] = useState("all");
  const [openCat, setOpenCat] = useState({});
  const [fuelForm, setFuelForm] = useState(emptyFuel());
  const [expForm, setExpForm] = useState(emptyExp());
  const [showVInfo, setShowVInfo] = useState(false);
  const [showAddV, setShowAddV] = useState(false);
  const [newV, setNewV] = useState(defV());

  const av = vehicles.find(v => v.id === vid) || vehicles[0];
  const col = av.color;

  useEffect(() => {
    const s = localStorage.getItem("fuellog_data");
    if (s) { const d = JSON.parse(s); setVehicles(d.vehicles); setEntries(d.entries); setExpenses(d.expenses); setVid(d.vid); }
  }, []);
  useEffect(() => { localStorage.setItem("fuellog_data", JSON.stringify({ vehicles, entries, expenses, vid })); }, [vehicles, entries, expenses, vid]);

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
    const aP = filtFuel.length ? filtFuel.reduce((s, x) => s + (parseFloat(x.ppl) || 0), 0) / filtFuel.length : 0;
    return { fuelSpent, expSpent, totalSpent: fuelSpent + expSpent, tL, aP, aC: 7.5 }; // aC placeholder
  }, [filtFuel, filtExp]);

  const fuelByMonth = useMemo(() => {
    const map = {};
    allFuel.forEach(e => {
      const k = e.date.slice(0, 7);
      if (!map[k]) map[k] = { key: k, label: `${MONTHS_FULL[parseInt(k.slice(5)) - 1]} ${k.slice(0, 4)}`, entries: [], total: 0 };
      map[k].entries.push(e); map[k].total += parseFloat(e.total) || 0;
    });
    return Object.values(map);
  }, [allFuel]);

  const expByMonth = useMemo(() => {
    const map = {};
    allExp.forEach(e => {
      const k = e.date.slice(0, 7);
      if (!map[k]) map[k] = { key: k, label: `${MONTHS_FULL[parseInt(k.slice(5)) - 1]} ${k.slice(0, 4)}`, entries: [], total: 0 };
      map[k].entries.push(e); map[k].total += parseFloat(e.amount) || 0;
    });
    return Object.values(map);
  }, [allExp]);

  const updateVInfo = (f, val) => setVehicles(p => p.map(v => v.id === vid ? { ...v, info: { ...v.info, [f]: val } } : v));

  const IS = { width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, background: T.inp, color: T.tx, border: `1px solid ${T.ib}`, boxSizing: "border-box" };
  const CS = (extra = {}) => ({ background: T.sf, padding: 14, borderRadius: 14, border: `1px solid ${T.br}`, ...extra });

  return (
    <div style={{ backgroundColor: T.bg, color: T.tx, minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: 80 }}>
      <header style={{ padding: 15, background: T.sf, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 18 }}>FuelLog</b>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowVInfo(true)} style={{ background: T.br, border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8 }}>🔧 Στοιχεία</button>
          <button onClick={() => setDark(!dark)} style={{ border: "none", background: "none", fontSize: 20 }}>{dark ? "☀️" : "🌙"}</button>
        </div>
      </header>

      <main style={{ padding: 15 }}>
        {tab === "home" && (
          <div>
            <div style={CS()}>
              <div style={{ fontSize: 12, color: T.mt }}>ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ ({av.name})</div>
              <div style={{ fontSize: 32, fontWeight: "bold", color: "#eab308" }}>{fmt(stats.totalSpent)}€</div>
            </div>
            {/* Gauges */}
            <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
              <RoundCyberGauge value={stats.aP} min={1.2} max={2.2} color="#f97316" label="ΜΕΣΗ ΤΙΜΗ" unit="€/L" T={T} />
              <RoundCyberGauge value={stats.aC} min={4} max={12} color="#10b981" label="ΚΑΤΑΝΑΛΩΣΗ" unit="L/100" T={T} />
            </div>
          </div>
        )}

        {tab === "fuel" && (
          <div style={CS()}>
            <h3>⛽ Νέο Γέμισμα</h3>
            <input type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} style={IS} />
            <input type="number" placeholder="€/Λίτρο" value={fuelForm.ppl} onChange={e => setFuelForm({ ...fuelForm, ppl: e.target.value })} style={IS} />
            <input type="number" placeholder="Συνολικό Ποσό €" value={fuelForm.total} onChange={e => setFuelForm({ ...fuelForm, total: e.target.value })} style={IS} />
            <input type="number" placeholder="Χιλιόμετρα (ODO)" value={fuelForm.odo} onChange={e => setFuelForm({ ...fuelForm, odo: e.target.value })} style={IS} />
            <button onClick={() => {
              const liters = fuelForm.ppl > 0 ? fuelForm.total / fuelForm.ppl : 0;
              setEntries(p => ({ ...p, [vid]: [...(p[vid] || []), { ...fuelForm, id: uid(), liters }] }));
              setFuelForm(emptyFuel()); setTab("history");
            }} style={{ width: "100%", padding: 15, background: col, border: "none", borderRadius: 10, color: "#fff", fontWeight: "bold" }}>ΑΠΟΘΗΚΕΥΣΗ</button>
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 15 }}>
              <select value={fY} onChange={e => setFY(e.target.value)} style={IS}>
                <option value="all">Όλα τα έτη</option>
                {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={fM} onChange={e => setFM(e.target.value)} style={IS}>
                <option value="all">Όλοι οι μήνες</option>
                {MONTHS_SHORT.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
              </select>
            </div>

            {/* ΠΤΥΣΣΟΜΕΝΗ ΚΑΤΑΝΟΜΗ ΑΝΑ ΜΗΝΑ ΣΤΑ STATS */}
            <h4 style={{ color: T.mt, marginBottom: 10 }}>📊 Κατανομή ανά Μήνα</h4>
            {fuelByMonth.filter(m => fY === "all" || m.key.startsWith(fY)).map(m => (
              <MonthGroup key={m.key} label={m.label} badge={`${m.entries.length} κινήσεις`} total={`${fmt(m.total)}€`} isOpen={!!openCat[m.key]} onToggle={() => setOpenCat(p => ({ ...p, [m.key]: !p[m.key] }))} T={T}>
                <div style={{ padding: 15 }}>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span>Καύσιμα: {fmt(m.total)}€</span>
                      <span>Άλλα: {fmt(allExp.filter(e => e.date.startsWith(m.key)).reduce((s, x) => s + x.amount, 0))}€</span>
                   </div>
                   <div style={{ height: 6, background: T.ft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: col, width: "70%" }}></div>
                   </div>
                </div>
              </MonthGroup>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div>
            {fuelByMonth.map(m => (
              <MonthGroup key={m.key} label={m.label} total={`${fmt(m.total)}€`} T={T} isOpen={true}>
                {m.entries.map(e => (
                  <div key={e.id} style={{ padding: 12, borderBottom: `1px solid ${T.ft}`, display: "flex", justifyContent: "space-between" }}>
                    <div><b>{fmt(e.total)}€</b> <small style={{ color: T.mt }}>({fmt(e.liters)}L)</small></div>
                    <div style={{ fontSize: 12 }}>{formatDate(e.date)}</div>
                  </div>
                ))}
              </MonthGroup>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER NAV */}
      <nav style={{ position: "fixed", bottom: 0, width: "100%", display: "flex", background: T.sf, borderTop: `1px solid ${T.br}`, padding: "10px 0" }}>
        {["home", "fuel", "stats", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", background: "none", color: tab === t ? col : T.mt, fontWeight: tab === t ? "bold" : "normal" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* MODAL ΣΤΟΙΧΕΙΩΝ ΟΧΗΜΑΤΟΣ - ΟΛΑ ΤΑ ΠΕΔΙΑ ΕΠΑΝΗΛΘΑΝ */}
      <Modal open={showVInfo} onClose={() => setShowVInfo(false)} title="Στοιχεία Οχήματος" T={T}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 10 }}>ΜΑΡΚΑ</label><input style={IS} value={av.info.brand} onChange={e => updateVInfo("brand", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΜΟΝΤΕΛΟ</label><input style={IS} value={av.info.model} onChange={e => updateVInfo("model", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΕΤΟΣ</label><input style={IS} value={av.info.year} onChange={e => updateVInfo("year", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>CC</label><input style={IS} value={av.info.cc} onChange={e => updateVInfo("cc", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΠΙΝΑΚΙΔΑ</label><input style={IS} value={av.info.plate} onChange={e => updateVInfo("plate", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΑΡ. ΠΛΑΙΣΙΟΥ</label><input style={IS} value={av.info.chassis} onChange={e => updateVInfo("chassis", e.target.value)} /></div>
        </div>
        <hr style={{ borderColor: T.br, margin: "10px 0" }} />
        <label style={{ fontSize: 10 }}>ΑΣΦΑΛΕΙΑ (ΕΤΑΙΡΕΙΑ)</label><input style={IS} value={av.info.insurance} onChange={e => updateVInfo("insurance", e.target.value)} />
        <label style={{ fontSize: 10 }}>ΛΗΞΗ ΑΣΦΑΛΕΙΑΣ</label><input type="date" style={IS} value={av.info.insuranceExp} onChange={e => updateVInfo("insuranceExp", e.target.value)} />
        <label style={{ fontSize: 10 }}>ΚΤΕΟ</label><input type="date" style={IS} value={av.info.kteo} onChange={e => updateVInfo("kteo", e.target.value)} />
        
        <hr style={{ borderColor: T.br, margin: "10px 0" }} />
        <h4 style={{ margin: "0 0 10px 0" }}>🔧 Service & Ελαστικά</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 10 }}>ΜΑΡΚΑ ΕΛΑΣΤ.</label><input style={IS} value={av.info.tiresBrand} onChange={e => updateVInfo("tiresBrand", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΔΙΑΣΤΑΣΗ</label><input style={IS} value={av.info.tiresSize} onChange={e => updateVInfo("tiresSize", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>KM SERVICE</label><input style={IS} value={av.info.serviceKm} onChange={e => updateVInfo("serviceKm", e.target.value)} /></div>
          <div><label style={{ fontSize: 10 }}>ΕΠΟΜΕΝΟ (KM)</label><input style={IS} value={av.info.serviceNextKm} onChange={e => updateVInfo("serviceNextKm", e.target.value)} /></div>
        </div>
        <button onClick={() => setShowVInfo(false)} style={{ width: "100%", padding: 12, background: col, color: "#fff", border: "none", borderRadius: 8, marginTop: 10 }}>ΑΠΟΘΗΚΕΥΣΗ</button>
      </Modal>
    </div>
  );
}
