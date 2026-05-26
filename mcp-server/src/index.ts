#!/usr/bin/env node

/**
 * BOB Orchestrator MCP Server
 * 
 * This MCP server connects the backend Python application to Bob (Claude) in VS Code.
 * It provides tools for dynamic code generation without requiring an API key.
 * 
 * Usage:
 *   node build/index.js
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "generate_code",
    description: "Generate code dynamically based on agent persona and project requirements. Bob will act as the specified agent and generate appropriate code/artifacts.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID (e.g., 'ui_specialist', 'api_specialist')",
        },
        agent_persona: {
          type: "string",
          description: "The full agent persona/instructions from markdown file",
        },
        project_description: {
          type: "string",
          description: "Description of the project to generate code for",
        },
        requirements: {
          type: "object",
          description: "Project requirements (needsDatabase, needsAuth, etc.)",
        },
        previous_outputs: {
          type: "array",
          description: "Outputs from previous agents for context",
          items: {
            type: "object",
          },
        },
      },
      required: ["agent_id", "agent_persona", "project_description"],
    },
  },
  {
    name: "analyze_requirements",
    description: "Analyze project requirements and suggest appropriate agents to use. Bob will intelligently determine which specialists are needed.",
    inputSchema: {
      type: "object",
      properties: {
        project_description: {
          type: "string",
          description: "User's project description",
        },
        requirements: {
          type: "object",
          description: "Structured requirements from the form",
        },
      },
      required: ["project_description", "requirements"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "bob-orchestrator-mcp",
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
    if (name === "generate_code") {
      const {
        agent_id,
        agent_persona,
        project_description,
        requirements = {},
        previous_outputs = [],
      } = args as {
        agent_id: string;
        agent_persona: string;
        project_description: string;
        requirements?: Record<string, any>;
        previous_outputs?: any[];
      };

      // Build context for Bob
      let context = `You are acting as the ${agent_id} agent.\n\n`;
      context += `AGENT PERSONA:\n${agent_persona}\n\n`;
      context += `PROJECT DESCRIPTION:\n${project_description}\n\n`;
      context += `REQUIREMENTS:\n${JSON.stringify(requirements, null, 2)}\n\n`;

      if (previous_outputs.length > 0) {
        context += `PREVIOUS AGENT OUTPUTS:\n`;
        previous_outputs.forEach((output, idx) => {
          context += `\nAgent ${idx + 1}:\n${JSON.stringify(output, null, 2)}\n`;
        });
      }

      context += `\n\nINSTRUCTIONS:\n`;
      context += `Generate appropriate code/artifacts for this project based on your role as ${agent_id}.\n`;
      context += `Return your response as a JSON object with the following structure:\n`;
      context += `{\n`;
      context += `  "content": "Brief description of what you generated",\n`;
      context += `  "artifacts": [\n`;
      context += `    {\n`;
      context += `      "path": "relative/file/path.ext",\n`;
      context += `      "content": "full file content here"\n`;
      context += `    }\n`;
      context += `  ],\n`;
      context += `  "metadata": {\n`;
      context += `    "technologies_used": ["tech1", "tech2"],\n`;
      context += `    "notes": "Any important notes"\n`;
      context += `  }\n`;
      context += `}\n\n`;
      context += `Generate complete, production-ready code. Be thorough and professional.`;

      return {
        content: [
          {
            type: "text",
            text: context,
          },
        ],
      };
    } else if (name === "analyze_requirements") {
      const { project_description, requirements } = args as {
        project_description: string;
        requirements: Record<string, any>;
      };

      const context = `Analyze the following project and recommend which specialist agents should be used:\n\n`;
      const prompt = context +
        `PROJECT DESCRIPTION:\n${project_description}\n\n` +
        `REQUIREMENTS:\n${JSON.stringify(requirements, null, 2)}\n\n` +
        `Available agents:\n` +
        `- ui_specialist: Frontend/UI development (React, TypeScript, Tailwind)\n` +
        `- api_specialist: Backend API development (FastAPI, REST)\n` +
        `- logic_specialist: Business logic and services\n` +
        `- ecommerce_specialist: E-commerce features and specifications\n` +
        `- database_specialist: Database design and implementation\n` +
        `- auth_specialist: Authentication and authorization\n\n` +
        `Return a JSON object with:\n` +
        `{\n` +
        `  "selected_agents": ["agent_id1", "agent_id2", ...],\n` +
        `  "reasoning": "Explanation of why these agents were selected",\n` +
        `  "execution_order": ["agent_id1", "agent_id2", ...]\n` +
        `}\n\n` +
        `Consider the project requirements carefully and select the most appropriate agents.`;

      return {
        content: [
          {
            type: "text",
            text: prompt,
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
          text: `Error: ${errorMessage}`,
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
  console.error("BOB Orchestrator MCP Server running on stdio");
  console.error("Ready to receive requests...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Made with Bob
