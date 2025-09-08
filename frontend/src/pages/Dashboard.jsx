import React, { useState, useEffect } from 'react'
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { token } = useAuth()
  const [search, setSearch] = useState("")
  const [recommendations, setRecommendations] = useState([])
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [recommendError, setRecommendError] = useState("")
  const [interestedStocks, setInterestedStocks] = useState([])
  const [selectedStock, setSelectedStock] = useState(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [stockError, setStockError] = useState("")

  useEffect(() => {
    fetchInterestedStocks()
  }, [])

  const fetchInterestedStocks = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/interested-stocks/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch interested stocks')
      const data = await response.json()
      setInterestedStocks(data.results || data)
    } catch (err) {
      // handle error
    }
  }

  const fetchRecommendations = async (query) => {
    setRecommendLoading(true)
    setRecommendError("")
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/recommendations/?search=${query}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      setRecommendations(data.results || data)
    } catch (err) {
      setRecommendError('Failed to load recommendations')
    } finally {
      setRecommendLoading(false)
    }
  }

  const fetchStockData = async (symbol) => {
    setStockLoading(true)
    setStockError("")
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/stocks/${symbol}/`)
      if (!response.ok) throw new Error('Failed to fetch stock data')
      const data = await response.json()
      setSelectedStock(data)
    } catch (err) {
      setStockError('Failed to load stock data')
    } finally {
      setStockLoading(false)
    }
  }

  // UI

  return (
    <Box>
      {/* <Typography variant="h4" gutterBottom>Dashboard</Typography> */}
      <Box mb={2}>
        <input
          type="text"
          placeholder="Search stocks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px', width: '300px', fontSize: '16px' }}
        />
        <Button variant="contained" sx={{ ml: 2 }} onClick={() => fetchRecommendations(search)} disabled={recommendLoading}>
          {recommendLoading ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      <Box mb={4}>
        <Typography variant="h6">Interested Stocks</Typography>
        <Grid container spacing={2}>
          {interestedStocks.map(stock => (
            <Grid item xs={12} sm={6} md={3} key={stock.symbol}>
              <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => fetchStockData(stock.symbol)}>
                <Typography variant="h6">{stock.symbol}</Typography>
                <Typography variant="body2">{stock.name}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* <Box mb={4}>
        <Typography variant="h6">Recommendations</Typography>
        {recommendError && <Alert severity="error">{recommendError}</Alert>}
        <Grid container spacing={2}>
          {recommendations.map(rec => (
            <Grid item xs={12} sm={6} md={3} key={rec.symbol}>
              <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => fetchStockData(rec.symbol)}>
                <Typography variant="h6">{rec.symbol}</Typography>
                <Typography variant="body2">{rec.name}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box> */}
      {stockLoading && <CircularProgress />}
      {stockError && <Alert severity="error">{stockError}</Alert>}
      {selectedStock && (
        <Box p={3} border="1px solid #e0e0e0" borderRadius={2} mb={4}>
          <Typography variant="h5">{selectedStock.symbol}</Typography>
          <Typography variant="body2">{selectedStock.name}</Typography>
          <Typography variant="body2">Price: ${selectedStock.latestPrice}</Typography>
          <Typography variant="body2">Change: {selectedStock.change} ({selectedStock.changePercent}%)</Typography>
          {/* Add more stock details as needed */}
        </Box>
      )}
    </Box>
  )
}

export default Dashboard
