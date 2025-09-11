import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory2 as Inventory2Icon,
  Equalizer as EqualizerIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'

const PortfolioDetails = ({ portfolio, onBack, token }) => {
  const [portfolioData, setPortfolioData] = useState(portfolio)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Stock dialog states
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [stockForm, setStockForm] = useState({
    symbol: '',
    company_name: '',
    shares: '',
    purchase_price: '',
    purchase_date: '',
    current_price: '',
    notes: ''
  })
  const [editingStock, setEditingStock] = useState(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [menuStock, setMenuStock] = useState(null)

  useEffect(() => {
    fetchPortfolioDetails()
  }, [portfolio.id])

  const fetchPortfolioDetails = async () => {
    try {
      setLoading(true)
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/portfolios/${portfolio.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio details')
      }
      
      const data = await response.json()
      setPortfolioData(data)
    } catch (error) {
      console.error('Error fetching portfolio details:', error)
      setError('Failed to load portfolio details')
    } finally {
      setLoading(false)
    }
  }

  const handleStockSubmit = async () => {
    try {
      const stockData = {
        ...stockForm,
        portfolio_id: portfolioData.id
      }
      
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      
      if (editingStock) {
        const response = await fetch(`${baseURL}/stocks/${editingStock.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(stockData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to update stock')
        }
      } else {
        const response = await fetch(`${baseURL}/stocks/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(stockData)
        })
        
        if (!response.ok) {
          throw new Error('Failed to create stock')
        }
      }
      
      setStockDialogOpen(false)
      setStockForm({
        symbol: '',
        company_name: '',
        shares: '',
        purchase_price: '',
        purchase_date: '',
        current_price: '',
        notes: ''
      })
      setEditingStock(null)
      fetchPortfolioDetails()
    } catch (error) {
      console.error('Error saving stock:', error)
      setError('Failed to save stock')
    }
  }

  const handleDeleteStock = async (stockId) => {
    if (window.confirm('Are you sure you want to delete this stock?')) {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
        const response = await fetch(`${baseURL}/stocks/${stockId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete stock')
        }
        
        fetchPortfolioDetails()
      } catch (error) {
        console.error('Error deleting stock:', error)
        setError('Failed to delete stock')
      }
    }
  }

  const openStockDialog = (stock = null) => {
    if (stock) {
      setStockForm({
        symbol: stock.symbol,
        company_name: stock.company_name,
        shares: stock.shares,
        purchase_price: stock.purchase_price,
        purchase_date: stock.purchase_date,
        current_price: stock.current_price || '',
        notes: stock.notes || ''
      })
      setEditingStock(stock)
    } else {
      setStockForm({
        symbol: '',
        company_name: '',
        shares: '',
        purchase_price: '',
        purchase_date: '',
        current_price: '',
        notes: ''
      })
      setEditingStock(null)
    }
    setStockDialogOpen(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const calculateGainLossPercentage = (stock) => {
    if (!stock.purchase_price || !stock.current_price) return 0
    return ((stock.current_price - stock.purchase_price) / stock.purchase_price * 100).toFixed(2)
  }

  const handleMenuOpen = (event, stock) => {
    setMenuAnchorEl(event.currentTarget)
    setMenuStock(stock)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setMenuStock(null)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{
      background: (theme) => `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.mode === 'light' ? '#f8fafc' : '#0b1220'} 100%)`,
      p: { xs: 1, md: 2 },
      borderRadius: 2
    }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Tooltip title="Back to portfolios">
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box flexGrow={1}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{portfolioData.name}</Typography>
          <Typography variant="body1" color="textSecondary">
            {portfolioData.description || 'No description'}
          </Typography>
        </Box>
        <Tooltip title="Add a stock to this portfolio">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openStockDialog()}
            sx={{ borderRadius: 2, px: 2, boxShadow: 2 }}
          >
            Add Stock
          </Button>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Portfolio Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                    ${(portfolioData.total_value || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 1, borderRadius: 2 }}>
                  <AccountBalanceIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Gain/Loss
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {(portfolioData.total_gain_loss || 0) >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="h5" 
                      component="div"
                      color={(portfolioData.total_gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 700 }}
                    >
                      {(portfolioData.total_gain_loss || 0) >= 0 ? '+' : ''}${(portfolioData.total_gain_loss || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ bgcolor: (portfolioData.total_gain_loss || 0) >= 0 ? 'success.main' : 'error.main', color: '#fff', p: 1, borderRadius: 2 }}>
                  {(portfolioData.total_gain_loss || 0) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Number of Stocks
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                    {portfolioData.stocks?.length || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', p: 1, borderRadius: 2 }}>
                  <Inventory2Icon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Return
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                    color={portfolioData.total_gain_loss >= 0 ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 700 }}
                  >
                    {portfolioData.total_value > 0 
                      ? ((portfolioData.total_gain_loss / (portfolioData.total_value - portfolioData.total_gain_loss)) * 100).toFixed(2)
                      : 0}%
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', p: 1, borderRadius: 2 }}>
                  <EqualizerIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Cards */}
      <Typography variant="h5" gutterBottom>
        Stocks
      </Typography>
      
      {portfolioData.stocks && portfolioData.stocks.length > 0 ? (
        <Grid container spacing={3}>
          {portfolioData.stocks.map((stock) => (
            <Grid item xs={12} md={6} lg={4} key={stock.id}>
              <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" component="div">
                        {stock.symbol}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stock.company_name}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title="More actions">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, stock)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Shares
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {stock.shares}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Total Value
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        ${(stock.total_value || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Purchase Price
                      </Typography>
                      <Typography variant="body1">
                        ${stock.purchase_price}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Current Price
                      </Typography>
                      <Typography variant="body1">
                        ${stock.current_price || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box mt={2} mb={2}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Gain/Loss
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {(stock.gain_loss || 0) >= 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography 
                        variant="h6" 
                        color={(stock.gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 700 }}
                      >
                        {(stock.gain_loss || 0) >= 0 ? '+' : ''}${(stock.gain_loss || 0).toLocaleString()}
                      </Typography>
                      <Chip 
                        label={`${calculateGainLossPercentage(stock)}%`}
                        size="small"
                        color={(stock.gain_loss || 0) >= 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Purchased: {formatDate(stock.purchase_date)}
                    </Typography>
                  </Box>

                  {stock.notes && (
                    <Box mt={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontStyle: 'italic',
                        backgroundColor: 'grey.50',
                        padding: 1,
                        borderRadius: 1
                      }}>
                        {stock.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No stocks in this portfolio
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Add your first stock to get started tracking your investments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openStockDialog()}
          >
            Add Stock
          </Button>
        </Box>
      )}

      {/* Stock Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStock ? 'Edit Stock' : 'Add Stock'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Symbol"
                fullWidth
                variant="outlined"
                value={stockForm.symbol}
                onChange={(e) => setStockForm({ ...stockForm, symbol: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Shares"
                fullWidth
                variant="outlined"
                type="number"
                value={stockForm.shares}
                onChange={(e) => setStockForm({ ...stockForm, shares: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Company Name"
                fullWidth
                variant="outlined"
                value={stockForm.company_name}
                onChange={(e) => setStockForm({ ...stockForm, company_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Purchase Price"
                fullWidth
                variant="outlined"
                type="number"
                step="0.01"
                value={stockForm.purchase_price}
                onChange={(e) => setStockForm({ ...stockForm, purchase_price: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Current Price"
                fullWidth
                variant="outlined"
                type="number"
                step="0.01"
                value={stockForm.current_price}
                onChange={(e) => setStockForm({ ...stockForm, current_price: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Purchase Date"
                fullWidth
                variant="outlined"
                type="date"
                value={stockForm.purchase_date}
                onChange={(e) => setStockForm({ ...stockForm, purchase_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Notes"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={stockForm.notes}
                onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                placeholder="Optional notes about this stock..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStockSubmit} variant="contained">
            {editingStock ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { if (menuStock) openStockDialog(menuStock); handleMenuClose() }}>Edit</MenuItem>
        <MenuItem onClick={() => { const id = menuStock?.id; handleMenuClose(); if (id) handleDeleteStock(id) }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </Box>
  )
}

export default PortfolioDetails