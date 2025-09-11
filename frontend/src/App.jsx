import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { StockLiveProvider } from './contexts/StockLiveProvider';
// ...existing code...
export const StockDataContext = React.createContext();
import Portfolio from './pages/Portfolio'
import Charts from './pages/Charts'
import Alerts from './pages/Alerts'
import Recommendations from './pages/Recommendations'
import { HistoricalDataProvider } from './contexts/HistoricalDataContext'

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolios" element={<Portfolio />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Route>
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <StockLiveProvider>
        <HistoricalDataProvider>
          <AppRoutes />
        </HistoricalDataProvider>
      </StockLiveProvider>
    </AuthProvider>
  )
}

export default App
