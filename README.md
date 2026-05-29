# 🚴 Bicycle Inventory Management System

A full-stack inventory management system for multi-store bicycle companies, featuring **Hybrid Cloud Architecture** and **AI-Driven Decision Making**.

## 🌟 Features

### Core Functionality
- **Multi-Store Management**: Independent inventory tracking for multiple bicycle stores
- **Hybrid Cloud Architecture**: Simulates local edge data with centralized cloud synchronization
- **Real-time Inventory Tracking**: Monitor stock levels across all locations
- **Stock Transfer System**: Move inventory between stores efficiently

### AI-Powered Features
- **Demand Forecasting**: Predict future product demand based on historical sales data
- **Smart Restocking Suggestions**: AI recommends what and how much to reorder
- **Stock Redistribution**: Identifies imbalances and suggests optimal transfers
- **Insights Dashboard**: Analytics on top sellers, slow-moving items, and stock health
- **AI Assistant**: Natural language interface for inventory queries

### Technical Highlights
- RESTful API architecture
- React-based responsive UI
- Real-time data synchronization
- Modular and scalable codebase

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │Dashboard │  │  Stores  │  │Global Inventory│             │
│  └──────────┘  └──────────┘  └──────────────┘             │
│                    ↓                                         │
│              ┌─────────────┐                                │
│              │AI Assistant │                                │
│              └─────────────┘                                │
└─────────────────────────────────────────────────────────────┘
                         ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │→ │ Controllers  │→ │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                           ↓                                  │
│                    ┌──────────────┐                         │
│                    │  AI Service  │                         │
│                    │  - Forecasting│                        │
│                    │  - Restocking │                        │
│                    │  - Redistribution│                     │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────────┐
│              DATA LAYER (In-Memory Mock Data)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│  │  Stores  │  │ Products │  │   Inventory  │             │
│  │  (Edge)  │  │          │  │  (Local+Cloud)│             │
│  └──────────┘  └──────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
bicycle-inventory-system/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   │   ├── storeController.js
│   │   │   ├── inventoryController.js
│   │   │   └── aiController.js
│   │   ├── models/           # Data models
│   │   │   ├── Store.js
│   │   │   ├── Product.js
│   │   │   └── InventoryItem.js
│   │   ├── routes/           # API routes
│   │   │   └── index.js
│   │   ├── services/         # Business logic
│   │   │   └── aiService.js
│   │   ├── utils/            # Utilities
│   │   │   └── mockData.js
│   │   └── server.js         # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── AIAssistant.js
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Stores.js
│   │   │   └── GlobalInventory.js
│   │   ├── services/         # API client
│   │   │   └── api.js
│   │   ├── styles/           # CSS styles
│   │   │   └── App.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd bicycle-inventory-system
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on `http://localhost:5000`

2. **Start the Frontend (in a new terminal)**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on `http://localhost:3000`

3. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`

## 📡 API Endpoints

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store by ID
- `POST /api/stores/:id/sync` - Sync store with cloud

### Inventory
- `GET /api/inventory` - Get all inventory (with filters)
- `GET /api/inventory/global` - Get aggregated global inventory
- `GET /api/inventory/store/:storeId` - Get store-specific inventory
- `PUT /api/inventory/:id` - Update inventory quantity
- `POST /api/inventory/transfer` - Transfer stock between stores

### AI Features
- `GET /api/ai/restock` - Get restocking suggestions
- `GET /api/ai/redistribute` - Get redistribution suggestions
- `GET /api/ai/insights` - Get comprehensive insights
- `POST /api/ai/assistant` - Ask AI assistant a question

## 🤖 AI Features Explained

### 1. Demand Forecasting
Uses historical sales data to predict future demand:
- Calculates average daily sales
- Analyzes recent trends (increasing/decreasing)
- Provides confidence levels based on data availability

### 2. Smart Restocking
Suggests optimal reorder quantities:
- Considers current stock levels
- Factors in predicted demand
- Includes safety stock buffers
- Prioritizes critical items

### 3. Stock Redistribution
Identifies and suggests optimal transfers:
- Detects stores with excess inventory
- Finds stores with low stock
- Recommends balanced transfers
- Prevents stockouts and overstocking

### 4. AI Assistant
Natural language interface for queries:
- "Which store has low stock?"
- "What should I restock this week?"
- "Show me top selling products"
- "Suggest stock transfers"

## 💡 Usage Examples

### Viewing Store Inventory
1. Navigate to "Stores" page
2. Click on any store card
3. View detailed inventory for that store
4. Click "Sync" to simulate cloud synchronization

### Checking Insights
1. Go to "Dashboard" page
2. View summary statistics
3. Check top selling products
4. Review low stock alerts
5. See redistribution suggestions

### Using AI Assistant
1. Click the 🤖 button in the bottom-right corner
2. Type your question or select a suggested query
3. Get instant AI-powered responses

### Global Inventory View
1. Navigate to "Global Inventory" page
2. Filter by category (bikes, parts, accessories)
3. Click "View" to see store-by-store distribution
4. Monitor total inventory value

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean cards, tables, and badges
- **Color-Coded Status**: Visual indicators for stock levels
- **Interactive Elements**: Expandable details, filters, and buttons
- **Real-time Updates**: Refresh data with a click

## 🔧 Configuration

### Backend Configuration
Edit `backend/src/server.js`:
```javascript
const PORT = process.env.PORT || 5000;
```

### Frontend API URL
Edit `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## 📊 Mock Data

The system includes realistic mock data:
- **4 Local Stores**: Downtown Bikes, Coastal Cycles, Mountain Gear, Urban Riders
- **1 Central Hub**: Cloud data center
- **24 Products**: 8 bikes, 8 parts, 8 accessories
- **Historical Sales Data**: 30 days of sales history per product

## 🔐 Hybrid Cloud Simulation

The system simulates a hybrid cloud architecture:
- **Edge (Local Stores)**: Each store maintains local inventory
- **Cloud (Central Hub)**: Aggregates data from all stores
- **Sync Operation**: Simulates data synchronization between edge and cloud
- **API Communication**: RESTful endpoints for data exchange

## 🎯 Key Concepts Demonstrated

1. **Multi-Store Architecture**: Independent inventory per location
2. **Centralized Monitoring**: Global view across all stores
3. **AI-Driven Decisions**: Automated suggestions based on data
4. **Hybrid Cloud Pattern**: Local + centralized data management
5. **RESTful API Design**: Clean, scalable API structure
6. **Modern Frontend**: React with hooks and routing
7. **Responsive UI**: Mobile-first design approach

## 🚧 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication and authorization
- Real-time WebSocket updates
- Advanced ML models for forecasting
- Barcode scanning integration
- Export reports (PDF/Excel)
- Email notifications for low stock
- Multi-language support

## 📝 License

This project is created for demonstration purposes.

## 👨‍💻 Development

### Adding New Features
1. Backend: Add controller → route → service
2. Frontend: Create component → add route → connect API
3. Test thoroughly before deployment

### Code Style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing patterns

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## 📞 Support

For questions or issues, please refer to the code comments and documentation within the source files.

---

**Built with ❤️ using Node.js, Express, React, and AI-powered algorithms**