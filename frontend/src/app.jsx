import { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { getExpenses, addExpense, deleteExpense, getInsights } from './api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/* ── Constants ── */
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other'];
const PALETTE    = ['#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c','#facc15','#94a3b8'];
const CAT_COLOR  = { Food:'#34d399', Transport:'#60a5fa', Shopping:'#f472b6', Entertainment:'#a78bfa', Health:'#fb923c', Bills:'#facc15', Other:'#94a3b8' };
const today      = () => new Date().toISOString().split('T')[0];

/* ════════════════════════════════════════
   EXPENSE FORM
════════════════════════════════════════ */
function ExpenseForm({ onAdded }) {
  const [form, setForm]     = useState({ amount: '', category: 'Food', description: '', date: today() });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Please enter a valid amount.'); return;
    }
    setError(''); setLoading(true);
    try {
      await addExpense({ ...form, amount: parseFloat(form.amount) });
      setForm({ amount: '', category: 'Food', description: '', date: today() });
      onAdded();
    } catch { setError('Failed to add expense. Is the server running?'); }
    finally   { setLoading(false); }
  };

  return (
    <div style={s.card}>
      <h2 style={s.cardTitle}>Add Expense</h2>
      <form onSubmit={handleSubmit} style={s.formGrid}>

        <div style={s.fieldGroup}>
          <label style={s.label}>Amount (₹)</label>
          <div style={{ position:'relative' }}>
            <span style={s.rupee}>₹</span>
            <input type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount} onChange={set('amount')} required
              style={{ ...s.input, paddingLeft:'1.8rem' }} />
          </div>
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>Category</label>
          <select value={form.category} onChange={set('category')} style={s.input}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ ...s.fieldGroup, gridColumn:'1/-1' }}>
          <label style={s.label}>Description</label>
          <input type="text" placeholder="Short note..."
            value={form.description} onChange={set('description')} style={s.input} />
        </div>

        <div style={s.fieldGroup}>
          <label style={s.label}>Date</label>
          <input type="date" value={form.date} onChange={set('date')} required style={s.input} />
        </div>

        {error && <p style={{ ...s.error, gridColumn:'1/-1' }}>{error}</p>}

        <button type="submit" disabled={loading}
          style={{ ...s.submitBtn, gridColumn:'1/-1', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Adding…' : '+ Add Expense'}
        </button>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════
   EXPENSE LIST
════════════════════════════════════════ */
function ExpenseList({ expenses, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteExpense(id); onDeleted(); }
    catch { alert('Could not delete.'); }
    finally { setDeletingId(null); }
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div style={s.card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ ...s.cardTitle, marginBottom:0 }}>Expenses</h2>
        <span style={s.totalBadge}>Total: ₹{total.toFixed(2)}</span>
      </div>

      {!expenses.length
        ? <p style={{ color:'#64748b', textAlign:'center', padding:'2rem 0' }}>No expenses yet. Add one above!</p>
        : <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Date','Category','Description','Amount',''].map(h => (
                    <th key={h} style={{ ...s.th, textAlign: h==='Amount' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} style={s.tr}>
                    <td style={{ ...s.td, fontFamily:'monospace', color:'#64748b', fontSize:'0.8rem' }}>{exp.date}</td>
                    <td style={s.td}>
                      <span style={{ ...s.pill, background: CAT_COLOR[exp.category]+'22', color: CAT_COLOR[exp.category] }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ ...s.td, color:'#94a3b8' }}>{exp.description || '—'}</td>
                    <td style={{ ...s.td, textAlign:'right', fontFamily:'monospace', color:'#34d399', fontWeight:600 }}>
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                    <td style={s.td}>
                      <button onClick={() => handleDelete(exp.id)} disabled={deletingId===exp.id} style={s.deleteBtn}>
                        {deletingId===exp.id ? '…' : '✕'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}

/* ════════════════════════════════════════
   CHARTS
════════════════════════════════════════ */
function Charts({ expenses }) {
  if (!expenses.length) return null;

  const catMap = {};
  expenses.forEach(({ category, amount }) => { catMap[category] = (catMap[category]||0) + Number(amount); });

  const dayMap = {};
  expenses.forEach(({ date, amount }) => { dayMap[date] = (dayMap[date]||0) + Number(amount); });
  const sortedDays = Object.keys(dayMap).sort();

  const pieData = {
    labels: Object.keys(catMap),
    datasets: [{ data: Object.values(catMap), backgroundColor: Object.keys(catMap).map((_,i)=>PALETTE[i%PALETTE.length]), borderColor:'#0f172a', borderWidth:2 }],
  };

  const barData = {
    labels: sortedDays,
    datasets: [{ label:'Daily Total (₹)', data: sortedDays.map(d=>dayMap[d]), backgroundColor:'#34d399cc', borderColor:'#34d399', borderWidth:2, borderRadius:6 }],
  };

  const chartOpts = (isBar) => ({
    plugins: { legend: { position: isBar ? 'top' : 'bottom', labels: { color:'#cbd5e1', font:{ size:11 }, padding:12 } } },
    ...(isBar ? { scales: { x:{ ticks:{color:'#94a3b8'}, grid:{color:'#1e3148'} }, y:{ ticks:{color:'#94a3b8'}, grid:{color:'#1e3148'} } } } : {}),
  });

  return (
    <div style={s.card}>
      <h2 style={s.cardTitle}>Spending Overview</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'center' }}>
        <div>
          <p style={s.label}>By Category</p>
          <Pie data={pieData} options={chartOpts(false)} />
        </div>
        <div>
          <p style={s.label}>Daily Totals</p>
          <Bar data={barData} options={chartOpts(true)} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   INSIGHTS PANEL
════════════════════════════════════════ */
function InsightsPanel() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { const { data } = await getInsights(); setInsights(data.insights || []); }
    catch { setError('Could not load AI insights.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={s.card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ ...s.cardTitle, marginBottom:0 }}>✨ AI Insights</h2>
        <button onClick={load} disabled={loading} style={s.refreshBtn}>{loading ? '⏳' : '↻'}</button>
      </div>

      {loading && <p style={{ color:'#64748b', fontSize:'0.875rem' }}>⏳ Asking Gemini…</p>}
      {error   && <p style={s.error}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {insights.map((text, i) => (
            <li key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
              <span>{['💡','📊','🔍'][i]}</span>
              <span style={{ fontSize:'0.875rem', lineHeight:1.5 }}>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const s = {
  card:       { background:'#0f1c2e', border:'1px solid #1e3148', borderRadius:14, padding:'1.5rem' },
  cardTitle:  { fontFamily:'Georgia, serif', fontSize:'1.2rem', color:'#e2e8f0', marginBottom:'1.25rem' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.9rem' },
  fieldGroup: { display:'flex', flexDirection:'column', gap:'0.35rem' },
  label:      { fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#64748b' },
  input:      { background:'#162237', border:'1px solid #1e3148', borderRadius:8, padding:'0.6rem 0.8rem', color:'#e2e8f0', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', width:'100%' },
  rupee:      { position:'absolute', left:'0.8rem', top:'50%', transform:'translateY(-50%)', color:'#34d399', fontWeight:600, pointerEvents:'none' },
  submitBtn:  { background:'#34d399', color:'#042a1a', fontWeight:700, fontSize:'0.9rem', border:'none', borderRadius:8, padding:'0.7rem 1rem', cursor:'pointer' },
  error:      { color:'#f87171', fontSize:'0.82rem' },
  totalBadge: { fontFamily:'monospace', fontSize:'0.85rem', color:'#34d399', background:'#1a3a2a', padding:'0.3rem 0.75rem', borderRadius:20 },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' },
  th:         { fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#64748b', padding:'0 0.75rem 0.75rem', borderBottom:'1px solid #1e3148' },
  td:         { padding:'0.7rem 0.75rem', borderBottom:'1px solid #1e3148', verticalAlign:'middle' },
  tr:         {},
  pill:       { display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.75rem', fontWeight:600 },
  deleteBtn:  { background:'none', border:'1px solid transparent', color:'#64748b', cursor:'pointer', borderRadius:6, width:28, height:28, fontSize:'0.75rem' },
  refreshBtn: { background:'#162237', border:'1px solid #1e3148', color:'#64748b', width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:'1rem' },
};

/* ════════════════════════════════════════
   APP (main)
════════════════════════════════════════ */
export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchExpenses = async () => {
    try { const { data } = await getExpenses(); setExpenses(data); }
    catch { /* server might not be up yet */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  return (
    <div style={{ background:'#080f1a', minHeight:'100vh', fontFamily:"'DM Sans', sans-serif", color:'#e2e8f0' }}>

      {/* Header */}
      <header style={{ background:'#0d1f35', borderBottom:'1px solid #1e3148', padding:'1.25rem 2rem' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <span style={{ background:'#1a3a2a', color:'#34d399', width:40, height:40, borderRadius:10, display:'grid', placeItems:'center', fontWeight:700, fontSize:'1.1rem' }}>₹</span>
            <h1 style={{ fontFamily:'Georgia, serif', fontSize:'1.5rem', letterSpacing:'-0.02em' }}>ExpenseIQ</h1>
          </div>
          <p style={{ marginLeft:'auto', fontSize:'0.8rem', color:'#64748b', letterSpacing:'0.08em', textTransform:'uppercase' }}>Track · Analyse · Improve</p>
        </div>
      </header>

      {/* Main grid */}
      <main style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'1.5rem', maxWidth:1280, margin:'1.75rem auto', padding:'0 1.5rem', alignItems:'start' }}>
        
        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <ExpenseForm onAdded={fetchExpenses} />
          <InsightsPanel />
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {loading
            ? <p style={{ color:'#64748b', textAlign:'center', padding:'3rem' }}>Loading expenses…</p>
            : <>
                <Charts      expenses={expenses} />
                <ExpenseList expenses={expenses} onDeleted={fetchExpenses} />
              </>
          }
        </div>
      </main>
    </div>
  );
}