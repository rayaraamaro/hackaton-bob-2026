# Backend Restart Instructions

## Issue
After updating the agent system to use Markdown-based personas, the backend server needs to be restarted to load the new code.

## Solution

### Step 1: Stop the Current Backend Server
If the backend is running, stop it by:
- Pressing `Ctrl+C` in the terminal where it's running
- Or closing the terminal window

### Step 2: Restart the Backend Server

```bash
cd backend
python main.py
```

Or if using uvicorn directly:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Verify the Server Started Successfully

You should see output like:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Test the API

Try creating a project again from the frontend. The error should be resolved.

## What Changed

The agent system now:
- ✅ Loads specialists from `.md` files in `backend/agents/specialists/`
- ✅ Only uses available agents (api_specialist, ui_specialist, ecommerce_specialist)
- ✅ Gracefully handles missing agents
- ✅ Provides fallback agents when specific specialists aren't available

## Verification

To verify the agent system is working, run:

```bash
cd backend
python -c "from agents.agent_loader import AGENT_DEFINITIONS; print('Available agents:', list(AGENT_DEFINITIONS.keys()))"
```

Expected output:
```
Available agents: ['api_specialist', 'ecommerce_specialist', 'ui_specialist']
```

## Troubleshooting

### If you still get errors:

1. **Check Python path**: Make sure you're in the `backend` directory
2. **Check file permissions**: Ensure `.md` files are readable
3. **Check imports**: Verify no old `agent_definitions.py` file exists
4. **Clear Python cache**: Delete `__pycache__` directories and `.pyc` files

```bash
cd backend
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
```

5. **Restart with fresh environment**:
```bash
cd backend
deactivate  # if using virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

## Next Steps

Once the backend is restarted:
1. The frontend should be able to create projects successfully
2. Agent selection will use only available specialists
3. The system will work with the Markdown-based architecture

## Additional Notes

- The agent system now automatically filters selection rules to only include available agents
- If a specialist is missing, the system will use available alternatives
- All agent personas are loaded from `.md` files at startup
- No code changes needed - just restart the server