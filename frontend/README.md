# AI Agent Project Studio - Frontend

React + TypeScript + Tailwind CSS frontend for the BOB-powered agent orchestration platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── TokenMonitor.tsx    # Token usage display
│   ├── ProgressBar.tsx     # Progress indicator
│   └── TaskList.tsx        # Task list display
├── hooks/              # Custom React hooks
│   ├── useWebSocket.ts     # WebSocket connection
│   └── useTokenMonitor.ts  # Token monitoring
├── pages/              # Page components
│   ├── HomePage.tsx        # Project creation
│   └── ExecutionPage.tsx   # Execution monitoring
├── services/           # API services
│   └── api.ts             # Backend API client
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🎨 Features

### Home Page
- Project creation form
- Requirement selection (Database, Auth, Payment, FAQ)
- Available agents display
- BOB-powered agent selection

### Execution Page
- Real-time progress tracking
- Token usage monitoring
- Task status updates
- Cost estimation
- WebSocket-based live updates

## 🔌 API Integration

The frontend connects to the FastAPI backend at:
- API: `http://localhost:8000/api`
- WebSocket: `ws://localhost:8000/ws`

Configure these in `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🎯 Key Components

### TokenMonitor
Displays real-time token usage with:
- Progress bar with color coding
- Total cost display
- Budget alerts (80%, 95%)

### ProgressBar
Shows execution progress:
- Completed vs total tasks
- Percentage complete
- Smooth animations

### TaskList
Lists all tasks with:
- Status indicators
- Token usage per task
- Error messages
- Agent information

## 🔄 Real-Time Updates

WebSocket events handled:
- `task:update` - Task status changes
- `token:update` - Token usage updates
- `progress:update` - Execution progress
- `budget:alert` - Budget threshold alerts
- `error:occurred` - Error notifications

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📦 Build

```bash
npm run build
```

Output will be in the `dist/` directory, ready for deployment to Cloud Storage or any static hosting.

## 🚢 Deployment

### Cloud Storage (GCP)
```bash
npm run build
gsutil -m rsync -r dist gs://your-bucket-name
```

### Other Platforms
The built files in `dist/` can be deployed to:
- Vercel
- Netlify
- AWS S3
- Any static hosting service

## 🎨 Styling

Uses Tailwind CSS for styling:
- Utility-first CSS framework
- Responsive design
- Dark mode support (configured)
- Custom color palette

## 📝 Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running
- Check CORS settings
- Verify WebSocket URL in `.env`

### API Errors
- Check backend is accessible
- Verify API URL in `.env`
- Check browser console for errors

## 📄 License

Part of the IBM BOB ecosystem.