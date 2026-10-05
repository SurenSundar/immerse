import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TbMessage2, TbExternalLink, TbX } from 'react-icons/tb';
import { LIBRARY_BOOKS } from '../utils/libraryBooks';

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeReviewId, setActiveReviewId] = useState(null);
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

  // Structured data so search engines understand the reading list
  useEffect(() => {
    document.title = "The Library | MonkeyMind";
    let ldJsonScript = document.getElementById('books-jsonld');
    if (!ldJsonScript) {
      ldJsonScript = document.createElement('script');
      ldJsonScript.id = 'books-jsonld';
      ldJsonScript.type = 'application/ld+json';
      document.head.appendChild(ldJsonScript);
    }
    ldJsonScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "The MonkeyMind Library",
      "description": "Hand-picked books and audiobooks on meditation and mindfulness.",
      "itemListElement": LIBRARY_BOOKS.map((book, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": { "@type": "Book", "name": book.title, "author": { "@type": "Person", "name": book.author } }
      }))
    });
    return () => document.getElementById('books-jsonld')?.remove();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', tab);
    }
    setSearchParams(searchParams);
  };

  // Filter books based on search and tab
  const filteredBooks = LIBRARY_BOOKS.filter(book => {
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

      <div className="books-grid">
        {filteredBooks.length === 0 ? (
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
                    const hasLink = buyLink && buyLink !== 'https://www.amazon.com' && buyLink !== 'https://www.flipkart.com';
                    if (!hasLink) return null;
                    return (
                      <a href={buyLink} target="_blank" rel="noopener noreferrer" className="mm-btn mm-btn--primary mm-btn--sm">
                        <TbExternalLink size={16} /> Find on {shopName}
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
