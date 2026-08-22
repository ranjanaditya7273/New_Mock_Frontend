import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ShieldCheck, Trash2, LayoutGrid, X, BookOpen, Moon, Sun } from 'lucide-react';
import { getAllBooksFromLocal, saveBooksToLocal } from '../db';
import './Book.css';

const Book = () => {
    const [books, setBooks] = useState([]);
    const [inputValue, setInputValue] = useState(''); // इनपुट फील्ड की वैल्यू के लिए
    const [searchTerm, setSearchTerm] = useState(''); // एक्चुअल सर्च ट्रिगर के लिए
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [creds, setCreds] = useState({ email: '', password: '' });
    const [darkMode, setDarkMode] = useState(false);

    const [searchedQuestions, setSearchedQuestions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
        // Check saved theme preference on initial load
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchedQuestions([]);
            return;
        }

        const results = [];

        // Recursive search - qIndex को पास कर रहे हैं ताकि नंबर पता चल सके
        const findQuestionsRecursively = (node, bName, sName = 'N/A', tName = 'N/A', qIndex = -1) => {
            if (!node || typeof node !== 'object') return;

            if (Array.isArray(node)) {
                node.forEach((item, index) => findQuestionsRecursively(item, bName, sName, tName, index));
                return;
            }

            let newSubject = sName;
            if (node.subjectName || node.subject) newSubject = node.subjectName || node.subject;
            else if (node.name && node.topics) newSubject = node.name;

            let newTopic = tName;
            if (node.topicName || node.topic || node.chapterName) newTopic = node.topicName || node.topic || node.chapterName;
            else if (node.name && (node.questions || node.data)) newTopic = node.name;

            const qText = node.question || node.questionText || node.title || node.text;

            if (qText && typeof qText === 'string') {
                if (qText.toLowerCase().includes(searchTerm.toLowerCase())) {
                    if (!results.find(r => r.questionText === qText)) {
                        results.push({
                            id: Math.random().toString(36).substr(2, 9),
                            bookName: bName,
                            subjectName: newSubject,
                            topicName: newTopic,
                            questionText: qText,
                            questionIndex: qIndex
                        });
                    }
                }
            }

            Object.values(node).forEach(val => {
                if (typeof val === 'object') {
                    findQuestionsRecursively(val, bName, newSubject, newTopic, qIndex);
                }
            });
        };

        books.forEach(book => {
            findQuestionsRecursively(book, book.bookName);
        });

        setSearchedQuestions(results);
    }, [searchTerm, books]);

    const handleSearchClick = () => {
        setSearchTerm(inputValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchTerm(inputValue);
        }
    };

    const handleQuestionClick = (sq) => {
        const path = `/quiz/${encodeURIComponent(sq.bookName)}/${encodeURIComponent(sq.subjectName)}/${encodeURIComponent(sq.topicName)}?mode=practice&qIdx=${sq.questionIndex}`;
        navigate(path);
    };

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
            const res = await axios.post('https://aditya-mock.onrender.com/api/admin-dump', creds);

            if (res.data && res.data.success) {
                await saveBooksToLocal(res.data.data);
                setBooks(res.data.data);
                setShowModal(false);
                alert("✅ Success!");
            }
        } catch (err) { alert("❌ Error!"); }
        finally { setLoading(false); }
    };

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

    return (
        <div className="book-container" style={{ paddingTop: "0px" }}>
            <nav className="navbar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '15px 25px',
                boxSizing: 'border-box',
                flexWrap: 'wrap',
                gap: '12px',
                margin: '0 auto'
            }}>
                {/* Left Side: Logo & Name */}
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div className="logo-box">Er.</div>
                    <span className="logo-text" style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>ADITYA RANJAN</span>
                </div>

                {/* Middle: Chapter-Wise Quiz Button & Dark Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexGrow: 1, order: 3, width: '100%', minWidth: '200px' }} className="desktop-middle-btn">
                    <button
                        onClick={() => { window.location.href = 'https://aditya-mixedquiz-mock.onrender.com/'; }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            color: darkMode ? '#f8fafc' : '#1e293b',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <BookOpen size={16} /> Go To Mixed-Quiz
                    </button>

                    {/* Dark Mode Toggle Button */}
                    <button
                        onClick={toggleDarkMode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                            color: darkMode ? '#f8fafc' : '#1e293b',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        title="Toggle Dark/Light Mode"
                    >
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        <span>{darkMode ? 'Light' : 'Dark'}</span>
                    </button>
                </div>

                {/* Right Side: Admin Button */}
                <div className="nav-links" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, order: 2 }}>
                    <button
                        onClick={() => setShowModal(true)}
                        className="admin-sync-btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <ShieldCheck size={16} /> Admin
                    </button>
                </div>
            </nav>

            {/* Inline CSS for Laptop vs Mobile adjustments */}
            <style>{`
                @media (min-width: 900px) {
                    .navbar {
                        flex-wrap: nowrap !important;
                        padding: 15px 40px !important;
                    }
                    .desktop-middle-btn {
                        order: 2 !important;
                        width: auto !important;
                    }
                    .nav-links {
                        order: 3 !important;
                    }
                }
            `}</style>

            <header className="header-section" style={{ padding: '20px 15px' }}>
                <div
                    className="search-container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderRadius: '50px',
                        padding: '6px 8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search questions..."
                        className="search-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            padding: '10px 12px',
                            fontSize: '16px',
                            backgroundColor: 'transparent',
                            color: darkMode ? '#f8fafc' : '#0f172a',
                            minWidth: '0'
                        }}
                    />
                    <button
                        onClick={handleSearchClick}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 18px',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background-color 0.2s ease',
                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                        Search
                    </button>
                </div>
            </header>

            {searchTerm.trim() !== '' && (
                <div style={{ padding: '0 20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3 style={{ color: darkMode ? '#f8fafc' : '#334155', margin: 0 }}>📝 Matching Questions</h3>
                        <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                            Total Found: {searchedQuestions.length}
                        </span>
                    </div>

                    {searchedQuestions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {searchedQuestions.map((sq) => (
                                <div
                                    key={sq.id}
                                    onClick={() => handleQuestionClick(sq)}
                                    style={{ padding: '15px', backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                                >
                                    <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '500', color: darkMode ? '#f8fafc' : '#1e293b' }}>
                                        {sq.questionIndex + 1}. {sq.questionText}
                                    </p>

                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: '600' }}>📚 {sq.bookName}</span>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: '600' }}>📖 {sq.subjectName}</span>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: '600' }}>📝 {sq.topicName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '15px', padding: '10px' }}>No questions found...</p>
                    )}
                </div>
            )}

            <main className="books-grid">
                {books.map((book) => (
                    <div key={book._id} className="book-card" style={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
                        <div className="book-icon-box">
                            {book.photo ? <img src={book.photo.startsWith('data:') ? book.photo : `data:image/png;base64,${book.photo}`} alt={book.bookName} className="book-photo" /> : <LayoutGrid size={32} />}
                        </div>
                        <div className="book-text-details">
                            <h3 className="book-name" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>{book.bookName}</h3>
                            <button onClick={() => navigate(`/book/${encodeURIComponent(book.bookName)}`)} className="open-link">Open Section ›</button>
                        </div>
                        <div className="action-buttons">
                            <button className="icon-btn delete-btn" onClick={() => handleDeleteBook(book._id, book.bookName)}><Trash2 size={24} /></button>
                        </div>
                    </div>
                ))}
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                        <button onClick={() => setShowModal(false)} className="close-modal"><X size={24} /></button>
                        <h2 style={{ fontWeight: 900, fontSize: '28px', marginBottom: '8px' }}>Admin Login</h2>
                        <form onSubmit={handleSync}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Email</label>
                            <input type="email" required className="modal-input" onChange={(e) => setCreds({ ...creds, email: e.target.value })} style={{ backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f8fafc' : '#000' }} />
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginTop: '16px' }}>Password</label>
                            <input type="password" required className="modal-input" onChange={(e) => setCreds({ ...creds, password: e.target.value })} style={{ backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#f8fafc' : '#000' }} />
                            <button type="submit" disabled={loading} className="submit-btn">{loading ? "Syncing..." : "Submit"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Book;