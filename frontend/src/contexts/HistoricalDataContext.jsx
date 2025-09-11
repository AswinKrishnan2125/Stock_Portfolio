import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const HistoricalDataContext = createContext(null);

export const useHistoricalData = () => {
  const ctx = useContext(HistoricalDataContext);
  if (!ctx) throw new Error('useHistoricalData must be used within HistoricalDataProvider');
  return ctx;
};

export const HistoricalDataProvider = ({ children }) => {
  const [historicalData, setHistoricalData] = useState({}); // { [symbol]: Candle[] }
  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef({}); // { [symbol]: Candle[] }
  const lastFetchTime = useRef({}); // { [symbol]: number }

  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  const fetchHistoricalData = async (symbols, forceRefresh = false) => {
    if (!Array.isArray(symbols) || symbols.length === 0) return;
    const now = Date.now();
    const uncachedSymbols = forceRefresh
      ? symbols
      : symbols.filter((s) => {
          const last = lastFetchTime.current[s];
          return !last || now - last > CACHE_DURATION || !cache.current[s];
        });

    if (uncachedSymbols.length === 0) {
      setHistoricalData({ ...cache.current });
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all(
        uncachedSymbols.map((symbol) =>
          axios
            .get(`/historical/prices/`, { params: { symbol, range: '6M' } })
            .then((res) => ({ symbol, data: (res.data?.prices?.[symbol]) || [] }))
        )
      );

      const newCache = { ...cache.current };
      results.forEach(({ symbol, data }) => {
        newCache[symbol] = data;
        lastFetchTime.current[symbol] = now;
      });
      cache.current = newCache;
      setHistoricalData({ ...newCache });
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredData = useMemo(() => {
    return (symbols, timeframe) => {
      if (!Array.isArray(symbols) || symbols.length === 0) return {};
      const data = cache.current;
      if (!data) return {};

      const now = new Date();
      let startDate;
      switch (timeframe) {
        case '1w':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          return symbols.reduce((acc, s) => {
            if (data[s]) acc[s] = data[s];
            return acc;
          }, {});
      }

      const filtered = {};
      symbols.forEach((symbol) => {
        const arr = data[symbol];
        if (Array.isArray(arr)) {
          filtered[symbol] = arr.filter((dp) => {
            const dStr = dp.date || dp.timestamp;
            const d = dStr ? new Date(dStr) : null;
            return d && d >= startDate;
          });
        }
      });
      return filtered;
    };
  }, []);

  const value = {
    historicalData,
    isLoading,
    fetchHistoricalData,
    getFilteredData,
  };

  return (
    <HistoricalDataContext.Provider value={value}>{children}</HistoricalDataContext.Provider>
  );
};
