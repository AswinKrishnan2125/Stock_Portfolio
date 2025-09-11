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
import { useStockLive } from '../contexts/StockLiveProvider'

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
  const { stockData } = useStockLive()

  const priceBySymbol = React.useMemo(() => {
    const map = new Map()
    ;(stockData || []).forEach((s) => {
      if (s?.symbol) map.set(String(s.symbol).toUpperCase(), s.latestPrice)
    })
    return map
  }, [stockData])

  const renderLivePrice = (symbol) => {
    const key = String(symbol || '').toUpperCase()
    const price = priceBySymbol.get(key)
    return typeof price === 'number' ? `$${price.toFixed(2)}` : 'N/A'
  }

  const getCurrentNumericPrice = (symbol, fallback) => {
    const key = String(symbol || '').toUpperCase()
    const live = priceBySymbol.get(key)
    if (typeof live === 'number') return live
    const fb = parseFloat(fallback)
    return Number.isFinite(fb) ? fb : undefined
  }

  const computeGainLoss = (stock) => {
    const shares = parseFloat(stock.shares)
    const purchase = parseFloat(stock.purchase_price)
    const current = getCurrentNumericPrice(stock.symbol, stock.current_price)
    if (!Number.isFinite(shares) || !Number.isFinite(purchase) || !Number.isFinite(current)) return 0
    return (current - purchase) * shares
  }

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
    const live = priceBySymbol.get(String(stock.symbol || '').toUpperCase())
    const current = typeof live === 'number' ? live : stock.current_price
    if (!stock.purchase_price || typeof current !== 'number') return 0
    return (((current - stock.purchase_price) / stock.purchase_price) * 100).toFixed(2)
  }

  // Portfolio-level live totals
  const totals = React.useMemo(() => {
    const list = portfolioData?.stocks || []
    let totalValue = 0
    let totalCost = 0
    list.forEach((s) => {
      const shares = parseFloat(s.shares)
      const purchase = parseFloat(s.purchase_price)
      const key = String(s.symbol || '').toUpperCase()
      const live = priceBySymbol.get(key)
      const current = typeof live === 'number' ? live : parseFloat(s.current_price)
      if (!Number.isFinite(shares) || !Number.isFinite(purchase)) return
      const safeCurrent = Number.isFinite(current) ? current : purchase
      totalValue += shares * safeCurrent
      totalCost += shares * purchase
    })
    const totalGainLoss = totalValue - totalCost
    const avgReturnPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
    return { totalValue, totalGainLoss, avgReturnPct }
  }, [portfolioData?.stocks, priceBySymbol])

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
    <Box sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Tooltip title="Back to portfolios">
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box flexGrow={1}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{portfolioData.name}</Typography>
          <Typography variant="body1" color="text.secondary">
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
          <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                    ${Number(totals.totalValue || 0).toLocaleString()}
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
          <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Gain/Loss
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {(Number(totals.totalGainLoss || 0)) >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="h5" 
                      component="div"
                      color={Number(totals.totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 700 }}
                    >
                      {Number(totals.totalGainLoss || 0) >= 0 ? '+' : ''}${Number(totals.totalGainLoss || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ bgcolor: Number(totals.totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main', color: '#fff', p: 1, borderRadius: 2 }}>
                  {Number(totals.totalGainLoss || 0) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
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
          <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Average Return
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                    color={Number(totals.totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 700 }}
                  >
                    {Number.isFinite(totals.avgReturnPct) ? totals.avgReturnPct.toFixed(2) : 0}%
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
                      <Typography variant="body2" color="text.secondary">
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
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        Shares
                      </Typography>
            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '1.05rem' }}>
                        {stock.shares}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        Total Value
                      </Typography>
            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '1.05rem' }}>
                        ${(stock.total_value || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        Purchase Price
                      </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem' }}>
                        ${stock.purchase_price}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        Current Price
                      </Typography>
            <Typography variant="body1" color={typeof priceBySymbol.get(String(stock.symbol || '').toUpperCase()) === 'number' ? 'text.primary' : 'text.secondary'} sx={{ fontSize: '1.05rem' }}>
                        {renderLivePrice(stock.symbol)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box mt={2} mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                      Gain/Loss
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {computeGainLoss(stock) >= 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography 
                        variant="h6" 
                        color={computeGainLoss(stock) >= 0 ? 'success.main' : 'error.main'}
                        sx={{ fontWeight: 700 }}
                      >
                        {computeGainLoss(stock) >= 0 ? '+' : ''}${Math.abs(computeGainLoss(stock)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                      Purchased: {formatDate(stock.purchase_date)}
                    </Typography>
                  </Box>

                  {stock.notes && (
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontStyle: 'italic',
                        backgroundColor: 'grey.50',
                        padding: 1,
                        borderRadius: 1,
                        fontSize: '0.95rem'
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
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stocks in this portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
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