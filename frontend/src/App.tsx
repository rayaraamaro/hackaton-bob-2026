import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ExecutionPage } from './pages/ExecutionPage';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/execution/:projectId" element={<ExecutionPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// Made with Bob
