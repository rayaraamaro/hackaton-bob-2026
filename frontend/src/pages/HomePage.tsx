import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createProject,
  listAgents,
  Agent,
  ProjectRequirements,
  suggestRequirements,
  analyzeInput,
  getMCPStatus,
  getGeminiHealth,
  generateText
} from '../services/api';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export function HomePage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mcpAvailable, setMcpAvailable] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [analyzingInput, setAnalyzingInput] = useState(false);
  const [suggestingRequirements, setSuggestingRequirements] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const { toasts, hideToast, success, error: showError, info } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: {
      needsDatabase: false,
      needsAuth: false,
      needsPayment: false,
      needsFAQ: false,
    } as ProjectRequirements,
  });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await listAgents();
        setAgents(data.agents);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        showError('Failed to load available agents. Please refresh the page.');
      }
    };
    
    const checkMCPStatus = async () => {
      try {
        const status = await getMCPStatus();
        setMcpAvailable(status.available);
        if (status.available) {
          info('🤖 Bob is ready to assist you!');
        }
      } catch (error) {
        console.error('Failed to check MCP status:', error);
      }
    };
    
    const checkGeminiStatus = async () => {
      try {
        const health = await getGeminiHealth();
        setGeminiAvailable(health.gemini_available);
        if (health.gemini_available) {
          info('✨ Gemini AI is ready to enhance your descriptions!');
        }
      } catch (error) {
        console.error('Failed to check Gemini status:', error);
      }
    };
    
    fetchAgents();
    checkMCPStatus();
    checkGeminiStatus();
  }, [showError, info]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      showError('Please enter a project name');
      return;
    }
    if (!formData.description.trim()) {
      showError('Please enter a project description');
      return;
    }
    
    setShowConfirm(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const result = await createProject({
        user_id: 'demo-user',
        name: formData.name,
        description: formData.description,
        requirements: formData.requirements,
      });

      success('Project created successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/execution/${result.project_id}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('Failed to create project. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementChange = (key: keyof ProjectRequirements) => {
    setFormData({
      ...formData,
      requirements: {
        ...formData.requirements,
        [key]: !formData.requirements[key],
      },
    });
  };

  const handleSuggestRequirements = async () => {
    if (!formData.description.trim()) {
      showError('Please enter a project description first');
      return;
    }

    if (!mcpAvailable) {
      showError('Bob is not available. Please check MCP server status.');
      return;
    }

    setSuggestingRequirements(true);
    try {
      const result = await suggestRequirements({ description: formData.description });
      
      if (result.success) {
        setFormData({
          ...formData,
          requirements: result.suggested_requirements,
        });
        success('✨ Bob suggested requirements based on your description!');
      }
    } catch (error) {
      console.error('Failed to suggest requirements:', error);
      showError('Failed to get suggestions from Bob. Please try again.');
    } finally {
      setSuggestingRequirements(false);
    }
  };

  const handleAnalyzeDescription = async () => {
    if (!formData.description.trim()) {
      return;
    }

    if (!mcpAvailable) {
      return;
    }

    setAnalyzingInput(true);
    try {
      const result = await analyzeInput(formData.description, formData.requirements);
      
      if (result.success && result.feedback.length > 0) {
        result.feedback.forEach(fb => {
          if (fb.type === 'warning') {
            showError(fb.message);
          } else if (fb.type === 'info') {
            info(fb.message);
          }
        });
      }
    } catch (error) {
      console.error('Failed to analyze input:', error);
    } finally {
      setAnalyzingInput(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!formData.description.trim()) {
      showError('Please enter a project description first');
      return;
    }

    if (!geminiAvailable) {
      showError('Gemini AI is not available. Please check the service status.');
      return;
    }

    setEnhancingDescription(true);
    try {
      const result = await generateText({
        prompt: `You are a technical project manager. Enhance and improve this project description to be more clear, detailed, and professional. Keep it concise but comprehensive. Original description: "${formData.description}"`,
        temperature: 0.7,
        max_tokens: 500
      });

      if (result.success && result.text) {
        setFormData({
          ...formData,
          description: result.text.trim()
        });
        success('✨ Gemini enhanced your description!');
      }
    } catch (error) {
      console.error('Failed to enhance description:', error);
      showError('Failed to enhance description. Please try again.');
    } finally {
      setEnhancingDescription(false);
    }
  };

  // Debounced analysis on description change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description.trim().length > 10) {
        handleAnalyzeDescription();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.description]);

  const requirementIcons = {
    needsDatabase: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    needsAuth: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    needsPayment: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    needsFAQ: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            AI Agent Project Studio
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Powered by <span className="font-bold text-blue-600">BOB</span> - IBM's AI Assistant
            {geminiAvailable && <span className="ml-2 text-purple-600">+ ✨ Gemini AI</span>}
          </p>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Describe your project and let BOB orchestrate specialized agents to build it for you
          </p>
          {(mcpAvailable || geminiAvailable) && (
            <div className="flex items-center justify-center gap-4 mt-4">
              {mcpAvailable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                  Bob Ready
                </span>
              )}
              {geminiAvailable && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse"></span>
                  Gemini Ready
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 animate-fade-in">
          <form onSubmit={handleSubmit}>
            {/* Project Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                placeholder="e.g., E-commerce Platform"
              />
            </div>

            {/* Project Description */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Project Description *
                </label>
                <div className="flex items-center gap-3">
                  {geminiAvailable && (
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      disabled={enhancingDescription || !formData.description.trim()}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {enhancingDescription ? (
                        <>
                          <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          ✨ Enhance with Gemini
                        </>
                      )}
                    </button>
                  )}
                  {mcpAvailable && analyzingInput && (
                    <span className="text-xs text-blue-600 flex items-center">
                      <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Bob is analyzing...
                    </span>
                  )}
                </div>
              </div>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Describe what you want to build in detail..."
              />
            </div>

            {/* Requirements */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-800">
                  Project Requirements
                </label>
                {mcpAvailable && (
                  <button
                    type="button"
                    onClick={handleSuggestRequirements}
                    disabled={suggestingRequirements || !formData.description.trim()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {suggestingRequirements ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Suggesting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Ask Bob to Suggest
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(requirementIcons).map(([key, icon]) => {
                  const isChecked = formData.requirements[key as keyof ProjectRequirements];
                  const labels = {
                    needsDatabase: 'Database',
                    needsAuth: 'Authentication',
                    needsPayment: 'Payment Integration',
                    needsFAQ: 'FAQ / Help Center',
                  };
                  
                  return (
                    <label
                      key={key}
                      className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all card-hover ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRequirementChange(key as keyof ProjectRequirements)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <div className={isChecked ? 'text-blue-600' : 'text-gray-500'}>
                        {icon}
                      </div>
                      <span className={`font-medium ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>
                        {labels[key as keyof typeof labels]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Project...
                </span>
              ) : (
                'Create Project with BOB'
              )}
            </button>
          </form>
        </div>

        {/* Available Agents */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
          <div className="flex items-center mb-6">
            <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Available Agents</h2>
          </div>
          
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-pulse-slow">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-500">Loading agents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="border-2 border-gray-200 rounded-xl p-5 card-hover bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex items-start mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{agent.name}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{agent.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {agent.capabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Create Project?"
        message={`Are you sure you want to create "${formData.name}"? BOB will start analyzing your requirements and selecting the appropriate agents.`}
        confirmText="Create Project"
        cancelText="Cancel"
        type="info"
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

// Made with Bob
