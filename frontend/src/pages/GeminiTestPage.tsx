import React, { useState, useEffect } from 'react';
import { getGeminiHealth, generateText, analyzeCode, generateCode, type GenerateTextRequest } from '../services/api';

export function GeminiTestPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [prompt, setPrompt] = useState('Explain what REST APIs are in one sentence');
  const [code, setCode] = useState('function add(a, b) {\n  return a + b;\n}');
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze' | 'create'>('generate');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const healthData = await getGeminiHealth();
      setHealth(healthData);
    } catch (err: any) {
      setError(`Health check failed: ${err.message}`);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const request: GenerateTextRequest = {
        prompt,
        temperature: 0.7,
        max_tokens: 500
      };
      
      const response = await generateText(request);
      
      if (response.success) {
        setResult(response.text);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCode = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const response = await analyzeCode({
        code,
        language: 'javascript',
        task: 'analyze and suggest improvements'
      });
      
      if (response.success) {
        setResult(response.text);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const response = await generateCode({
        description: prompt,
        language: 'javascript',
        requirements: ['Use modern ES6+ syntax', 'Include error handling']
      });
      
      if (response.success) {
        setResult(response.text);
      } else {
        setError(response.error || 'Code generation failed');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Gemini AI Test Console
          </h1>
          <p className="text-gray-600">
            Test Google Gemini AI integration directly from the UI
          </p>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Status</h2>
              {health ? (
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${health.gemini_available ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-700">
                    {health.gemini_available ? '✅ Gemini Available' : '❌ Gemini Unavailable'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Model: {health.model}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">Checking...</span>
              )}
            </div>
            <button
              onClick={checkHealth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
          {health && !health.gemini_available && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ {health.message}
              </p>
              <p className="text-yellow-700 text-xs mt-2">
                Make sure the backend server is restarted and GEMINI_API_KEY is configured in .env
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💬 Generate Text
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'analyze'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔍 Analyze Code
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⚡ Generate Code
            </button>
          </div>

          <div className="p-6">
            {/* Generate Text Tab */}
            {activeTab === 'generate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter your prompt here..."
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !health?.gemini_available}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '⏳ Generating...' : '🚀 Generate Text'}
                </button>
              </div>
            )}

            {/* Analyze Code Tab */}
            {activeTab === 'analyze' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code to Analyze
                  </label>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    rows={8}
                    placeholder="Paste your code here..."
                  />
                </div>
                <button
                  onClick={handleAnalyzeCode}
                  disabled={loading || !health?.gemini_available}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze Code'}
                </button>
              </div>
            )}

            {/* Generate Code Tab */}
            {activeTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe what you want to build
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="E.g., Create a function to validate email addresses"
                  />
                </div>
                <button
                  onClick={handleGenerateCode}
                  disabled={loading || !health?.gemini_available}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '⏳ Generating Code...' : '⚡ Generate Code'}
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">❌ Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  ✨ Gemini Response
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📚 How to Use
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Make sure the backend server is restarted (stop Terminal 2 with Ctrl+C, then run <code className="bg-blue-100 px-2 py-1 rounded">python main.py</code>)</li>
            <li>Check that the Service Status shows "✅ Gemini Available"</li>
            <li>Choose a tab: Generate Text, Analyze Code, or Generate Code</li>
            <li>Enter your prompt or code and click the button</li>
            <li>View the AI-generated response below</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
