import React, { useState } from 'react';
import { aiAPI } from '../services/api';

/**
 * AI Assistant Component
 * Provides natural language interface for inventory queries
 */
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: 'Olá! Sou seu assistente de IA para inventário. Pergunte-me sobre:\n- Itens com estoque baixo\n- Sugestões de reposição\n- Transferências de estoque\n- Produtos mais vendidos\n- Informações das lojas'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await aiAPI.askAssistant(query);
      const assistantMessage = {
        type: 'assistant',
        text: response.data.answer
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'assistant',
        text: 'Desculpe, encontrei um erro. Por favor, tente novamente.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    'Qual loja tem estoque baixo?',
    'O que devo repor esta semana?',
    'Mostre-me os produtos mais vendidos',
    'Sugira transferências de estoque'
  ];

  return (
    <div className="ai-assistant">
      {!isOpen && (
        <button
          className="ai-chat-button"
          onClick={() => setIsOpen(true)}
          title="Assistente de IA"
        >
          🤖
        </button>
      )}

      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <h3>Assistente de IA</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="ai-message"
                style={{
                  background: msg.type === 'user' ? '#667eea' : '#f8f9fa',
                  color: msg.type === 'user' ? 'white' : '#333',
                  marginLeft: msg.type === 'user' ? '2rem' : '0',
                  marginRight: msg.type === 'user' ? '0' : '2rem'
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="ai-message">
                <em>Pensando...</em>
              </div>
            )}

            {messages.length === 1 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Experimente perguntar:
                </p>
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.5rem',
                      margin: '0.3rem 0',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="ai-chat-input">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pergunte-me qualquer coisa..."
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !query.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AIAssistant;

// Made with Bob
