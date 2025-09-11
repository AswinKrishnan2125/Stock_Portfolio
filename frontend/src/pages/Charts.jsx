import React, { useState, useEffect, useMemo } from 'react'
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
import { useStockLive } from "../contexts/StockLiveProvider";
import { useHistoricalData } from "../contexts/HistoricalDataContext";
import axios from 'axios'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const timeframeOptions = [
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' }
]

const Charts = () => {
  const [portfolioData, setPortfolioData] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [portfolioError, setPortfolioError] = useState('')
  const [error, setError] = useState('')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1w')
  const [selectedChart, setSelectedChart] = useState('line')
  const { interestedSymbols, stockData: livePrices } = useStockLive();
  const [trackedSymbols, setTrackedSymbols] = useState([]);
  const { fetchHistoricalData, getFilteredData } = useHistoricalData();

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch all interested symbols for the user on mount and whenever they change
  useEffect(() => {
    if (interestedSymbols && interestedSymbols.length > 0) {
      setTrackedSymbols(interestedSymbols.map(symbol => ({ symbol })));
    } else {
      // Fallback demo symbols only if user has none
      setTrackedSymbols([{ symbol: 'AAPL' }, { symbol: 'MSFT' }]);
    }
  }, [interestedSymbols]);

  const fetchData = async () => {
    try {
      // Fetch portfolio data from backend
      const portfoliosResponse = await axios.get('/portfolios/')
      const fetched = portfoliosResponse.data.results || portfoliosResponse.data
      setPortfolios(fetched)
    } catch (error) {
      setPortfolioError('Failed to load portfolio data')
    }
  }

  useEffect(() => {
    const symbols = trackedSymbols.map((s) => s.symbol);
    if (symbols.length > 0) {
      // Fetch once (cached); timeframe filtering happens client-side
      fetchHistoricalData(symbols);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedSymbols]);

  const filteredHistoricalData = useMemo(() => {
    const symbols = trackedSymbols.map((s) => s.symbol);
    return getFilteredData(symbols, selectedTimeframe);
  }, [trackedSymbols, selectedTimeframe, getFilteredData]);

  // Build quick lookup for live prices
  const priceBySymbol = useMemo(() => {
    const map = new Map();
    (livePrices || []).forEach((s) => {
      if (s?.symbol) map.set(String(s.symbol).toUpperCase(), s.latestPrice);
    });
    return map;
  }, [livePrices]);

  const getCurrentNumericPrice = (symbol, fallback) => {
    const key = String(symbol || '').toUpperCase();
    const live = priceBySymbol.get(key);
    if (typeof live === 'number') return live;
    const fb = parseFloat(fallback);
    return Number.isFinite(fb) ? fb : undefined;
  };

  const computePortfolioTotals = (p) => {
    if (!p?.stocks?.length) return { totalValue: 0, totalGainLoss: 0 };
    return p.stocks.reduce(
      (acc, s) => {
        const shares = parseFloat(s.shares);
        const purchase = parseFloat(s.purchase_price);
        const current = getCurrentNumericPrice(s.symbol, s.current_price) ?? purchase;
        if (!Number.isFinite(shares) || !Number.isFinite(purchase) || !Number.isFinite(current)) return acc;
        acc.totalValue += shares * current;
        acc.totalGainLoss += (current - purchase) * shares;
        return acc;
      },
      { totalValue: 0, totalGainLoss: 0 }
    );
  };

  // Recompute chart data whenever portfolios or live prices change
  useEffect(() => {
    if (!portfolios || portfolios.length === 0) {
      setPortfolioData([]);
      return;
    }
    const computed = portfolios.map((p) => {
      const totals = computePortfolioTotals(p);
      return {
        name: p.name,
        value: totals.totalValue,
        gainLoss: totals.totalGainLoss,
      };
    });
    setPortfolioData(computed);
  }, [portfolios, priceBySymbol]);

  const handleTimeframeChange = (event, newValue) => {
    if (newValue) setSelectedTimeframe(newValue);
  };

  const handleChartTypeChange = (event, newValue) => {
    if (newValue) setSelectedChart(newValue);
  };

  const renderChart = () => {
  if (!filteredHistoricalData || Object.keys(filteredHistoricalData).length === 0) return null;

  const symbols = Object.keys(filteredHistoricalData);
    const chartData = [];

    // Build dataset for recharts
  filteredHistoricalData[symbols[0]].forEach((day, idx) => {
      const entry = { date: day.date || day.timestamp };
      symbols.forEach(sym => {
    entry[sym] = filteredHistoricalData[sym][idx]?.close;
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

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="text.primary">
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
              <Typography variant="h6" gutterBottom color="text.primary">
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
      <Typography variant="h6" color="text.primary">
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
