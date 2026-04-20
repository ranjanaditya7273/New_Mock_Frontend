import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Timer, CheckCircle2, Award, RefreshCcw, Home, BookOpen, Info, Pause, Play, SkipForward } from 'lucide-react';
import { getAllBooksFromLocal } from '../db';
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
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPaused, setIsPaused] = useState(false);
  const [clickedIdx, setClickedIdx] = useState(null); 
  const timerRef = useRef(null);

  const fireConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 1500 };
    function fire(particleRatio, opts) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

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

  useEffect(() => {
    if (mode === 'timing' && !showResult && questions.length > 0 && clickedIdx === null && !isPaused) {
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
  }, [currentIdx, mode, questions.length, showResult, clickedIdx, isPaused]);

  const handleOptionClick = (qIdx, optionIdx) => {
    if (userAnswers[qIdx] !== undefined) return;

    if (mode === 'timing') {
      if (clickedIdx !== null || isPaused) return;
      setClickedIdx(optionIdx);
      if (optionIdx === questions[qIdx].ans) {
        setScore(prev => prev + 1);
        fireConfetti();
      }
      setTimeout(() => {
        handleNext();
        setClickedIdx(null);
        setTimeLeft(20);
      }, 800);
    } else if (!mode) {
      setUserAnswers(prev => ({ ...prev, [qIdx]: optionIdx }));
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const skipQuestion = () => {
    handleNext();
    setTimeLeft(20);
    setClickedIdx(null);
  };

  const submitFullTest = () => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.ans) finalScore++;
    });
    setScore(finalScore);
    if (finalScore >= questions.length / 2) fireConfetti();
    setShowResult(true);
  };

  if (questions.length === 0) return <div className="loader">Loading...</div>;

  // --- 1. START MODE (Fixed Header & Footer) ---
  if (!mode && !showResult) {
    return (
      <div className="quiz-page scrollable">
        <nav className="quiz-nav fixed-top">
          <button className="exit-btn" onClick={() => navigate(-1)}><ChevronLeft size={18}/> Exit</button>
          <span className="quiz-header-title">{topicName}</span>
          <div className="practice-mode-tag">Full Test</div>
        </nav>
        <div className="quiz-content pt-nav pb-footer">
          {questions.map((q, idx) => (
            <div key={idx} className="question-card mb-6">
              <h2 className="question-text">{idx + 1}. {q.q || q.question}</h2>
              <div className="options-container">
                {q.options.map((opt, i) => {
                  let statusClass = "";
                  if (userAnswers[idx] !== undefined) {
                    if (i === q.ans) statusClass = "correct";
                    else if (i === userAnswers[idx]) statusClass = "wrong";
                    else statusClass = "dimmed";
                  }
                  return (
                    <div key={i} className={`option-row ${statusClass}`} onClick={() => handleOptionClick(idx, i)}>
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
          <button className="submit-next-btn main-submit" onClick={submitFullTest}>
            Submit Full Test ({Object.keys(userAnswers).length}/{questions.length})
          </button>
        </div>
      </div>
    );
  }

  // --- 2. PRACTICE MODE (Explanation with Fixed Top Nav) ---
  if (mode === 'practice') {
    return (
      <div className="quiz-page scrollable">
        <nav className="quiz-nav fixed-top">
          <button className="exit-btn" onClick={() => navigate(-1)}><ChevronLeft size={18}/> Back</button>
          <span className="quiz-header-title">{topicName}</span>
          <div className="practice-mode-tag"><BookOpen size={16}/> Learning</div>
        </nav>
        <div className="quiz-content pt-nav">
          {questions.map((q, idx) => (
            <div key={idx} className="question-card mb-4">
              <h2 className="question-text">{idx + 1}. {q.q || q.question}</h2>
              <div className="options-container">
                {q.options.map((opt, i) => (
                  <div key={i} className={`option-row ${i === q.ans ? 'correct' : 'dimmed'}`}>
                    <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="opt-text">{opt}</span>
                    {i === q.ans && <CheckCircle2 size={20} className="status-ico-right" />}
                  </div>
                ))}
              </div>
              <div className="explanation-box">
                <div className="exp-header"><Info size={16}/> Explanation:</div>
                <p>{q.explanation || "No explanation available."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. TIMING MODE (With Pause & Skip - No Blur) ---
  if (mode === 'timing' && !showResult) {
    const currentQ = questions[currentIdx];
    return (
      <div className="quiz-page">
        <nav className="quiz-nav fixed-top">
          <button className="exit-btn" onClick={() => navigate(-1)}><ChevronLeft size={18}/> Exit</button>
          <div className="timer-controls">
            <div className="timer-circle"><Timer size={18} /> <span>{timeLeft}s</span></div>
            <div className="action-btns">
              <button className="control-btn pause" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play size={16}/> : <Pause size={16}/>} {isPaused ? "Resume" : "Pause"}
              </button>
              <button className="control-btn skip" onClick={skipQuestion}><SkipForward size={16}/> Skip</button>
            </div>
          </div>
          <div className="practice-mode-tag">Timing</div>
        </nav>
        <main className="quiz-content pt-nav">
          <div className="question-card"> {/* Blur class removed from here */}
            {isPaused && (
              <div className="pause-badge">
                <Pause size={14} /> Paused
              </div>
            )}
            <span className="q-count-text">QUESTION {currentIdx + 1} OF {questions.length}</span>
            <h2 className="question-text">{currentQ.q || currentQ.question}</h2>
            <div className="options-container">
              {currentQ.options.map((opt, i) => {
                let statusClass = "";
                if (clickedIdx !== null) {
                  if (i === currentQ.ans) statusClass = "correct";
                  else if (i === clickedIdx) statusClass = "wrong";
                  else statusClass = "dimmed";
                }
                return (
                  <div key={i} className={`option-row ${statusClass}`} onClick={() => handleOptionClick(currentIdx, i)}>
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

  // --- 4. RESULT SCREEN ---
  if (showResult) {
    return (
      <div className="result-container">
        <div className="result-card">
          <Award size={80} color="#f59e0b" />
          <h1>Quiz Finished!</h1>
          <div className="score-badge"><span className="score-text">{score}</span><span>/ {questions.length}</span></div>
          <div className="result-actions">
            <button className="retry-btn" onClick={() => window.location.reload()}><RefreshCcw size={20} /> Retry</button>
            <button className="home-btn" onClick={() => navigate('/')}><Home size={20} /> Home</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Quiz;