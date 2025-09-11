// src/contexts/StockLiveProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const StockLiveContext = createContext();

export const useStockLive = () => {
  const context = useContext(StockLiveContext);
  if (!context) {
    throw new Error("useStockLive must be used within a StockLiveProvider");
  }
  return context;
};

export const StockLiveProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [stockData, setStockData] = useState([]);
  const [interestedSymbols, setInterestedSymbols] = useState([]);
  const [loading, setLoading] = useState(false);

  // Axios default baseURL (same as AuthProvider)
  axios.defaults.baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  // Attach token if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Fetch stock data for the user
  const fetchStockData = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/batch-prices/`, {
        params: { user_id: userId },
      });
      const apiData = response.data || [];
      // Ensure all interested symbols are present in stockData
      const symbols = apiData.map(item => item.symbol);
      setInterestedSymbols(symbols);
      // Fill missing symbols with placeholders
      const allData = symbols.map(sym => {
        const found = apiData.find(item => item.symbol === sym);
        return found || { symbol: sym, latestPrice: null, change: null, changePercent: null, timestamp: null };
      });
      setStockData(allData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock data on first render and when token/user changes
  useEffect(() => {
    if (token && user?.id) {
      fetchStockData(user.id);
    }
  }, [token, user]);

  // Finnhub WebSocket for live prices
  useEffect(() => {
    if (!interestedSymbols.length) return;
    const FINNHUB_TOKEN = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!FINNHUB_TOKEN) {
      console.error("Missing VITE_FINNHUB_API_KEY in environment. WebSocket will not connect.");
      return;
    }
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_TOKEN}`);

    ws.onopen = () => {
      console.log("[Finnhub WS] Connected");
      console.log("[Finnhub WS] Subscribing:", interestedSymbols);
      // Subscribe to all interested symbols
      interestedSymbols.forEach(symbol => {
        try {
          ws.send(JSON.stringify({ type: "subscribe", symbol }));
          console.log(`[Finnhub WS] -> subscribe ${symbol}`);
        } catch (e) {
          console.warn("[Finnhub WS] subscribe send failed for", symbol, e);
        }
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "trade" && Array.isArray(data.data)) {
          setStockData(prev => {
            // Only update price/timestamp for matching symbols, never clear or shrink array
            let updated = [...prev];
            data.data.forEach(trade => {
              const idx = updated.findIndex(s => s.symbol === trade.s);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  latestPrice: trade.p,
                  timestamp: trade.t,
                };
              }
            });
            return updated;
          });
        } else if (data.type && data.type !== "trade") {
          // Helpful during debugging: ping, info, etc.
          console.debug("[Finnhub WS] Non-trade message:", data.type);
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    ws.onerror = (err) => {
      console.error("[Finnhub WS] Error:", err);
    };

    ws.onclose = (event) => {
      console.warn("[Finnhub WS] Closed:", event);
      if (event.code || event.reason) {
        console.warn(`[Finnhub WS] Close code: ${event.code}, reason: ${event.reason}`);
      }
    };

    return () => {
      ws.close();
    };
  }, [interestedSymbols]);

  // Add a stock to interested symbols
  const addStock = async (symbol, userId) => {
    try {
      const response = await axios.post(`/interests/`, {
        user_id: userId,
        symbol,
      });
  // Update subscriptions immediately so WS can subscribe without waiting for refetch
  setInterestedSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
      if (userId) {
        // refreshPrices();
      await fetchStockData(userId);
    }
      return response.data;
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  // Remove a stock from interested symbols
  const removeStock = async (symbol, userId) => {
    try {
      await axios.delete(`/interests/${symbol}/`, {
        data: { user_id: userId },
      });
      setInterestedSymbols((prev) =>
        prev.filter((s) => s !== symbol)
      );
    } catch (error) {
      console.error("Error removing stock:", error);
    }
  };

  // Helper to refresh prices for all interested symbols (for UI refresh after add/remove)
  const refreshPrices = () => {

    const userId = user.id || null;
    if (userId) {
      console.log('refreshing------------')
      fetchStockData(userId);
    }
  };

  const value = {
    stockData,
    interestedSymbols,
    loading,
    fetchStockData,
    addStock,
    removeStock,
    refreshPrices,
  };

  return (
    <StockLiveContext.Provider value={value}>
      {children}
    </StockLiveContext.Provider>
  );
};
