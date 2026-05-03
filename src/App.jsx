// --- Προσθήκη βοηθητικής συνάρτησης για το format ημερομηνίας ---
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
};

// --- Στο τμήμα του Ιστορικού (History Tab) ---
// Εκεί που κάνεις map τις εγγραφές καυσίμου (allFuel):
{allFuel.slice().reverse().map((e, index, array) => {
  // Υπολογισμός χιλιομέτρων από το προηγούμενο γέμισμα
  // Επειδή έχουμε κάνει reverse, το "προηγούμενο" χρονικά είναι το επόμενο στον πίνακα array
  const prevEntry = array[index + 1];
  const distance = (e.odo && prevEntry && prevEntry.odo) ? (e.odo - prevEntry.odo) : null;

  return (
    <div key={e.id} style={{ /* το στυλ σου */ }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* Αλλαγή format ημερομηνίας */}
        <span style={{ fontSize: 12, fontWeight: "bold" }}>{formatDate(e.date)}</span>
        
        {/* Εμφάνιση χιλιομέτρων διαδρομής αν υπάρχουν */}
        {distance && (
          <span style={{ fontSize: 11, color: "#aaa" }}>
             📍 {distance} χλμ
          </span>
        )}
      </div>
      {/* Υπόλοιπα στοιχεία εγγραφής... */}
    </div>
  );
})}

// --- Διόρθωση στα Στατιστικά (Stats Logic) ---
const stats = useMemo(() => {
  if (!filtFuel.length && !filtExp.length) return null;

  // Χρήση parseFloat και || 0 για αποφυγή NaN
  const fuelSpent = filtFuel.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
  const expSpent = filtExp.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const tL = filtFuel.reduce((s, x) => s + (parseFloat(x.liters) || 0), 0);
  
  // Υπολογισμός μέσης τιμής με ασφάλεια
  const wP = filtFuel.filter(x => parseFloat(x.ppl) > 0);
  const aP = wP.length ? wP.reduce((s, x) => s + parseFloat(x.ppl), 0) / wP.length : null;

  return {
    fuelSpent,
    expSpent,
    totalSpent: fuelSpent + expSpent,
    tL,
    aP,
    // ... τα υπόλοιπα stats
  };
}, [filtFuel, filtExp]);
