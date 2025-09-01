# Real-Time Stock Portfolio Tracker

A full-stack application for tracking stock portfolios with real-time data, charts, alerts, and AI recommendations.

## Project Structure

```
StockBuilder/
├── frontend/          # React + Vite frontend
├── backend/           # Django + DRF backend
├── README.md          # This file
└── .gitignore         # Git ignore file
```

## Features

### Frontend (React + Vite)
- **Authentication**: Login/Register pages with JWT
- **Dashboard**: Main overview with sidebar navigation
- **Portfolio Management**: CRUD operations for stocks
- **Charts**: Interactive stock charts using Recharts
- **Alerts**: Price alert management (UI only)
- **AI Recommendations**: Stock recommendations with confidence scores

### Backend (Django + DRF)
- **Authentication**: JWT-based user authentication
- **Portfolio API**: CRUD operations for portfolios and stocks
- **Mock Data**: Placeholder endpoints for real-time prices and AI recommendations
- **Database**: PostgreSQL with User, Portfolio, and Stock models

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- PostgreSQL (v12 or higher)
- pip (Python package manager)
- npm or yarn

## Setup Instructions

### 1. Backend Setup (Django)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up PostgreSQL database:**
   - Create a database named `stocktracker`
   - Update database settings in `stocktracker/settings.py` if needed

6. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

7. **Create superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

   The backend will be available at `http://localhost:8000`

### 2. Frontend Setup (React + Vite)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Environment Variables

### Backend (.env file in backend directory)
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/stocktracker
ALPHAVANTAGE_KEY=your-alpha-vantage-key-here
LLM_API_KEY=your-llm-api-key-here
```

### Frontend (.env file in frontend directory)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ALPHAVANTAGE_KEY=your-alpha-vantage-key-here
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token

### Portfolio
- `GET /api/portfolios/` - List user portfolios
- `POST /api/portfolios/` - Create portfolio
- `GET /api/portfolios/{id}/` - Get portfolio details
- `PUT /api/portfolios/{id}/` - Update portfolio
- `DELETE /api/portfolios/{id}/` - Delete portfolio

### Stocks
- `GET /api/stocks/` - List stocks in portfolio
- `POST /api/stocks/` - Add stock to portfolio
- `GET /api/stocks/{id}/` - Get stock details
- `PUT /api/stocks/{id}/` - Update stock
- `DELETE /api/stocks/{id}/` - Remove stock

### Mock Data
- `GET /api/mock/prices/` - Get mock real-time prices
- `GET /api/mock/alerts/` - Get mock price alerts
- `GET /api/mock/recommendations/` - Get mock AI recommendations

## Development Notes

- All external API integrations (Alpha Vantage, LLM) are currently mocked
- CORS is configured to allow frontend requests from `http://localhost:5173`
- JWT tokens are used for authentication
- PostgreSQL is used as the primary database
- Material-UI components are used for consistent styling

## Future Enhancements

- Real-time WebSocket connections for live price updates
- Integration with Alpha Vantage API for real stock data
- AI-powered stock recommendations using LLM APIs
- Email/SMS notifications for price alerts
- Advanced charting with technical indicators
- Portfolio performance analytics
