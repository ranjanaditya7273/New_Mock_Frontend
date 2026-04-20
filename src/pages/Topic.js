import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Trash2, BookOpen, Clock } from 'lucide-react';
import { getAllBooksFromLocal, updateBookInLocal } from '../db';
import './Topic.css';

const Topic = () => {
  const { bookName, subjectName } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allBooks, setAllBooks] = useState([]);

  useEffect(() => {
    loadTopics();
  }, [bookName, subjectName]);

  const loadTopics = async () => {
    try {
      const data = await getAllBooksFromLocal();
      setAllBooks(data);
      const currentBook = data.find(b => b.bookName === bookName);
      if (currentBook) {
        const currentSubject = currentBook.subjects.find(s => s.subjectName === subjectName);
        if (currentSubject) {
          setTopics(currentSubject.topics || []);
        }
      }
    } catch (err) {
      console.error("Topics load fail:", err);
    }
  };

  // --- Deletion Logic with Admin Auth ---
  const handleDeleteTopic = async (topicNameToDelete) => {
    // 1. एडमिन नाम के लिए प्रॉम्ट दिखाएं
    const adminName = window.prompt("Enter Admin Name:");

    // 2. अगर यूजर 'Cancel' दबा दे तो प्रक्रिया रोक दें
    if (adminName === null) return;

    // 3. नाम की जांच करें
    if (adminName === "Aditya Ranjan") {
      try {
        const bookToUpdate = allBooks.find(b => b.bookName === bookName);
        if (!bookToUpdate) return;

        // डेटा स्ट्रक्चर को अपडेट करें (टॉपिक रिमूव करें)
        const updatedSubjects = bookToUpdate.subjects.map(subject => {
          if (subject.subjectName === subjectName) {
            return {
              ...subject,
              topics: subject.topics.filter(t => t.topicName !== topicNameToDelete)
            };
          }
          return subject;
        });

        const finalBookData = { ...bookToUpdate, subjects: updatedSubjects };

        // डेटाबेस अपडेट करें
        await updateBookInLocal(finalBookData);

        // UI स्टेट अपडेट करें
        setTopics(prev => prev.filter(t => t.topicName !== topicNameToDelete));
        alert("Topic removed successfully!");
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Error updating database.");
      }
    } else {
      alert("Unauthorized! Wrong Admin Name.");
    }
  };

  const filteredTopics = topics.filter(t => 
    t.topicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="topic-container">
      {/* --- Navbar --- */}
      <nav className="topic-nav">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back
        </button>
        <div className="nav-header-info">
          <h2 className="nav-subject-title">{subjectName}</h2>
          <span className="nav-subtitle">Quizzes</span>
        </div>
        <div style={{ width: '80px' }}></div>
      </nav>

      {/* --- Search Section --- */}
      <div className="topic-search-area">
        <div className="search-box-wrapper">
          <Search className="search-box-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search topics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- Topics List --- */}
      <main className="topic-list-wrapper">
        {filteredTopics.length === 0 ? (
          <div className="no-data-text">No topics found.</div>
        ) : (
          filteredTopics.map((topic, index) => (
            <div key={index} className="topic-item-card">
              <div className="ready-status-bar">
                <Clock size={14} /> Ready to start
              </div>
              
              <div className="topic-card-body">
                <div className="topic-body-left">
                  {/* Delete Button */}
                  <button className="delete-topic-btn" onClick={() => handleDeleteTopic(topic.topicName)}>
                    <Trash2 size={20} />
                  </button>
                  <div className="topic-info-text">
                    <h3>{topic.topicName}</h3>
                    <span>{topic.questions?.length || 0} Questions</span>
                  </div>
                </div>

                <div className="topic-actions-group">
                  <button className="btn-timing" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}?mode=timing`)}>
                    <Clock size={16} /> Timing Test
                  </button>
                  <button className="btn-start" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}`)}>
                    Start <ChevronRightSmall />
                  </button>
                  <button className="btn-practice" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}?mode=practice`)}>
                    <BookOpen size={16} /> Practice
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

const ChevronRightSmall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default Topic;