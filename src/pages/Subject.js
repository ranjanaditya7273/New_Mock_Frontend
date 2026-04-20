import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, BookOpen, LayoutGrid, Trash2 } from 'lucide-react';
import { getAllBooksFromLocal, updateBookInLocal } from '../db';
import './Subject.css';

const Subject = () => {
  const { bookName } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allBooks, setAllBooks] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, [bookName]);

  const loadSubjects = async () => {
    try {
      const data = await getAllBooksFromLocal();
      setAllBooks(data);
      const currentBook = data.find(b => b.bookName === bookName);
      if (currentBook && currentBook.subjects) {
        setSubjects(currentBook.subjects);
      }
    } catch (err) {
      console.error("Subjects load fail:", err);
    }
  };

  const handleDeleteSubject = async (e, subjectNameToDelete) => {
    e.stopPropagation();
    const adminName = window.prompt("Enter Admin Name to delete subject:");
    if (adminName === null) return;

    if (adminName === "Aditya Ranjan") {
      try {
        const bookToUpdate = allBooks.find(b => b.bookName === bookName);
        if (!bookToUpdate) return;

        const updatedSubjectsList = bookToUpdate.subjects.filter(
          (s) => s.subjectName !== subjectNameToDelete
        );

        const updatedBookData = { ...bookToUpdate, subjects: updatedSubjectsList };
        await updateBookInLocal(updatedBookData);

        setSubjects(updatedSubjectsList);
        alert(`Subject "${subjectNameToDelete}" deleted successfully!`);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Error deleting subject.");
      }
    } else {
      alert("Unauthorized! Incorrect Admin Name.");
    }
  };

  const filteredSubjects = subjects.filter(sub => 
    sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="subject-container">
      <nav className="subject-nav">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={24} /> Back
        </button>
        <div className="nav-title-box">
          <span className="nav-book-name">{bookName}</span>
        </div>
        <div style={{ width: '80px' }}></div>
      </nav>

      <header className="subject-header">
        <div className="subject-search-wrapper">
          <Search className="sub-search-icon" size={20} />
          <input 
            type="text" 
            placeholder={`Search subjects in ${bookName}...`}
            className="subject-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="subject-grid-wrapper">
        <div className="subject-grid-layout">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((sub, index) => (
              <div 
                key={index} 
                className="subject-card-modern" 
                onClick={() => navigate(`/topic/${bookName}/${encodeURIComponent(sub.subjectName)}`)}
              >
                <div className="sub-card-content">
                  <div className="sub-icon-circle">
                    <LayoutGrid size={22} color="#3b82f6" />
                  </div>
                  <div className="sub-details">
                    <h3 className="sub-name-text">{sub.subjectName}</h3>
                    <p className="sub-topics-count">{sub.topics?.length || 0} Topics Available</p>
                  </div>
                </div>
                
                <button 
                  className="sub-delete-action" 
                  onClick={(e) => handleDeleteSubject(e, sub.subjectName)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="no-sub-found-full">
              <BookOpen size={48} />
              <p>No subjects found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subject;