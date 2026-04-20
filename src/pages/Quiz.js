import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Timer, Maximize, Minimize, Pause, Play, SkipForward, CheckCircle2, Lightbulb } from 'lucide-react';
import { getAllBooksFromLocal, saveQuizResult } from '../db';
import confetti from 'canvas-confetti';
import './Quiz.css';

const Quiz = () => {
  const { bookName, subjectName, topicName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20); // Individual Q timer for Timing Mode
  const [totalSeconds, setTotalSeconds] = useState(0); // Total Quiz Time Tracker
  const [isPaused, setIsPaused] = useState(false);
  const [clickedIdx, setClickedIdx] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const timerRef = useRef(null);
  const totalTimerRef = useRef(null);

  const fireConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 2000 });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => navigate(-1)).catch(() => navigate(-1));
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Load Quiz Questions
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const allBooks = await getAllBooksFromLocal();
        const book = allBooks.find(b => b.bookName === bookName);
        if (book) {
          const subject = book.subjects.find(s => s.subjectName === subjectName);
          if (subject) {
            const topic = subject.topics.find(t => t.topicName === topicName);
            if (topic) setQuestions(topic.questions || []);
          }
        }
      } catch (err) { console.error(err); }
    };
    loadQuiz();
  }, [bookName, subjectName, topicName]);

  // Global Timer for all modes (to track total time taken)
  useEffect(() => {
    if (!isPaused && questions.length > 0) {
      totalTimerRef.current = setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(totalTimerRef.current);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [isPaused, questions.length]);

  // Individual Question Timer for Timing Mode
  useEffect(() => {
    if (mode === 'timing' && questions.length > 0 && clickedIdx === null && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNext();
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [currentIdx, mode, questions.length, clickedIdx, isPaused]);

  // Format total seconds into "4 min 34 sec" string
  const getFormattedTime = () => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs} sec`;
    return `${mins} min ${secs} sec`;
  };

  // रिडायरेक्ट और सेव लॉजिक (With Time)
  const saveAndRedirect = async (finalUserAns) => {
    const correctArr = [];
    const wrongArr = [];
    const skipArr = [];

    questions.forEach((q, idx) => {
      const uAns = finalUserAns[idx];
      const qData = { ...q, userAns: uAns, qIdx: idx + 1 };
      if (uAns === undefined) skipArr.push(qData);
      else if (uAns === q.ans) correctArr.push(qData);
      else wrongArr.push(qData);
    });

    const resultData = {
      topicId: `${bookName}_${subjectName}_${topicName}`,
      correct: correctArr.length,
      wrong: wrongArr.length,
      skipped: skipArr.length,
      total: questions.length,
      completedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeTaken: getFormattedTime(), // अब यहाँ "4 min 34 sec" जैसा डेटा जाएगा
      reviewData: { correctArr, wrongArr, skipArr }
    };

    try {
      await saveQuizResult(resultData);
      if (document.fullscreenElement) await document.exitFullscreen();
      navigate(`/topic/${encodeURIComponent(bookName)}/${encodeURIComponent(subjectName)}`, { replace: true });
    } catch (err) {
      console.error("Error saving:", err);
      navigate(-1);
    }
  };

  const handleOptionClick = (qIdx, optionIdx) => {
    if (userAnswers[qIdx] !== undefined) return;

    if (mode === 'timing') {
      if (clickedIdx !== null || isPaused) return;
      const updatedAnswers = { ...userAnswers, [qIdx]: optionIdx };
      setUserAnswers(updatedAnswers);
      setClickedIdx(optionIdx);

      if (optionIdx === questions[qIdx].ans) fireConfetti();

      setTimeout(() => {
        if (currentIdx + 1 < questions.length) {
          setCurrentIdx(prev => prev + 1);
          setClickedIdx(null);
          setTimeLeft(20);
        } else {
          saveAndRedirect(updatedAnswers);
        }
      }, 600);
    } else if (!mode) {
      setUserAnswers(prev => ({ ...prev, [qIdx]: optionIdx }));
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(20);
    } else if (mode === 'timing') {
      saveAndRedirect(userAnswers);
    }
  };

  const submitFullTest = () => {
    saveAndRedirect(userAnswers);
  };

  if (questions.length === 0) return <div className="loader">Loading Questions...</div>;

  // Normal Mode UI
  if (!mode) {
    return (
      <div className={`quiz-page scrollable ${isFullScreen ? 'fs-active' : ''}`}>
        {!isFullScreen && (
          <nav className="quiz-nav fixed-top">
            <button className="exit-btn" onClick={handleExit}><ChevronLeft size={18} /> Exit</button>
            <span className="quiz-header-title">{topicName}</span>
            <div className="nav-right">
              <span className="total-time-badge"><Timer size={14} /> {getFormattedTime()}</span>
              <button className="fs-toggle-btn" onClick={toggleFullScreen}><Maximize size={18} /></button>
            </div>
          </nav>
        )}
        <div className={`quiz-content ${isFullScreen ? 'pt-20' : 'pt-nav'} pb-footer`}>
          {questions.map((q, idx) => (
            <div key={idx} className="question-card mb-6">
              <h2 className="question-text">{idx + 1}. {q.q || q.question}</h2>
              <div className="options-container">
                {q.options.map((opt, i) => {
                  let st = (userAnswers[idx] !== undefined) ? (i === q.ans ? "correct" : (i === userAnswers[idx] ? "wrong" : "dimmed")) : "";
                  return (
                    <div key={i} className={`option-row ${st}`} onClick={() => handleOptionClick(idx, i)}>
                      <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                      <span className="opt-text">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="fixed-footer">
          <button className="main-submit" onClick={submitFullTest}>
            Finish & Save ({Object.keys(userAnswers).length}/{questions.length})
          </button>
        </div>
      </div>
    );
  }

  // Practice Mode UI (No changes needed for result saving here)
  if (mode === 'practice') {
    return (
      <div className={`quiz-page scrollable ${isFullScreen ? 'fs-active' : ''}`}>
        <nav className="quiz-nav fixed-top">
          <button className="exit-btn" onClick={handleExit}><ChevronLeft size={18} /> Back</button>
          <span className="quiz-header-title">{topicName}</span>
          <button className="fs-toggle-btn" onClick={toggleFullScreen}><Maximize size={18} /></button>
        </nav>
        <div className={`quiz-content pt-nav`}>
          {questions.map((q, idx) => (
            <div key={idx} className="question-card mb-4 learning-card">
              <h2 className="question-text">{idx + 1}. {q.q || q.question}</h2>
              <div className="options-container">
                {q.options.map((opt, i) => (
                  <div key={i} className={`option-row ${i === q.ans ? 'correct' : 'dimmed'}`}>
                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                    {i === q.ans && <CheckCircle2 size={18} className="status-ico-right" />}
                  </div>
                ))}
              </div>
              <div className="explanation-box-modern">
                <div className="exp-header-modern"><Lightbulb size={18} /> <span>Explanation</span></div>
                <p className="exp-body-modern">{q.explanation || "No explanation provided."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Timing Mode UI
  if (mode === 'timing') {
    const currentQ = questions[currentIdx];
    return (
      <div className={`quiz-page ${isFullScreen ? 'fs-active' : ''}`}>
        <nav className={`quiz-nav ${isFullScreen ? 'fs-nav-timing' : 'fixed-top'}`}>
          <button className="exit-btn" onClick={handleExit}><ChevronLeft size={18} /> Exit</button>
          <div className="timer-controls">
            <div className="timer-circle"><Timer size={18} /> <span>{timeLeft}s</span></div>
            <button className="control-btn pause" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button className="control-btn skip" onClick={handleNext}><SkipForward size={16} /></button>
          </div>
          <div className="nav-right">
            <span className="q-counter">{currentIdx + 1}/{questions.length}</span>
          </div>
        </nav>
        <main className="quiz-content pt-nav">
          <div className="question-card">
            {isPaused && <div className="pause-overlay">Paused</div>}
            <h2 className="question-text">{currentIdx + 1}. {currentQ.q || currentQ.question}</h2>
            <div className="options-container">
              {currentQ.options.map((opt, i) => {
                let status = (clickedIdx !== null) ? (i === currentQ.ans ? "correct" : (i === clickedIdx ? "wrong" : "dimmed")) : "";
                return (
                  <div key={i} className={`option-row ${status}`} onClick={() => handleOptionClick(currentIdx, i)}>
                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default Quiz;