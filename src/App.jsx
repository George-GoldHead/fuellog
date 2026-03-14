  import React, { useState, useMemo, useEffect } from "react";

// --- CONFIGURATION ---
const STATIONS = [
  { id: "aegean", label: "Aegean", bg: "#0057a8", fg: "#fff" },
  { id: "avin", label: "Avin", bg: "#ff6600", fg: "#fff" },
  { id: "bp", label: "BP", bg: "#00a650", fg: "#fff" },
  { id: "eko", label: "ΕΚΟ", bg: "#e30613", fg: "#fff" },
  { id: "eteka", label: "ΕΤΕΚΑ", bg: "#1a5fa8", fg: "#fff" },
  { id: "revoil", label: "Revoil", bg: "#0055a5", fg: "#fff" },
  { id: "shell", label: "Shell", bg: "#f5d000", fg: "#000" },
  { id: "other", label: "Άλλο", bg: "#555", fg: "#fff" },
];

const FTYPES = [
  { id: "unleaded95", label: "95", icon: "🟢", color: "#10b981" },
  { id: "unleaded100", label: "100", icon: "🔵", color: "#3b82f6" },
  { id: "diesel", label: "Diesel", icon: "🟡", color: "#eab308" },
  { id: "lpg", label: "LPG", icon: "🟣", color: "#a78bfa" },
];

const RTYPES = [
  { id: "kteo", label: "ΚΤΕΟ", icon: "📋", color: "#ef4444" },
  { id: "insurance", label: "Ασφάλεια", icon: "🛡️", color: "#3b82f6" },
  { id: "emissions", label: "Κάρτα Καυσαερίων", icon: "💨", color: "#10b981" },
  { id: "service", label: "Service", icon: "🔧", color: "#f59e0b" },
];

const EXPCATS = [
  { id: "parking", label: "Parking", icon: "🅿️", color: "#6366f1" },
  { id: "tolls", label: "Διόδια", icon: "🛣️", color: "#8b5cf6" },
  { id: "wash", label: "Πλύσιμο", icon: "🧼", color: "#06b6d4" },
  { id: "other", label: "Άλλο", icon: "💸", color: "#71717a" },
];

const DK = { bg: "#050508", sf: "#11111d", br: "#3b82f6", tx: "#f8fafc", mt: "#94a3b8", ft: "#64748b", inp: "#0a0a14", ib: "#1e293b" };
const LT = { bg: "#f1f5f9", sf: "#ffffff", br: "#3b82f6", tx: "#0f172a", mt: "#475569", ft: "#94a3b8", inp: "#ffffff", ib: "#cbd5e1" };

// --- COMPONENTS ---
function SVGChart({ points, color }) {
  if (!points || points.length < 2) return null;
  const W = 400, H = 120, P = 30;
  const vals = points.map(p => p.y);
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = (maxV - minV) || 1;
  const getX = (i) => P + (i / (points.length - 1)) * (W - P * 2);
  const getY = (v) => H - P - ((v - minV) / range) * (H - P * 2);
  const pathData = points.map((p, i) => (i === 0 ? "M" : "L") + getX(i) + "," + getY(p.y)).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140, overflow: "visible" }}>
      <path d={pathData} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
      {points.map((p, i) => <circle key={i} cx={getX(i)} cy={getY(p.y)} r={7} fill={color} stroke="#fff" strokeWidth={3} />)}
    </svg>
  );
}

function ChartBlock({ title, data, dk, color, T, unit }) {
  const pts = data.filter(d => d[dk] != null).map(d => ({ x: d.date, y: parseFloat(d[dk]) }));
  if (pts.length < 2) return null;
  const current = pts[pts.length - 1].y;

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 15 }}>
        <span style={{ fontSize: 13, color: color, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: T.tx }}>{current.toFixed(2)}<small style={{ fontSize: 11, marginLeft: 5, opacity: 0.7 }}>{unit}</small></span>
      </div>
      {/* VIVID BORDERS & NEON EFFECT */}
      <div style={{ 
        background: T.sf, 
        borderRadius: 30, 
        padding: "30px 20px 15px", 
        border: `4px solid ${color}`, 
        boxShadow: `0 0 25px ${color}44`,
        position: "relative"
      }}>
        <SVGChart points={pts} color={color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, opacity: 0.8, fontSize: 11, fontWeight: 900 }}>
          <span>{pts[0].x}</span>
          <span>{pts[pts.length - 1].x}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const T = dark ? DK : LT;
  const [tab, setTab] = useState("add");
  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(null);

  const [fuel, setFuel] = useState({ date: new Date().toISOString().split("T")[0], liters: "", ppl: "", total: "", fuelType: "unleaded95", station: "avin", km: "" });
  const [extra, setExtra] = useState({ date: new Date().toISOString().split("T")[0], amount: "", note: "", km: "" });

  useEffect(() => {
    const saved = localStorage.getItem("fuellog_data_v2");
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("fuellog_data_v2", JSON.stringify(entries));
  }, [entries]);

  const handleFuel = (f, v) => {
    let u = { ...fuel, [f]: v };
    if (f === "liters" && u.ppl) u.total = (v * u.ppl).toFixed(2);
    if (f === "ppl" && u.liters) u.total = (v * u.liters).toFixed(2);
    if (f === "total" && u.liters) u.ppl = (v / u.liters).toFixed(3);
    setFuel(u);
  };

  const saveFuel = () => {
    if (!fuel.total) return;
    setEntries([...entries, { ...fuel, id: Math.random(), type: "fuel", total: parseFloat(fuel.total), liters: parseFloat(fuel.liters), ppl: parseFloat(fuel.ppl) }]);
    setTab("history");
  };

  const saveExtra = () => {
    setEntries([...entries, { ...extra, id: Math.random(), type: modal.type, catId: modal.id, label: modal.label, amount: parseFloat(extra.amount) || 0 }]);
    setModal(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.tx, fontFamily: "sans-serif", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ padding: "30px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Fuel<span style={{ color: T.br }}>Log</span></h1>
        <button onClick={() => setDark(!dark)} style={{ border: "none", background: T.sf, width: 45, height: 45, borderRadius: 15, fontSize: 20 }}>{dark ? "☀️" : "🌙"}</button>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 20px 30px" }}>
        {["add", "stats", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: 16, borderRadius: 20, border: "none", fontWeight: 900, background: tab === t ? T.br : T.sf, color: tab === t ? "#fff" : T.mt }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding: "0 20px 100px" }}>
        {tab === "add" && (
          <>
            <div style={{ background: T.sf, padding: 25, borderRadius: 35, border: `1px solid ${T.ib}` }}>
              <div style={{ display: "grid", gap: 20 }}>
                <input type="date" value={fuel.date} onChange={e => handleFuel("date", e.target.value)} style={{ padding: 15, borderRadius: 15, background: T.inp, color: T.tx, border: `1px solid ${T.ib}` }} />
                <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                  {STATIONS.map(s => (
                    <button key={s.id} onClick={() => handleFuel("station", s.id)} style={{ padding: "10px 15px", borderRadius: 12, background: s.bg, color: s.fg, border: fuel.station === s.id ? `3px solid #fff` : "none", fontWeight: 800 }}>{s.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="number" placeholder="Liters" value={fuel.liters} onChange={e => handleFuel("liters", e.target.value)} style={{ flex: 1, padding: 15, borderRadius: 15, background: T.inp, color: T.tx, border: `1px solid ${T.ib}` }} />
                  <input type="number" placeholder="€/L" value={fuel.ppl} onChange={e => handleFuel("ppl", e.target.value)} style={{ flex: 1, padding: 15, borderRadius: 15, background: T.inp, color: T.tx, border: `1px solid ${T.ib}` }} />
                </div>
                <input type="number" placeholder="Total €" value={fuel.total} onChange={e => handleFuel("total", e.target.value)} style={{ padding: 20, borderRadius: 20, background: T.inp, color: T.br, border: `3px solid ${T.br}`, fontSize: 28, fontWeight: 900, textAlign: "center" }} />
                <button onClick={saveFuel} style={{ padding: 22, borderRadius: 25, background: T.br, color: "#fff", border: "none", fontWeight: 900, fontSize: 18 }}>ΑΠΟΘΗΚΕΥΣΗ</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 30 }}>
              {[...RTYPES, ...EXPCATS].map(c => (
                <button key={c.id} onClick={() => setModal({ ...c, type: RTYPES.includes(c) ? "reminder" : "expense" })} style={{ background: T.sf, padding: 15, borderRadius: 22, border: `1px solid ${T.ib}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 24 }}>{c.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: T.tx }}>{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "stats" && (
          <div style={{ paddingTop: 10 }}>
            <ChartBlock title="Τιμή Καυσίμου" data={entries.filter(e => e.type === "fuel")} dk="ppl" color="#3b82f6" T={T} unit="€/L" />
            <ChartBlock title="Κόστος Γεμίσματος" data={entries.filter(e => e.type === "fuel")} dk="total" color="#f97316" T={T} unit="€" />
            <ChartBlock title="Λίτρα" data={entries.filter(e => e.type === "fuel")} dk="liters" color="#10b981" T={T} unit="L" />
          </div>
        )}

        {tab === "history" && (
          <div style={{ display: "grid", gap: 12 }}>
            {entries.slice().reverse().map(e => (
              <div key={e.id} style={{ background: T.sf, padding: 20, borderRadius: 25, border: `1px solid ${T.ib}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 14, fontWeight: 900 }}>{e.date}</div><div style={{ fontSize: 11, color: T.mt }}>{e.label || STATIONS.find(s => s.id === e.station)?.label}</div></div>
                <div style={{ fontSize: 20, fontWeight: 900, color: T.br }}>€{(e.total || e.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}>
          <div style={{ background: T.sf, width: "100%", padding: 30, borderRadius: "35px 35px 0 0", borderTop: `5px solid ${modal.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><h2 style={{ margin: 0 }}>{modal.icon} {modal.label}</h2><button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: T.tx, fontSize: 24 }}>✕</button></div>
            <div style={{ display: "grid", gap: 15 }}>
              <input type="date" value={extra.date} onChange={e => setExtra({ ...extra, date: e.target.value })} style={{ padding: 18, borderRadius: 15, background: T.inp, color: T.tx, border: `1px solid ${T.ib}` }} />
              <input type="number" placeholder="Ποσό €" value={extra.amount} onChange={e => setExtra({ ...extra, amount: e.target.value })} style={{ padding: 18, borderRadius: 15, background: T.inp, color: T.tx, border: `1px solid ${T.ib}`, fontSize: 20, fontWeight: 900 }} />
              <button onClick={saveExtra} style={{ padding: 20, borderRadius: 20, background: modal.color, color: "#fff", border: "none", fontWeight: 900 }}>SAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
