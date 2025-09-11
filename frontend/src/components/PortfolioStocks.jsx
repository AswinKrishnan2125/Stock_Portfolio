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

const PortfolioStocks = ({ stocks, onAddStock, onEditStock, onDeleteStock }) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [menuStock, setMenuStock] = React.useState(null);

  const handleMenuOpen = (event, stock) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuStock(stock);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuStock(null);
  };

  return (
    <Box className="bg-white rounded-lg shadow p-6 mt-6">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Stocks in Portfolio</Typography>
        <Button variant="contained" startIcon={<AddStockIcon />} onClick={onAddStock}>
          Add Stock
        </Button>
      </Box>
      {stocks && stocks.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Shares</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Gain/Loss</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>{stock.symbol}</TableCell>
                  <TableCell>{stock.company_name}</TableCell>
                  <TableCell>{stock.shares}</TableCell>
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
        <Typography color="textSecondary">No stocks in this portfolio.</Typography>
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
