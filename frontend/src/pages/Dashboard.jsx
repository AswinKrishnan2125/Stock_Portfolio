import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  // console.log("hjdsfhj");

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/portfolios/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios')
      }
      
      const data = await response.json()
      setPortfolios(data.results || data)
    } catch (error) {
      console.error('Error fetching portfolios:', error)
      setError('Failed to load portfolio data')
    } finally {
      setLoading(false)
    }
  }

  const totalValue = portfolios.reduce((sum, portfolio) => sum + (portfolio.total_value || 0), 0)
  const totalGainLoss = portfolios.reduce((sum, portfolio) => sum + (portfolio.total_gain_loss || 0), 0)
  const totalStocks = portfolios.reduce((sum, portfolio) => sum + (portfolio.stocks?.length || 0), 0)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Portfolio Value
                  </Typography>
                  <Typography variant="h5">
                    ${totalValue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                {totalGainLoss >= 0 ? (
                  <TrendingUp color="success" sx={{ mr: 2 }} />
                ) : (
                  <TrendingDown color="error" sx={{ mr: 2 }} />
                )}
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Gain/Loss
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={totalGainLoss >= 0 ? 'success.main' : 'error.main'}
                  >
                    ${totalGainLoss.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ShowChart color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Stocks
                  </Typography>
                  <Typography variant="h5">
                    {totalStocks}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Portfolios
                  </Typography>
                  <Typography variant="h5">
                    {portfolios.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Portfolios
            </Typography>
            {portfolios.length === 0 ? (
              <Typography color="textSecondary">
                No portfolios found. Create your first portfolio to get started!
              </Typography>
            ) : (
              portfolios.slice(0, 3).map((portfolio) => (
                <Box key={portfolio.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h6">{portfolio.name}</Typography>
                  <Typography color="textSecondary" variant="body2">
                    {portfolio.description || 'No description'}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="body2">
                      Value: ${(portfolio.total_value || 0).toLocaleString()}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={(portfolio.total_gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {portfolio.total_gain_loss >= 0 ? '+' : ''}${(portfolio.total_gain_loss || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              • Add new stocks to your portfolio
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              • View detailed charts and analytics
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              • Set up price alerts
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              • Check AI recommendations
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
