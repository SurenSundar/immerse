import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mindfulness Journal | MonkeyMind";
    supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '120px 20px 60px', maxWidth: '860px', margin: '0 auto', fontFamily: 'inherit' }}>

      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>The Journal</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#555', fontSize: '1rem' }}>Thoughts on mindfulness, focus, and the science of the quiet mind.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#444' }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#444', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '20px' }}>
          No posts published yet. Check back soon.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', gap: '1.4rem', alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px', padding: '1.6rem',
                transition: 'all 0.3s', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,255,157,0.3)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                {/* Cover swatch */}
                <div style={{
                  width: '64px', height: '80px', flexShrink: 0, borderRadius: '12px',
                  background: post.cover_color || 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                }}>{post.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {(post.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: '0.68rem', color: '#00ff9d', background: 'rgba(0,255,157,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>#{tag}</span>
                    ))}
                  </div>
                  <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{post.title}</h2>
                  <p style={{ margin: '0 0 0.8rem', color: '#666', fontSize: '0.88rem', lineHeight: 1.6 }}>{post.excerpt}</p>
                  <div style={{ fontSize: '0.75rem', color: '#444' }}>
                    By <strong style={{ color: '#666' }}>{post.author}</strong> · {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div style={{ color: '#333', fontSize: '1.2rem', flexShrink: 0, alignSelf: 'center' }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
