// import React, { useState, useEffect } from 'react'
// import {
//   Box,
//   Typography,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Card,
//   CardContent,
//   Grid,
//   Alert,
//   CircularProgress,
//   Fab,
//   Tooltip
// } from '@mui/material'
// import {
//   Add as AddIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Add as AddStockIcon
// } from '@mui/icons-material'
// import { useAuth } from '../contexts/AuthContext'

// const Portfolio = () => {
//   const [portfolios, setPortfolios] = useState([])
//   const [selectedPortfolio, setSelectedPortfolio] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const { token } = useAuth()
  
//   // Portfolio dialog states
//   const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
//   const [portfolioForm, setPortfolioForm] = useState({ name: '', description: '' })
//   const [editingPortfolio, setEditingPortfolio] = useState(null)
  
//   // Stock dialog states
//   const [stockDialogOpen, setStockDialogOpen] = useState(false)
//   const [stockForm, setStockForm] = useState({
//     symbol: '',
//     company_name: '',
//     shares: '',
//     purchase_price: '',
//     purchase_date: '',
//     current_price: '',
//     notes: ''
//   })
//   const [editingStock, setEditingStock] = useState(null)

//   // Portfolio stats
//   const totalValue = portfolios.reduce((sum, portfolio) => sum + (portfolio.total_value || 0), 0)
//   const totalGainLoss = portfolios.reduce((sum, portfolio) => sum + (portfolio.total_gain_loss || 0), 0)
//   const totalStocks = portfolios.reduce((sum, portfolio) => sum + (portfolio.stocks?.length || 0), 0)

//   useEffect(() => {
//     fetchPortfolios()
//   }, [])

//   const fetchPortfolios = async () => {
//     try {
//       const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
//       const response = await fetch(`${baseURL}/portfolios/`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       })
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch portfolios')
//       }
      
//       const data = await response.json()
//       setPortfolios(data.results || data)
//     } catch (error) {
//       console.error('Error fetching portfolios:', error)
//       setError('Failed to load portfolios')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handlePortfolioSubmit = async () => {
//     try {
//       const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      
//       if (editingPortfolio) {
//         const response = await fetch(`${baseURL}/portfolios/${editingPortfolio.id}/`, {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(portfolioForm)
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to update portfolio')
//         }
//       } else {
//         const response = await fetch(`${baseURL}/portfolios/`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(portfolioForm)
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to create portfolio')
//         }
//       }
//       setPortfolioDialogOpen(false)
//       setPortfolioForm({ name: '', description: '' })
//       setEditingPortfolio(null)
//       fetchPortfolios()
//     } catch (error) {
//       console.error('Error saving portfolio:', error)
//       setError('Failed to save portfolio')
//     }
//   }

//   const handleStockSubmit = async () => {
//     try {
//       const stockData = {
//         ...stockForm,
//         portfolio_id: selectedPortfolio.id
//       }
      
//       const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      
//       if (editingStock) {
//         const response = await fetch(`${baseURL}/stocks/${editingStock.id}/`, {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(stockData)
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to update stock')
//         }
//       } else {
//         const response = await fetch(`${baseURL}/stocks/`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(stockData)
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to create stock')
//         }
//       }
//       setStockDialogOpen(false)
//       setStockForm({
//         symbol: '',
//         company_name: '',
//         shares: '',
//         purchase_price: '',
//         purchase_date: '',
//         current_price: '',
//         notes: ''
//       })
//       setEditingStock(null)
//       fetchPortfolios()
//     } catch (error) {
//       console.error('Error saving stock:', error)
//       setError('Failed to save stock')
//     }
//   }

//   const handleDeletePortfolio = async (portfolioId) => {
//     if (window.confirm('Are you sure you want to delete this portfolio?')) {
//       try {
//         const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
//         const response = await fetch(`${baseURL}/portfolios/${portfolioId}/`, {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to delete portfolio')
//         }
        
//         fetchPortfolios()
//       } catch (error) {
//         console.error('Error deleting portfolio:', error)
//         setError('Failed to delete portfolio')
//       }
//     }
//   }

//   const handleDeleteStock = async (stockId) => {
//     if (window.confirm('Are you sure you want to delete this stock?')) {
//       try {
//         const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
//         const response = await fetch(`${baseURL}/stocks/${stockId}/`, {
//           method: 'DELETE',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         })
        
//         if (!response.ok) {
//           throw new Error('Failed to delete stock')
//         }
        
//         fetchPortfolios()
//       } catch (error) {
//         console.error('Error deleting stock:', error)
//         setError('Failed to delete stock')
//       }
//     }
//   }

//   const openPortfolioDialog = (portfolio = null) => {
//     if (portfolio) {
//       setPortfolioForm({ name: portfolio.name, description: portfolio.description })
//       setEditingPortfolio(portfolio)
//     } else {
//       setPortfolioForm({ name: '', description: '' })
//       setEditingPortfolio(null)
//     }
//     setPortfolioDialogOpen(true)
//   }

//   const openStockDialog = (stock = null) => {
//     if (stock) {
//       setStockForm({
//         symbol: stock.symbol,
//         company_name: stock.company_name,
//         shares: stock.shares,
//         purchase_price: stock.purchase_price,
//         purchase_date: stock.purchase_date,
//         current_price: stock.current_price || '',
//         notes: stock.notes || ''
//       })
//       setEditingStock(stock)
//     } else {
//       setStockForm({
//         symbol: '',
//         company_name: '',
//         shares: '',
//         purchase_price: '',
//         purchase_date: '',
//         current_price: '',
//         notes: ''
//       })
//       setEditingStock(null)
//     }
//     setStockDialogOpen(true)
//   }

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
//         <CircularProgress />
//       </Box>
//     )
//   }

//   return (
//     <Box>
//       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
//         <Typography variant="h4">Portfolio Management</Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={() => openPortfolioDialog()}
//         >
//           New Portfolio
//         </Button>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       <Grid container spacing={3}>
//         {portfolios.map((portfolio) => (
//           <Grid item xs={12} md={6} key={portfolio.id}>
//             <Card>
//               <CardContent>
//                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                   <Typography variant="h6">{portfolio.name}</Typography>
//                   <Box>
//                     <IconButton onClick={() => openPortfolioDialog(portfolio)}>
//                       <EditIcon />
//                     </IconButton>
//                     <IconButton onClick={() => handleDeletePortfolio(portfolio.id)}>
//                       <DeleteIcon />
//                     </IconButton>
//                   </Box>
//                 </Box>
                
//                 <Typography color="textSecondary" variant="body2" mb={2}>
//                   {portfolio.description || 'No description'}
//                 </Typography>
                
//                 <Box display="flex" justifyContent="space-between" mb={2}>
//                   <Typography variant="body2">
//                     Total Value: ${(portfolio.total_value || 0).toLocaleString()}
//                   </Typography>
//                   <Typography 
//                     variant="body2" 
//                     color={(portfolio.total_gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
//                   >
//                     {portfolio.total_gain_loss >= 0 ? '+' : ''}${(portfolio.total_gain_loss || 0).toLocaleString()}
//                   </Typography>
//                 </Box>

//                 <Button
//                   variant="outlined"
//                   startIcon={<AddStockIcon />}
//                   onClick={() => {
//                     setSelectedPortfolio(portfolio)
//                     openStockDialog()
//                   }}
//                   fullWidth
//                 >
//                   Add Stock
//                 </Button>

//                 {portfolio.stocks && portfolio.stocks.length > 0 && (
//                   <TableContainer component={Paper} sx={{ mt: 2 }}>
//                     <Table size="small">
//                       <TableHead>
//                         <TableRow>
//                           <TableCell>Symbol</TableCell>
//                           <TableCell>Shares</TableCell>
//                           <TableCell>Value</TableCell>
//                           <TableCell>Gain/Loss</TableCell>
//                           <TableCell>Actions</TableCell>
//                         </TableRow>
//                       </TableHead>
//                       <TableBody>
//                         {portfolio.stocks.map((stock) => (
//                           <TableRow key={stock.id}>
//                             <TableCell>{stock.symbol}</TableCell>
//                             <TableCell>{stock.shares}</TableCell>
//                             <TableCell>${(stock.total_value || 0).toLocaleString()}</TableCell>
//                             <TableCell>
//                               <Typography 
//                                 variant="body2" 
//                                 color={(stock.gain_loss || 0) >= 0 ? 'success.main' : 'error.main'}
//                               >
//                                 {stock.gain_loss >= 0 ? '+' : ''}${(stock.gain_loss || 0).toLocaleString()}
//                               </Typography>
//                             </TableCell>
//                             <TableCell>
//                               <IconButton size="small" onClick={() => openStockDialog(stock)}>
//                                 <EditIcon />
//                               </IconButton>
//                               <IconButton size="small" onClick={() => handleDeleteStock(stock.id)}>
//                                 <DeleteIcon />
//                               </IconButton>
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </TableContainer>
//                 )}
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       {/* Portfolio Dialog */}
//       <Dialog open={portfolioDialogOpen} onClose={() => setPortfolioDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>{editingPortfolio ? 'Edit Portfolio' : 'New Portfolio'}</DialogTitle>
//         <DialogContent>
//           <TextField
//             autoFocus
//             margin="dense"
//             label="Portfolio Name"
//             fullWidth
//             variant="outlined"
//             value={portfolioForm.name}
//             onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
//             sx={{ mb: 2 }}
//           />
//           <TextField
//             margin="dense"
//             label="Description"
//             fullWidth
//             variant="outlined"
//             multiline
//             rows={3}
//             value={portfolioForm.description}
//             onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
//           <Button onClick={handlePortfolioSubmit} variant="contained">
//             {editingPortfolio ? 'Update' : 'Create'}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Stock Dialog */}
//       <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>{editingStock ? 'Edit Stock' : 'Add Stock'}</DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2}>
//             <Grid item xs={6}>
//               <TextField
//                 margin="dense"
//                 label="Symbol"
//                 fullWidth
//                 variant="outlined"
//                 value={stockForm.symbol}
//                 onChange={(e) => setStockForm({ ...stockForm, symbol: e.target.value })}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 margin="dense"
//                 label="Shares"
//                 fullWidth
//                 variant="outlined"
//                 type="number"
//                 value={stockForm.shares}
//                 onChange={(e) => setStockForm({ ...stockForm, shares: e.target.value })}
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 margin="dense"
//                 label="Company Name"
//                 fullWidth
//                 variant="outlined"
//                 value={stockForm.company_name}
//                 onChange={(e) => setStockForm({ ...stockForm, company_name: e.target.value })}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 margin="dense"
//                 label="Purchase Price"
//                 fullWidth
//                 variant="outlined"
//                 type="number"
//                 value={stockForm.purchase_price}
//                 onChange={(e) => setStockForm({ ...stockForm, purchase_price: e.target.value })}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 margin="dense"
//                 label="Current Price"
//                 fullWidth
//                 variant="outlined"
//                 type="number"
//                 value={stockForm.current_price}
//                 onChange={(e) => setStockForm({ ...stockForm, current_price: e.target.value })}
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 margin="dense"
//                 label="Purchase Date"
//                 fullWidth
//                 variant="outlined"
//                 type="date"
//                 value={stockForm.purchase_date}
//                 onChange={(e) => setStockForm({ ...stockForm, purchase_date: e.target.value })}
//                 InputLabelProps={{ shrink: true }}
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 margin="dense"
//                 label="Notes"
//                 fullWidth
//                 variant="outlined"
//                 multiline
//                 rows={3}
//                 value={stockForm.notes}
//                 onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
//               />
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setStockDialogOpen(false)}>Cancel</Button>
//           <Button onClick={handleStockSubmit} variant="contained">
//             {editingStock ? 'Update' : 'Add'}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   )
// }

// export default Portfolio


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
  CardActionArea,
  Chip,
  Tooltip,
  Divider,
  Menu,
  MenuItem
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory2 as Inventory2Icon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import PortfolioDetails from './PortfolioDetails'
import { useStockLive } from '../contexts/StockLiveProvider'

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([])
  const [selectedPortfolio, setSelectedPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('list') // 'list' or 'details'
  const { token } = useAuth()

  // Portfolio dialog states
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
  const [portfolioForm, setPortfolioForm] = useState({ name: '', description: '' })
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [menuPortfolio, setMenuPortfolio] = useState(null)
  const { stockData } = useStockLive()

  // Build a quick lookup for live prices
  const priceBySymbol = React.useMemo(() => {
    const map = new Map()
    ;(stockData || []).forEach((s) => {
      if (s?.symbol) map.set(String(s.symbol).toUpperCase(), s.latestPrice)
    })
    return map
  }, [stockData])

  const getCurrentNumericPrice = (symbol, fallback) => {
    const key = String(symbol || '').toUpperCase()
    const live = priceBySymbol.get(key)
    if (typeof live === 'number') return live
    const fb = parseFloat(fallback)
    return Number.isFinite(fb) ? fb : undefined
  }

  const computePortfolioTotals = (p) => {
    if (!p?.stocks?.length) return { totalValue: 0, totalGainLoss: 0 }
    return p.stocks.reduce(
      (acc, s) => {
        const shares = parseFloat(s.shares)
        const purchase = parseFloat(s.purchase_price)
        const current = getCurrentNumericPrice(s.symbol, s.current_price) ?? purchase
        if (!Number.isFinite(shares) || !Number.isFinite(purchase) || !Number.isFinite(current)) {
          return acc
        }
        acc.totalValue += shares * current
        acc.totalGainLoss += (current - purchase) * shares
        return acc
      },
      { totalValue: 0, totalGainLoss: 0 }
    )
  }

  // Live portfolio stats (sum computed live totals across portfolios)
  const totalValue = portfolios.reduce((sum, p) => sum + computePortfolioTotals(p).totalValue, 0)
  const totalGainLoss = portfolios.reduce((sum, p) => sum + computePortfolioTotals(p).totalGainLoss, 0)
  const totalStocks = portfolios.reduce((sum, portfolio) => sum + (portfolio.stocks?.length || 0), 0)

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

  const handleDeletePortfolio = async (event, portfolioId) => {
    event.stopPropagation() // Prevent card click when deleting
    
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

  const openPortfolioDialog = (event, portfolio = null) => {
    if (event) {
      event.stopPropagation() // Prevent card click when editing
    }
    
    if (portfolio) {
      setPortfolioForm({ name: portfolio.name, description: portfolio.description })
      setEditingPortfolio(portfolio)
    } else {
      setPortfolioForm({ name: '', description: '' })
      setEditingPortfolio(null)
    }
    setPortfolioDialogOpen(true)
  }

  const handlePortfolioClick = (portfolio) => {
    setSelectedPortfolio(portfolio)
    setView('details')
  }

  const handleBackToList = () => {
    setView('list')
    setSelectedPortfolio(null)
    fetchPortfolios() // Refresh data when returning to list
  }

  const handleMenuOpen = (event, portfolio) => {
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
    setMenuPortfolio(portfolio)
  }

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation()
    setMenuAnchorEl(null)
    setMenuPortfolio(null)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  // Show portfolio details view if a portfolio is selected
  if (view === 'details' && selectedPortfolio) {
    return (
      <PortfolioDetails 
        portfolio={selectedPortfolio} 
        onBack={handleBackToList}
        token={token}
      />
    )
  }

  // Show portfolio list view
  return (
    <Box sx={{ p: { xs: 1, md: 2 }, borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            Track performance and manage your investment portfolios
          </Typography>
        </Box>
        <Tooltip title="Create a new portfolio">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openPortfolioDialog()}
            size="large"
            sx={{ borderRadius: 2, px: 3, boxShadow: 2 }}
          >
            New Portfolio
          </Button>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
  <Grid item xs={12} md={4}>
    <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
      <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                    Total Portfolio Value
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    ${Number(totalValue).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 1, borderRadius: 2 }}>
                  <AccountBalanceIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
    <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
      <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                    Total Gain/Loss
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {(totalGainLoss || 0) >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="h4" 
                      component="div"
                      color={Number(totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 700 }}
                    >
                      {Number(totalGainLoss || 0) >= 0 ? '+' : ''}${Number(totalGainLoss || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ bgcolor: (totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main', color: '#fff', p: 1, borderRadius: 2 }}>
                  {(totalGainLoss || 0) >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
    <Card sx={{ borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
      <Typography color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                    Total Stocks
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                    {Number(totalStocks)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', p: 1, borderRadius: 2 }}>
                  <Inventory2Icon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Portfolio Cards */}
      <Grid container spacing={3}>
        {portfolios.map((portfolio) => (
          <Grid item xs={12} md={6} lg={4} key={portfolio.id}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3, border: '1px solid', borderColor: 'divider', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
              <CardActionArea onClick={() => handlePortfolioClick(portfolio)}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                      {portfolio.name}
                    </Typography>
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, portfolio)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography color="text.secondary" variant="body1" mb={2} sx={{ minHeight: '40px' }}>
                    {portfolio.description || 'No description'}
                  </Typography>
                  
                  {(() => { const liveTotals = computePortfolioTotals(portfolio); return (
                  <>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                      Portfolio Value
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            ${Number(liveTotals.totalValue || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.95rem' }}>
                      Gain/Loss
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div"
            color={Number(liveTotals.totalGainLoss || 0) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 700 }}
                    >
            {Number(liveTotals.totalGainLoss || 0) >= 0 ? '+' : ''}${Number(liveTotals.totalGainLoss || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  </>
                  )})()}

                  <Divider sx={{ my: 1 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={`${portfolio.stocks?.length || 0} stocks`} size="small" color="default" variant="outlined" />
                    <Typography variant="body1" color="primary" sx={{ fontWeight: 700 }}>
                      View details →
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={(e) => { handleMenuClose(e); if (menuPortfolio) openPortfolioDialog(e, menuPortfolio) }}>Edit</MenuItem>
        <MenuItem onClick={(e) => { const id = menuPortfolio?.id; handleMenuClose(e); if (id) handleDeletePortfolio(e, id) }} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>

      {portfolios.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portfolios found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Create your first portfolio to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openPortfolioDialog()}
            sx={{ borderRadius: 2, px: 2, boxShadow: 2 }}
          >
            Create Portfolio
          </Button>
        </Box>
      )}

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
          <Button onClick={handlePortfolioSubmit} variant="contained" sx={{ borderRadius: 2 }}>
            {editingPortfolio ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Portfolio