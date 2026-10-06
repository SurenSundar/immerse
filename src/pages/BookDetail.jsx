import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TbArrowLeft, TbExternalLink } from 'react-icons/tb';
import { LIBRARY_BOOKS, coverSrc, fetchLiveBooks, isPlaceholderLink } from '../utils/libraryBooks';
import { updateMetaTags } from '../utils/meta';
import BookCover from '../components/BookCover';

const SITE = 'https://monkeymind.online';
const RELATED_COUNT = 4;

/** One book's page: /books/:id (pre-rendered for every built-in book). */
export default function BookDetail() {
  const { id } = useParams();
  // Built-in list first (instant and pre-rendered), then the live list from the admin
  const [books, setBooks] = useState(LIBRARY_BOOKS);
  const [liveChecked, setLiveChecked] = useState(false);

  useEffect(() => {
    let live = true;
    fetchLiveBooks().then((list) => {
      if (!live) return;
      if (list) setBooks(list);
      setLiveChecked(true);
    });
    return () => { live = false; };
  }, []);

  const book = books.find((b) => b.id === id);

  // Same author first, then the same format, skipping this book
  const related = useMemo(() => {
    if (!book) return [];
    const others = books.filter((b) => b.id !== book.id);
    const sameAuthor = others.filter((b) => b.author === book.author);
    const sameType = others.filter((b) => b.type === book.type && b.author !== book.author);
    // Stable pick that varies by book, so every page links to different neighbours
    const start = [...book.id].reduce((n, c) => n + c.charCodeAt(0), 0) % Math.max(1, sameType.length);
    const rotated = [...sameType.slice(start), ...sameType.slice(0, start)];
    return [...sameAuthor, ...rotated].slice(0, RELATED_COUNT);
  }, [book, books]);

  // Title, description, share image and structured data for this book
  useEffect(() => {
    if (!book) return undefined;
    const kind = book.type === 'audio' ? 'audiobook' : 'book';
    const desc = book.review || `${book.title} by ${book.author}, a ${kind} in the MonkeyMind Library.`;
    const image = coverSrc(book);
    updateMetaTags(
      `${book.title} by ${book.author} | MonkeyMind Library`,
      desc.length > 160 ? `${desc.slice(0, 157)}…` : desc,
      `/books/${book.id}`,
      image ? (image.startsWith('http') ? image : `${SITE}${image}`) : undefined,
    );

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'book-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': book.type === 'audio' ? 'Audiobook' : 'Book',
      name: book.title,
      author: { '@type': 'Person', name: book.author },
      ...(image ? { image: image.startsWith('http') ? image : `${SITE}${image}` } : {}),
      url: `${SITE}/books/${book.id}`,
      ...(book.review ? {
        review: {
          '@type': 'Review',
          reviewBody: book.review,
          author: { '@type': 'Organization', name: 'MonkeyMind' },
        },
      } : {}),
    });
    document.getElementById('book-jsonld')?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [book]);

  if (!book) {
    return (
      <div className="mm-page mm-page--narrow bd-missing">
        {liveChecked ? (
          <>
            <h1>Book not found</h1>
            <p className="bd-muted">This book may have been removed from the Library.</p>
            <Link to="/books" className="mm-btn"><TbArrowLeft size={16} /> Back to the Library</Link>
          </>
        ) : (
          <div className="lib-skeleton" aria-label="Loading" />
        )}
      </div>
    );
  }

  const link = book.buyLink;
  const isAffiliate = link && !isPlaceholderLink(link);

  return (
    <div className="mm-page bd">
      <nav className="bd-crumbs" aria-label="Breadcrumb">
        <Link to="/books">Library</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/books?type=${book.type}`}>{book.type === 'audio' ? 'Audiobooks' : 'Books'}</Link>
      </nav>

      <article className="bd-main">
        <div className="bd-cover">
          <BookCover book={book} eager />
        </div>
        <div className="bd-info">
          <span className="book-type">{book.type === 'audio' ? 'Audiobook' : 'Book'}</span>
          <h1>{book.title}</h1>
          <p className="bd-author">by {book.author}</p>

          {book.review && (
            <section className="bd-review">
              <h2>Our take</h2>
              <p>{book.review}</p>
            </section>
          )}

          {link && (
            <div className="bd-buy">
              <a
                href={link}
                target="_blank"
                rel={isAffiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
                className="mm-btn mm-btn--primary"
              >
                <TbExternalLink size={18} /> Find on {book.shopName || 'Amazon'}
              </a>
              {isAffiliate && (
                <p className="bd-disclosure">As an Amazon Associate, MonkeyMind earns from qualifying purchases. It costs you nothing extra.</p>
              )}
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="bd-related" aria-labelledby="bd-related-title">
          <h2 id="bd-related-title">You might also like</h2>
          <ul>
            {related.map((b) => (
              <li key={b.id}>
                <Link to={`/books/${b.id}`} className="bd-related__item">
                  <span className="book-cover-container bd-related__cover"><BookCover book={b} /></span>
                  <span className="bd-related__title">{b.title}</span>
                  <span className="bd-related__author">{b.author}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="bd-back">
        <Link to="/books" className="mm-btn mm-btn--ghost"><TbArrowLeft size={16} /> All books and audiobooks</Link>
      </p>
    </div>
  );
}
