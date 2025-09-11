import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Paper
} from '@mui/material'
import {
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
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useStockLive } from "../contexts/StockLiveProvider";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const timeframeOptions = [
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' }
]

const Charts = () => {
  const [portfolioData, setPortfolioData] = useState([])
  const [portfolioError, setPortfolioError] = useState('')
  const [error, setError] = useState('')
  const [historicalData, setHistoricalData] = useState({})
  const [selectedTimeframe, setSelectedTimeframe] = useState('1w')
  const [selectedChart, setSelectedChart] = useState('line')
  const { token } = useAuth();
  const { interestedSymbols } = useStockLive();
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch all interested symbols for the user on mount and whenever they change
  useEffect(() => {
    if (interestedSymbols && interestedSymbols.length > 0) {
      setStockData(interestedSymbols.map(symbol => ({ symbol })));
    } else {
      setStockData([]);
    }
  }, [interestedSymbols]);

  const fetchData = async () => {
    try {
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

      // Fetch stockData for historical charts (demo: use AAPL, MSFT if none)
      if (portfolios.length > 0 && portfolios[0].stocks) {
        setStockData(portfolios[0].stocks.map(s => ({ symbol: s.symbol })));
      } else {
        setStockData([{ symbol: "AAPL" }, { symbol: "MSFT" }]);
      }
    } catch (error) {
      setPortfolioError('Failed to load portfolio data')
    }
  }

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line
  }, [stockData, selectedTimeframe])

  const fetchHistory = async () => {
    try {
      let allData = {};
      // Use live symbols from stockData
      const symbols = stockData.map(s => s.symbol);
      if (symbols.length === 0) {
        setHistoricalData({});
        return;
      }
      for (const symbol of symbols) {
        const response = await axios.get(
          `/historical/prices/?symbol=${symbol}&range=${selectedTimeframe}`
        );
        const prices = response.data.prices[symbol];
        allData[symbol] = prices || [];
      }
      setHistoricalData(allData);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  const handleTimeframeChange = (event, newValue) => {
    if (newValue) setSelectedTimeframe(newValue);
  };

  const handleChartTypeChange = (event, newValue) => {
    if (newValue) setSelectedChart(newValue);
  };

  const renderChart = () => {
    if (!historicalData || Object.keys(historicalData).length === 0) return null;

    const symbols = Object.keys(historicalData);
    const chartData = [];

    // Build dataset for recharts
    historicalData[symbols[0]].forEach((day, idx) => {
      const entry = { date: day.date || day.timestamp };
      symbols.forEach(sym => {
        entry[sym] = historicalData[sym][idx]?.close;
      });
      chartData.push(entry);
    });

    switch (selectedChart) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {symbols.map((symbol, index) => (
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
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {symbols.map((symbol, index) => (
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
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {symbols.map((symbol, index) => (
                <Bar
                  key={symbol}
                  dataKey={symbol}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: "#1976d2", fontWeight: 700 }}>
        Stock Charts & Analytics
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
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
              <Typography variant="h6" gutterBottom sx={{ color: "#1976d2" }}>
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
                  <Bar dataKey="gainLoss" fill="#1976d2" name="Gain/Loss" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Timeframe & Chart Type Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ color: "#1976d2" }}>
            Historical Data
          </Typography>
          <ToggleButtonGroup
            value={selectedTimeframe}
            exclusive
            onChange={handleTimeframeChange}
          >
            {timeframeOptions.map(opt => (
              <ToggleButton
                key={opt.value}
                value={opt.value}
                sx={{ fontWeight: 600 }}
              >
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={selectedChart}
            exclusive
            onChange={handleChartTypeChange}
          >
            <ToggleButton value="line" sx={{ fontWeight: 600 }}>Line</ToggleButton>
            <ToggleButton value="area" sx={{ fontWeight: 600 }}>Area</ToggleButton>
            <ToggleButton value="bar" sx={{ fontWeight: 600 }}>Bar</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Historical Chart */}
      <Box sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        {renderChart() || (
          <Typography color="text.secondary" textAlign="center">
            No historical data available for selected timeframe.
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default Charts
