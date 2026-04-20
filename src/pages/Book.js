import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ShieldCheck, Trash2, Home, PlusSquare, LayoutGrid, X } from 'lucide-react';
import { getAllBooksFromLocal, saveBooksToLocal } from '../db';
import './Book.css';

const Book = () => {
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [creds, setCreds] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const localData = await getAllBooksFromLocal();
            setBooks(Array.isArray(localData) ? localData : []);
        } catch (err) { console.error(err); }
    };

    const handleSync = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8080/api/admin-dump', creds);
            if (res.data && res.data.success) {
                await saveBooksToLocal(res.data.data);
                setBooks(res.data.data);
                setShowModal(false);
                alert("✅ Success!");
            }
        } catch (err) { alert("❌ Error!"); }
        finally { setLoading(false); }
    };

    // --- Delete Book logic with Admin check ---
    const handleDeleteBook = async (bookId, bookName) => {
        const adminName = window.prompt("Enter Admin Name to delete book:");

        if (adminName === null) return;

        if (adminName === "Aditya Ranjan") {
            try {
                const updatedBooks = books.filter(b => b._id !== bookId);
                await saveBooksToLocal(updatedBooks);
                setBooks(updatedBooks);
                alert(`Book "${bookName}" deleted successfully!`);
            } catch (err) {
                console.error("Delete failed:", err);
                alert("Error deleting book.");
            }
        } else {
            alert("Unauthorized! Incorrect Admin Name.");
        }
    };

    const filteredBooks = books.filter(b =>
        b.bookName && b.bookName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="book-container">
            <nav className="navbar">
                <div className="logo-section">
                    <div className="logo-box">Er.</div>
                    <span className="logo-text">ADITYA RANJAN</span>
                </div>
                <div className="nav-links">
                    {/* <button className="nav-btn"><Home size={19} /> Home</button> */}
                    {/* <button className="nav-btn"><PlusSquare size={19} /> Create Test</button> */}
                    {/* <button className="nav-btn"><PlusSquare size={19} /> New Section</button> */}
                    <button onClick={() => setShowModal(true)} className="admin-sync-btn">
                        <ShieldCheck size={18} /> Admin Sync
                    </button>
                </div>
            </nav>

            <header className="header-section">
                {/* <h1 className="main-title">Quiz Library</h1> */}
                <div className="search-container">
                    <Search className="search-icon" size={22} />
                    <input
                        type="text"
                        placeholder="Search sections..."
                        className="search-input"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className="books-grid">
                {filteredBooks.map((book) => (
                    <div key={book._id} className="book-card">
                        {/* 1. Left Section: Image */}
                        <div className="book-icon-box">
                            {book.photo ? (
                                <img
                                    src={book.photo.startsWith('data:') ? book.photo : `data:image/png;base64,${book.photo}`}
                                    alt={book.bookName}
                                    className="book-photo"
                                />
                            ) : (
                                <LayoutGrid size={32} />
                            )}
                        </div>

                        {/* 2. Middle Section: Book Name & Link */}
                        <div className="book-text-details">
                            <h3 className="book-name">{book.bookName}</h3>
                            <button
                                onClick={() => navigate(`/book/${encodeURIComponent(book.bookName)}`)}
                                className="open-link"
                            >
                                Open Section ›
                            </button>
                        </div>

                        {/* 3. Right Section: Delete Button */}
                        <div className="action-buttons">
                            <button
                                className="icon-btn delete-btn"
                                onClick={() => handleDeleteBook(book._id, book.bookName)}
                            >
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>
                ))}
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button onClick={() => setShowModal(false)} className="close-modal"><X size={24} /></button>
                        <h2 style={{ fontWeight: 900, fontSize: '28px', marginBottom: '8px' }}>Admin Sync</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Enter credentials.</p>
                        <form onSubmit={handleSync}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Email</label>
                            <input type="email" required className="modal-input" onChange={(e) => setCreds({ ...creds, email: e.target.value })} />

                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginTop: '16px' }}>Password</label>
                            <input type="password" required className="modal-input" onChange={(e) => setCreds({ ...creds, password: e.target.value })} />

                            <button type="submit" disabled={loading} className="submit-btn">
                                {loading ? "Syncing..." : "Submit"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Book;