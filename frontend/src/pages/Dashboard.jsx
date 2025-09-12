import React from "react";
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Typography,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { TrendingUp, TrendingDown, Circle } from "lucide-react";
import axios from 'axios'
import StockSearch from "./StockSearch";
import { useAuth } from "../contexts/AuthContext";
import { useStockLive } from "../contexts/StockLiveProvider";
import { useTheme } from '@mui/material/styles';

const Dashboard = () => {
  const theme = useTheme();
  const { stockData, loading, interestedSymbols, refreshPrices } = useStockLive();
  React.useEffect(() => {
    console.log('Dashboard stockData:', stockData);
    console.log('Dashboard interestedSymbols:', interestedSymbols);
  }, [stockData, interestedSymbols]);

  const avatarBg = React.useCallback((sym) => {
    const s = String(sym || '');
    const palette = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      (theme.palette.info && theme.palette.info.main) || theme.palette.primary.light,
    ];
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  }, [theme]);

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
      {/* Full-width hero section from top to hero bottom */}
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          backgroundImage:
            'url("https://images.stockcake.com/public/8/6/9/869bfcae-8250-4327-8895-ae6d31ec1907_large/financial-market-analysis-stockcake.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)' }} />
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <Box textAlign="center" sx={{ position: 'relative' }}>
            <Typography variant="h3" fontWeight="bold" color="text.primary">
              Discover Your Next Investment
            </Typography>
            <Typography variant="h6" color="text.secondary" mt={2}>
              Search and analyze thousands of stocks and securities with real-time
              data and insights.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>

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
      <Grid item xs={12} sm={6} md={6} lg={4} key={stock.symbol}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            transition: "0.3s",
            "&:hover": { boxShadow: 6 },
            minHeight: 180,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Symbol + Live */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Box display="flex" alignItems="center" gap={1.25}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: avatarBg(stock.symbol),
                    color: theme.palette.getContrastText(avatarBg(stock.symbol)),
                    fontSize: 16,
                  }}
                >
                  {String(stock.symbol || '?').slice(0, 3)}
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {stock.symbol}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
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
                <StockCardMenu symbol={stock.symbol} />
              </Box>
            </Box>

            {/* Current Value */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>
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

function StockCardMenu({ symbol }) {
  const { removeStock, refreshPrices } = useStockLive();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleDelete = async () => {
    try {
  // Call authenticated endpoint; axios carries the token from AuthContext setup
  await axios.delete(`/interested-stocks/by-symbol/${encodeURIComponent(symbol)}/`)

  // Update client state
  await removeStock(symbol, user?.id)
      refreshPrices()
    } catch (e) {
      console.error('Delete failed', e)
    } finally {
      handleClose()
    }
  }

  return (
    <>
      <IconButton size="small" onClick={handleOpen} aria-label="more">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </>
  )
}
