import React, { useState, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Typography,
} from "@mui/material";
import { Search, TrendingUp, TrendingDown, DollarSign, X as ClearIcon } from "lucide-react";
import { debounce } from "../utils/debounce";
import { useAuth } from "../contexts/AuthContext";
import { useStockLive } from "../contexts/StockLiveProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const StockSearch = () => {
  // Remove liveData state, rely on Dashboard cards for display
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token, fetchUserProfile, user } = useAuth ? useAuth() : { token: null, fetchUserProfile: null, user: null };
  const [addStatus, setAddStatus] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const {refreshPrices} = useStockLive ? useStockLive() : {};

  const fetchSuggestions = async (searchTerm) => {
    if (!searchTerm) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Call backend API for stock search
      const res = await fetch(
        `${API_BASE}/search/?q=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();
      // Defensive: ensure results is an array
      const results = Array.isArray(data.results) ? data.results : [];
      setSuggestions(results);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // debounce API calls
  const debouncedFetch = useCallback(
    debounce((q) => fetchSuggestions(q), 400), // increased debounce to 400ms for rate limit safety
    []
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetch(value);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);

  const formatPercent = (percent) =>
    `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;

  const handleAddInterestedStock = async (item) => {
    setAddStatus("");
    setAddSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/interested-stocks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ symbol: item.symbol, name: item.description }),
      });
      if (res.ok) {
        setAddStatus(`Added ${item.symbol} to Interested Stocks!`);
        setAddSuccess(true);
        if (fetchUserProfile) await fetchUserProfile();
        // Wait 1.5 seconds before refreshing live data
        setTimeout(() => {
          if (refreshPrices) refreshPrices();
        }, 1500);
      } else {
        const err = await res.json();
        setAddStatus(err?.detail || "Failed to add.");
        setAddSuccess(false);
      }
    } catch (err) {
      console.error("fetch error-------", err);
      setAddStatus("Network or server error.");
      setAddSuccess(false);
    }
    setTimeout(() => {
      setAddStatus("");
      setAddSuccess(false);
    }, 2000);
  };

  return (
    <Box maxWidth={600} mx="auto">
      {/* Search Input */}
      <TextField
        fullWidth
        value={query}
        onChange={handleChange}
        placeholder="Search stocks or symbols..."
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} />
            </InputAdornment>
          ),
          endAdornment: (
            <>
              {isLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              )}
              {query && (
                <InputAdornment position="end">
                  <ClearIcon size={18} style={{ cursor: "pointer" }} onClick={() => setQuery("")} />
                </InputAdornment>
              )}
            </>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            fontSize: "1.1rem",
            fontWeight: 500,
          },
        }}
        color={addSuccess ? "success" : addStatus ? "error" : "primary"}
      />

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && query && !isLoading && (
        <Paper
          elevation={4}
          sx={{ mt: 2, borderRadius: 3, overflow: "hidden", maxHeight: 400 }}
        >
          <List sx={{ maxHeight: 400, overflowY: "auto" }}>
            {suggestions.map((item) => (
              <ListItem
                key={item.symbol}
                divider
                sx={{
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => handleAddInterestedStock(item)}
              >
                {/* Left icon */}
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      borderRadius: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <DollarSign size={18} />
                  </Avatar>
                </ListItemAvatar>

                {/* Middle content */}
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight="bold">
                        {item.symbol || item.displaySymbol}
                      </Typography>
                      {item.changePercent !== undefined && (
                        <Chip
                          size="small"
                          label={formatPercent(item.changePercent)}
                          icon={
                            item.changePercent >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )
                          }
                          sx={{
                            bgcolor:
                              item.changePercent >= 0
                                ? "rgba(46,125,50,0.1)"
                                : "rgba(211,47,47,0.1)",
                            color:
                              item.changePercent >= 0
                                ? "success.main"
                                : "error.main",
                            fontWeight: 500,
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                    >
                      {item.description || item.symbol}
                    </Typography>
                  }
                />

                {/* Right price info */}
                {item.price !== undefined && (
                  <Box textAlign="right">
                    <Typography fontWeight="bold">
                      {formatPrice(item.price)}
                    </Typography>
                    {item.change !== undefined && (
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color={item.change >= 0 ? "success.main" : "error.main"}
                      >
                        {item.change >= 0 ? "+" : ""}
                        {formatPrice(item.change)}
                      </Typography>
                    )}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Empty State */}
      {query && !isLoading && suggestions.length === 0 && (
        <Paper
          elevation={2}
          sx={{ mt: 2, borderRadius: 3, textAlign: "center", p: 4 }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <Search size={28} />
          </Box>
          <Typography variant="body1" fontWeight={500} color="text.secondary">
            No stocks found for "{query}"
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try searching with a different symbol or company name
          </Typography>
        </Paper>
      )}

      {/* Feedback message */}
      {addStatus && (
        <Paper elevation={2} sx={{ mt: 2, borderRadius: 3, textAlign: "center", p: 2 }}>
          <Typography color={addSuccess ? "success.main" : "error.main"} fontWeight={500}>{addStatus}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StockSearch;
