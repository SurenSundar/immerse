import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TbMessage2, TbExternalLink, TbX } from 'react-icons/tb';
import { supabase } from '../utils/supabaseClient';
import { SAMPLE_BOOKS } from '../utils/sampleBooks';

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Set tab based on url type parameter (e.g. ?type=audio or ?type=text) or default to 'all'
  const [activeTab, setActiveTab] = useState(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'audio' || typeParam === 'text') return typeParam;
    return 'all';
  });

  // Sync state if url param changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'audio' || typeParam === 'text') {
      setActiveTab(typeParam);
    } else if (!typeParam) {
      setActiveTab('all');
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = "The Sanctuary Library | MonkeyMind Books";
    let isMounted = true;
    const fetchBooks = async () => {
      try {
        setLoading(true);
        // Don't leave people staring at placeholders if the database is slow or unreachable
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Library request timed out')), 5000));
        const { data, error } = await Promise.race([
          supabase.from('books').select('*').order('created_at', { ascending: false }),
          timeout,
        ]);
        
        if (error) throw error;
        if (isMounted) {
          setAllBooks(data || []);
        }
      } catch (err) {
        console.error('Error fetching books from Supabase:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (allBooks.length > 0) {
      let ldJsonScript = document.getElementById('books-jsonld');
      if (!ldJsonScript) {
        ldJsonScript = document.createElement('script');
        ldJsonScript.id = 'books-jsonld';
        ldJsonScript.type = 'application/ld+json';
        document.head.appendChild(ldJsonScript);
      }

      const schemaData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "The Sanctuary Library - Recommended Mindfulness Books",
        "description": "Curated reading and guided audio programs to quiet the monkey mind.",
        "itemListElement": allBooks.map((book, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Book",
            "name": book.title,
            "author": {
              "@type": "Person",
              "name": book.author
            },
            "image": "https://monkeymind.app/monkeymindLogo.svg",
            "review": {
              "@type": "Review",
              "reviewBody": book.review,
              "author": {
                "@type": "Organization",
                "name": "MonkeyMind Team"
              }
            }
          }
        }))
      };

      ldJsonScript.textContent = JSON.stringify(schemaData);
    }

    return () => {
      const ldJsonScript = document.getElementById('books-jsonld');
      if (ldJsonScript) {
        ldJsonScript.remove();
      }
    };
  }, [allBooks]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', tab);
    }
    setSearchParams(searchParams);
  };

  // Until real books are added (or if the database can't be reached), show a sample shelf
  const shelf = !loading && allBooks.length === 0 ? SAMPLE_BOOKS : allBooks;

  // Filter books based on search and tab
  const filteredBooks = shelf.filter(book => {
    const matchesTab = activeTab === 'all' || book.type === activeTab;
    const matchesSearch = !search || 
      book.title.toLowerCase().includes(search.toLowerCase()) || 
      book.author.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'text', label: 'Books' },
    { id: 'audio', label: 'Audiobooks' }
  ];

  return (
    <div className="mm-page">
      <header className="mm-page-header">
        <h1>The Library</h1>
        <p>Hand-picked books and audiobooks on meditation and mindfulness.</p>
      </header>

      <div className="lib-toolbar">
        <div className="mm-chips" role="group" aria-label="Filter by format">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`mm-chip ${activeTab === t.id ? 'is-on' : ''}`}
              aria-pressed={activeTab === t.id}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="mm-input lib-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or author"
          aria-label="Search title or author"
        />
      </div>

      {/* Affiliate disclosure — must be visible near the links (sample shelf links are not affiliate links) */}
      {loading ? null : shelf === SAMPLE_BOOKS ? (
        <p className="lib-disclosure">A few books we love to start you off. More are on the way.</p>
      ) : (
        <p className="lib-disclosure">
          Some links below are affiliate links. If you buy through them, we may earn a small commission at no extra cost to you.
        </p>
      )}

      <div className="books-grid">
        {loading ? (
          [0, 1, 2].map(i => <div key={i} className="lib-skeleton" aria-hidden="true" />)
        ) : filteredBooks.length === 0 ? (
          <div className="lib-empty">
            No books match that search. Try a different word or filter.
          </div>
        ) : (
          filteredBooks.map(book => {
            return (
              <div className="mm-panel book-card" key={book.id}>
                <div className="book-cover-container">
                  <div className="book-cover" style={{ background: book.coverColor }} aria-label={`Cover of ${book.title} by ${book.author}`} role="img">
                    <div className="book-cover-spine" />
                    <div className="book-cover-emoji">{book.emoji}</div>
                    <div className="book-cover-title">{book.title.toUpperCase()}</div>
                    <div className="book-cover-author">{book.author}</div>
                  </div>
                </div>

                <h3 className="book-title" title={book.title}>{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <span className="book-type">{book.type === 'audio' ? 'Audiobook' : 'Book'}</span>

                <div className="book-actions">
                  <button className="mm-btn mm-btn--sm" onClick={() => setActiveReviewId(book.id)}>
                    <TbMessage2 size={16} /> Read our review
                  </button>
                  {(() => {
                    const buyLink = book.buyLink || book.amazonLink || book.flipkartLink;
                    const shopName = book.shopName || (book.amazonLink ? 'Amazon' : book.flipkartLink ? 'Flipkart' : 'Platform');
                    const isSample = String(book.id).startsWith('sample-');
                    const hasLink = buyLink && buyLink !== 'https://www.amazon.com' && buyLink !== 'https://www.flipkart.com';
                    if (!hasLink) return null;
                    return (
                      <a href={buyLink} target="_blank" rel={isSample ? 'noopener noreferrer' : 'noopener noreferrer sponsored'} className="mm-btn mm-btn--primary mm-btn--sm">
                        <TbExternalLink size={16} /> {isSample ? `Find on ${shopName}` : `Buy on ${shopName}`}
                      </a>
                    );
                  })()}
                </div>

                {/* Review Drawer */}
                <div className={`review-drawer ${activeReviewId === book.id ? 'active' : ''}`}>
                  <div className="review-drawer-content">
                    <button 
                      className="review-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReviewId(null);
                      }}
                      title="Close review" aria-label="Close review"
                    >
                      <TbX size={14} />
                    </button>
                    <span className="review-drawer-title">Our review</span>
                    <p className="review-drawer-text">“{book.review}”</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
