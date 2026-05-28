import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NewHomePage } from './pages/NewHomePage';
import { ExecutionPage } from './pages/ExecutionPage';
import { GeminiTestPage } from './pages/GeminiTestPage';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<NewHomePage />} />
        <Route path="/execution/:projectId" element={<ExecutionPage />} />
        <Route path="/gemini-test" element={<GeminiTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// Made with Bob
