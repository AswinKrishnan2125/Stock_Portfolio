#!/bin/bash

echo "🚀 Setting up Stock Portfolio Tracker..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 12 or higher."
    echo "   You can continue with the setup, but you'll need to install PostgreSQL later."
fi

echo "✅ Prerequisites check completed!"

# Backend setup
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update backend/.env with your database credentials and API keys."
fi

echo "✅ Backend setup completed!"

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.example .env
fi

echo "✅ Frontend setup completed!"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Create a PostgreSQL database named 'stocktracker'"
echo "3. Run backend migrations: cd backend && python manage.py migrate"
echo "4. Start the backend: cd backend && python manage.py runserver"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:8000"
echo "- Django Admin: http://localhost:8000/admin"
