#!/usr/bin/env node

/**
 * Backend Integration MCP Server
 * 
 * This MCP server exposes the backend API as tools that Bob can use directly.
 * Bob can now create projects, execute them, and retrieve results through MCP.
 * 
 * Usage:
 *   node build/backend-tools.js
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Backend API configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Define tools that expose backend functionality
const TOOLS: Tool[] = [
  {
    name: "create_project",
    description: "Create a new AI agent project. This will analyze requirements and select appropriate specialist agents to build the project.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project name (e.g., 'E-commerce Platform', 'Blog Website')",
        },
        description: {
          type: "string",
          description: "Detailed project description explaining what needs to be built",
        },
        requirements: {
          type: "object",
          description: "Project requirements flags",
          properties: {
            needsDatabase: {
              type: "boolean",
              description: "Does the project need database functionality?",
            },
            needsAuth: {
              type: "boolean",
              description: "Does the project need authentication?",
            },
            needsPayment: {
              type: "boolean",
              description: "Does the project need payment processing?",
            },
            needsAPI: {
              type: "boolean",
              description: "Does the project need a REST API?",
            },
            needsUI: {
              type: "boolean",
              description: "Does the project need a user interface?",
            },
          },
        },
        user_id: {
          type: "string",
          description: "User identifier (default: 'bob_user')",
          default: "bob_user",
        },
        token_limit: {
          type: "number",
          description: "Maximum tokens to use (default: 50000)",
          default: 50000,
        },
        cost_limit: {
          type: "number",
          description: "Maximum cost in USD (default: 5.0)",
          default: 5.0,
        },
      },
      required: ["name", "description", "requirements"],
    },
  },
  {
    name: "execute_project",
    description: "Execute a project to generate code. This will run all selected agents and generate the project files.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "The project ID to execute",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_project_status",
    description: "Get the current status of a project, including execution progress and token usage.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "The project ID to check",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_project_output",
    description: "Get all generated code and files for a completed project. Returns the actual generated code that can be saved to disk.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "The project ID to get output for",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "list_available_agents",
    description: "List all available specialist agents and their capabilities.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "estimate_project_cost",
    description: "Estimate the token usage and cost before executing a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "The project ID to estimate",
        },
      },
      required: ["project_id"],
    },
  },
];

// HTTP client helper
async function callBackendAPI(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call backend API: ${error.message}`);
    }
    throw error;
  }
}

// Create MCP server
const server = new Server(
  {
    name: "backend-integration-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "create_project") {
      const {
        name: projectName,
        description,
        requirements,
        user_id = "bob_user",
        token_limit = 50000,
        cost_limit = 5.0,
      } = args as {
        name: string;
        description: string;
        requirements: Record<string, boolean>;
        user_id?: string;
        token_limit?: number;
        cost_limit?: number;
      };

      const result = await callBackendAPI("/api/projects", "POST", {
        user_id,
        name: projectName,
        description,
        requirements,
        token_limit,
        cost_limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Project "${projectName}" created successfully!`,
                project_id: result.project_id,
                selected_agents: result.selected_agents,
                status: result.status,
                next_step: "Use execute_project to generate the code",
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "execute_project") {
      const { project_id } = args as { project_id: string };

      const result = await callBackendAPI(
        `/api/projects/${project_id}/execute`,
        "POST"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Project execution completed!",
                project_id: result.project_id,
                status: result.status,
                total_tokens: result.total_tokens,
                total_cost: result.total_cost,
                results_count: result.results?.length || 0,
                next_step: "Use get_project_output to retrieve the generated code",
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "get_project_status") {
      const { project_id } = args as { project_id: string };

      const result = await callBackendAPI(
        `/api/projects/${project_id}/status`,
        "GET"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                project_id: result.project_id,
                status: result.status,
                total_tokens: result.total_tokens,
                total_cost: result.total_cost,
                tasks: result.tasks.map((task: any) => ({
                  agent_id: task.agent_id,
                  status: task.status,
                  tokens_used: task.tokens_used,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "get_project_output") {
      const { project_id } = args as { project_id: string };

      const result = await callBackendAPI(
        `/api/projects/${project_id}/output`,
        "GET"
      );

      // Format the output nicely
      const files = result.generated_files || {};
      const fileList = Object.keys(files).map((path) => ({
        path,
        size: files[path].length,
        preview: files[path].substring(0, 100) + "...",
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                project_name: result.project_name,
                project_description: result.project_description,
                status: result.project_status,
                total_files: result.total_files,
                files: fileList,
                full_content: files,
                message:
                  "Use the 'full_content' object to save files to disk. Each key is a file path, each value is the file content.",
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "list_available_agents") {
      const result = await callBackendAPI("/api/agents", "GET");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total_agents: result.total,
                agents: result.agents.map((agent: any) => ({
                  id: agent.id,
                  name: agent.name,
                  type: agent.type,
                  capabilities: agent.capabilities,
                  description: agent.description,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (name === "estimate_project_cost") {
      const { project_id } = args as { project_id: string };

      const result = await callBackendAPI(
        `/api/projects/${project_id}/estimate`,
        "POST"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                project_id,
                estimated_tokens: result.estimated_tokens,
                estimated_cost: result.estimated_cost,
                token_limit: result.token_limit,
                cost_limit: result.cost_limit,
                within_budget: result.within_budget,
                message: result.within_budget
                  ? "Project is within budget limits"
                  : "Warning: Project may exceed budget limits",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
              tip: "Make sure the backend server is running on " + BACKEND_URL,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for JSON-RPC communication)
  console.error("Backend Integration MCP Server running on stdio");
  console.error(`Backend URL: ${BACKEND_URL}`);
  console.error("Ready to receive requests from Bob...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Made with Bob