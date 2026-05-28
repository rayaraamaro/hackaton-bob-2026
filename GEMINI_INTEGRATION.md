# Gemini AI Integration Guide

## Overview

This project now includes **Google Gemini AI** integration using the modern `google-genai` SDK. Gemini provides advanced AI capabilities for code generation, analysis, and intelligent requirement processing.

## Features

✅ **Production-Ready Integration**
- Modern `google-genai` SDK (v2.7.0+)
- Structured JSON logging for observability
- Comprehensive error handling
- Environment-based configuration
- Type-safe interfaces with Pydantic

✅ **AI Capabilities**
- Text generation with customizable parameters
- Code analysis and improvement suggestions
- Code generation from natural language
- Structured JSON output generation
- Project requirement analysis

✅ **Integration Points**
- REST API endpoints (`/api/gemini/*`)
- BOB Orchestrator enhancement
- Automatic fallback to rule-based systems

## Setup Instructions

### 1. Install Dependencies

The `google-genai` package is already added to `requirements.txt`. Install it:

```bash
cd backend
pip install -r requirements.txt
```

Or install directly:

```bash
pip install google-genai
```

### 2. Configure API Key

Add your Gemini API key to the `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

**How to get an API key:**

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API key" or "Create API key"
4. Copy the key and add it to your `.env` file

**Security Note:** Never commit your API key to version control. The `.env` file is already in `.gitignore`.

### 3. Configuration Options

You can customize Gemini behavior in `backend/config/settings.py`:

```python
# Gemini AI Configuration
GEMINI_API_KEY: Optional[str] = None          # API key (from .env)
GEMINI_MODEL: str = "gemini-2.0-flash-exp"    # Model to use
GEMINI_TEMPERATURE: float = 0.7                # Creativity (0.0-1.0)
GEMINI_MAX_TOKENS: int = 8000                  # Max response length
```

**Available Models:**
- `gemini-2.0-flash-exp` - Fast, cost-effective (recommended)
- `gemini-1.5-pro` - More capable, higher cost
- `gemini-1.5-flash` - Balanced performance

## API Endpoints

### Health Check

Check if Gemini service is available:

```bash
GET /api/gemini/health
```

**Response:**
```json
{
  "status": "healthy",
  "gemini_available": true,
  "model": "gemini-2.0-flash-exp",
  "message": "Gemini AI service is operational"
}
```

### Generate Text

Generate text from a prompt:

```bash
POST /api/gemini/generate
Content-Type: application/json

{
  "prompt": "Explain microservices architecture",
  "temperature": 0.7,
  "max_tokens": 2000,
  "system_instruction": "You are a software architecture expert"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Microservices architecture is...",
  "tokens_used": 450,
  "model": "gemini-2.0-flash-exp",
  "error": null
}
```

### Analyze Code

Get AI-powered code analysis:

```bash
POST /api/gemini/analyze-code
Content-Type: application/json

{
  "code": "def calculate(x, y):\n    return x + y",
  "language": "python",
  "task": "analyze and improve"
}
```

### Generate Code

Generate code from description:

```bash
POST /api/gemini/generate-code
Content-Type: application/json

{
  "description": "Create a REST API endpoint for user authentication",
  "language": "python",
  "requirements": [
    "Use FastAPI",
    "Include JWT tokens",
    "Add input validation"
  ]
}
```

### Structured Output

Generate JSON conforming to a schema:

```bash
POST /api/gemini/structured-output
Content-Type: application/json

{
  "prompt": "Analyze this project and suggest architecture",
  "schema": {
    "architecture": "string",
    "tech_stack": ["string"],
    "phases": ["string"]
  },
  "temperature": 0.3
}
```

### Analyze Requirements

AI-powered project requirement analysis:

```bash
POST /api/gemini/analyze-requirements?description=Build%20a%20blog%20platform
Content-Type: application/json

{
  "needsDatabase": true,
  "needsAuth": true,
  "needsPayment": false
}
```

## Integration with BOB Orchestrator

Gemini is automatically integrated into the BOB Orchestrator for enhanced requirement analysis:

```python
from services.bob_orchestrator import BOBOrchestrator

# Gemini is enabled by default
orchestrator = BOBOrchestrator(
    db=db,
    token_monitor=token_monitor,
    realtime=realtime,
    use_gemini=True  # Enable Gemini AI
)

# Analyze requirements with AI
result = await orchestrator.analyze_requirements(
    project_id="123",
    description="Build an e-commerce platform",
    requirements={"needsDatabase": True, "needsAuth": True}
)
```

**Fallback Behavior:**
- If Gemini is unavailable, the system automatically falls back to rule-based analysis
- No disruption to existing functionality
- Graceful degradation ensures reliability

## Usage Examples

### Python Service Usage

```python
from services.gemini_service import gemini_service

# Check availability
if gemini_service.is_available():
    # Generate text
    result = await gemini_service.generate_content(
        prompt="Explain REST APIs",
        temperature=0.7,
        max_tokens=1000
    )
    
    if result["success"]:
        print(result["text"])
    else:
        print(f"Error: {result['error']}")

# Analyze code
analysis = await gemini_service.analyze_code(
    code="function add(a, b) { return a + b; }",
    language="javascript",
    task="review and suggest improvements"
)

# Generate code
code_result = await gemini_service.generate_code(
    description="Create a user authentication system",
    language="python",
    requirements=["Use bcrypt", "Include password reset"]
)
```

### cURL Examples

```bash
# Health check
curl http://localhost:8000/api/gemini/health

# Generate text
curl -X POST http://localhost:8000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is Docker?",
    "temperature": 0.5,
    "max_tokens": 500
  }'

# Analyze code
curl -X POST http://localhost:8000/api/gemini/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def hello(): print(\"Hello\")",
    "language": "python",
    "task": "analyze"
  }'
```

## Architecture

### Service Layer (`backend/services/gemini_service.py`)

- **GeminiService**: Main service class
  - Handles API initialization
  - Manages client lifecycle
  - Provides high-level methods
  - Implements error handling

- **Global Instance**: `gemini_service`
  - Singleton pattern
  - Automatic initialization
  - Environment-based configuration

### API Layer (`backend/api/routes/gemini.py`)

- RESTful endpoints
- Request/response validation
- Error handling and logging
- HTTP status codes

### Configuration (`backend/config/settings.py`)

- Environment variables
- Default values
- Type validation

## Error Handling

The integration includes comprehensive error handling:

1. **Service Unavailable**: Returns 503 if Gemini is not configured
2. **API Errors**: Catches and logs all API errors
3. **Validation Errors**: Pydantic validates all inputs
4. **Graceful Degradation**: Falls back to rule-based systems

## Monitoring and Logging

All operations are logged with structured JSON:

```json
{
  "time": "2026-05-28T10:30:00",
  "level": "INFO",
  "module": "gemini_service",
  "message": "Generating content with model=gemini-2.0-flash-exp"
}
```

**Log Levels:**
- `INFO`: Normal operations
- `WARNING`: Fallback scenarios
- `ERROR`: API failures
- `CRITICAL`: Service initialization failures

## Cost Management

Gemini API usage incurs costs. Monitor your usage:

1. **Token Estimation**: Service estimates tokens used
2. **Model Selection**: Use `gemini-2.0-flash-exp` for cost efficiency
3. **Max Tokens**: Set appropriate limits
4. **Caching**: Consider implementing response caching

**Approximate Costs (as of 2026):**
- Input: ~$0.00001 per 1K tokens
- Output: ~$0.00003 per 1K tokens

## Troubleshooting

### "Gemini service not available"

**Cause**: API key not configured or SDK not installed

**Solution**:
```bash
# Check .env file
cat .env | grep GEMINI_API_KEY

# Install SDK
pip install google-genai

# Restart server
```

### "Cannot find module google.genai"

**Cause**: Package not installed

**Solution**:
```bash
pip install google-genai
```

### "API Error: Invalid API key"

**Cause**: Invalid or expired API key

**Solution**:
1. Get a new key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Update `.env` file
3. Restart server

### Import Errors

**Cause**: Linter errors before package installation

**Solution**: These are expected before `pip install`. They will resolve after installation.

## Best Practices

1. **API Key Security**
   - Never commit API keys
   - Use environment variables
   - Rotate keys regularly

2. **Error Handling**
   - Always check `success` field
   - Handle errors gracefully
   - Log failures for debugging

3. **Performance**
   - Use appropriate temperature settings
   - Set reasonable token limits
   - Consider caching responses

4. **Cost Optimization**
   - Use flash models for simple tasks
   - Implement request throttling
   - Monitor token usage

## Testing

Test the integration:

```bash
# 1. Check health
curl http://localhost:8000/api/gemini/health

# 2. Test generation
curl -X POST http://localhost:8000/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, Gemini!", "max_tokens": 100}'

# 3. Check logs
tail -f backend/logs/app.log
```

## Support

For issues or questions:

1. Check this documentation
2. Review logs in `backend/logs/`
3. Consult [Google AI Studio Documentation](https://ai.google.dev/docs)
4. Check [google-genai SDK docs](https://github.com/googleapis/python-genai)

## Future Enhancements

Planned improvements:

- [ ] Response caching
- [ ] Rate limiting
- [ ] Usage analytics dashboard
- [ ] Multi-model support
- [ ] Streaming responses
- [ ] Fine-tuned models

---

**Made with ❤️ using Google Gemini AI**