import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProjectRequirements {
  needsDatabase: boolean;
  needsAuth: boolean;
  needsPayment: boolean;
  needsFAQ: boolean;
}

export interface CreateProjectRequest {
  user_id: string;
  name: string;
  description: string;
  requirements: ProjectRequirements;
  token_limit?: number;
  cost_limit?: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  requirements: ProjectRequirements;
  status: string;
  selected_agents: string[];
  created_at: string;
  updated_at: string;
  total_tokens: number;
  total_cost: number;
  token_limit: number;
  cost_limit: number;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  estimated_tokens: number;
  estimated_time: number;
  system_prompt: string;
  version: string;
}

export interface Task {
  id: string;
  project_id: string;
  agent_id: string;
  name: string;
  status: string;
  input: any;
  output?: any;
  error?: string;
  start_time?: string;
  end_time?: string;
  tokens_used: number;
  cost: number;
  execution_order: number;
}

export interface TokenUsage {
  total_tokens: number;
  total_cost: number;
  token_limit: number;
  cost_limit: number;
  percentage: number;
}

export interface CostEstimate {
  estimated_tokens: number;
  estimated_cost: number;
  breakdown: Array<{
    task_name: string;
    estimated_tokens: number;
    estimated_cost: number;
  }>;
  confidence: number;
}

// Projects API
export const createProject = async (data: CreateProjectRequest) => {
  const response = await api.post('/api/projects', data);
  return response.data;
};

export const getProject = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/api/projects/${projectId}`);
  return response.data;
};

export const getProjectStatus = async (projectId: string) => {
  const response = await api.get(`/api/projects/${projectId}/status`);
  return response.data;
};

export const executeProject = async (projectId: string) => {
  const response = await api.post(`/api/projects/${projectId}/execute`);
  return response.data;
};

export const getTokenUsage = async (projectId: string): Promise<TokenUsage> => {
  const response = await api.get(`/api/projects/${projectId}/tokens`);
  return response.data;
};

export const estimateCost = async (projectId: string): Promise<CostEstimate> => {
  const response = await api.post(`/api/projects/${projectId}/estimate`);
  return response.data;
};

export interface ProjectOutput {
  project_id: string;
  project_name: string;
  project_description: string;
  project_status: string;
  total_tasks: number;
  outputs: TaskOutput[];
  generated_files?: { [filename: string]: string };
  agent_outputs?: any[];
  total_files?: number;
  total_agents?: number;
}

export interface TaskOutput {
  task_id: string;
  task_name: string;
  agent_id: string;
  status: string;
  output: any;
  result: any;
  created_at: string;
  completed_at: string;
}

export const getProjectOutput = async (projectId: string): Promise<ProjectOutput> => {
  const response = await api.get(`/api/projects/${projectId}/output`);
  return response.data;
};

export const exportProject = async (projectId: string): Promise<Blob> => {
  const response = await api.get(`/api/projects/${projectId}/export`, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadProjectZip = async (projectId: string, projectName: string) => {
  try {
    const blob = await exportProject(projectId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download project ZIP:', error);
    throw error;
  }
};

// Agents API
export const listAgents = async (): Promise<{ agents: Agent[]; total: number }> => {
  const response = await api.get('/api/agents');
  return response.data;
};

export const getAgent = async (agentId: string): Promise<Agent> => {
  const response = await api.get(`/api/agents/${agentId}`);
  return response.data;
};

// MCP API - Bob Integration
export interface MCPAnalysisResult {
  success: boolean;
  analysis?: any;
  message: string;
}

export interface EnhanceDescriptionRequest {
  description: string;
  requirements: ProjectRequirements;
}

export interface SuggestRequirementsRequest {
  description: string;
}

export interface SuggestedRequirements {
  success: boolean;
  suggested_requirements: ProjectRequirements;
  analysis?: any;
  message: string;
}

export interface MCPFeedback {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface AnalyzeInputResult {
  success: boolean;
  feedback: MCPFeedback[];
  analysis?: any;
  message: string;
}

export const enhanceDescription = async (data: EnhanceDescriptionRequest): Promise<MCPAnalysisResult> => {
  const response = await api.post('/api/mcp/enhance-description', data);
  return response.data;
};

export const suggestRequirements = async (data: SuggestRequirementsRequest): Promise<SuggestedRequirements> => {
  const response = await api.post('/api/mcp/suggest-requirements', data);
  return response.data;
};

export const analyzeInput = async (description: string, requirements?: ProjectRequirements): Promise<AnalyzeInputResult> => {
  const response = await api.post('/api/mcp/analyze-input', {
    description,
    requirements: requirements || null,
  });
  return response.data;
};

export const getMCPStatus = async (): Promise<{ available: boolean; message: string }> => {
  const response = await api.get('/api/mcp/status');
  return response.data;
};

// Gemini AI API
export interface GeminiHealthResponse {
  status: string;
  gemini_available: boolean;
  model: string;
  message: string;
}

export interface GenerateTextRequest {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  system_instruction?: string;
}

export interface GenerateTextResponse {
  success: boolean;
  text: string;
  tokens_used: number;
  model: string;
  error?: string;
}

export interface AnalyzeCodeRequest {
  code: string;
  language: string;
  task?: string;
}

export interface GenerateCodeRequest {
  description: string;
  language: string;
  requirements?: string[];
}

export interface StructuredOutputRequest {
  prompt: string;
  schema: Record<string, any>;
  temperature?: number;
}

export const getGeminiHealth = async (): Promise<GeminiHealthResponse> => {
  const response = await api.get('/api/gemini/health');
  return response.data;
};

export const generateText = async (data: GenerateTextRequest): Promise<GenerateTextResponse> => {
  const response = await api.post('/api/gemini/generate', data);
  return response.data;
};

export const analyzeCode = async (data: AnalyzeCodeRequest) => {
  const response = await api.post('/api/gemini/analyze-code', data);
  return response.data;
};

export const generateCode = async (data: GenerateCodeRequest) => {
  const response = await api.post('/api/gemini/generate-code', data);
  return response.data;
};

export const generateStructuredOutput = async (data: StructuredOutputRequest) => {
  const response = await api.post('/api/gemini/structured-output', data);
  return response.data;
};

export const analyzeRequirementsWithGemini = async (
  description: string,
  requirements: ProjectRequirements
) => {
  const response = await api.post('/api/gemini/analyze-requirements', requirements, {
    params: { description }
  });
  return response.data;
};

// Analyze Project with Gemini
export interface AnalyzeProjectRequest {
  description: string;
  requirements: ProjectRequirements;
}

export interface AgentSuggestion {
  agent_id: string;
  agent_name: string;
  reason: string;
  estimated_tokens: number;
}

export interface AnalyzeProjectResponse {
  success: boolean;
  suggested_agents: AgentSuggestion[];
  total_estimated_tokens: number;
  total_estimated_cost: number;
  analysis: string;
  error?: string;
}

export const analyzeProject = async (data: AnalyzeProjectRequest): Promise<AnalyzeProjectResponse> => {
  const response = await api.post('/api/gemini/analyze-project', data);
  return response.data;
};

export default api;

// Made with Bob
