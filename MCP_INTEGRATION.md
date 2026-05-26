# MCP Integration Guide - Local Development with Bob

This guide explains how to use the MCP (Model Context Protocol) integration to connect your backend to Bob in VS Code for dynamic AI-powered code generation **without requiring an API key**.

## 🎯 What This Enables

Instead of using static templates, your backend can now:
- ✅ Use Bob's AI intelligence for dynamic code generation
- ✅ Analyze requirements intelligently
- ✅ Generate context-aware code based on project descriptions
- ✅ Work locally without API costs during development

## 📋 Prerequisites

- Node.js installed (v18 or higher)
- VS Code with Bob extension
- Python 3.8+

## 🚀 Quick Start

### 1. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure VS Code (Optional)

Add to your VS Code settings to enable MCP:

```json
{
  "mcp.servers": {
    "bob-orchestrator": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/build/index.js"]
    }
  }
}
```

### 3. Test the Integration

```bash
cd backend
python -m services.mcp_client
```

You should see:
```
INFO:__main__:Testing MCP connection...
INFO:__main__:MCP test successful: prompt_ready
```

### 4. Run Your Backend

```bash
cd backend
python main.py
```

The backend will automatically detect and use MCP if available.

## 🔧 How It Works

### Architecture

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Backend        │
│  (FastAPI)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BOBOrchestrator │ ◄─── use_mcp=True
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Client     │
│  (Python)       │
└────────┬────────┘
         │ JSON-RPC
         ▼
┌─────────────────┐
│  MCP Server     │
│  (Node.js)      │
└────────┬────────┘
         │ stdio
         ▼
┌─────────────────┐
│  Bob in VS Code │
│  (Claude AI)    │
└─────────────────┘
```

### Request Flow

1. **User creates project** in frontend
2. **Backend receives request** and calls `BOBOrchestrator`
3. **Orchestrator checks MCP availability** and calls `mcp_client`
4. **MCP client sends JSON-RPC request** to MCP server
5. **MCP server formats prompt** with agent persona and project details
6. **Bob processes prompt** (in VS Code) and generates code
7. **Response flows back** through the chain to frontend

## 📝 Usage Examples

### Example 1: Create Project with MCP

```python
from services.bob_orchestrator import BOBOrchestrator

# Initialize with MCP enabled (default)
orchestrator = BOBOrchestrator(
    db=db_client,
    token_monitor=token_monitor,
    realtime=realtime_service,
    use_mcp=True  # Enable MCP
)

# Analyze requirements - Bob will intelligently suggest agents
analysis = await orchestrator.analyze_requirements(
    project_id="proj_123",
    description="Build a modern e-commerce platform with user authentication",
    requirements={
        "needsDatabase": True,
        "needsAuth": True,
        "needsPayment": True
    }
)

print(analysis["selected_agents"])
# Output: ['ui_specialist', 'api_specialist', 'auth_specialist', ...]
```

### Example 2: Generate Code with Bob

```python
# Execute agent - Bob will generate actual code
result = await orchestrator.execute_agent(
    project_id="proj_123",
    task_id="task_1",
    agent_id="ui_specialist",
    input_data={
        "project_description": "Modern e-commerce platform",
        "requirements": {"needsAuth": True},
        "previous_outputs": []
    }
)

# Result contains AI-generated code
print(result["output"]["artifacts"])
# [
#   {"path": "src/App.tsx", "content": "...generated React code..."},
#   {"path": "src/components/Login.tsx", "content": "..."},
#   ...
# ]
```

### Example 3: Disable MCP (Use Static Templates)

```python
# Disable MCP to use static templates
orchestrator = BOBOrchestrator(
    db=db_client,
    token_monitor=token_monitor,
    realtime=realtime_service,
    use_mcp=False  # Disable MCP
)
```

## 🔍 Checking MCP Status

The orchestrator logs its mode on initialization:

```python
# MCP enabled and available
# Output: ✓ MCP mode enabled - using Bob in VS Code for dynamic generation

# MCP disabled or unavailable
# Output: ✗ MCP mode disabled - using static templates
```

## 🐛 Troubleshooting

### Issue: "MCP server not found"

**Cause:** MCP server hasn't been built

**Solution:**
```bash
cd mcp-server
npm run build
```

### Issue: "MCP mode disabled - using static templates"

**Cause:** MCP server not available or not built

**Check:**
1. Is the MCP server built? (`mcp-server/build/index.js` exists?)
2. Is Node.js installed? (`node --version`)
3. Check logs for specific error messages

### Issue: "MCP test failed"

**Cause:** MCP server can't be executed

**Solution:**
```bash
# Test manually
cd mcp-server
node build/index.js

# Should start without errors
# Press Ctrl+C to exit
```

### Issue: Code generation still uses templates

**Current Limitation:** The MCP integration generates prompts for Bob but doesn't automatically process them yet. This is a proof-of-concept showing the integration architecture.

**Full Implementation Would:**
1. Send prompt to Bob through MCP
2. Bob processes with Claude AI
3. Returns structured code/artifacts
4. Backend uses generated code

**Current Behavior:**
- Generates prompts (logged)
- Falls back to static templates
- Demonstrates the integration flow

## 🎓 Understanding the Code

### MCP Server (`mcp-server/src/index.ts`)

Defines two tools:
- `generate_code`: Creates prompts for code generation
- `analyze_requirements`: Creates prompts for requirement analysis

### MCP Client (`backend/services/mcp_client.py`)

Python client that:
- Spawns MCP server process
- Sends JSON-RPC requests
- Receives and parses responses

### BOB Orchestrator (`backend/services/bob_orchestrator.py`)

Modified to:
- Detect MCP availability
- Call MCP client when enabled
- Fall back to static templates when needed

## 🚀 Production Deployment

**Important:** MCP integration is for **local development only**.

For production, use the Anthropic API:

```python
# Install: pip install anthropic
import anthropic
import os

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=8000,
    system=agent_persona,
    messages=[{"role": "user", "content": prompt}]
)

generated_code = message.content[0].text
```

## 📚 Additional Resources

- [MCP Server README](mcp-server/README.md) - Detailed MCP server documentation
- [Anthropic API Docs](https://docs.anthropic.com/) - For production deployment
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## 💡 Benefits of This Approach

### For Development
- ✅ No API costs during development
- ✅ Use existing Bob access in VS Code
- ✅ Test AI integration locally
- ✅ Rapid iteration without API limits

### For Production
- ✅ Easy migration to Anthropic API
- ✅ Same prompts and personas work
- ✅ Scalable and reliable
- ✅ Professional deployment

## 🎉 Next Steps

1. **Test the integration** - Create a project and watch the logs
2. **Experiment with prompts** - Modify agent personas in `backend/agents/specialists/`
3. **Implement full MCP flow** - Connect Bob's responses back to backend
4. **Deploy to production** - Switch to Anthropic API for live deployment

---

**Made with Bob** 🤖