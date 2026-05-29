import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stores from './pages/Stores';
import GlobalInventory from './pages/GlobalInventory';
import AddInventory from './pages/AddInventory';
import AddStore from './pages/AddStore';
import AIAssistant from './components/AIAssistant';
import './styles/App.css';

/**
 * Main App Component
 * Bicycle Inventory Management System
 */
function App() {
  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <h1>🚴 Sistema de Gestão de Estoque de Bicicletas</h1>
          <p>Plataforma de Inventário Multi-Loja com Nuvem Híbrida e IA</p>
        </header>

        {/* Navigation */}
        <nav className="nav">
          <Link to="/dashboard" className="nav-link">
            📊 Painel
          </Link>
          <Link to="/stores" className="nav-link">
            🏪 Lojas
          </Link>
          <Link to="/global-inventory" className="nav-link">
            🌐 Estoque Global
          </Link>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/add-store" element={<AddStore />} />
            <Route path="/global-inventory" element={<GlobalInventory />} />
            <Route path="/add-inventory" element={<AddInventory />} />
          </Routes>
        </main>

        {/* AI Assistant - Available on all pages */}
        <AIAssistant />
      </div>
    </Router>
  );
}

export default App;

// Made with Bob
