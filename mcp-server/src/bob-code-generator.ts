#!/usr/bin/env node

/**
 * Bob Code Generator MCP Server
 * 
 * This MCP server provides Bob with agent personas and project requirements,
 * allowing Bob to generate code directly instead of relying on backend templates.
 * 
 * Flow:
 * 1. Bob calls get_project_requirements(description, requirements)
 * 2. MCP returns agent personas and detailed instructions
 * 3. Bob generates code using his AI capabilities
 * 4. Bob saves files directly to disk
 * 
 * This is TRUE MCP integration - Bob does the generation, not the backend.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

// Get project root directory
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const AGENTS_DIR = path.join(PROJECT_ROOT, "backend", "agents", "specialists");

// Define tools
const TOOLS: Tool[] = [
  {
    name: "get_code_generation_context",
    description: "Get all context needed for Bob to generate code: agent personas, project requirements, and generation instructions. Bob will use this to generate code directly.",
    inputSchema: {
      type: "object",
      properties: {
        project_description: {
          type: "string",
          description: "Detailed description of what to build (e.g., 'a blog website with authentication')",
        },
        requirements: {
          type: "object",
          description: "Project requirements",
          properties: {
            needsDatabase: { type: "boolean" },
            needsAuth: { type: "boolean" },
            needsPayment: { type: "boolean" },
            needsAPI: { type: "boolean" },
            needsUI: { type: "boolean" },
          },
        },
      },
      required: ["project_description", "requirements"],
    },
  },
];

// Load agent persona from markdown file
async function loadAgentPersona(agentId: string): Promise<string> {
  try {
    const filePath = path.join(AGENTS_DIR, `${agentId}.md`);
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return `Agent persona not found for ${agentId}`;
  }
}

// Select agents based on requirements
function selectAgents(requirements: Record<string, boolean>): string[] {
  const agents: string[] = [];
  
  if (requirements.needsUI) {
    agents.push("ui_specialist");
  }
  
  if (requirements.needsAPI) {
    agents.push("api_specialist");
  }
  
  if (requirements.needsDatabase || requirements.needsAuth || requirements.needsPayment) {
    agents.push("logic_specialist");
  }
  
  // Default agents if none selected
  if (agents.length === 0) {
    agents.push("ui_specialist", "api_specialist", "logic_specialist");
  }
  
  return agents;
}

// Create MCP server
const server = new Server(
  {
    name: "bob-code-generator",
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
    if (name === "get_code_generation_context") {
      const { project_description, requirements } = args as {
        project_description: string;
        requirements: Record<string, boolean>;
      };

      // Select appropriate agents
      const selectedAgents = selectAgents(requirements);
      
      // Load agent personas
      const personas: Record<string, string> = {};
      for (const agentId of selectedAgents) {
        personas[agentId] = await loadAgentPersona(agentId);
      }

      // Build comprehensive generation instructions
      const instructions = `
# Code Generation Task

## Project Description
${project_description}

## Requirements
${Object.entries(requirements)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

## Selected Agents
${selectedAgents.map((id) => `- ${id}`).join("\n")}

## Your Task
You are Bob, an AI assistant. You need to generate a complete, production-ready project based on the description and requirements above.

### Generation Process

1. **Analyze the project description carefully**
   - Extract key features (e.g., "blog" → blog posts, "authentication" → login/register)
   - Identify entities (e.g., User, Post, Comment)
   - Determine relationships between entities

2. **For each selected agent, generate appropriate code:**

${selectedAgents
  .map(
    (agentId) => `
   **${agentId}:**
   ${personas[agentId].split("\n").slice(0, 20).join("\n")}
   
   [Full persona provided below]
`
  )
  .join("\n")}

3. **Generate complete, working code**
   - All files must be complete and runnable
   - Include all necessary imports and dependencies
   - Follow the coding standards from each agent persona
   - Implement the ACTUAL features described, not generic templates

4. **File structure**
   - Frontend: React + TypeScript + Tailwind CSS
   - Backend: Python + FastAPI
   - Include package.json, requirements.txt, and all config files

### Important Rules

- **NO GENERIC TEMPLATES**: Generate code that implements the specific features described
- **COMPLETE IMPLEMENTATION**: Don't use placeholders or TODOs
- **FOLLOW PERSONAS**: Each agent has specific technology stacks and standards
- **TYPE SAFETY**: Use TypeScript for frontend, type hints for backend
- **BEST PRACTICES**: Follow the coding standards in each persona

---

## Agent Personas (Full Context)

${selectedAgents
  .map(
    (agentId) => `
### ${agentId}

${personas[agentId]}

---
`
  )
  .join("\n")}

## Next Steps

1. Read and understand all agent personas above
2. Generate code for each agent following their specific guidelines
3. Save all files to the appropriate locations
4. Ensure all files work together as a cohesive project

**Start generating code now!**
`;

      return {
        content: [
          {
            type: "text",
            text: instructions,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bob Code Generator MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Made with Bob
