# 🧪 API Testing Guide

Test all API endpoints to verify the system is working correctly.

## Prerequisites
- Backend server running on `http://localhost:5000`

## Testing Methods

### Option 1: Browser
Simply paste the URLs into your browser address bar.

### Option 2: Command Line (curl)
Use the curl commands provided below.

### Option 3: Postman/Insomnia
Import the endpoints into your API testing tool.

---

## 🏥 Health Check

### GET /api/health
**Purpose**: Verify the API is running

**Browser**: 
```
http://localhost:5000/api/health
```

**curl**:
```bash
curl http://localhost:5000/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Bicycle Inventory API is running",
  "timestamp": "2026-05-13T12:00:00.000Z"
}
```

---

## 🏪 Store Endpoints

### GET /api/stores
**Purpose**: Get all stores with their metrics

**Browser**: 
```
http://localhost:5000/api/stores
```

**curl**:
```bash
curl http://localhost:5000/api/stores
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Downtown Bikes",
      "location": "New York, NY",
      "type": "local",
      "inventoryCount": 24,
      "totalValue": "50000.00"
    },
    ...
  ]
}
```

### GET /api/stores/:id
**Purpose**: Get specific store details

**Browser**: 
```
http://localhost:5000/api/stores/{STORE_ID}
```

**Note**: Replace {STORE_ID} with an actual store ID from the previous request.

---

## 📦 Inventory Endpoints

### GET /api/inventory
**Purpose**: Get all inventory items

**Browser**: 
```
http://localhost:5000/api/inventory
```

**curl**:
```bash
curl http://localhost:5000/api/inventory
```

**With Filters**:
```
http://localhost:5000/api/inventory?category=bikes
http://localhost:5000/api/inventory?storeId={STORE_ID}
```

### GET /api/inventory/global
**Purpose**: Get aggregated inventory across all stores

**Browser**: 
```
http://localhost:5000/api/inventory/global
```

**curl**:
```bash
curl http://localhost:5000/api/inventory/global
```

**Expected Response**:
```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "productId": "uuid",
      "productName": "Mountain Pro X1",
      "category": "bikes",
      "totalQuantity": 45,
      "totalValue": "58499.55",
      "storeCount": 4,
      "stores": [...]
    },
    ...
  ]
}
```

### GET /api/inventory/store/:storeId
**Purpose**: Get inventory for a specific store

**Browser**: 
```
http://localhost:5000/api/inventory/store/{STORE_ID}
```

---

## 🤖 AI Endpoints

### GET /api/ai/insights
**Purpose**: Get comprehensive AI-powered insights

**Browser**: 
```
http://localhost:5000/api/ai/insights
```

**curl**:
```bash
curl http://localhost:5000/api/ai/insights
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 24,
      "totalStores": 4,
      "totalInventoryValue": "200000.00",
      "lowStockCount": 15
    },
    "topSelling": [...],
    "slowMoving": [...],
    "imbalances": [...],
    "lowStockAlerts": [...]
  }
}
```

### GET /api/ai/restock
**Purpose**: Get AI-powered restocking suggestions

**Browser**: 
```
http://localhost:5000/api/ai/restock
```

**curl**:
```bash
curl http://localhost:5000/api/ai/restock
```

**Expected Response**:
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "storeName": "Downtown Bikes",
      "productName": "Mountain Pro X1",
      "currentStock": 3,
      "suggestedQuantity": 15,
      "priority": "high",
      "forecast": {
        "predictedDemand": 10,
        "trend": "increasing",
        "confidence": "high"
      }
    },
    ...
  ]
}
```

### GET /api/ai/redistribute
**Purpose**: Get stock redistribution suggestions

**Browser**: 
```
http://localhost:5000/api/ai/redistribute
```

**curl**:
```bash
curl http://localhost:5000/api/ai/redistribute
```

**Expected Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "productName": "City Cruiser Comfort",
      "fromStoreName": "Coastal Cycles",
      "toStoreName": "Downtown Bikes",
      "quantity": 8,
      "reason": "Coastal Cycles has excess stock (25), Downtown Bikes is running low (4)"
    },
    ...
  ]
}
```

### POST /api/ai/assistant
**Purpose**: Ask the AI assistant a question

**curl**:
```bash
curl -X POST http://localhost:5000/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{"query": "Which store has low stock?"}'
```

**Request Body**:
```json
{
  "query": "Which store has low stock?"
}
```

**Expected Response**:
```json
{
  "success": true,
  "query": "Which store has low stock?",
  "answer": "Found 5 products with low stock:\n...",
  "data": [...]
}
```

**Sample Queries**:
- "Which store has low stock?"
- "What should I restock this week?"
- "Show me top selling products"
- "Suggest stock transfers"
- "Tell me about Downtown Bikes"

---

## 🔄 Mutation Endpoints

### PUT /api/inventory/:id
**Purpose**: Update inventory quantity

**curl**:
```bash
curl -X PUT http://localhost:5000/api/inventory/{INVENTORY_ID} \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5, "operation": "add"}'
```

**Request Body**:
```json
{
  "quantity": 5,
  "operation": "add"  // or "remove"
}
```

### POST /api/inventory/transfer
**Purpose**: Transfer stock between stores

**curl**:
```bash
curl -X POST http://localhost:5000/api/inventory/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "fromStoreId": "STORE_ID_1",
    "toStoreId": "STORE_ID_2",
    "quantity": 10
  }'
```

**Request Body**:
```json
{
  "productId": "uuid",
  "fromStoreId": "uuid",
  "toStoreId": "uuid",
  "quantity": 10
}
```

### POST /api/stores/:id/sync
**Purpose**: Sync store with cloud

**curl**:
```bash
curl -X POST http://localhost:5000/api/stores/{STORE_ID}/sync
```

---

## ✅ Testing Checklist

Test each endpoint and check off when successful:

- [ ] Health check returns success
- [ ] Get all stores returns 5 stores (4 local + 1 central)
- [ ] Get store by ID returns store details
- [ ] Get all inventory returns items
- [ ] Get global inventory shows aggregated data
- [ ] Get store inventory returns store-specific items
- [ ] AI insights returns comprehensive data
- [ ] Restocking suggestions returns prioritized list
- [ ] Redistribution suggestions returns transfer recommendations
- [ ] AI assistant responds to queries
- [ ] Store sync updates lastSyncAt timestamp

---

## 🐛 Common Issues

### 404 Not Found
- Check if backend server is running
- Verify the URL is correct
- Ensure you're using the right port (5000)

### 500 Internal Server Error
- Check backend terminal for error messages
- Verify all dependencies are installed
- Check if mock data is loading correctly

### Empty Response
- Data might be filtered out
- Try without query parameters first
- Check if mock data was generated

### CORS Errors (from frontend)
- Backend has CORS enabled
- Check if frontend is on port 3000
- Verify API_BASE_URL in frontend

---

## 📊 Expected Data Counts

- **Stores**: 5 (4 local + 1 central hub)
- **Products**: 24 (8 bikes, 8 parts, 8 accessories)
- **Inventory Items**: ~96 (24 products × 4 local stores)
- **Low Stock Items**: ~15-20 (varies based on mock data)
- **Restocking Suggestions**: ~20-30
- **Redistribution Suggestions**: ~5-10

---

## 🎯 Success Criteria

All endpoints should:
1. Return valid JSON
2. Include `success: true` in response
3. Return appropriate HTTP status codes
4. Include relevant data in response
5. Handle errors gracefully

---

**Happy Testing! 🧪**