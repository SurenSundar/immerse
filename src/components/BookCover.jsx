import { coverSrc } from '../utils/libraryBooks';

/** A book's cover: the real image when we have one, otherwise the coloured design. */
export default function BookCover({ book, eager = false }) {
  const src = coverSrc(book);
  if (src) {
    return (
      <div className="book-cover has-image">
        <img
          src={src}
          alt={`Cover of ${book.title} by ${book.author}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          width="320"
          height="480"
        />
        <div className="book-cover-spine" />
      </div>
    );
  }
  return (
    <div className="book-cover" style={{ background: book.coverColor }} aria-label={`Cover of ${book.title} by ${book.author}`} role="img">
      <div className="book-cover-spine" />
      <div className="book-cover-emoji">{book.emoji}</div>
      <div className="book-cover-title">{book.title.toUpperCase()}</div>
      <div className="book-cover-author">{book.author}</div>
    </div>
  );
}
