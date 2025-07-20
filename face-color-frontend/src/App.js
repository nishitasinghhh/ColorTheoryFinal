import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ResultPage from './pages/ResultPage'
import RecommendationsPage from './pages/Recommendations';
import FloatingChatbot from './components/FloatingChatbot';
// (You can import other pages here as you build them)

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/recommendations" element={<RecommendationsPage/>}/>
          {/* Add more routes here for upload, camera, quiz, results, etc. */}
        </Routes>
        <FloatingChatbot />
      </div>
    </Router>
  );
}

export default App;