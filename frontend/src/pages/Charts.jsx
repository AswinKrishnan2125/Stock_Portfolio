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
import { use } from 'react'

const Charts = () => {
  const [stockData, setStockData] = useState([])
  const [portfolioData, setPortfolioData] = useState([])
  const [portfolioError, setPortfolioError] = useState(''); 
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChart, setSelectedChart] = useState('line')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')
  const [historicalData, setHistoricalData] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  

useEffect(()=>{
  console.log(stockData);
  
},[stockData]);

useEffect(() => {
  let socket;
  let alive = true;

  const connect = () => {
    socket = new WebSocket('ws://127.0.0.1:8000/ws/prices/');

    socket.onopen = () => {
      console.log('WebSocket connected');
      setLoading(false);
    }

    socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.prices) {
      // Deduplicate by symbol
      const uniquePrices = Object.values(
        data.prices.reduce((acc, stock) => {
          acc[stock.symbol] = stock
          return acc
        }, {})
      )
      setStockData(uniquePrices);
      setLoading(false);
      // console.log(stockData);
      
    }
  }


    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      // Don’t flip global error; try to reconnect if closed.
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      if (alive) {
        // simple backoff reconnect
        setTimeout(connect, 2000);
      }
    };
  };

  connect();
  return () => {
    alive = false;
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
  };
}, []);


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

      // Cleanup on unmount
      // return () => socket.close()

    } catch (error) {
      console.error('Error fetching chart data:', error)
      // setError('Failed to load chart data')
      setPortfolioError('Failed to load portfolio data')
    }
  }




  useEffect(() => {
    fetchHistory()
  }, [selectedTimeframe])


  //working but only for one stock
//   const fetchHistory = async () => {
//   try {
//     const symbol = stockData[0]?.symbol || "AAPL";
//     const historicalResponse = await axios.get(
//       `/historical/prices/?symbol=${symbol}&range=${selectedTimeframe}`
//     );

//     const prices = historicalResponse.data.prices[symbol]; // directly grab the array
//     console.log("Historical Response:", historicalResponse.data);
//     console.log("Prices:", prices);

//     setHistoricalData({ [symbol]: prices }); // store { symbol: array }

//     console.log("Timeframe changed to:", selectedTimeframe);
//   } catch (error) {
//     console.error("Error fetching historical data:", error);
//   }
// };



const symbolsList = ["AAPL", "MSFT", "GOOGL"]; // you can expand this list

const fetchHistory = async () => {
  try {
    let allData = {};

    for (const symbol of symbolsList) {
      const response = await axios.get(
        `/historical/prices/?symbol=${symbol}&range=${selectedTimeframe}`
      );

      const prices = response.data.prices[symbol];
      allData[symbol] = prices || [];
    }

    setHistoricalData(allData);
    console.log("Historical Data:", allData);
  } catch (error) {
    console.error("Error fetching historical data:", error);
  }
};






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
  if (!historicalData || Object.keys(historicalData).length === 0) return null;

  const symbols = Object.keys(historicalData);
  const chartData = [];

  // Build dataset for recharts
  historicalData[symbols[0]].forEach((day, idx) => {
    const entry = { date: day.date };
    symbols.forEach(sym => {
      entry[sym] = historicalData[sym][idx]?.close;
    });
    chartData.push(entry);
  });

  console.log("Chart data:", chartData);

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
              {stockData.map((stock) => (
                <Grid item xs={12} sm={6} md={3} key={stock.symbol}>
                  <Box p={2} border="1px solid #e0e0e0" borderRadius={1}>
                    <Typography variant="h6">{stock.symbol}</Typography>
                    <Typography variant="h5" color="primary">
                      {typeof stock.latestPrice === "number"
                        ? `$${stock.latestPrice.toFixed(2)}`
                        : "N/A"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={stock.change >= 0 ? "success.main" : "error.main"}
                    >
                      {typeof stock.change === "number" && typeof stock.changePercent === "number"
                        ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)`
                        : "N/A"}
                    </Typography>
                  </Box>
                </Grid>
              ))}

            </Grid>

          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Charts
