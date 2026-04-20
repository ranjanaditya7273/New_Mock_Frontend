import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Trash2, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { getAllBooksFromLocal, updateBookInLocal, getAllResults } from '../db';
import './Topic.css';

const Topic = () => {
  const { bookName, subjectName } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allBooks, setAllBooks] = useState([]);
  const [quizResults, setQuizResults] = useState({});

  useEffect(() => {
    loadTopics();
    loadResults();
  }, [bookName, subjectName]);

  const loadTopics = async () => {
    try {
      const data = await getAllBooksFromLocal();
      setAllBooks(data);
      const currentBook = data.find(b => b.bookName === bookName);
      if (currentBook) {
        const currentSubject = currentBook.subjects.find(s => s.subjectName === subjectName);
        if (currentSubject) setTopics(currentSubject.topics || []);
      }
    } catch (err) { console.error("Error loading topics:", err); }
  };

  const loadResults = async () => {
    try {
      const results = await getAllResults();
      const resultsMap = {};
      results.forEach(res => { 
        resultsMap[res.topicId] = res; 
      });
      setQuizResults(resultsMap);
    } catch (err) { console.error("Error loading results:", err); }
  };

  const handleStatsClick = (topicName, type) => {
    navigate(`/analysis/${encodeURIComponent(bookName)}/${encodeURIComponent(subjectName)}/${encodeURIComponent(topicName)}?type=${type}`);
  };

  const handleDeleteTopic = async (topicNameToDelete) => {
    const adminName = window.prompt("Enter Admin Name:");
    if (adminName === "Aditya Ranjan") {
      try {
        const bookToUpdate = allBooks.find(b => b.bookName === bookName);
        if (!bookToUpdate) return;
        const updatedSubjects = bookToUpdate.subjects.map(subject => {
          if (subject.subjectName === subjectName) {
            return { ...subject, topics: subject.topics.filter(t => t.topicName !== topicNameToDelete) };
          }
          return subject;
        });
        await updateBookInLocal({ ...bookToUpdate, subjects: updatedSubjects });
        setTopics(prev => prev.filter(t => t.topicName !== topicNameToDelete));
      } catch (err) { alert("Error updating database."); }
    }
  };

  const filteredTopics = topics.filter(t => t.topicName.toLowerCase().includes(searchTerm.toLowerCase()));

  // समय को फॉर्मेट करने के लिए हेल्पर फंक्शन
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    // अगर समय पहले से "4 min 34 sec" फॉर्मेट में है तो उसे ही दिखाएं
    if (timeStr.includes('min')) return `Time: ${timeStr}`;
    // अगर केवल स्ट्रिंग है "Full Test" या "Timing Test", तो इसे डेटाबेस से आए वास्तविक समय से बदलें
    return timeStr;
  };

  return (
    <div className="topic-container">
      <nav className="topic-nav">
        {/* Change 3: Navigate back to Subject Page */}
        <button className="back-button" onClick={() => navigate(`/book/${encodeURIComponent(bookName)}`)}>
          <ChevronLeft size={20} /> Back
        </button>
        <div className="nav-header-info">
          <h2 className="nav-subject-title">{subjectName}</h2>
          {/* <span className="nav-subtitle">Quizzes</span> */}
        </div>
        <div style={{ width: '80px' }}></div>
      </nav>

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

      <main className="topic-list-wrapper">
        {filteredTopics.map((topic, index) => {
          const tId = `${bookName}_${subjectName}_${topic.topicName}`;
          const res = quizResults[tId];

          // Change 1: Remove pre-existing numbers from topicName to avoid "1. 1."
          const cleanTopicName = topic.topicName.replace(/^\d+\.\s*/, '');

          return (
            <div key={index} className={`topic-item-card ${res ? 'completed-card' : ''}`}>
              <div className={`ready-status-bar ${res ? 'status-completed' : ''}`}>
                {res ? (
                  // Change 2: Dynamic Time display
                  <><CheckCircle2 size={14} /> Completed: {res.completedDate} | {res.timeTaken ? `Time: ${res.timeTaken}` : 'Completed'}</>
                ) : (
                  <><Clock size={14} /> Ready to start</>
                )}
              </div>
              
              <div className="topic-card-body">
                <div className="topic-body-left">
                  <button className="delete-topic-btn" onClick={() => handleDeleteTopic(topic.topicName)}>
                    <Trash2 size={20} />
                  </button>
                  <div className="topic-info-text">
                    <h3>{index + 1}. {cleanTopicName}</h3>
                    <span>{topic.questions?.length || 0} Questions</span>
                  </div>
                </div>

                <div className="topic-actions-group">
                  <button className="btn-timing" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}?mode=timing`)}>
                    <Clock size={16} /> Timing Test
                  </button>
                  <button className="btn-start" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}`)}>
                    {res ? "Retake" : "Start"}
                  </button>
                  <button className="btn-practice" onClick={() => navigate(`/quiz/${bookName}/${subjectName}/${encodeURIComponent(topic.topicName)}?mode=practice`)}>
                    <BookOpen size={16} /> Practice
                  </button>
                </div>
              </div>

              {res && (
                <div className="result-stats-footer">
                  <div className="stats-row">
                    <span className="stat-correct" onClick={() => handleStatsClick(topic.topicName, 'correct')}>
                      ● {res.correct} Correct ({Math.round((res.correct/res.total)*100)}%)
                    </span>
                    <span className="stat-wrong" onClick={() => handleStatsClick(topic.topicName, 'wrong')}>
                      ● {res.wrong} Wrong ({Math.round((res.wrong/res.total)*100)}%)
                    </span>
                    <span className="stat-skip" onClick={() => handleStatsClick(topic.topicName, 'skip')}>
                      ● {res.skipped} Skip
                    </span>
                  </div>
                  
                  <div className="multi-progress-bar" style={{ display: 'flex', height: '8px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' }}>
                    <div 
                      className="p-correct" 
                      style={{ 
                        width: `${(res.correct / res.total) * 100}%`,
                        backgroundColor: '#22c55e', 
                        height: '100%' 
                      }}
                    ></div>
                    <div 
                      className="p-wrong" 
                      style={{ 
                        width: `${(res.wrong / res.total) * 100}%`,
                        backgroundColor: '#ef4444', 
                        height: '100%' 
                      }}
                    ></div>
                    <div 
                      className="p-skip" 
                      style={{ 
                        width: `${(res.skipped / res.total) * 100}%`,
                        backgroundColor: '#f59e0b', 
                        height: '100%' 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default Topic;