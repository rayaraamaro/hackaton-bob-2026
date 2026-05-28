# MCP Integration - Bob Frontend Assistance

## Overview

This document describes the MCP (Model Context Protocol) integration that enables Bob to assist users in real-time as they input project details in the frontend.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──HTTP─→│   Backend    │ ──MCP──→│  Bob (IDE)  │
│  (React)    │ ←──────│  (FastAPI)   │ ←───────│             │
└─────────────┘         └──────────────┘         └─────────────┘
```

### Components

1. **Frontend** (`frontend/src/`)
   - Collects user input (project name, description, requirements)
   - Calls backend MCP proxy endpoints
   - Displays real-time feedback from Bob

2. **Backend MCP Proxy** (`backend/api/routes/mcp.py`)
   - Exposes MCP capabilities as REST endpoints
   - Proxies requests to MCP client
   - Handles errors and provides fallbacks

3. **MCP Client** (`backend/services/mcp_client.py`)
   - Communicates with MCP server via stdio
   - Sends requests to Bob in VS Code
   - Returns Bob's analysis and suggestions

4. **MCP Servers** (`.bob/mcp.json`)
   - `bob-code-generator`: Provides code generation context
   - `backend-integration`: Connects to backend API
   - `sequential-thinking`: Advanced reasoning

## Features

### 1. Real-time Description Analysis

As users type their project description, Bob analyzes it and provides feedback:

```typescript
// Automatically triggered after 1.5s of no typing
const handleAnalyzeDescription = async () => {
  const result = await analyzeInput(formData.description, formData.requirements);
  // Display feedback to user
};
```

**Feedback Types:**
- ℹ️ **Info**: Helpful suggestions
- ⚠️ **Warning**: Description too short or unclear
- ❌ **Error**: Critical issues

### 2. Smart Requirement Suggestions

Bob can suggest requirements based on the project description:

```typescript
const handleSuggestRequirements = async () => {
  const result = await suggestRequirements({ description: formData.description });
  // Auto-check suggested requirements
};
```

**Example:**
- Description: "A blog website with user authentication"
- Bob suggests: ✅ Database, ✅ Auth, ✅ UI, ✅ API

### 3. Description Enhancement

Bob can enhance and clarify project descriptions:

```typescript
const result = await enhanceDescription({
  description: formData.description,
  requirements: formData.requirements
});
```

## API Endpoints

### POST `/api/mcp/enhance-description`

Enhance a project description with Bob's assistance.

**Request:**
```json
{
  "description": "A blog website",
  "requirements": {
    "needsDatabase": true,
    "needsAuth": false,
    "needsPayment": false,
    "needsAPI": true,
    "needsUI": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "original_description": "A blog website",
  "analysis": {
    "status": "prompt_ready",
    "prompt": "...",
    "message": "This prompt should be processed by Bob in VS Code"
  },
  "message": "Description analyzed by Bob"
}
```

### POST `/api/mcp/suggest-requirements`

Get requirement suggestions based on description.

**Request:**
```json
{
  "description": "An e-commerce platform with payment processing"
}
```

**Response:**
```json
{
  "success": true,
  "suggested_requirements": {
    "needsDatabase": true,
    "needsAuth": true,
    "needsPayment": true,
    "needsAPI": true,
    "needsUI": true
  },
  "message": "Requirements suggested by Bob"
}
```

### POST `/api/mcp/analyze-input`

Analyze user input and provide real-time feedback.

**Request:**
```json
{
  "description": "blog",
  "requirements": null
}
```

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "type": "warning",
      "message": "Description is quite short. Consider adding more details."
    },
    {
      "type": "info",
      "message": "Bob can suggest requirements based on your description."
    }
  ],
  "message": "Input analyzed by Bob"
}
```

### GET `/api/mcp/status`

Check if MCP server is available.

**Response:**
```json
{
  "available": true,
  "message": "MCP server is ready",
  "server_path": "/path/to/mcp-server/build/index.js"
}
```

## Frontend Integration

### 1. Import MCP Functions

```typescript
import { 
  suggestRequirements,
  analyzeInput,
  getMCPStatus
} from '../services/api';
```

### 2. Check MCP Availability

```typescript
useEffect(() => {
  const checkMCPStatus = async () => {
    const status = await getMCPStatus();
    setMcpAvailable(status.available);
    if (status.available) {
      info('🤖 Bob is ready to assist you!');
    }
  };
  checkMCPStatus();
}, []);
```

### 3. Add UI Elements

```tsx
{mcpAvailable && (
  <button onClick={handleSuggestRequirements}>
    <svg>...</svg>
    Ask Bob to Suggest
  </button>
)}
```

## Configuration

### MCP Server Configuration (`.bob/mcp.json`)

```json
{
  "mcpServers": {
    "bob-code-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp-server/build/bob-code-generator.js"],
      "disabled": false
    },
    "backend-integration": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp-server/build/backend-tools.js"],
      "env": {
        "BACKEND_URL": "http://localhost:8000"
      },
      "disabled": false
    }
  }
}
```

## Setup Instructions

### 1. Build MCP Servers

```bash
cd mcp-server
npm install
npm run build
```

### 2. Start Backend

```bash
cd backend
python -m uvicorn main:app --reload
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Verify MCP Connection

1. Open the frontend at `http://localhost:5173`
2. Look for "🤖 Bob is ready to assist you!" message
3. Try typing a project description
4. Click "Ask Bob to Suggest" button

## Troubleshooting

### MCP Server Not Available

**Error:** "MCP server not available"

**Solutions:**
1. Build MCP servers: `cd mcp-server && npm run build`
2. Check `.bob/mcp.json` configuration
3. Verify Bob is running in VS Code
4. Check backend logs for MCP connection errors

### No Suggestions from Bob

**Error:** "Failed to get suggestions from Bob"

**Solutions:**
1. Check backend is running: `http://localhost:8000/health`
2. Verify MCP status: `http://localhost:8000/api/mcp/status`
3. Check backend logs for errors
4. Ensure description is not empty

### Analysis Not Working

**Issue:** No feedback when typing

**Solutions:**
1. Wait 1.5 seconds after typing (debounced)
2. Type at least 10 characters
3. Check browser console for errors
4. Verify MCP is available

## Benefits

1. **Real-time Assistance**: Bob helps users as they type
2. **Smart Suggestions**: Automatic requirement detection
3. **Better Input Quality**: Feedback on description clarity
4. **Reduced Errors**: Validation before project creation
5. **Enhanced UX**: Users feel guided by AI

## Future Enhancements

1. **Description Auto-completion**: Bob suggests completions
2. **Template Suggestions**: Bob recommends project templates
3. **Cost Estimation**: Real-time cost estimates as user types
4. **Agent Preview**: Show which agents will be selected
5. **Multi-language Support**: Bob assists in multiple languages

## Technical Notes

- MCP communication uses stdio transport
- Backend acts as proxy to avoid CORS issues
- Frontend uses debouncing to reduce API calls
- Fallback to rule-based logic if MCP unavailable
- All MCP calls are async and non-blocking

## Made with Bob