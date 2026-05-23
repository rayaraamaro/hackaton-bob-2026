# Agent System Implementation

## Overview

This system implements a **Markdown-based persona architecture** where BOB (the AI assistant) dynamically reads specialist definitions from `.md` files and assumes their personas to accomplish tasks.

## Architecture

### Key Components

1. **agent_loader.py** - Core module that loads agent personas from Markdown files
2. **orchestrator/** - Contains orchestrator persona and decision matrix
3. **specialists/** - Contains individual specialist persona definitions

### How It Works

```
User Request
    ↓
Orchestrator (BOB reads orchestrator.md)
    ↓
Decision Matrix (BOB consults decision_matrix.md)
    ↓
Specialist Selection
    ↓
For each specialist:
    - BOB reads specialist's .md file
    - BOB assumes that persona
    - BOB generates code/output following persona's standards
    ↓
Integration & Delivery
```

## Agent Loader API

### Loading Specialists

```python
from agents.agent_loader import AGENT_DEFINITIONS, get_specialist_persona

# Get all available specialists
specialists = AGENT_DEFINITIONS
# Returns: {'ui_specialist': {...}, 'api_specialist': {...}, ...}

# Get full persona content for a specialist
persona_content = get_specialist_persona('ui_specialist')
# Returns: Full markdown content of ui_specialist.md
```

### Loading Orchestrator & Decision Matrix

```python
from agents.agent_loader import get_orchestrator_persona, get_decision_matrix

# Get orchestrator persona
orchestrator = get_orchestrator_persona()

# Get decision matrix
decision_matrix = get_decision_matrix()
```

### Agent Selection Rules

```python
from agents.agent_loader import AGENT_SELECTION_RULES

# Predefined rules for selecting specialists based on requirements
rules = AGENT_SELECTION_RULES
# Example: {'needsDatabase': ['database_specialist'], ...}
```

## Available Specialists

Currently implemented specialists (in `specialists/` folder):

1. **ui_specialist.md** - Frontend specialist (React + TypeScript + Tailwind CSS)
2. **api_specialist.md** - API specialist (Python + FastAPI)
3. **ecommerce_specialist.md** - E-commerce domain specialist

### Adding New Specialists

To add a new specialist:

1. Create a new `.md` file in `specialists/` folder
2. Follow the standard persona template structure:
   - Section 1: Persona Name and Role
   - Section 2: Technology Stack (STRICT)
   - Section 3+: Standards, capabilities, etc.
3. The agent loader will automatically detect and load it

Example filename: `database_specialist.md`, `analytics_specialist.md`, etc.

## Integration Points

### BOB Orchestrator Service

The `bob_orchestrator.py` service uses the agent loader:

```python
from agents.agent_loader import AGENT_DEFINITIONS, AGENT_SELECTION_RULES

# Access agent definitions
agent = AGENT_DEFINITIONS.get(agent_id)

# Use selection rules
selected_agents = AGENT_SELECTION_RULES.get(requirement_key)
```

### Agents API Route

The `api/routes/agents.py` route exposes agent information:

```python
from agents.agent_loader import AGENT_DEFINITIONS

# List all available agents
@router.get("/agents")
async def list_agents():
    agents = list(AGENT_DEFINITIONS.values())
    return {"agents": agents}
```

## Agent Definition Structure

Each agent in `AGENT_DEFINITIONS` contains:

```python
{
    "id": "ui_specialist",
    "name": "UI Specialist",
    "type": "frontend",  # frontend | backend | database | domain | analytics
    "description": "Generates production-quality frontend code...",
    "capabilities": ["React components", "TypeScript", ...],
    "tech_stack": ["React 18+", "TypeScript", "Tailwind CSS"],
    "persona_content": "# UI Specialist\n\n...",  # Full .md content
    "estimated_tokens": 2000,
    "estimated_time": 5
}
```

## Persona Content Format

Each specialist `.md` file should follow this structure:

```markdown
# Specialist Name

## 1. Persona Name and Role
**Name** — Brief description

## 2. Technology Stack (STRICT)
- **Tech 1** — Description
- **Tech 2** — Description

### Stack Restrictions
Explanation of what this specialist does/doesn't support

## 3. Standards and Guidelines
Detailed standards, conventions, best practices

## 4. Output Format
How the specialist delivers its work

## 5. How to Invoke This Persona
When and how BOB should assume this persona

## 6. Output Location
Where generated files should be placed

## 7. Handoff Format
What information to pass to next specialist
```

## Benefits of This Architecture

1. **Maintainability** - Personas defined in readable Markdown, easy to update
2. **Extensibility** - Add new specialists by creating new `.md` files
3. **Transparency** - Clear documentation of each specialist's capabilities
4. **Flexibility** - BOB can dynamically load and assume any persona
5. **Version Control** - Persona definitions tracked in git like code

## Migration from Old System

### What Changed

**Before:**
- Hardcoded agent definitions in Python dictionaries
- Agent logic mixed with orchestration code
- Difficult to update agent behaviors

**After:**
- Agent personas defined in Markdown files
- Clear separation between orchestration and specialist logic
- Easy to update by editing `.md` files

### Backward Compatibility

The new system maintains the same API:
- `AGENT_DEFINITIONS` dictionary still available
- `AGENT_SELECTION_RULES` dictionary still available
- Same structure for agent objects

Existing code using these imports continues to work without changes.

## Testing

Test the agent loader:

```bash
cd backend
python -c "from agents.agent_loader import AGENT_DEFINITIONS; print(list(AGENT_DEFINITIONS.keys()))"
```

Expected output:
```
['api_specialist', 'ecommerce_specialist', 'ui_specialist']
```

Test persona loading:

```bash
python -c "from agents.agent_loader import get_specialist_persona; print(len(get_specialist_persona('ui_specialist')))"
```

Expected output: Number of characters in the persona file (e.g., `11006`)

## Future Enhancements

Potential improvements:

1. **Caching** - Cache loaded personas for better performance
2. **Validation** - Validate `.md` file structure on load
3. **Versioning** - Support multiple versions of same specialist
4. **Hot Reload** - Reload personas without restarting server
5. **Metrics** - Track which specialists are used most frequently

## Troubleshooting

### Agent Not Found

If `AGENT_DEFINITIONS.get(agent_id)` returns `None`:
- Check that the `.md` file exists in `specialists/` folder
- Verify filename matches the agent_id (e.g., `ui_specialist.md`)
- Ensure file has proper UTF-8 encoding

### Persona Content Empty

If `get_specialist_persona()` returns `None`:
- Check file permissions
- Verify file is not corrupted
- Check for proper Markdown formatting

### Import Errors

If imports fail:
- Ensure you're in the `backend/` directory
- Check Python path includes the backend directory
- Verify all `.md` files are present

## Summary

The Markdown-based agent system provides a flexible, maintainable architecture where:
- BOB acts as the orchestrator
- Specialists are defined in readable `.md` files
- BOB dynamically assumes specialist personas
- All components work together seamlessly

This architecture enables rapid iteration on agent behaviors while maintaining clean separation of concerns.