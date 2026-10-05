import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { updateMetaTags } from '../utils/meta';

const escapeHtml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Very basic markdown renderer — handles headings, bold, line breaks. Input is escaped first. */
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(escapeHtml)
    .map(line => {
      if (line.startsWith('## ')) return `<h2 style="margin:1.8rem 0 0.6rem;font-size:1.3rem;font-weight:800;color:#fff;">${line.slice(3)}</h2>`;
      if (line.startsWith('# '))  return `<h1 style="margin:2rem 0 0.8rem;font-size:1.7rem;font-weight:900;color:#fff;">${line.slice(2)}</h1>`;
      if (line.startsWith('### ')) return `<h3 style="margin:1.4rem 0 0.5rem;font-size:1.1rem;font-weight:700;color:#ddd;">${line.slice(4)}</h3>`;
      if (line.match(/^\d+\. /)) return `<li style="margin:0.4rem 0;color:#bbb;line-height:1.7;">${line.replace(/^\d+\. /, '')}</li>`;
      if (line.startsWith('- ')) return `<li style="margin:0.4rem 0;color:#bbb;line-height:1.7;">${line.slice(2)}</li>`;
      if (!line.trim()) return '<br/>';
      const parsed = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:700;">$1</strong>');
      return `<p style="margin:0.5rem 0;color:#bbb;line-height:1.8;font-size:1rem;">${parsed}</p>`;
    })
    .join('');
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setPost(data);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (post) {
      const title = `${post.title} | MonkeyMind Journal`;
      const desc = post.excerpt || "Read our journal articles on the science of focus, coherent breathing, heartfulness practices, and digital mindfulness guides.";
      updateMetaTags(title, desc, `/blog/${post.slug}`);

      // Inject BlogPosting JSON-LD structured schema for AI and Search Spiders
      let ldJsonScript = document.getElementById('blog-jsonld');
      if (!ldJsonScript) {
        ldJsonScript = document.createElement('script');
        ldJsonScript.id = 'blog-jsonld';
        ldJsonScript.type = 'application/ld+json';
        document.head.appendChild(ldJsonScript);
      }

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "author": {
          "@type": "Organization",
          "name": post.author || "MonkeyMind Team"
        },
        "datePublished": post.created_at || new Date().toISOString(),
        "url": `https://monkeymind.app/blog/${post.slug}`,
        "image": "https://monkeymind.app/monkeymindLogo.svg",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://monkeymind.app/blog/${post.slug}`
        }
      };
      
      ldJsonScript.textContent = JSON.stringify(schemaData);
    }

    return () => {
      // Clean up the script tag when navigating away
      const ldJsonScript = document.getElementById('blog-jsonld');
      if (ldJsonScript) {
        ldJsonScript.remove();
      }
    };
  }, [post]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Loading...</div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444', gap: '1rem' }}>
      <div style={{ fontSize: '3rem' }}>404</div>
      <div>Post not found.</div>
      <Link to="/blog" style={{ color: '#00ff9d', textDecoration: 'none', fontWeight: 700 }}>← Back to Journal</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '120px 20px 80px', maxWidth: '720px', margin: '0 auto', fontFamily: 'inherit' }}>
      <Link to="/blog" style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '2.5rem',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)', color: '#888', padding: '0.55rem 1.1rem',
        borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#00ff9d'; e.currentTarget.style.color='#00ff9d'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#888'; }}
      >← The Journal</Link>

      {/* Hero */}
      <div style={{
        height: '220px', borderRadius: '24px',
        background: post.cover_color || 'linear-gradient(135deg,#6366f1,#4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '4rem', marginBottom: '2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>{post.emoji}</div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(post.tags || []).map(tag => (
          <span key={tag} style={{ fontSize: '0.7rem', color: '#00ff9d', background: 'rgba(0,255,157,0.08)', padding: '3px 10px', borderRadius: '5px', fontWeight: 700 }}>#{tag}</span>
        ))}
      </div>

      {/* Title */}
      <h1 style={{ margin: '0 0 0.6rem', fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{post.title}</h1>

      {/* Meta */}
      <div style={{ marginBottom: '2.5rem', fontSize: '0.82rem', color: '#444' }}>
        By <strong style={{ color: '#666' }}>{post.author}</strong>
        {' · '}{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '2.5rem' }}/>

      {/* Body */}
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />

      {/* Footer */}
      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <p style={{ color: '#444', fontSize: '0.85rem', marginBottom: '1rem' }}>More from the Journal</p>
        <Link to="/blog" style={{
          background: '#00ff9d', color: '#000', padding: '0.7rem 1.6rem',
          borderRadius: '12px', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem',
        }}>Read More Posts →</Link>
      </div>
    </div>
  );
}
