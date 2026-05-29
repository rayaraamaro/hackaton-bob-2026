# 🚀 Quick Start Guide

## Step-by-Step Instructions

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd bicycle-inventory-system/backend
npm start
```

You should see:
```
🚴 Bicycle Inventory Management System
==================================================
Server running on http://localhost:5000
API Documentation: http://localhost:5000/api/health
==================================================
```

**Keep this terminal running!**

### 2. Start the Frontend (New Terminal)

Open a **new terminal** and run:

```bash
cd bicycle-inventory-system/frontend
npm start
```

The React app will automatically open in your browser at `http://localhost:3000`

### 3. Explore the Application

#### Dashboard (Home Page)
- View AI-powered insights
- Check top selling products
- Monitor low stock alerts
- See slow-moving inventory
- Review stock redistribution suggestions

#### Stores Page
- View all 4 bicycle stores
- Click on a store to see its inventory
- Click "Sync" to simulate cloud synchronization
- See store-specific metrics

#### Global Inventory Page
- View aggregated inventory across all stores
- Filter by category (bikes, parts, accessories)
- Click "View" to see store-by-store distribution
- Monitor total inventory value

#### AI Assistant (Bottom Right Corner)
Click the 🤖 button and try these queries:
- "Which store has low stock?"
- "What should I restock this week?"
- "Show me top selling products"
- "Suggest stock transfers"

## 🧪 Test the API Directly

You can test the API endpoints using your browser or tools like Postman:

### Health Check
```
http://localhost:5000/api/health
```

### Get All Stores
```
http://localhost:5000/api/stores
```

### Get AI Insights
```
http://localhost:5000/api/ai/insights
```

### Get Restocking Suggestions
```
http://localhost:5000/api/ai/restock
```

### Get Global Inventory
```
http://localhost:5000/api/inventory/global
```

## 📊 What to Look For

### AI Features in Action

1. **Demand Forecasting**
   - Go to Dashboard → Check restocking suggestions
   - Notice how AI predicts demand based on sales history

2. **Smart Restocking**
   - Products with low stock get high priority
   - Suggested quantities consider predicted demand

3. **Stock Redistribution**
   - Dashboard shows suggested transfers
   - AI identifies stores with excess and deficit

4. **Insights Dashboard**
   - Top selling products ranked by sales
   - Slow-moving inventory identified
   - Low stock alerts highlighted

### Hybrid Cloud Simulation

1. **Local Stores (Edge)**
   - Each store has independent inventory
   - Stores page shows individual store data

2. **Central Hub (Cloud)**
   - Global Inventory aggregates all stores
   - Dashboard provides centralized insights

3. **Sync Operation**
   - Click "Sync" on any store
   - Simulates data synchronization with cloud

## 🎯 Key Features to Try

### 1. View Store Inventory
- Go to Stores page
- Click on "Downtown Bikes"
- See all products in that store
- Notice low stock indicators

### 2. Check AI Insights
- Go to Dashboard
- Scroll through different sections
- See AI-generated recommendations

### 3. Use AI Assistant
- Click 🤖 button
- Ask: "Which store has low stock?"
- Get instant AI response

### 4. Explore Global View
- Go to Global Inventory
- Filter by "bikes" category
- Click "View" on any product
- See distribution across stores

## 🔧 Troubleshooting

### Backend won't start
- Make sure you ran `npm install` in the backend folder
- Check if port 5000 is available
- Look for error messages in the terminal

### Frontend won't start
- Make sure you ran `npm install` in the frontend folder
- Check if port 3000 is available
- Ensure backend is running first

### API errors in browser
- Verify backend is running on port 5000
- Check browser console for error messages
- Make sure both servers are running

### Page not loading
- Clear browser cache
- Try a different browser
- Check if both servers are running

## 📝 Sample Data

The system includes:
- **4 Local Stores**: Downtown Bikes, Coastal Cycles, Mountain Gear, Urban Riders
- **24 Products**: 8 bikes, 8 parts, 8 accessories
- **30 Days of Sales History**: For AI forecasting
- **Realistic Inventory Levels**: Varied across stores

## 🎨 UI Tips

- **Responsive Design**: Try resizing your browser window
- **Color Coding**: Red badges = urgent, Yellow = warning, Green = OK
- **Interactive Tables**: Click "View" buttons for more details
- **Refresh Data**: Use refresh buttons to reload data

## 💡 Understanding the AI

### How Demand Forecasting Works
1. Analyzes last 30 days of sales
2. Calculates average daily sales
3. Detects trends (increasing/decreasing)
4. Predicts future demand with confidence levels

### How Restocking Works
1. Checks current stock levels
2. Compares with reorder points
3. Factors in predicted demand
4. Suggests optimal order quantities

### How Redistribution Works
1. Identifies stores with excess inventory
2. Finds stores with low stock
3. Matches excess with deficit
4. Suggests balanced transfers

## 🚀 Next Steps

After exploring the application:
1. Review the code structure in `README.md`
2. Check API endpoints documentation
3. Explore the source code
4. Customize for your needs

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Review code comments in source files
- Inspect browser console for errors
- Check terminal output for server logs

---

**Enjoy exploring the Bicycle Inventory Management System! 🚴**