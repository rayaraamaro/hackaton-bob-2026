# AI Agent Project Studio

Sistema de orquestração de agentes especialistas powered by BOB (IBM's AI Assistant).

## 🚀 Quick Start

### 1. Instalar Dependências

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Iniciar o Backend

```bash
cd backend
python start.py
```

O servidor estará disponível em: http://localhost:8000

### 3. Iniciar o Frontend

```bash
cd frontend
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## 📁 Estrutura do Projeto

```
hackaton-bob-2026/
├── backend/                    # Backend FastAPI
│   ├── agents/                # Agentes especialistas
│   │   ├── specialists/       # Definições dos agentes (.md)
│   │   └── agent_loader.py    # Carregador de agentes
│   ├── api/                   # Rotas da API
│   │   └── routes/
│   ├── database/              # Camada de banco de dados (SQLite)
│   ├── services/              # Serviços de negócio
│   ├── config/                # Configurações
│   ├── main.py                # Aplicação principal
│   ├── start.py               # Script de inicialização
│   └── requirements.txt       # Dependências Python
│
└── frontend/                  # Frontend React + TypeScript
    ├── src/
    │   ├── components/        # Componentes reutilizáveis
    │   ├── pages/             # Páginas da aplicação
    │   ├── services/          # Serviços (API client)
    │   └── hooks/             # React hooks customizados
    └── package.json           # Dependências Node

```

## 🤖 Agentes Disponíveis

- **API Specialist** - Cria APIs REST com FastAPI
- **UI Specialist** - Desenvolve interfaces com React + TypeScript + Tailwind
- **Logic Specialist** - Implementa regras de negócio em Python
- **E-commerce Specialist** - Especialista em funcionalidades de e-commerce
- **Prompt Interpreter Specialist** - Interpreta e analisa requisitos

## 🔧 Tecnologias

### Backend
- Python 3.11+
- FastAPI
- SQLite
- Pydantic

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Axios

## 📝 Como Usar

1. Acesse o frontend em http://localhost:5173
2. Preencha o nome e descrição do projeto
3. Selecione os requisitos (Database, Auth, Payment, FAQ)
4. Clique em "Create Project with BOB"
5. Acompanhe a execução dos agentes
6. Baixe o código gerado

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se a porta 8000 está livre
- Confirme que as dependências estão instaladas: `pip install -r requirements.txt`

### Frontend não conecta ao backend
- Verifique se o backend está rodando em http://localhost:8000
- Teste o endpoint: http://localhost:8000/health

### Agentes não carregam
- Verifique se os arquivos `.md` existem em `backend/agents/specialists/`
- Reinicie o servidor backend

## 📚 Documentação da API

Com o backend rodando, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🎯 Endpoints Principais

- `GET /health` - Health check
- `GET /api/agents` - Lista agentes disponíveis
- `POST /api/projects` - Cria novo projeto
- `GET /api/projects/{id}` - Detalhes do projeto
- `POST /api/projects/{id}/execute` - Executa o projeto
- `GET /api/projects/{id}/output` - Obtém saída do projeto

## 📄 Licença

Made with Bob - IBM's AI Assistant