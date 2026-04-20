import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, MinusCircle, Lightbulb, Maximize, Minimize } from 'lucide-react';
import { getAllResults } from '../db'; 
import './QuizAnalysis.css';

const QuizAnalysis = () => {
  const { bookName, subjectName, topicName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterType = queryParams.get('type') || 'all'; 

  const [displayQuestions, setDisplayQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleBackToTopics = () => {
    if (bookName && subjectName) {
      const encodedBook = encodeURIComponent(bookName);
      const encodedSubject = encodeURIComponent(subjectName);
      navigate(`/topic/${encodedBook}/${encodedSubject}`);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    loadAnalysisData();
  }, [topicName, filterType]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      const allResults = await getAllResults();
      const topicId = `${bookName}_${subjectName}_${topicName}`;
      const resultObj = allResults.find(r => r.topicId === topicId);

      if (resultObj && resultObj.reviewData) {
        const { correctArr, wrongArr, skipArr } = resultObj.reviewData;
        setStats({
          correct: correctArr.length,
          wrong: wrongArr.length,
          skipped: skipArr.length
        });

        if (filterType === 'correct') setDisplayQuestions(correctArr);
        else if (filterType === 'wrong') setDisplayQuestions(wrongArr);
        else if (filterType === 'skip') setDisplayQuestions(skipArr);
        else {
          const all = [...correctArr, ...wrongArr, ...skipArr].sort((a, b) => a.qIdx - b.qIdx);
          setDisplayQuestions(all);
        }
      }
    } catch (err) {
      console.error("Error loading analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (q) => {
    if (q.userAns === undefined) return { label: 'Skipped', icon: <MinusCircle className="stat-ico-gray" size={18} />, class: 'skip' };
    if (q.userAns === q.ans) return { label: 'Correct', icon: <CheckCircle className="stat-ico-green" size={18} />, class: 'correct' };
    return { label: 'Wrong', icon: <XCircle className="stat-ico-red" size={18} />, class: 'wrong' };
  };

  if (loading) return <div className="analysis-loader">Analyzing Your Performance...</div>;

  return (
    <div className={`analysis-page ${isFullScreen ? 'fs-active' : ''}`}>
      {!isFullScreen && (
        <nav className="analysis-nav fixed-top">
          <div className="nav-top-row">
            <button className="back-btn" onClick={handleBackToTopics}>
              <ChevronLeft size={22}/> Back
            </button>
            
            {/* Center Group */}
            <div className="nav-title-group">
              <h1 className="topic-title-main">{topicName}</h1>
              <span className="subtitle-text">Performance Analysis</span>
            </div>

            {/* Right Group (Full Screen Icon) */}
            <button className="fs-toggle-right" onClick={toggleFullScreen}>
              <Maximize size={20} />
            </button>
          </div>
          
          <div className="mode-tabs">
            <button className={`tab-item ${filterType === 'all' ? 'active' : ''}`} onClick={() => navigate(`?type=all`)}>
              All <span>{stats.correct + stats.wrong + stats.skipped}</span>
            </button>
            <button className={`tab-item correct-tab ${filterType === 'correct' ? 'active' : ''}`} onClick={() => navigate(`?type=correct`)}>
              Correct <span>{stats.correct}</span>
            </button>
            <button className={`tab-item wrong-tab ${filterType === 'wrong' ? 'active' : ''}`} onClick={() => navigate(`?type=wrong`)}>
              Wrong <span>{stats.wrong}</span>
            </button>
            <button className={`tab-item skip-tab ${filterType === 'skip' ? 'active' : ''}`} onClick={() => navigate(`?type=skip`)}>
              Skip <span>{stats.skipped}</span>
            </button>
          </div>
        </nav>
      )}

      {isFullScreen && (
        <button className="fs-minimize-floating" onClick={toggleFullScreen}>
          <Minimize size={24} />
        </button>
      )}

      <main className={`analysis-content ${isFullScreen ? 'fs-content' : ''}`}>
        {displayQuestions.length === 0 ? (
          <div className="no-data-view">
             <div className="no-data-icon">📋</div>
             <p>No questions found.</p>
          </div>
        ) : (
          displayQuestions.map((q, idx) => {
            const info = getStatusInfo(q);
            return (
              <div key={idx} className={`analysis-card-container ${info.class}`}>
                <div className="analysis-card-header">
                  <span className="q-badge">Question {q.qIdx}</span>
                  <div className={`status-pill ${info.class}`}>
                    {info.icon} <span>{info.label}</span>
                  </div>
                </div>
                <h2 className="analysis-q-text">{q.q || q.question}</h2>
                <div className="analysis-options-list">
                  {q.options.map((opt, i) => {
                    let optionType = i === q.ans ? "correct-opt" : (i === q.userAns ? "wrong-opt" : "neutral-opt");
                    return (
                      <div key={i} className={`analysis-option-item ${optionType}`}>
                        <div className="opt-letter-circle">{String.fromCharCode(65 + i)}</div>
                        <span className="opt-label-text">{opt}</span>
                        {i === q.ans && <CheckCircle size={16} className="correct-check" />}
                        {i === q.userAns && i !== q.ans && <XCircle size={16} className="wrong-cross" />}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="analysis-explanation-box">
                    <div className="exp-header"><Lightbulb size={16} /> <span>Detailed Explanation</span></div>
                    <div className="exp-body">{q.explanation}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default QuizAnalysis;