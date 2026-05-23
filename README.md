# AI Agent Project Studio - MVP

A BOB-powered agent orchestration platform where users provide project descriptions, and **BOB (IBM's AI Assistant)** acts as the orchestrator to select and coordinate specialized agents to build solutions.

## 🎯 Overview

This MVP enables users to:
- Input project requirements through a guided form
- Have BOB automatically select appropriate agents
- Execute agents sequentially with real-time progress tracking
- Monitor token usage and costs
- Receive generated artifacts (code files)

## 🏗️ Architecture

### Key Components

1. **Frontend**: React 18 + TypeScript + Tailwind CSS
2. **Backend**: Python 3.11+ + FastAPI
3. **Database**: Firestore (Google Cloud)
4. **Cache**: Redis (Memorystore)
5. **Orchestrator**: BOB (IBM's AI Assistant)
6. **Infrastructure**: Google Cloud Platform (Terraform)
7. **Real-time**: WebSocket (FastAPI)

### BOB as Orchestrator

BOB serves as the intelligent orchestrator:
- Analyzes user requirements
- Selects appropriate agents
- Generates agent outputs
- Coordinates execution flow
- Tracks progress and token usage

## 📁 Project Structure

```
.
├── backend/                    # Python FastAPI backend
│   ├── agents/                # Agent definitions
│   │   └── agent_definitions.py
│   ├── api/                   # API routes
│   │   └── routes/
│   │       ├── projects.py
│   │       ├── agents.py
│   │       └── websocket.py
│   ├── config/                # Configuration
│   │   └── settings.py
│   ├── database/              # Database layer
│   │   ├── firestore.py
│   │   └── models/
│   │       ├── project.py
│   │       ├── agent.py
│   │       ├── task.py
│   │       └── token_usage.py
│   ├── services/              # Business logic
│   │   ├── bob_orchestrator.py
│   │   ├── token_monitor.py
│   │   └── realtime_service.py
│   ├── main.py               # FastAPI app
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile           # Docker configuration
│   └── .env.example         # Environment template
│
├── infrastructure/           # Terraform IaC
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── modules/
│           ├── firestore/
│           ├── redis/
│           ├── storage/
│           └── cloudrun/
│
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Google Cloud Platform account
- Terraform 1.0+
- Redis (for local development)

### Backend Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the backend**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/health`

### Infrastructure Deployment

1. **Navigate to Terraform directory**
   ```bash
   cd infrastructure/terraform
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Create terraform.tfvars**
   ```hcl
   project_id = "your-gcp-project-id"
   region     = "us-central1"
   environment = "dev"
   ```

4. **Plan deployment**
   ```bash
   terraform plan
   ```

5. **Apply infrastructure**
   ```bash
   terraform apply
   ```

## 📡 API Endpoints

### Projects

- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `GET /api/projects/{id}/status` - Get execution status
- `POST /api/projects/{id}/execute` - Start execution
- `GET /api/projects/{id}/tokens` - Get token usage
- `POST /api/projects/{id}/estimate` - Estimate cost

### Agents

- `GET /api/agents` - List available agents
- `GET /api/agents/{id}` - Get agent details

### WebSocket

- `WS /ws/{project_id}` - Real-time updates

## 🤖 Available Agents

1. **Database Agent** - Generates database schemas and migrations
2. **UI Agent** - Creates React components and layouts
3. **Logic Agent** - Implements business logic and services
4. **API Agent** - Designs REST API endpoints
5. **FAQ Agent** - Generates FAQ content and documentation

## 💰 Token Monitoring

The system tracks and enforces token usage:

- **Default Limits**: 50,000 tokens, $5.00 cost
- **Alerts**: 80% (warning), 95% (critical)
- **Real-time Updates**: WebSocket notifications
- **Cost Estimation**: Pre-execution estimates

## 🔄 Real-Time Updates

WebSocket events:

- `task:update` - Task status changes
- `token:update` - Token usage updates
- `progress:update` - Execution progress
- `budget:alert` - Budget threshold alerts
- `error:occurred` - Error notifications

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
PORT=8000
ENVIRONMENT=development

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Firestore
FIRESTORE_DATABASE_ID=(default)

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Token Limits
DEFAULT_TOKEN_LIMIT=50000
DEFAULT_COST_LIMIT=5.00
ALERT_THRESHOLD_WARNING=0.80
ALERT_THRESHOLD_CRITICAL=0.95

# CORS
CORS_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

## 🐳 Docker Deployment

### Build Backend Image

```bash
cd backend
docker build -t bob-backend .
```

### Run with Docker

```bash
docker run -p 8000:8000 \
  -e GCP_PROJECT_ID=your-project \
  -e REDIS_HOST=redis \
  bob-backend
```

## 📊 Database Schema

### Collections

- **projects** - Project metadata and status
- **agents** - Agent definitions
- **tasks** - Individual task executions
- **executionPlans** - Execution plans
- **tokenUsage** - Token consumption logs

### Indexes

- `projects`: userId, status, createdAt
- `tasks`: projectId, executionOrder
- `tokenUsage`: projectId, timestamp

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=backend
```

## 📈 Monitoring

- **Cloud Monitoring**: Automatic metrics collection
- **Cloud Logging**: Centralized log aggregation
- **Health Checks**: `/health` endpoint
- **Token Tracking**: Real-time usage monitoring

## 🔧 Development

### Code Style

- Python: Follow PEP 8
- Use type hints
- Document functions with docstrings

### Git Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## 🚢 Deployment

### Manual Deployment

```bash
# Deploy backend to Cloud Run
gcloud run deploy bob-api \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Automated Deployment

Use the provided deployment script:

```bash
./scripts/deploy.sh
```

## 📝 Success Criteria

✅ User can input project description  
✅ BOB selects appropriate agents  
✅ BOB executes agents sequentially  
✅ Real-time progress updates via WebSocket  
✅ Token usage tracked and displayed  
✅ Budget limits enforced  
✅ Alerts at 80% and 95% thresholds  
✅ Cost estimation before execution  
✅ Infrastructure provisioned via Terraform  

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is part of the IBM BOB ecosystem.

## 🆘 Support

For issues and questions:
- Check the documentation
- Review API docs at `/docs`
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Current - MVP)
- ✅ Core infrastructure
- ✅ 5 basic agents
- ✅ Sequential execution
- ✅ Token monitoring
- ✅ Real-time updates

### Phase 2 (Future)
- Parallel agent execution
- Advanced agent library
- User authentication
- Project templates
- Enhanced monitoring

### Phase 3 (Future)
- Multi-user support
- Agent marketplace
- Custom agent creation
- Advanced analytics
- CI/CD integration

---

**Built with ❤️ using BOB (IBM's AI Assistant)**