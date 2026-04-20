import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Book from './pages/Book';
import Subject from './pages/Subject';
import Topic from './pages/Topic';
import Quiz from "./pages/Quiz"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Book />} />
        
        {/* यह Subject पेज के लिए है */}
        <Route path="/book/:bookName" element={<Subject />} />
        
        {/* --- यहाँ दिक्कत हो सकती है: इस लाइन को चेक करें --- */}
        <Route path="/topic/:bookName/:subjectName" element={<Topic />} />

        <Route path="/quiz/:bookName/:subjectName/:topicName" element={<Quiz />} />
      </Routes>
    </Router>
  );
}

export default App;