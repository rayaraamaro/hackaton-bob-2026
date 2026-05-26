# Como Iniciar o Servidor Backend

## Após remover o Firestore, siga estes passos:

### 1. Instalar dependências (se necessário)
```bash
cd backend
pip install -r requirements.txt
```

### 2. Iniciar o servidor
```bash
cd backend
python main.py
```

Ou usando uvicorn diretamente:
```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Verificar se está funcionando
Abra o navegador em: http://127.0.0.1:8000/health

Você deve ver:
```json
{
  "status": "healthy",
  "orchestrator": "BOB",
  "version": "1.0.0"
}
```

### 4. Testar o endpoint de agentes
Abra: http://127.0.0.1:8000/api/agents

Você deve ver a lista de 4 agentes disponíveis.

## Notas Importantes

- ✅ O Firestore foi completamente removido
- ✅ Agora usa apenas SQLite (arquivo `local_db.sqlite` será criado automaticamente)
- ✅ Não precisa de credenciais do Google Cloud
- ✅ Tudo roda localmente

## Se o erro persistir

1. Certifique-se de que nenhum outro processo está usando a porta 8000
2. Verifique se todas as dependências estão instaladas
3. Reinicie o servidor backend
4. Recarregue a página do frontend (F5)