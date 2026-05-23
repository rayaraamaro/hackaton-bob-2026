import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getProjectStatus, executeProject, estimateCost, getProjectOutput, Project, Task, ProjectOutput } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { TokenMonitor } from '../components/TokenMonitor';
import { ProgressBar } from '../components/ProgressBar';
import { TaskList } from '../components/TaskList';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export function ExecutionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [output, setOutput] = useState<ProjectOutput | null>(null);
  const [loadingOutput, setLoadingOutput] = useState(false);
  const { lastMessage } = useWebSocket(projectId || null);
  const { toasts, hideToast, success, error: showError, info } = useToast();

  // Fetch project data
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        const [projectData, statusData] = await Promise.all([
          getProject(projectId),
          getProjectStatus(projectId),
        ]);
        
        setProject(projectData);
        setTasks(statusData.tasks || []);
        
        // Get cost estimate
        try {
          const estimateData = await estimateCost(projectId);
          setEstimate(estimateData);
        } catch (error) {
          console.error('Failed to get estimate:', error);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        showError('Failed to load project data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, showError]);

  // Listen for real-time updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'task:update') {
      setTasks((prevTasks) => {
        const taskIndex = prevTasks.findIndex((t) => t.id === lastMessage.data.task_id);
        if (taskIndex >= 0) {
          const newTasks = [...prevTasks];
          newTasks[taskIndex] = { ...newTasks[taskIndex], ...lastMessage.data };
          return newTasks;
        }
        return prevTasks;
      });
      
      if (lastMessage.data.status === 'completed') {
        info(`Task completed: ${lastMessage.data.agent_id}`);
      }
    }

    if (lastMessage.type === 'progress:update') {
      // Progress updates are handled by the ProgressBar component
    }
  }, [lastMessage, info]);

  const handleExecute = () => {
    setShowConfirm(true);
  };

  const handleConfirmExecute = async () => {
    if (!projectId) return;

    setShowConfirm(false);
    setExecuting(true);
    
    try {
      await executeProject(projectId);
      success('Execution started! BOB is now working on your project.');
    } catch (error) {
      console.error('Failed to execute project:', error);
      showError('Failed to start execution. Please check your connection and try again.');
    } finally {
      setExecuting(false);
    }
  };

  const handleViewOutput = async () => {
    if (!projectId) return;
    
    setLoadingOutput(true);
    try {
      const outputData = await getProjectOutput(projectId);
      setOutput(outputData);
      setShowOutput(true);
    } catch (error) {
      console.error('Failed to fetch output:', error);
      showError('Failed to load project output. Please try again.');
    } finally {
      setLoadingOutput(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl text-gray-700 font-semibold mb-4">Project not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;

  const statusConfig = {
    completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✓' },
    executing: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '⚡' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: '✕' },
    planning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '📋' },
  };

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.planning;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border border-gray-100 animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
              </div>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 ${status.border} ${status.bg}`}>
              <span className="text-lg">{status.icon}</span>
              <span className={`font-semibold ${status.text} capitalize`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Selected Agents */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Selected Agents
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.selected_agents.map((agentId) => (
                <span
                  key={agentId}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200"
                >
                  {agentId}
                </span>
              ))}
            </div>
          </div>

          {/* Cost Estimate */}
          {estimate && project.status === 'planning' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold text-blue-900">Cost Estimate</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium mb-1">Estimated Tokens</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {estimate.estimated_tokens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${estimate.estimated_cost.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          {project.status === 'planning' && (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {executing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting Execution...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Execution with BOB
                </span>
              )}
            </button>
          )}

          {/* View Output Button */}
          {(project.status === 'completed' || project.status === 'executing') && (
            <button
              onClick={handleViewOutput}
              disabled={loadingOutput}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-4"
            >
              {loadingOutput ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading Output...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Project Output
                </span>
              )}
            </button>
          )}

          {/* Progress Bar */}
          {project.status === 'executing' && totalTasks > 0 && (
            <div className="mt-6">
              <ProgressBar completed={completedTasks} total={totalTasks} />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TaskList tasks={tasks} />
          </div>

          {/* Token Monitor - Takes 1 column */}
          <div>
            <TokenMonitor projectId={projectId || ''} />
          </div>
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
        title="Start Execution?"
        message="BOB will now start executing your project with the selected agents. This process may take several minutes depending on the complexity."
        confirmText="Start Execution"
        cancelText="Cancel"
        type="info"
        onConfirm={handleConfirmExecute}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Output Modal */}
      {showOutput && output && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold text-white">Project Output</h2>
              </div>
              <button
                onClick={() => setShowOutput(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Project Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{output.project_name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Status: <span className="font-medium ml-1 capitalize">{output.project_status}</span>
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks: <span className="font-medium ml-1">{output.total_tasks}</span>
                  </span>
                </div>
              </div>

              {/* Task Outputs */}
              <div className="space-y-4">
                {output.outputs.map((taskOutput, index) => (
                  <div key={taskOutput.task_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Task Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-3">
                            Task {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900">{taskOutput.task_name}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          taskOutput.status === 'completed' ? 'bg-green-100 text-green-800' :
                          taskOutput.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {taskOutput.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Agent: {taskOutput.agent_id}</p>
                    </div>

                    {/* Task Output */}
                    <div className="p-4">
                      {taskOutput.output ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                            <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 font-mono whitespace-pre-wrap">
                              {typeof taskOutput.output === 'string'
                                ? taskOutput.output
                                : JSON.stringify(taskOutput.output, null, 2)}
                            </div>
                          </div>
                          {taskOutput.result && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Result:</p>
                              <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 font-mono whitespace-pre-wrap">
                                {JSON.stringify(taskOutput.result, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No output available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {output.outputs.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No outputs generated yet</p>
                  <p className="text-gray-500 text-sm mt-1">Execute the project to generate outputs</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowOutput(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Made with Bob
