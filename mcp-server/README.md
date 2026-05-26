# BOB Orchestrator MCP Server

This MCP (Model Context Protocol) server connects the backend Python application to Bob (Claude) in VS Code, enabling dynamic AI-powered code generation without requiring an API key.

## Overview

The MCP server acts as a bridge between:
- **Backend**: Python FastAPI application
- **Bob**: Claude AI assistant in VS Code

This allows the backend to leverage Bob's intelligence for:
- Dynamic requirement analysis
- Intelligent agent selection
- AI-powered code generation

## Architecture

```
Backend (Python) → MCP Client → MCP Server → Bob (VS Code)
                                              ↓
                                    Dynamic Code Generation
```

## Setup

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Build the Server

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

### 3. Configure VS Code

Add the MCP server to your VS Code settings (`.vscode/settings.json` or user settings):

```json
{
  "mcp.servers": {
    "bob-orchestrator": {
      "command": "node",
      "args": ["path/to/mcp-server/build/index.js"],
      "env": {}
    }
  }
}
```

## Usage

### From Backend

The backend automatically uses MCP when available:

```python
from services.bob_orchestrator import BOBOrchestrator

# MCP is enabled by default
orchestrator = BOBOrchestrator(db, token_monitor, realtime, use_mcp=True)

# Analyze requirements with Bob
analysis = await orchestrator.analyze_requirements(
    project_id="123",
    description="Build an e-commerce platform",
    requirements={"needsDatabase": True, "needsAuth": True}
)

# Generate code with Bob
result = await orchestrator.execute_agent(
    project_id="123",
    task_id="task_1",
    agent_id="ui_specialist",
    input_data={...}
)
```

### Testing MCP Connection

Test the MCP client from Python:

```bash
cd backend
python -m services.mcp_client
```

## Available Tools

### 1. `generate_code`

Generates code dynamically based on agent persona and project requirements.

**Parameters:**
- `agent_id`: Agent identifier (e.g., 'ui_specialist')
- `agent_persona`: Full agent persona from markdown file
- `project_description`: Project description
- `requirements`: Project requirements object
- `previous_outputs`: Array of outputs from previous agents

**Returns:**
- Prompt for Bob to process and generate code

### 2. `analyze_requirements`

Analyzes project requirements and suggests appropriate agents.

**Parameters:**
- `project_description`: User's project description
- `requirements`: Structured requirements object

**Returns:**
- Prompt for Bob to analyze and suggest agents

## Development

### Run in Development Mode

```bash
npm run dev
```

### Rebuild After Changes

```bash
npm run build
```

### Project Structure

```
mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript (generated)
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## How It Works

1. **Backend calls MCP client** with agent persona and project details
2. **MCP client sends JSON-RPC request** to MCP server via stdio
3. **MCP server formats prompt** for Bob based on agent role
4. **Bob processes the prompt** in VS Code and generates code
5. **Response flows back** through MCP server to backend

## Limitations

- **VS Code must be running** for MCP to work
- **Local development only** - not suitable for production deployments
- **Manual prompt processing** - Bob needs to manually process prompts (for now)

## Production Alternative

For production deployments, use the Anthropic API directly:

```python
# Install: pip install anthropic
import anthropic

client = anthropic.Anthropic(api_key="your-key")
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4096,
    system=agent_persona,
    messages=[{"role": "user", "content": prompt}]
)
```

## Troubleshooting

### MCP Server Not Found

```
Error: MCP server not found at path/to/build/index.js
```

**Solution:** Build the server first:
```bash
cd mcp-server && npm run build
```

### Connection Failed

```
Error: MCP server exited with code 1
```

**Solution:** Check that:
1. Node.js is installed (`node --version`)
2. Dependencies are installed (`npm install`)
3. Server builds successfully (`npm run build`)

### Bob Not Responding

The current implementation generates prompts but doesn't automatically process them. In a full implementation, Bob would:
1. Receive the prompt through MCP
2. Process it using Claude's intelligence
3. Return structured code/artifacts

For now, the system falls back to static templates while logging the prompts that would be sent to Bob.

## License

ISC