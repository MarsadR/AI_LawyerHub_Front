import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Search, Star, X,
  Check, Filter, Download
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All', 'Constitutional', 'Criminal', 'Civil', 'Corporate', 
  'Family', 'Property', 'International', 'Labor', 'Tax', 
  'Intellectual Property', 'Environmental', 'Human Rights'
];

function BookCard({ book, onClick }) {
  return (
    <div
      className="glass-card animate-slide-up card-3d"
      style={{
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.3s var(--ease)',
        display: 'flex', flexDirection: 'column',
        minHeight: 280, justifyContent: 'space-between',
        borderRadius: 16
      }}
      onClick={() => onClick(book)}
    >
      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: '#1e293b' }}>
        {book.posterUrl ? (
          <img
            src={book.posterUrl}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: book.coverColor || '#1D4ED8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <BookOpen size={40} color="#fff" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>{book.category}</span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{
            fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {book.title}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }} className="truncate">
            by {book.author}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
          {book.price ? (
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--emerald)' }}>
              PKR {book.price.toLocaleString()}
            </span>
          ) : (
            <span className="badge badge-green" style={{ fontSize: 10 }}>Free</span>
          )}
          {book.rating ? (
            <span style={{ fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={12} fill="var(--gold)" /> {book.rating}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>PDF</span>
          )}
        </div>
      </div>
    </div>
  );
}

function BookDetailModal({ book, onClose }) {
  if (!book) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 540, padding: 28 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
          <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Book Details</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Cover/Poster */}
          {book.posterUrl ? (
            <img
              src={book.posterUrl}
              alt={book.title}
              style={{
                width: 110, height: 150, borderRadius: 10,
                objectFit: 'cover', boxShadow: '0 6px 16px rgba(0,0,0,0.3)', flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: 110, height: 150, borderRadius: 10,
              background: book.coverColor || '#1D4ED8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0,0,0,0.3)', flexShrink: 0
            }}>
              <BookOpen size={48} color="#fff" />
            </div>
          )}

          <div style={{ minWidth: 200, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', lineHeight: 1.2, marginBottom: 6 }}>{book.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>by {book.author}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Category', value: book.category },
                { label: 'Edition', value: book.edition || 'Latest' }
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }} className="truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {book.description && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', marginBottom: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>Description</p>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{book.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
          {(book.pdfUrl || book.purchaseUrl) && (
            <a
              href={book.pdfUrl || book.purchaseUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ flex: 2, textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={16} />
              {book.price ? `Buy · PKR ${book.price.toLocaleString()}` : 'Download PDF'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const { API } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/books`);
      const rawBooks = Array.isArray(res.data) ? res.data : (res.data.data?.books || res.data.data || []);
      // Enrich with colors
      const colors = [
        ['#1D4ED8','#7C3AED'], ['#059669','#0891B2'], ['#DC2626','#7C2D12'],
        ['#9333EA','#4F46E5'], ['#B45309','#78350F'], ['#0F766E','#1E3A5F'],
      ];
      setBooks(rawBooks.map((b, i) => ({
        ...b,
        coverColor: colors[i % colors.length][0],
        coverColor2: colors[i % colors.length][1]
      })));
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const filtered = books.filter(b => {
    const matchSearch = !search || (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Law Library</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Browse legal books and references</p>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
        <div className="input-wrap" style={{ flex: '1 1 280px', maxWidth: 400, margin: 0 }}>
          <Search size={15} className="icon-left" />
          <input className="input input-icon" placeholder="Search books, authors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category Filter Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-ghost" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Filter size={15} />
            <span>Filter: {category}</span>
          </button>
          
          {showFilterDropdown && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onClick={() => setShowFilterDropdown(false)} 
              />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 8,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                padding: 6, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2,
                minWidth: 200, transformOrigin: 'top left', animation: 'slide-up 0.2s ease-out'
              }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    style={{
                      background: category === cat ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: category === cat ? 'var(--primary-light)' : 'var(--text)',
                      border: 'none', borderRadius: 8, padding: '8px 12px',
                      fontSize: 13, fontWeight: category === cat ? 700 : 500,
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    onClick={() => {
                      setCategory(cat);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <span>{cat}</span>
                    {category === cat && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="grid-4" style={{ gap: 16 }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="skeleton" style={{ height: 240, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state" style={{ minHeight: 200 }}>
          <BookOpen size={44} />
          <h3>No books found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="grid-4" style={{ gap: 16 }}>
          {filtered.map((book, i) => (
            <div key={book._id || i} style={{ animationDelay: `${i * 0.04}s` }}>
              <BookCard book={book} onClick={setSelected} />
            </div>
          ))}
        </div>
      )}

      {selected && <BookDetailModal book={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
