@echo off
echo 🚀 Setting up Stock Portfolio Tracker...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check completed!

REM Backend setup
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy env.example .env
    echo ⚠️  Please update backend/.env with your database credentials and API keys.
)

echo ✅ Backend setup completed!

REM Frontend setup
echo 📦 Setting up frontend...
cd ..\frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy env.example .env
)

echo ✅ Frontend setup completed!

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Update backend/.env with your database credentials
echo 2. Create a PostgreSQL database named 'stocktracker'
echo 3. Run backend migrations: cd backend ^&^& python manage.py migrate
echo 4. Start the backend: cd backend ^&^& python manage.py runserver
echo 5. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo The application will be available at:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000
echo - Django Admin: http://localhost:8000/admin
echo.
pause
