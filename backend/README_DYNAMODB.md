# 🚀 Guia de Deploy com DynamoDB

## ⚠️ IMPORTANTE: Configuração de Segurança

### 1. Configurar Credenciais AWS

Edite o arquivo `backend/.env` e adicione suas credenciais AWS:

```env
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui

DYNAMODB_STORES_TABLE=bicycle-stores
DYNAMODB_PRODUCTS_TABLE=bicycle-products
DYNAMODB_INVENTORY_TABLE=bicycle-inventory

PORT=5000
```

**NUNCA commite o arquivo `.env` no Git!**

---

## 📋 Pré-requisitos

1. **Conta AWS** criada e ativa
2. **Usuário IAM** com permissões DynamoDB
3. **Access Keys** geradas
4. **Node.js** instalado (v14+)

---

## 🗄️ Criar Tabelas no DynamoDB

### Console AWS → DynamoDB → Create table

#### Tabela 1: bicycle-stores
```
Table name: bicycle-stores
Partition key: id (String)
Settings: On-demand
```

#### Tabela 2: bicycle-products
```
Table name: bicycle-products
Partition key: id (String)
Settings: On-demand
```

#### Tabela 3: bicycle-inventory
```
Table name: bicycle-inventory
Partition key: id (String)
Settings: On-demand

Global Secondary Index:
  Index name: storeId-index
  Partition key: storeId (String)
  Projection type: All
```

---

## 📦 Instalação

```bash
cd backend
npm install
```

---

## 🔄 Migrar Dados Mock para DynamoDB

Execute o script de migração:

```bash
node src/scripts/migrateData.js
```

Isso irá:
- Criar 5 lojas (4 locais + 1 central)
- Criar 24 produtos (bikes, parts, accessories)
- Criar ~100 itens de inventário com histórico de vendas

---

## 🚀 Iniciar Servidor

```bash
npm start
```

O servidor estará rodando em: `http://localhost:5000`

---

## ✅ Testar Conexão

```bash
# Listar lojas
curl http://localhost:5000/api/stores

# Listar inventário
curl http://localhost:5000/api/inventory
```

---

## 🔐 Segurança

### ✅ O que fazer:
- Usar usuário IAM (não root)
- Dar apenas permissões necessárias
- Rotacionar keys periodicamente
- Usar `.gitignore` para `.env`

### ❌ O que NÃO fazer:
- Commitar `.env` no Git
- Compartilhar secret keys
- Usar root account keys
- Hardcode credentials no código

---

## 💰 Custos Estimados

### Tier Gratuito (12 meses):
- DynamoDB: 25 GB + 25 WCU/RCU = **GRÁTIS**
- Lambda: 1M requisições = **GRÁTIS**

### Após Tier Gratuito:
- DynamoDB: ~$5-10/mês (uso pequeno)
- Total: **~$5-10/mês**

---

## 🐛 Troubleshooting

### Erro: "Missing credentials"
- Verifique se o `.env` está configurado
- Confirme que as credenciais estão corretas

### Erro: "Table does not exist"
- Crie as tabelas no console AWS
- Verifique os nomes das tabelas no `.env`

### Erro: "Access Denied"
- Verifique permissões do usuário IAM
- Adicione policy `AmazonDynamoDBFullAccess`

---

## 📚 Recursos

- [AWS DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## 🎯 Próximos Passos

1. ✅ Configurar credenciais AWS
2. ✅ Criar tabelas DynamoDB
3. ✅ Migrar dados
4. ✅ Testar endpoints
5. 🚀 Deploy em produção (Elastic Beanstalk/EC2)

---

**Made with ❤️ for Hybrid Cloud & AI Integration Project**