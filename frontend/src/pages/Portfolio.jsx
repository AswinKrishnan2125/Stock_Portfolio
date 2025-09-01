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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Fab,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddStockIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuth()
  
  // Portfolio dialog states
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
  const [portfolioForm, setPortfolioForm] = useState({ name: '', description: '' })
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  
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

  useEffect(() => {
    fetchPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const response = await fetch(`${baseURL}/portfolios/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios')
      }
      
      const data = await response.json()
      setPortfolios(data.results || data)
    } catch (error) {
      console.error('Error fetching portfolios:', error)
      setError('Failed to load portfolios')
    } finally {
      setLoading(false)
    }
  }

  const handlePortfolioSubmit = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      
      if (editingPortfolio) {
        const response = await fetch(`${baseURL}/portfolios/${editingPortfolio.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(portfolioForm)
        })
        
        if (!response.ok) {
          throw new Error('Failed to update portfolio')
        }
      } else {
        const response = await fetch(`${baseURL}/portfolios/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(portfolioForm)
        })
        
        if (!response.ok) {
          throw new Error('Failed to create portfolio')
        }
      }
      setPortfolioDialogOpen(false)
      setPortfolioForm({ name: '', description: '' })
      setEditingPortfolio(null)
      fetchPortfolios()
    } catch (error) {
      console.error('Error saving portfolio:', error)
      setError('Failed to save portfolio')
    }
  }

  const handleStockSubmit = async () => {
    try {
      const stockData = {
        ...stockForm,
        portfolio_id: selectedPortfolio.id
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
      fetchPortfolios()
    } catch (error) {
      console.error('Error saving stock:', error)
      setError('Failed to save stock')
    }
  }

  const handleDeletePortfolio = async (portfolioId) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
        const response = await fetch(`${baseURL}/portfolios/${portfolioId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete portfolio')
        }
        
        fetchPortfolios()
      } catch (error) {
        console.error('Error deleting portfolio:', error)
        setError('Failed to delete portfolio')
      }
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
        
        fetchPortfolios()
      } catch (error) {
        console.error('Error deleting stock:', error)
        setError('Failed to delete stock')
      }
    }
  }

  const openPortfolioDialog = (portfolio = null) => {
    if (portfolio) {
      setPortfolioForm({ name: portfolio.name, description: portfolio.description })
      setEditingPortfolio(portfolio)
    } else {
      setPortfolioForm({ name: '', description: '' })
      setEditingPortfolio(null)
    }
    setPortfolioDialogOpen(true)
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Portfolio Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openPortfolioDialog()}
        >
          New Portfolio
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {portfolios.map((portfolio) => (
          <Grid item xs={12} md={6} key={portfolio.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{portfolio.name}</Typography>
                  <Box>
                    <IconButton onClick={() => openPortfolioDialog(portfolio)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePortfolio(portfolio.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography color="textSecondary" variant="body2" mb={2}>
                  {portfolio.description || 'No description'}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">
                    Total Value: ${(portfolio.total_value || 0).toLocaleString()}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={(portfolio.total_gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolio.total_gain_loss >= 0 ? '+' : ''}${(portfolio.total_gain_loss || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddStockIcon />}
                  onClick={() => {
                    setSelectedPortfolio(portfolio)
                    openStockDialog()
                  }}
                  fullWidth
                >
                  Add Stock
                </Button>

                {portfolio.stocks && portfolio.stocks.length > 0 && (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Shares</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Gain/Loss</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portfolio.stocks.map((stock) => (
                          <TableRow key={stock.id}>
                            <TableCell>{stock.symbol}</TableCell>
                            <TableCell>{stock.shares}</TableCell>
                            <TableCell>${(stock.total_value || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                color={(stock.gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {stock.gain_loss >= 0 ? '+' : ''}${(stock.gain_loss || 0).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => openStockDialog(stock)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteStock(stock.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Portfolio Dialog */}
      <Dialog open={portfolioDialogOpen} onClose={() => setPortfolioDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPortfolio ? 'Edit Portfolio' : 'New Portfolio'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            fullWidth
            variant="outlined"
            value={portfolioForm.name}
            onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={portfolioForm.description}
            onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePortfolioSubmit} variant="contained">
            {editingPortfolio ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
                onChange={(e) => setStockForm({ ...stockForm, symbol: e.target.value })}
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
    </Box>
  )
}

export default Portfolio
