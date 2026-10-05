import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../utils/supabaseClient';

/* ─── Icons ─── */
const Icon = {
  Up:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>,
  Reply:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Plus:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>,
  Pin:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>,
  Back:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Check:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

const CATEGORIES = ['All', 'Meditation', 'Focus', 'Breathing', 'Books', 'General'];
const CAT_COLORS = { Meditation: '#a855f7', Focus: '#3b82f6', Breathing: '#06b6d4', Books: '#f59e0b', General: '#6b7280' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Auth Panel ─── */
function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', padding: '0.8rem 1rem',
    fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.3s',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
      } else {
        if (!username.trim()) throw new Error('Please enter a display name.');
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username } }
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setSuccess('Check your email to confirm your account, then sign in.');
        } else {
          onAuth();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px', padding: '2.5rem',
        backdropFilter: 'blur(30px)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🌿</div>
          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join the Sanctuary'}
          </h1>
          <p style={{ margin: 0, color: '#555', fontSize: '0.82rem', lineHeight: 1.6 }}>
            {mode === 'login'
              ? 'Sign in to ask questions and share insights with the community.'
              : 'Create a free account to participate in mindful Q&A discussions.'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(255,0,85,0.08)', border: '1px solid rgba(255,0,85,0.2)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#ff4477', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.2)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#00ff9d', textAlign: 'center' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {mode === 'signup' && (
            <input type="text" placeholder="Display name (e.g. MindfulSam)" value={username} onChange={e => setUsername(e.target.value)} style={inp} required
              onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inp} required
            onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          <input type="password" placeholder="Password (min. 6 characters)" value={password} onChange={e => setPassword(e.target.value)} style={inp} required minLength={6}
            onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          <button type="submit" disabled={loading} style={{
            background: loading ? 'rgba(0,255,157,0.4)' : '#00ff9d', color: '#000', border: 'none',
            padding: '0.85rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.88rem',
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '0.3rem',
          }}>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}</button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: '#444' }}>
          {mode === 'login' ? (
            <span>No account? <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#00ff9d', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.82rem' }}>Sign up free</button></span>
          ) : (
            <span>Already a member? <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#00ff9d', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.82rem' }}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Create Post Modal ─── */
function CreatePostModal({ user, onClose, onPosted }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true); setError('');
    const username = user.user_metadata?.username || user.email.split('@')[0];
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id, author_name: username, author_email: user.email,
        title: title.trim(), body: body.trim(), category,
      });
      if (error) throw error;
      onPosted();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', padding: '0.8rem 1rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.3s' };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Ask the community"
      style={{ position: 'fixed', inset: 0, zIndex: 10004, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '580px', margin: 'auto', boxSizing: 'border-box', background: 'rgba(10,10,18,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2rem', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
        <h2 style={{ margin: '0 0 1.6rem', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Ask the Community</h2>
        {error && <div style={{ background: 'rgba(255,0,85,0.08)', border: '1px solid rgba(255,0,85,0.2)', borderRadius: '8px', padding: '0.7rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#ff4477' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} style={{ background: '#0d0d0d' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>Question Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's your question?" style={inp} required maxLength={200}
              onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>Details (optional but helpful)</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Give some context — what have you tried, what are you looking for..." 
              style={{ ...inp, minHeight: '110px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', padding: '0.65rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: '#00ff9d', color: '#000', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ─── Post Detail ─── */
function PostDetail({ post, user, onBack, onRefresh }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchAnswers = useCallback(async () => {
    const { data } = await supabase.from('post_answers').select('*').eq('post_id', post.id).order('upvotes', { ascending: false });
    setAnswers(data || []);
    setLoading(false);
  }, [post.id]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  const handleUpvotePost = async () => {
    if (!user) return;
    await supabase.from('posts').update({ upvotes: post.upvotes + 1 }).eq('id', post.id);
    onRefresh();
  };

  const handleUpvoteAnswer = async (ans) => {
    if (!user) return;
    await supabase.from('post_answers').update({ upvotes: ans.upvotes + 1 }).eq('id', ans.id);
    fetchAnswers();
  };

  const handleAccept = async (answerId) => {
    if (!user || user.id !== post.user_id) return;
    await supabase.from('post_answers').update({ is_accepted: true }).eq('id', answerId);
    fetchAnswers();
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!user) return;
    if (!confirm('Delete this answer?')) return;
    await supabase.from('post_answers').delete().eq('id', answerId);
    fetchAnswers();
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim() || !user) return;
    setPosting(true);
    const username = user.user_metadata?.username || user.email.split('@')[0];
    const { error } = await supabase.from('post_answers').insert({
      post_id: post.id, user_id: user.id, author_name: username, body: answerBody.trim(),
    });
    if (!error) {
      await supabase.from('posts').update({ answer_count: post.answer_count + 1 }).eq('id', post.id);
      setAnswerBody('');
      fetchAnswers();
      onRefresh();
    }
    setPosting(false);
  };

  const catColor = CAT_COLORS[post.category] || '#6b7280';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontFamily: 'inherit' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0, width: 'fit-content' }}
        onMouseEnter={e => e.currentTarget.style.color='#aaa'} onMouseLeave={e => e.currentTarget.style.color='#555'}>
        {Icon.Back()} Back to questions
      </button>

      {/* Post */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.8rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Vote */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '40px' }}>
            <button onClick={handleUpvotePost} style={{ background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.2)', color: '#00ff9d', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,255,157,0.2)'} onMouseLeave={e => e.currentTarget.style.background='rgba(0,255,157,0.08)'}>
              {Icon.Up()}
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{post.upvotes}</span>
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: catColor, background: `${catColor}18`, padding: '2px 8px', borderRadius: '4px' }}>{post.category}</span>
              {post.is_pinned && <span style={{ fontSize: '0.68rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>{Icon.Pin()} Pinned</span>}
            </div>
            <h1 style={{ margin: '0 0 0.8rem', fontSize: '1.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{post.title}</h1>
            <p style={{ margin: '0 0 1rem', color: '#999', lineHeight: 1.7, fontSize: '0.95rem' }}>{post.body}</p>
            <div style={{ fontSize: '0.75rem', color: '#444' }}>Asked by <strong style={{ color: '#666' }}>{post.author_name}</strong> · {timeAgo(post.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h3>

        {loading ? <div style={{ color: '#444', padding: '1rem' }}>Loading answers...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {answers.map(ans => (
              <div key={ans.id} style={{
                background: ans.is_accepted ? 'rgba(0,255,157,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${ans.is_accepted ? 'rgba(0,255,157,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px', padding: '1.4rem',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                {/* Vote */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '36px' }}>
                  <button onClick={() => handleUpvoteAnswer(ans)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', padding: '5px 7px', borderRadius: '7px', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color='#00ff9d'; }} onMouseLeave={e => { e.currentTarget.style.color='#888'; }}>
                    {Icon.Up()}
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{ans.upvotes}</span>
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {ans.is_accepted && <div style={{ fontSize: '0.7rem', color: '#00ff9d', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icon.Check()} Accepted Answer</div>}
                  <p style={{ margin: '0 0 0.8rem', color: '#bbb', lineHeight: 1.7, fontSize: '0.9rem' }}>{ans.body}</p>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', fontSize: '0.75rem', color: '#444' }}>
                    <span>By <strong style={{ color: '#666' }}>{ans.author_name}</strong></span>
                    <span>{timeAgo(ans.created_at)}</span>
                    {user && user.id === post.user_id && !ans.is_accepted && (
                      <button onClick={() => handleAccept(ans.id)} style={{ background: 'none', border: 'none', color: '#00ff9d', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {Icon.Check()} Mark Accepted
                      </button>
                    )}
                    {user && (user.id === ans.user_id) && (
                      <button onClick={() => handleDeleteAnswer(ans.id)} style={{ background: 'none', border: 'none', color: '#ff4466', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {Icon.Trash()} Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer form */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.6rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Your Answer</h3>
        <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <textarea value={answerBody} onChange={e => setAnswerBody(e.target.value)} placeholder="Share your insight or experience..." required
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', padding: '0.8rem 1rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', minHeight: '100px', resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={posting} style={{ background: '#00ff9d', color: '#000', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.7 : 1 }}>
              {posting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Post Card ─── */
function PostCard({ post, onOpen, user, onUpvote }) {
  const catColor = CAT_COLORS[post.category] || '#6b7280';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px', padding: '1.2rem 1.4rem',
      display: 'flex', gap: '1rem', alignItems: 'flex-start',
      transition: 'border-color 0.2s, background 0.2s', cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}
    >
      {/* Upvote column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '38px' }}>
        <button onClick={() => onUpvote(post)} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#555', cursor: user ? 'pointer' : 'not-allowed', padding: '5px 7px', borderRadius: '7px', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (user) { e.currentTarget.style.color='#00ff9d'; e.currentTarget.style.borderColor='rgba(0,255,157,0.3)'; }}}
        onMouseLeave={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
        title={user ? 'Upvote' : 'Sign in to vote'}>
          {Icon.Up()}
        </button>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: post.upvotes > 0 ? '#fff' : '#555' }}>{post.upvotes}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
          {post.is_pinned && <span style={{ fontSize: '0.64rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>{Icon.Pin()} PINNED</span>}
          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: catColor, background: `${catColor}18`, padding: '1px 7px', borderRadius: '4px' }}>{post.category}</span>
        </div>

        <h3 onClick={() => onOpen(post)} style={{ margin: '0 0 0.3rem', fontSize: '0.98rem', fontWeight: 700, color: '#fff', lineHeight: 1.35, cursor: 'pointer', display: 'inline' }}
          onMouseEnter={e => e.currentTarget.style.color='#00ff9d'} onMouseLeave={e => e.currentTarget.style.color='#fff'}>
          {post.title}
        </h3>

        <p style={{ margin: '0 0 0.6rem', color: '#666', fontSize: '0.82rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {post.body}
        </p>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.74rem', color: '#444', flexWrap: 'wrap' }}>
          <span>by <strong style={{ color: '#666' }}>{post.author_name}</strong></span>
          <span>{timeAgo(post.created_at)}</span>
          <button onClick={() => onOpen(post)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.74rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color='#aaa'} onMouseLeave={e => e.currentTarget.style.color='#555'}>
            {Icon.Reply()} {post.answer_count} {post.answer_count === 1 ? 'answer' : 'answers'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Community ─── */
export default function Community() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('hot'); // 'hot' | 'new' | 'top'
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [openPostId, setOpenPostId] = useState(null);
  // Derive the open post from the latest list so upvotes/answer counts stay fresh
  const openPost = openPostId ? posts.find(p => p.id === openPostId) || null : null;
  const openPostById = (p) => setOpenPostId(p.id);

  // Auth listener
  useEffect(() => {
    document.title = "Community Q&A Forum | MonkeyMind";
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoadingPosts(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleUpvote = async (post) => {
    if (!session) return;
    await supabase.from('posts').update({ upvotes: post.upvotes + 1 }).eq('id', post.id);
    fetchPosts();
  };

  const handleLogout = () => supabase.auth.signOut();

  // Show auth screen if not logged in
  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Loading...</div>
  );

  if (!session) return <AuthPanel onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />;

  // Filter and sort
  const user = session.user;
  const username = user.user_metadata?.username || user.email.split('@')[0];

  let filtered = posts.filter(p => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  if (sortBy === 'hot') filtered = [...filtered].sort((a, b) => (b.upvotes * 2 + b.answer_count) - (a.upvotes * 2 + a.answer_count));
  else if (sortBy === 'top') filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
  // 'new' is already ordered by created_at desc

  const pinnedPosts = filtered.filter(p => p.is_pinned);
  const regularPosts = filtered.filter(p => !p.is_pinned);

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', padding: '120px 20px 60px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 3rem' }}>
        {/* Header Block inside the feed container */}
        {!openPost && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '1.2rem 1.6rem',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', background: 'none', WebkitTextFillColor: 'initial', webkitBackgroundClip: 'initial', webkitTextFillColor: 'initial' }}>Sanctuary Q&A</h1>
              <p style={{ margin: '0.2rem 0 0', color: '#555', fontSize: '0.82rem' }}>Share reflections and ask questions</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                Logged in as <strong style={{ color: '#00ff9d' }}>{username}</strong>
              </span>
              <button onClick={() => setShowCreate(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#00ff9d', color: '#000', border: 'none',
                padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
              }}>{Icon.Plus()} Ask Question</button>
              <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888', padding: '0.5rem 0.9rem', borderRadius: '9px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>Sign out</button>
            </div>
          </div>
        )}
        {/* Post detail view */}
        {openPost ? (
          <PostDetail post={openPost} user={user} onBack={() => { setOpenPostId(null); fetchPosts(); }} onRefresh={fetchPosts}/>
        ) : (
          <>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
                style={{ flex: 1, minWidth: '180px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', padding: '0.6rem 1rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor='#00ff9d'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}/>

              {['hot','new','top'].map(s => (
                <button key={s} onClick={() => setSortBy(s)} style={{
                  padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                  background: sortBy === s ? 'rgba(0,255,157,0.15)' : 'rgba(255,255,255,0.04)',
                  color: sortBy === s ? '#00ff9d' : '#555', transition: 'all 0.2s',
                }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', overflowX: 'auto', paddingBottom: '4px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  background: activeCategory === cat ? (CAT_COLORS[cat] || '#00ff9d') + '22' : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat ? (CAT_COLORS[cat] || '#00ff9d') : '#555',
                  border: `1px solid ${activeCategory === cat ? (CAT_COLORS[cat] || '#00ff9d') + '44' : 'transparent'}`,
                  transition: 'all 0.2s',
                }}>{cat}</button>
              ))}
            </div>

            {/* Posts */}
            {loadingPosts ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#444' }}>Loading questions...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#444', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🌿</div>
                <div>No questions yet in this category.</div>
                <button onClick={() => setShowCreate(true)} style={{ marginTop: '1rem', background: '#00ff9d', color: '#000', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem' }}>Ask the first question</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {pinnedPosts.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '0.2rem 0' }}>📌 Pinned</div>
                    {pinnedPosts.map(p => <PostCard key={p.id} post={p} onOpen={openPostById} user={user} onUpvote={handleUpvote}/>)}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.3rem 0' }}/>
                  </>
                )}
                {regularPosts.map(p => <PostCard key={p.id} post={p} onOpen={openPostById} user={user} onUpvote={handleUpvote}/>)}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && <CreatePostModal user={user} onClose={() => setShowCreate(false)} onPosted={fetchPosts}/>}
    </div>
  );
}
