import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import { Add as AddStockIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';
import { useStockLive } from '../contexts/StockLiveProvider';

const PortfolioStocks = ({ stocks, onAddStock, onEditStock, onDeleteStock }) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuStock, setMenuStock] = React.useState(null);
  const { stockData } = useStockLive();

  const priceBySymbol = React.useMemo(() => {
    const map = new Map();
    (stockData || []).forEach((s) => {
      if (s?.symbol) map.set(String(s.symbol).toUpperCase(), s.latestPrice);
    });
    return map;
  }, [stockData]);

  const renderCurrent = (symbol) => {
    const key = String(symbol || '').toUpperCase();
    const price = priceBySymbol.get(key);
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`;
    }
    return 'NA';
  };

  const handleMenuOpen = (event, stock) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuStock(stock);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuStock(null);
  };

  return (
    <Box sx={{
      mt: 6,
      p: 3,
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Stocks in Portfolio</Typography>
        <Button variant="contained" startIcon={<AddStockIcon />} onClick={onAddStock}>
          Add Stock
        </Button>
      </Box>
      {stocks && stocks.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Symbol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Shares</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Current</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gain/Loss</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id} hover>
                  <TableCell>{stock.symbol}</TableCell>
                  <TableCell>{stock.company_name}</TableCell>
                  <TableCell>{stock.shares}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color={typeof priceBySymbol.get(String(stock.symbol || '').toUpperCase()) === 'number' ? 'text.primary' : 'text.secondary'}>
                      {renderCurrent(stock.symbol)}
                    </Typography>
                  </TableCell>
                  <TableCell>${(stock.total_value || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={stock.gain_loss >= 0 ? 'success.main' : 'error.main'}
                    >
                      {stock.gain_loss >= 0 ? '+' : ''}${(stock.gain_loss || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, stock)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color="text.secondary">No stocks in this portfolio.</Typography>
      )}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { if (menuStock) onEditStock(menuStock); handleMenuClose(); }}>Edit</MenuItem>
        <MenuItem onClick={() => { const id = menuStock?.id; handleMenuClose(); if (id) onDeleteStock(id); }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </Box>
  );
};

export default PortfolioStocks;
