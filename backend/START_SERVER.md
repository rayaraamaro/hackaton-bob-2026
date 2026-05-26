# Como Iniciar o Servidor Backend

## Método Simples (Recomendado)

```bash
cd backend
python start.py
```

## Método Alternativo

```bash
cd backend
python main.py
```

## Verificar se está funcionando

1. Abra o navegador em: http://localhost:8000/health
2. Você deve ver: `{"status":"healthy","orchestrator":"BOB","version":"1.0.0"}`

## Documentação da API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints Principais

- `GET /health` - Health check
- `GET /api/agents` - Lista todos os agentes disponíveis
- `POST /api/projects` - Cria um novo projeto
- `GET /api/projects/{id}` - Obtém detalhes de um projeto

## Troubleshooting

### Porta 8000 já está em uso

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Agentes não carregam

Verifique se os arquivos markdown dos agentes existem em:
- `backend/agents/specialists/*.md`

### Erro de importação

Certifique-se de que está no diretório `backend` e que o ambiente virtual está ativado (se estiver usando).

## Parar o Servidor

Pressione `CTRL+C` no terminal onde o servidor está rodando.