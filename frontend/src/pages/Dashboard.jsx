import React from "react";
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Typography,
  CircularProgress,
} from "@mui/material";
import { TrendingUp, TrendingDown, Circle } from "lucide-react";
import StockSearch from "./StockSearch";
import { useAuth } from "../contexts/AuthContext";
import { useStockLive } from "../contexts/StockLiveProvider";

const Dashboard = () => {
  const { stockData, loading, interestedSymbols, refreshPrices } = useStockLive();
  React.useEffect(() => {
    console.log('Dashboard stockData:', stockData);
    console.log('Dashboard interestedSymbols:', interestedSymbols);
  }, [stockData, interestedSymbols]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  const formatPercent = (percent) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  };

  function isMarketLiveIST() {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 60 * 60000);

    const day = ist.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (day === 0 || day === 6) return false; // Only Mon-Fri

    const hour = ist.getHours();
    const minute = ist.getMinutes();

    // Market open: 19:00 (7PM) to 01:30 (next day)
    if (hour > 19 || (hour === 19 && minute >= 0)) return true; // 19:00 to 23:59
    if (hour < 2 || (hour === 1 && minute <= 30)) return true;  // 00:00 to 01:30
    return false;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h3"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(90deg,#1976d2,#42a5f5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Discover Your Next Investment
          </Typography>
          <Typography variant="h6" color="text.secondary" mt={2}>
            Search and analyze thousands of stocks and securities with real-time
            data and insights.
          </Typography>
        </Box>

        {/* Search */}
        <Box mb={6}>
          <StockSearch />
        </Box>

        {/* Stock Cards */}
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
  {stockData.length > 0 ? (
    stockData.map((stock) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={stock.symbol}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            boxShadow: 3,
            transition: "0.3s",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <CardContent>
            {/* Symbol + Live */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Typography variant="h6" fontWeight="bold">
                {stock.symbol}
              </Typography>
              {isMarketLiveIST() ? (
                          <Chip
                            size="small"
                            label="LIVE"
                            icon={
                              <Circle
                                size={10}
                                style={{ color: "green", fill: "green" }}
                              />
                            }
                            sx={{
                              bgcolor: "rgba(46,125,50,0.1)",
                              color: "success.main",
                              fontWeight: 500,
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="CLOSED"
                            icon={
                              <Circle
                                size={10}
                                style={{ color: "gray", fill: "gray" }}
                              />
                            }
                            sx={{
                              bgcolor: "rgba(120,120,120,0.1)",
                              color: "text.secondary",
                              fontWeight: 500,
                            }}
                          />
                        )}
            </Box>

            {/* Current Value */}
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {typeof stock.latestPrice === "number"
                ? formatPrice(stock.latestPrice)
                : "N/A"}
            </Typography>

            {/* Change */}
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                color={stock.change >= 0 ? "success.main" : "error.main"}
              >
                {stock.change >= 0 ? (
                  <TrendingUp size={18} />
                ) : (
                  <TrendingDown size={18} />
                )}
                <Typography variant="body2" fontWeight="500">
                  {typeof stock.change === "number"
                    ? formatPrice(Math.abs(stock.change))
                    : "N/A"}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={
                  typeof stock.changePercent === "number"
                    ? formatPercent(stock.changePercent)
                    : "N/A"
                }
                sx={{
                  bgcolor:
                    stock.change >= 0
                      ? "rgba(46,125,50,0.1)"
                      : "rgba(211,47,47,0.1)",
                  color:
                    stock.change >= 0 ? "success.main" : "error.main",
                  fontWeight: 500,
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))
  ) : (
    <Box textAlign="center" py={6} color="text.secondary">
      <Typography variant="h6">No stocks to display.</Typography>
    </Box>
  )}
</Grid>

        )}
      </Container>
    </Box>
  );
};

export default Dashboard;

// Wrap Dashboard with StockDataContext.Provider in your app's main component (e.g., App.jsx):
// <StockDataContext.Provider value={React.useState([])}>
//   <Dashboard />
// </StockDataContext.Provider>
