import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { getAudioContext, playZenChime, playSingingBowl } from '../utils/zenAudio';

/* ─────────────────────────────────────────────────────────────
   SVG ICONS (inline to avoid fa6 naming issues)
───────────────────────────────────────────────────────────── */
const Icon = {
  Dashboard:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Books:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Comments:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Analytics:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Logout:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Close:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Heart:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Users:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Link:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Eye:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  TrendUp:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

/* ─────────────────────────────────────────────────────────────
   MINI SPARKLINE CHART (pure SVG, no library needed)
───────────────────────────────────────────────────────────── */
function Sparkline({ data, color = '#00ff9d', width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <polyline fill={`url(#sg-${color.replace('#','')})`} stroke="none"
        points={`0,${height} ${pts} ${width},${height}`}/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   BAR CHART (pure SVG)
───────────────────────────────────────────────────────────── */
function BarChart({ data, color = '#00ff9d' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;
  return (
    <svg width="100%" height="140" style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const pct = d.value / max;
        const barH = pct * 110;
        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        return (
          <g key={i}>
            <rect x={`${x}%`} y={140 - barH - 20} width={`${w}%`} height={barH}
              rx="4" fill={color} fillOpacity={0.15 + pct * 0.5}/>
            <text x={`${x + w/2}%`} y="138" textAnchor="middle"
              fill="#555" fontSize="10" fontFamily="inherit">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   DONUT CHART (pure SVG)
───────────────────────────────────────────────────────────── */
function DonutChart({ slices, size = 110 }) {
  const r = 38; const cx = size / 2; const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => {
        const dash = (s.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference / total}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"/>
        );
        offset += s.value;
        return el;
      })}
      <circle cx={cx} cy={cy} r={28} fill="rgba(0,0,0,0.6)"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color = '#00ff9d', sparkData, icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      padding: '1.6rem 1.8rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = `${color}44`}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{label}</p>
          <h3 style={{ margin: '0.4rem 0 0 0', fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</h3>
          {sub && <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: color, fontWeight: 600 }}>{sub}</p>}
        </div>
        {icon && <div style={{ color, opacity: 0.6 }}>{icon}</div>}
      </div>
      {sparkData && <Sparkline data={sparkData} color={color} width={140}/>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOGIN SCREEN
───────────────────────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    getAudioContext();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      playSingingBowl(329.63, 3.0, 0.6);
      onLogin();
    } catch (err) {
      setError(err.message);
      playZenChime(196.00, 0.5, 0.4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,157,0.04) 0%, #000 60%)',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', padding: '2.5rem',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px',
        backdropFilter: 'blur(30px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,157,0.05)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #00ff9d22, #00ff9d44)',
            border: '1px solid rgba(0,255,157,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem'
          }}>🧘</div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Sanctuary Control</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#555', fontSize: '0.85rem' }}>Admin access only</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,0,85,0.08)', border: '1px solid rgba(255,0,85,0.2)',
            borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
            fontSize: '0.82rem', color: '#ff4477', textAlign: 'center'
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Email', type: 'email', value: email, onChange: e => setEmail(e.target.value), placeholder: 'admin@sanctuary.com' },
            { label: 'Password', type: 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: '••••••••' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={f.onChange} placeholder={f.placeholder} required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', color: '#fff', padding: '0.85rem 1rem',
                  fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.3s',
                }}
                onFocus={e => e.target.style.borderColor = '#00ff9d'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            marginTop: '0.5rem',
            background: loading ? 'rgba(0,255,157,0.4)' : '#00ff9d',
            color: '#000', border: 'none', padding: '0.9rem',
            borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s', letterSpacing: '0.5px',
          }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',     icon: 'Dashboard'  },
  { id: 'analytics',  label: 'Analytics',    icon: 'Analytics'  },
  { id: 'books',      label: 'Affiliate Mgr',icon: 'Books'      },
];

function Sidebar({ active, onNav, email, onLogout }) {
  return (
    <aside className="admin-sidebar" style={{
      width: '230px', flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
      background: 'rgba(255,255,255,0.015)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.8rem 1.6rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00ff9d22, #00ff9d55)',
            border: '1px solid rgba(0,255,157,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem'
          }}>🧘</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Sanctuary</div>
            <div style={{ fontSize: '0.68rem', color: '#00ff9d', fontWeight: 600, letterSpacing: '1px' }}>CONTROL PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1.2rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0.7rem 1rem', borderRadius: '12px', border: 'none',
              background: isActive ? 'rgba(0,255,157,0.1)' : 'transparent',
              color: isActive ? '#00ff9d' : '#555',
              cursor: 'pointer', fontSize: '0.88rem', fontWeight: isActive ? 700 : 500,
              transition: 'all 0.2s', width: '100%', textAlign: 'left',
              borderLeft: isActive ? '2px solid #00ff9d' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent'; }}}
            >
              {Icon[item.icon]()}
              {item.label}
            </button>
          );
        })}
        
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '1rem 0' }} />
        
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0.7rem 1rem', borderRadius: '12px', border: 'none',
          background: 'transparent',
          color: '#555',
          textDecoration: 'none',
          cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
          transition: 'all 0.2s', width: '100%', boxSizing: 'border-box',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#00ff9d'; e.currentTarget.style.background = 'rgba(0,255,157,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Return to Site
        </Link>
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.72rem', color: '#444', marginBottom: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px',
          border: '1px solid rgba(255,0,85,0.15)', background: 'rgba(255,0,85,0.05)',
          color: '#ff4466', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#ff0055'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,85,0.05)'; e.currentTarget.style.color = '#ff4466'; }}
        >
          {Icon.Logout()} Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────────────────────── */

function OverviewTab({ books, pageEvents, toolEvents }) {
  // Most visited pages
  const pageCounts = Object.entries(pageEvents.reduce((acc, e) => { acc[e.page] = (acc[e.page] || 0) + 1; return acc; }, {}))
    .sort((a, b) => b[1] - a[1]);


  // Real analytics from page_events
  const totalVisits = pageEvents.length;
  const totalTimeS  = pageEvents.reduce((a, e) => a + (e.duration_s || 0), 0);
  const avgTimeS    = totalVisits ? Math.round(totalTimeS / totalVisits) : 0;
  const avgTimeStr  = avgTimeS >= 60 ? `${Math.floor(avgTimeS/60)}m ${avgTimeS%60}s` : `${avgTimeS}s`;

  // Tool usage from tool_events
  const toolCounts = toolEvents.reduce((acc, e) => { acc[e.tool] = (acc[e.tool] || 0) + 1; return acc; }, {});
  const topTool = Object.entries(toolCounts).sort((a,b) => b[1]-a[1])[0];

  // Last 7 days visits by day
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const last7 = Array(7).fill(0);
  pageEvents.forEach(e => {
    const daysAgo = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) last7[6 - daysAgo]++;
  });
  const activityData = last7.map((v, i) => ({ label: dayLabels[(new Date().getDay() - 6 + i + 7) % 7], value: v }));

  // Tool usage bar chart
  const toolChartData = ['breathing', 'focus_timer', 'meditation', 'books_text', 'books_audio'].map(t => ({
    label: t.replace('_', ' ').replace('books ', 'books\n'),
    value: toolCounts[t] || 0,
  }));

  const donutSlices = [
    { label: 'Text Books', value: books.filter(b => b.type === 'text').length, color: '#00ff9d' },
    { label: 'Audio Books', value: books.filter(b => b.type === 'audio').length, color: '#a855f7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Overview</h1>
        <p style={{ margin: '0.3rem 0 0', color: '#555', fontSize: '0.85rem' }}>Your sanctuary at a glance — live data from Supabase</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Books" value={books.length} sub={`${books.filter(b=>b.type==='text').length} text · ${books.filter(b=>b.type==='audio').length} audio`} color="#00ff9d" sparkData={last7} icon={<Icon.Books/>}/>
        <StatCard label="Total Page Visits" value={totalVisits.toLocaleString()} sub={`${last7[6]} today`} color="#3b82f6" sparkData={last7} icon={<Icon.Eye/>}/>
        <StatCard label="Avg Time on Site" value={avgTimeStr} sub={`across ${totalVisits} sessions`} color="#00ff9d" sparkData={pageEvents.slice(0,7).map(e=>e.duration_s||0)} icon={<Icon.TrendUp/>}/>
        <StatCard label="Pages Visited" value={pageCounts.length} sub={pageCounts[0] ? `most: ${pageCounts[0][0]}` : 'no visits yet'} color="#a855f7" sparkData={last7} icon={<Icon.Users/>}/>
      </div>

      {/* Charts row */}
      <div className="admin-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Page Visits (last 7 days)</h3>
          {totalVisits === 0 ? <p style={{ color:'#444', fontSize:'0.82rem', marginTop:'2rem', textAlign:'center' }}>No visits tracked yet.<br/>Data will appear as users browse the site.</p> : <BarChart data={activityData} color="#00ff9d"/>}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tool Usage (all time)</h3>
          {toolEvents.length === 0 ? <p style={{ color:'#444', fontSize:'0.82rem', marginTop:'2rem', textAlign:'center' }}>No tool sessions recorded yet.</p> : <BarChart data={toolChartData} color="#a855f7"/>}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Content Mix</h3>
          <DonutChart slices={donutSlices}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
            {donutSlices.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                <span style={{ color: '#888', flex: 1 }}>{s.label}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tool + Top Pages */}
      <div className="admin-grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Used Tool</h3>
          {topTool ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{{'breathing':'🌬️','focus_timer':'⏱️','meditation':'🧘','books_text':'📚','books_audio':'🎧'}[topTool[0]] || '🌿'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00ff9d' }}>{topTool[0].replace('_',' ')}</div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop:'0.3rem' }}>{topTool[1]} sessions recorded</div>
            </div>
          ) : <p style={{ color:'#444', fontSize:'0.82rem', textAlign:'center', marginTop:'1rem' }}>No tool usage yet.</p>}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Visited Pages</h3>
          {pageCounts.slice(0, 5).map(([page, count]) => (
            <div key={page} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'0.8rem', fontWeight:700, color:'#fff' }}>{page}</div>
              <span style={{ fontSize:'0.72rem', color:'#555' }}>{count} visits</span>
            </div>
          ))}
          {pageCounts.length === 0 && <p style={{ color:'#444', fontSize:'0.82rem', textAlign:'center', marginTop:'1rem' }}>No visits tracked yet.</p>}
        </div>
      </div>
    </div>
  );
}



/* ─────────────────────────────────────────────────────────────
   ANALYTICS TAB
───────────────────────────────────────────────────────────── */
function AnalyticsTab({ books, pageEvents, toolEvents }) {

  // Real page_events breakdown
  const totalVisits = pageEvents.length;
  const totalTimeS  = pageEvents.reduce((a,e) => a + (e.duration_s||0), 0);
  const avgTimeS    = totalVisits ? Math.round(totalTimeS / totalVisits) : 0;
  const avgTimeStr  = avgTimeS >= 60 ? `${Math.floor(avgTimeS/60)}m ${avgTimeS%60}s` : `${avgTimeS}s`;

  // Per-page breakdown
  const pageCounts = pageEvents.reduce((acc, e) => { acc[e.page] = (acc[e.page]||0)+1; return acc; }, {});
  const pageChartData = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([p,v]) => ({ label: p, value: v }));

  // Per-tool breakdown
  const toolTimes = toolEvents.reduce((acc,e) => { acc[e.tool] = (acc[e.tool]||0) + (e.duration_s||0); return acc; }, {});
  const toolChartData = Object.entries(toolTimes).sort((a,b)=>b[1]-a[1]).map(([t,v]) => ({ label: t.replace('_',' '), value: v }));

  // Last 30 days visits by day (weekly buckets)
  const weekBuckets = [0,0,0,0];
  pageEvents.forEach(e => {
    const daysAgo = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
    const week = Math.min(3, Math.floor(daysAgo / 7));
    weekBuckets[3-week]++;
  });
  const weekData = weekBuckets.map((v,i) => ({ label: `W-${3-i}`, value: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>Analytics</h1>
        <p style={{ margin: '0.3rem 0 0', color: '#555', fontSize: '0.85rem' }}>Real data from Supabase — page visits, time spent, and tool usage</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Page Visits',   value: totalVisits.toLocaleString(), sub: `${pageEvents.filter(e => { const d=Date.now()-new Date(e.created_at).getTime(); return d<86400000; }).length} today`, color: '#3b82f6', data: weekBuckets },
          { label: 'Avg Time Per Visit',  value: avgTimeStr, sub: `${Math.round(totalTimeS/60)} min total`, color: '#00ff9d', data: pageEvents.slice(0,7).map(e=>e.duration_s||0) },
          { label: 'Tool Sessions',       value: toolEvents.length, sub: `${Object.keys(toolTimes).length} tools used`, color: '#a855f7', data: weekBuckets },
        ].map(s => <StatCard key={s.label} {...s} sparkData={s.data}/>)}
      </div>

      <div className="admin-grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visits by Page</h3>
          {pageChartData.length ? <BarChart data={pageChartData} color="#3b82f6"/> : <p style={{ color:'#444', fontSize:'0.82rem', marginTop:'1rem', textAlign:'center' }}>No page event data yet.</p>}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
          <h3 style={{ margin: '0 0 1.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Spent per Tool (seconds)</h3>
          {toolChartData.length ? <BarChart data={toolChartData} color="#a855f7"/> : <p style={{ color:'#444', fontSize:'0.82rem', marginTop:'1rem', textAlign:'center' }}>No tool usage recorded yet.</p>}
        </div>
      </div>


      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
        <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Affiliate Performance by Book</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {books.slice(0, 8).map((book) => {
            const hasLink = book.buyLink && book.buyLink.trim() !== '';
            return (
              <div key={book.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: book.coverColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>{book.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</div>
                  <div style={{ marginTop: '4px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: hasLink ? '100%' : '0%', height: '100%', background: 'linear-gradient(90deg, #00ff9d, #00cc7a)', borderRadius: '2px' }}/>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: hasLink ? '#00ff9d' : '#444', fontWeight: 700, flexShrink: 0, width: '90px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasLink ? (book.shopName || 'Active') : 'No link'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BOOK FORM MODAL
───────────────────────────────────────────────────────────── */
const shopOptions = ['Amazon', 'Flipkart', 'Audible', 'Spotify', 'Apple Books', 'Google Play Books', 'Other'];

function BookFormModal({ book, onSave, onClose, saving }) {
  const [formType, setFormType]       = useState(book?.type || 'text');
  const [formTitle, setFormTitle]     = useState(book?.title || '');
  const [formAuthor, setFormAuthor]   = useState(book?.author || '');
  const [formCover, setFormCover]     = useState(book?.coverColor || 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)');
  const [formEmoji, setFormEmoji]     = useState(book?.emoji || '📖');
  const [formReview, setFormReview]   = useState(book?.review || '');
  
  const [formShopName, setFormShopName] = useState(() => {
    if (!book?.shopName) return 'Amazon';
    if (shopOptions.includes(book.shopName)) return book.shopName;
    return 'Other';
  });
  
  const [customShopName, setCustomShopName] = useState(() => {
    if (!book?.shopName) return '';
    if (shopOptions.includes(book.shopName)) return '';
    return book.shopName;
  });
  
  const [formBuyLink, setFormBuyLink]   = useState(book?.buyLink || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: book?.id || `book-${Date.now()}`,
      type: formType, title: formTitle, author: formAuthor,
      coverColor: formCover, emoji: formEmoji, review: formReview,
      shopName: formShopName === 'Other' ? customShopName : formShopName,
      buyLink: formBuyLink,
    });
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', padding: '0.75rem 0.9rem',
    fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.3s',
  };
  const labelStyle = { display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 700 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        background: 'rgba(12,12,20,0.98)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px', padding: '2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {book ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px' }}>
            {Icon.Close()}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="text" style={{ background: '#0d0d0d' }}>Text Book</option>
                <option value="audio" style={{ background: '#0d0d0d' }}>Audio Book</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Emoji</label>
              <input type="text" value={formEmoji} onChange={e => setFormEmoji(e.target.value)} placeholder="📖" style={inputStyle} required
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="The Power of Now" style={inputStyle} required
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
            </div>
            <div>
              <label style={labelStyle}>Author</label>
              <input type="text" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} placeholder="Eckhart Tolle" style={inputStyle} required
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
            </div>
            <div>
              <label style={labelStyle}>E-Commerce Platform</label>
              <select value={formShopName} onChange={e => setFormShopName(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}>
                {shopOptions.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#0d0d0d' }}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Affiliate / Buy URL</label>
              <input type="url" value={formBuyLink} onChange={e => setFormBuyLink(e.target.value)} placeholder="https://example.com/buy-link" style={inputStyle}
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
            </div>
            {formShopName === 'Other' && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Custom Platform Name</label>
                <input type="text" value={customShopName} onChange={e => setCustomShopName(e.target.value)} placeholder="Enter store name (e.g. Kobo, Audible)" style={inputStyle} required
                  onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Cover Gradient (CSS)</label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <input type="text" value={formCover} onChange={e => setFormCover(e.target.value)} style={{ ...inputStyle, flex: 1 }} required
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: formCover, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Review Text</label>
            <textarea value={formReview} onChange={e => setFormReview(e.target.value)} placeholder="Write your review here..." required
              style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#888', padding: '0.7rem 1.4rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              background: '#00ff9d', color: '#000', border: 'none',
              padding: '0.7rem 1.6rem', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontSize: '0.85rem', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving...' : book ? 'Update Book' : 'Add Book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   AFFILIATE MANAGER TAB
───────────────────────────────────────────────────────────── */
function AffiliateMgrTab({ books, onRefresh }) {
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = books.filter(b => {
    const matchType = filter === 'all' || b.type === filter;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('books').upsert([payload]);
      if (error) throw error;
      playZenChime(523.25, 0.8, 0.4);
      setShowForm(false);
      setEditingBook(null);
      onRefresh();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book permanently?')) return;
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      playZenChime(196, 0.6, 0.35);
      onRefresh();
    } catch (err) { alert(`Delete failed: ${err.message}`); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>Affiliate Manager</h1>
          <p style={{ margin: '0.3rem 0 0', color: '#555', fontSize: '0.85rem' }}>{books.length} books · manage affiliate links and recommendations</p>
        </div>
        <button onClick={() => { setEditingBook(null); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#00ff9d', color: '#000', border: 'none',
          padding: '0.7rem 1.4rem', borderRadius: '12px', fontWeight: 800,
          fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
        >
          {Icon.Plus()} Add Book
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or author..."
          style={{
            flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
            color: '#fff', padding: '0.6rem 1rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor='#00ff9d'}
          onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
        />
        {['all','text','audio'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            background: filter === f ? 'rgba(0,255,157,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === f ? '#00ff9d' : '#666',
            transition: 'all 0.2s',
          }}>{f === 'all' ? 'All' : f === 'text' ? 'Text' : 'Audio'}</button>
        ))}
      </div>

      {/* Books Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
        <div className="admin-table-header admin-table-row" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 180px 80px', gap: '0', padding: '0.8rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', }}>
          {['', 'Title & Author', 'Platform Link', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: '0.7rem', color: '#444', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#444' }}>No books found.</div>
        ) : (
          filtered.map(book => (
            <div key={book.id} className="admin-table-row" style={{
              display: 'grid', gridTemplateColumns: '48px 1fr 180px 80px',
              gap: '0', padding: '1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
              alignItems: 'center', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.015)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ width: '36px', height: '48px', borderRadius: '6px', background: book.coverColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{book.emoji}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{book.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>
                  {book.author} · <span style={{ color: book.type === 'audio' ? '#a855f7' : '#10b981' }}>{book.type}</span>
                </div>
              </div>
              <div>
                {book.buyLink ? (
                  <a href={book.buyLink} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff9d', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {Icon.Link()} {book.shopName || 'Platform Link'}
                  </a>
                ) : <span style={{ color: '#333', fontSize: '0.72rem' }}>—</span>}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setEditingBook(book); setShowForm(true); }} style={{
                  background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.15)',
                  color: '#00ff9d', cursor: 'pointer', padding: '5px 8px', borderRadius: '7px', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,255,157,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(0,255,157,0.08)'}
                title="Edit">{Icon.Edit()}</button>
                <button onClick={() => handleDelete(book.id)} style={{
                  background: 'rgba(255,0,85,0.08)', border: '1px solid rgba(255,0,85,0.15)',
                  color: '#ff4466', cursor: 'pointer', padding: '5px 8px', borderRadius: '7px', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,0,85,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,0,85,0.08)'}
                title="Delete">{Icon.Trash()}</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <BookFormModal book={editingBook} onSave={handleSave} onClose={() => { setShowForm(false); setEditingBook(null); }} saving={saving}/>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD (authenticated)
───────────────────────────────────────────────────────────── */
function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [books, setBooks] = useState([]);
  const [pageEvents, setPageEvents] = useState([]);
  const [toolEvents, setToolEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, pageRes, toolRes] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('page_events').select('*').order('created_at', { ascending: false }),
        supabase.from('tool_events').select('*').order('created_at', { ascending: false }),
      ]);
      setBooks(booksRes.data || []);
      setPageEvents(pageRes.data || []);
      setToolEvents(toolRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogout = async () => {
    getAudioContext();
    playZenChime(261.63, 0.5, 0.3);
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: '#050508', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar active={activeTab} onNav={setActiveTab} email={session.user.email} onLogout={handleLogout}/>

      {/* Main content */}
      <main className="admin-main" style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', minWidth: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#555', fontSize: '0.9rem' }}>
            Loading sanctuary data...
          </div>
        ) : (
          <>
            {activeTab === 'overview'   && <OverviewTab books={books} pageEvents={pageEvents} toolEvents={toolEvents}/>}
            {activeTab === 'analytics'  && <AnalyticsTab books={books} pageEvents={pageEvents} toolEvents={toolEvents}/>}
            {activeTab === 'books'      && <AffiliateMgrTab books={books} onRefresh={fetchAll}/>}
          </>
        )}
      </main>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────
   ROOT EXPORT
───────────────────────────────────────────────────────────── */
export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#555', fontSize: '0.9rem' }}>
        Loading...
      </div>
    );
  }

  if (!session) return <LoginScreen onLogin={() => {}} />;

  return <Dashboard session={session} onLogout={() => setSession(null)}/>;
}
