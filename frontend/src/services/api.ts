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

export default api;

// Made with Bob
