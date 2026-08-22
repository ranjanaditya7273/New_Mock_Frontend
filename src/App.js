import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Book from './pages/Book';
import Subject from './pages/Subject';
import Topic from './pages/Topic';
import Quiz from "./pages/Quiz";
import QuizAnalysis from './pages/QuizAnalysis';

function App() {
  // ऐप के शुरू होते ही localStorage से थीम चेक करके body पर क्लास जोड़ें
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Book />} />
        <Route path="/book/:bookName" element={<Subject />} />
        <Route path="/topic/:bookName/:subjectName" element={<Topic />} />
        <Route path="/quiz/:bookName/:subjectName/:topicName" element={<Quiz />} />
        <Route path="/analysis/:bookName/:subjectName/:topicName" element={<QuizAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;