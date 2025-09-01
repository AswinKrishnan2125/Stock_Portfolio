import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import axios from 'axios'

const Charts = () => {
  const [stockData, setStockData] = useState([])
  const [portfolioData, setPortfolioData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChart, setSelectedChart] = useState('line')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch mock stock prices
      const pricesResponse = await axios.get('/mock/prices/')
      const prices = pricesResponse.data.prices

      // Generate mock historical data
      const historicalData = generateHistoricalData(prices)
      setStockData(historicalData)

      // Fetch portfolio data
      const portfoliosResponse = await axios.get('/portfolios/')
      const portfolios = portfoliosResponse.data.results || portfoliosResponse.data
      
      // Generate portfolio chart data
      const portfolioChartData = portfolios.map(portfolio => ({
        name: portfolio.name,
        value: portfolio.total_value || 0,
        gainLoss: portfolio.total_gain_loss || 0
      }))
      setPortfolioData(portfolioChartData)

    } catch (error) {
      console.error('Error fetching chart data:', error)
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const generateHistoricalData = (prices) => {
    const data = []
    const symbols = prices.map(p => p.symbol)
    
    // Generate 30 days of historical data
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dayData = {
        date: date.toLocaleDateString(),
        timestamp: date.getTime()
      }
      
      symbols.forEach(symbol => {
        const basePrice = prices.find(p => p.symbol === symbol)?.current_price || 100
        const randomChange = (Math.random() - 0.5) * 0.1 // ±5% daily change
        dayData[symbol] = Math.max(basePrice * (1 + randomChange), 1)
      })
      
      data.push(dayData)
    }
    
    return data
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

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

  const renderChart = () => {
    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {stockData.length > 0 && Object.keys(stockData[0]).filter(key => key !== 'date' && key !== 'timestamp').map((symbol, index) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {stockData.length > 0 && Object.keys(stockData[0]).filter(key => key !== 'date' && key !== 'timestamp').slice(0, 3).map((symbol, index) => (
                <Area
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stockData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {stockData.length > 0 && Object.keys(stockData[0]).filter(key => key !== 'date' && key !== 'timestamp').slice(0, 4).map((symbol, index) => (
                <Bar
                  key={symbol}
                  dataKey={symbol}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      
      default:
        return null
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stock Charts & Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Stock Price Trends</Typography>
                <Box display="flex" gap={2}>
                  <FormControl size="small">
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={selectedChart}
                      label="Chart Type"
                      onChange={(e) => setSelectedChart(e.target.value)}
                    >
                      <MenuItem value="line">Line Chart</MenuItem>
                      <MenuItem value="area">Area Chart</MenuItem>
                      <MenuItem value="bar">Bar Chart</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <InputLabel>Timeframe</InputLabel>
                    <Select
                      value={selectedTimeframe}
                      label="Timeframe"
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                    >
                      <MenuItem value="1W">1 Week</MenuItem>
                      <MenuItem value="1M">1 Month</MenuItem>
                      <MenuItem value="3M">3 Months</MenuItem>
                      <MenuItem value="6M">6 Months</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              {renderChart()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Total Value" />
                  <Bar dataKey="gainLoss" fill="#82ca9d" name="Gain/Loss" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Market Summary
            </Typography>
            <Grid container spacing={2}>
              {stockData.length > 0 && Object.keys(stockData[0]).filter(key => key !== 'date' && key !== 'timestamp').map((symbol, index) => {
                const latestPrice = stockData[stockData.length - 1][symbol]
                const previousPrice = stockData[stockData.length - 2]?.[symbol] || latestPrice
                const change = latestPrice - previousPrice
                const changePercent = (change / previousPrice) * 100
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={symbol}>
                    <Box p={2} border="1px solid #e0e0e0" borderRadius={1}>
                      <Typography variant="h6">{symbol}</Typography>
                      <Typography variant="h5" color="primary">
                        ${latestPrice.toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={change >= 0 ? 'success.main' : 'error.main'}
                      >
                        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Charts
