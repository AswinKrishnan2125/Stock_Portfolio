// import React, { useState, useEffect } from 'react'
// import {
//   Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
//   DialogContent, DialogActions, TextField, Select, FormControl,
//   InputLabel, List, ListItem, ListItemText, ListItemSecondaryAction,
//   IconButton, Chip, Alert, CircularProgress, Switch, FormControlLabel, Divider,
//   Menu, MenuItem
// } from '@mui/material'
// import {
//   Add as AddIcon,
//   Delete as DeleteIcon,
//   Notifications as NotificationsIcon,
//   TrendingUp,
//   TrendingDown,
//   MoreVert as MoreVertIcon
// } from '@mui/icons-material'
// import axios from 'axios'
// import { useStockLive } from "../contexts/StockLiveProvider";

// const Alerts = () => {
//   const [alerts, setAlerts] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const [alertForm, setAlertForm] = useState({
//     symbol: '',
//     type: 'price_above',
//     target_price: '',
//     enabled: true
//   })
//   const [menuAnchorEl, setMenuAnchorEl] = useState(null)
//   const [menuAlert, setMenuAlert] = useState(null)
//   const { stockData } = useStockLive();

//   // Load alerts on mount
//   useEffect(() => {
//     fetchAlerts()
//   }, [])

//   useEffect(() => {
//   const interval = setInterval(async () => {
//     try {
//       await axios.post("/alerts/check/");
//       fetchAlerts(); // refresh UI with triggered status
//     } catch (err) {
//       console.error("Auto check failed", err);
//     }
//   }, 15000); // check every 15s
//   return () => clearInterval(interval);
// }, []);


//   const fetchAlerts = async () => {
//     try {
//       const response = await axios.get('/alerts/')
//       setAlerts(response.data) // assuming backend returns a list of alerts
//     } catch (error) {
//       console.error('Error fetching alerts:', error)
//       setError('Failed to load alerts')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleCreateAlert = async () => {
//     try {
//       const response = await axios.post('/alerts/', alertForm)
//       setAlerts([...alerts, response.data]) // add new alert from backend
//       setDialogOpen(false)
//       setAlertForm({
//         symbol: '',
//         type: 'price_above',
//         target_price: '',
//         enabled: true
//       })
//     } catch (error) {
//       console.error('Error creating alert:', error)
//       setError('Failed to create alert')
//     }
//   }

//   const handleDeleteAlert = async (alertId) => {
//     if (window.confirm('Are you sure you want to delete this alert?')) {
//       try {
//         await axios.delete(`/alerts/${alertId}/`)
//         setAlerts(alerts.filter(alert => alert.id !== alertId))
//       } catch (error) {
//         console.error('Error deleting alert:', error)
//         setError('Failed to delete alert')
//       }
//     }
//   }

//   const handleToggleAlert = async (alertId, enabled) => {
//     try {
//       const updated = alerts.find(a => a.id === alertId)
//       const response = await axios.put(`/alerts/${alertId}/`, {
//         ...updated,
//         enabled: !enabled
//       })
//       setAlerts(alerts.map(alert => 
//         alert.id === alertId ? response.data : alert
//       ))
//     } catch (error) {
//       console.error('Error toggling alert:', error)
//       setError('Failed to update alert')
//     }
//   }

//   const getAlertTypeIcon = (type) =>
//     type === 'price_above' ? <TrendingUp color="success" /> : <TrendingDown color="error" />

//   const getAlertTypeText = (type) =>
//     type === 'price_above' ? 'Price Above' : 'Price Below'

//   const getAlertStatusColor = (triggered) =>
//     triggered ? 'error' : 'default'

//   const handleMenuOpen = (event, alert) => {
//     setMenuAnchorEl(event.currentTarget)
//     setMenuAlert(alert)
//   }

//   const handleMenuClose = () => {
//     setMenuAnchorEl(null)
//     setMenuAlert(null)
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
//     <Typography variant="h4" component="div">Price Alerts</Typography>
//         <Button
//           variant="contained"
//           startIcon={<AddIcon />}
//           onClick={() => setDialogOpen(true)}
//         >
//           New Alert
//         </Button>
//       </Box>

//       {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

//       <Grid container spacing={3}>
//         <Grid item xs={12} md={8}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" gutterBottom component="div">
//                 Active Alerts
//               </Typography>
//               {alerts.length === 0 ? (
//                 <Typography color="textSecondary" align="center" sx={{ py: 4 }} component="div">
//                   No alerts configured. Create your first price alert to get started!
//                 </Typography>
//               ) : (
//                 <List>
//                   {alerts.map((alert, index) => {
//                     const live = stockData.find(s => s.symbol === alert.symbol);
//                     return (
//                       <React.Fragment key={alert.id}>
//                       <ListItem>
//                         <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
//                           {getAlertTypeIcon(alert.type)}
//                         </Box>
//                         <ListItemText
//                           primary={
//                             <Box display="flex" alignItems="center" gap={1}>
//                               <Typography variant="h6" component="div">{alert.symbol}</Typography>
//                               <Chip
//                                 label={getAlertTypeText(alert.type)}
//                                 size="small"
//                                 color="primary"
//                                 variant="outlined"
//                               />
//                               <Chip
//                                 label={alert.triggered ? 'Triggered' : 'Active'}
//                                 size="small"
//                                 color={getAlertStatusColor(alert.triggered)}
//                               />
//                             </Box>
//                           }
//                           secondary={
//                             <Box>
//                               <Typography variant="body2" component="div">
//                                 Target: ${alert.target_price} | Current: ${alert.current_price || 'N/A'}
//                               </Typography>
//                               <Typography variant="caption" component="div" color="textSecondary">
//                                 Created: {new Date(alert.created_at).toLocaleDateString()}
//                                 {alert.triggered_at && ` | Triggered: ${new Date(alert.triggered_at).toLocaleDateString()}`}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary" component="div">
//                                 Current Price: {typeof live?.latestPrice === "number" ? live.latestPrice : "N/A"}
//                               </Typography>
//                             </Box>
//                           }
//                         />
//                         <ListItemSecondaryAction>
//                           <FormControlLabel
//                             control={
//                               <Switch
//                                 checked={alert.enabled}
//                                 onChange={() => handleToggleAlert(alert.id, alert.enabled)}
//                                 color="primary"
//                               />
//                             }
//                             label=""
//                           />
//                           <IconButton edge="end" onClick={(e) => handleMenuOpen(e, alert)}>
//                             <MoreVertIcon />
//                           </IconButton>
//                         </ListItemSecondaryAction>
//                       </ListItem>
//                       {index < alerts.length - 1 && <Divider />}
//                     </React.Fragment>
//                     )
//                   })}
//                 </List>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>

//         <Grid item xs={12} md={4}>
//           <Card>
//             <CardContent>
//               <Typography variant="h6" gutterBottom component="div">
//                 Alert Statistics
//               </Typography>
//               <Box display="flex" flexDirection="column" gap={2}>
//                 <Box display="flex" justifyContent="space-between">
//                   <Typography component="div">Total Alerts:</Typography>
//                   <Typography variant="h6" component="div">{alerts.length}</Typography>
//                 </Box>
//                 <Box display="flex" justifyContent="space-between">
//                   <Typography component="div">Active Alerts:</Typography>
//                   <Typography variant="h6" color="primary" component="div">
//                     {alerts.filter(alert => alert.enabled).length}
//                   </Typography>
//                 </Box>
//                 <Box display="flex" justifyContent="space-between">
//                   <Typography component="div">Triggered:</Typography>
//                   <Typography variant="h6" color="error" component="div">
//                     {alerts.filter(alert => alert.triggered).length}
//                   </Typography>
//                 </Box>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Create Alert Dialog */}
//       <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>Create Price Alert</DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2} sx={{ mt: 1 }}>
//             <Grid item xs={12}>
//               <TextField
//                 label="Stock Symbol"
//                 fullWidth
//                 variant="outlined"
//                 value={alertForm.symbol}
//                 onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value.toUpperCase() })}
//                 placeholder="e.g., AAPL"
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <FormControl fullWidth>
//                 <InputLabel>Alert Type</InputLabel>
//                 <Select
//                   value={alertForm.type}
//                   label="Alert Type"
//                   onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
//                 >
//                   <MenuItem value="price_above">Price Above</MenuItem>
//                   <MenuItem value="price_below">Price Below</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 label="Target Price"
//                 fullWidth
//                 variant="outlined"
//                 type="number"
//                 value={alertForm.target_price}
//                 onChange={(e) => setAlertForm({ ...alertForm, target_price: e.target.value })}
//                 placeholder="e.g., 150.00"
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <FormControlLabel
//                 control={
//                   <Switch
//                     checked={alertForm.enabled}
//                     onChange={(e) => setAlertForm({ ...alertForm, enabled: e.target.checked })}
//                     color="primary"
//                   />
//                 }
//                 label="Enable Alert"
//               />
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
//           <Button
//             onClick={handleCreateAlert}
//             variant="contained"
//             disabled={!alertForm.symbol || !alertForm.target_price}
//           >
//             Create Alert
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Menu
//         anchorEl={menuAnchorEl}
//         open={Boolean(menuAnchorEl)}
//         onClose={handleMenuClose}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//         transformOrigin={{ vertical: 'top', horizontal: 'right' }}
//       >
//         <MenuItem onClick={() => { const id = menuAlert?.id; handleMenuClose(); if (id) handleDeleteAlert(id) }} sx={{ color: 'error.main' }}>Delete</MenuItem>
//       </Menu>
//     </Box>
//   )
// }

// export default Alerts







import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, FormControl,
  InputLabel, Chip, Alert, CircularProgress, Switch, FormControlLabel,
  Menu, MenuItem, IconButton, Paper, Grow, Fade
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  TrendingUp,
  TrendingDown,
  MoreVert as MoreVertIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material'
import { keyframes, styled } from '@mui/material/styles'
import axios from 'axios'
import { useStockLive } from "../contexts/StockLiveProvider";

// Keyframe animations for triggered alerts
const bounceAnimation = keyframes`
  0% { transform: translateY(0); }
  25% { transform: translateY(-10px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`

// Styled components
const AlertCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'triggered'
})(({ theme, triggered }) => ({
  position: 'relative',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  background: triggered 
    ? 'linear-gradient(135deg, #ffebee 0%, #fff 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
  border: triggered ? '2px solid #f44336' : '1px solid #e0e0e0',
  animation: triggered ? `${bounceAnimation} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
  },
  ...(triggered && {
    animation: `${pulseAnimation} 2s infinite, ${bounceAnimation} 1s ease-in-out`,
  }),
}))

const StockSymbolChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '0.9rem',
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  color: 'white',
}))

const PriceBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'triggered'
})(({ theme, triggered }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  background: triggered 
    ? 'rgba(244, 67, 54, 0.1)' 
    : 'rgba(76, 175, 79, 0.1)',
  border: triggered 
    ? '1px solid rgba(244, 67, 54, 0.3)' 
    : '1px solid rgba(76, 175, 79, 0.3)',
}))

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [alertForm, setAlertForm] = useState({
    symbol: '',
    type: 'price_above',
    target_price: '',
    enabled: true
  })
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [menuAlert, setMenuAlert] = useState(null)
  const [triggerAnimation, setTriggerAnimation] = useState({})
  const { stockData } = useStockLive();
  const triggeredSentRef = useRef(new Set()); // avoid duplicate trigger posts per alert id

  // Load alerts on mount
  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await axios.post("/alerts/check/");
        fetchAlerts(); // refresh UI with triggered status
      } catch (err) {
        console.error("Auto check failed", err);
      }
    }, 15000); // check every 15s
    return () => clearInterval(interval);
  }, []);

  // Immediate trigger: detect crossing using live prices and notify backend right away
  useEffect(() => {
    if (!alerts?.length || !stockData?.length) return;

    const now = new Date();
    const bySymbol = new Map(stockData.map(s => [String(s.symbol).toUpperCase(), s]));

    alerts.forEach((a) => {
      if (!a.enabled || a.triggered) return;
      const sym = String(a.symbol).toUpperCase();
      const live = bySymbol.get(sym)?.latestPrice;
      if (typeof live !== 'number') return;

      const target = parseFloat(a.target_price);
      if (isNaN(target)) return;

      const crossed = (a.type === 'price_above' && live >= target) ||
                      (a.type === 'price_below' && live <= target);

      if (crossed && !triggeredSentRef.current.has(a.id)) {
        triggeredSentRef.current.add(a.id);
        axios.post(`/alerts/${a.id}/trigger/`)
          .then((res) => {
            // Update local state for instant UI feedback
            setAlerts(prev => prev.map(x => x.id === a.id ? res.data : x));
          })
          .catch((err) => {
            console.error('Immediate trigger failed', err);
            // Allow retry on next tick
            triggeredSentRef.current.delete(a.id);
          });
      }
    });
  }, [alerts, stockData]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/alerts/')
      const newAlerts = response.data
      
      // Check for newly triggered alerts to animate
      if (alerts.length > 0) {
        newAlerts.forEach(newAlert => {
          const oldAlert = alerts.find(a => a.id === newAlert.id)
          if (oldAlert && !oldAlert.triggered && newAlert.triggered) {
            setTriggerAnimation(prev => ({
              ...prev,
              [newAlert.id]: true
            }))
            // Remove animation after 3 seconds
            setTimeout(() => {
              setTriggerAnimation(prev => ({
                ...prev,
                [newAlert.id]: false
              }))
            }, 3000)
          }
        })
      }
      
      setAlerts(newAlerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    try {
      const response = await axios.post('/alerts/', alertForm)
      setAlerts([...alerts, response.data])
      setDialogOpen(false)
      setAlertForm({
        symbol: '',
        type: 'price_above',
        target_price: '',
        enabled: true
      })
    } catch (error) {
      console.error('Error creating alert:', error)
      setError('Failed to create alert')
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await axios.delete(`/alerts/${alertId}/`)
        setAlerts(alerts.filter(alert => alert.id !== alertId))
      } catch (error) {
        console.error('Error deleting alert:', error)
        setError('Failed to delete alert')
      }
    }
  }

  const handleToggleAlert = async (alertId, enabled) => {
    try {
      const updated = alerts.find(a => a.id === alertId)
      const response = await axios.put(`/alerts/${alertId}/`, {
        ...updated,
        enabled: !enabled
      })
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? response.data : alert
      ))
    } catch (error) {
      console.error('Error toggling alert:', error)
      setError('Failed to update alert')
    }
  }

  const getAlertTypeIcon = (type, triggered) => {
    const IconComponent = type === 'price_above' ? TrendingUp : TrendingDown
    return (
      <IconComponent 
        sx={{ 
          color: triggered ? '#f44336' : (type === 'price_above' ? '#4caf50' : '#f44336'),
          fontSize: '2rem'
        }} 
      />
    )
  }

  const getAlertTypeText = (type) =>
    type === 'price_above' ? 'Price Above' : 'Price Below'

  const handleMenuOpen = (event, alert) => {
    setMenuAnchorEl(event.currentTarget)
    setMenuAlert(alert)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setMenuAlert(null)
  }

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`
    }
    return '$0.00'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="div" fontWeight="bold">
            Price Alerts
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
            }
          }}
        >
          New Alert
        </Button>
      </Box>

      {error && (
        <Fade in={Boolean(error)}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      <Grid container spacing={3}>
        {/* Alert Cards */}
        <Grid item xs={12} lg={9}>
          {alerts.length === 0 ? (
            <Card sx={{ textAlign: 'center', p: 4, background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)' }}>
              <ShowChartIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                No alerts configured
              </Typography>
              <Typography color="textSecondary" sx={{ mb: 3 }}>
                Create your first price alert to monitor your favorite stocks!
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setDialogOpen(true)}
              >
                Create Alert
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {alerts.map((alert) => {
                const live = stockData.find(s => s.symbol === alert.symbol);
                const currentPrice = live?.latestPrice;
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={alert.id}>
                    <Grow in={true} timeout={500}>
                      <AlertCard triggered={alert.triggered}>
                        <CardContent sx={{ position: 'relative', pb: 2 }}>
                          {/* Header */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getAlertTypeIcon(alert.type, alert.triggered)}
                              <StockSymbolChip 
                                label={alert.symbol} 
                                size="medium"
                              />
                            </Box>
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleMenuOpen(e, alert)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>

                          {/* Alert Type and Status */}
                          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                            <Chip
                              label={getAlertTypeText(alert.type)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={alert.triggered ? 'TRIGGERED' : 'ACTIVE'}
                              size="small"
                              color={alert.triggered ? 'error' : 'success'}
                              variant={alert.triggered ? 'filled' : 'outlined'}
                            />
                          </Box>

                          {/* Price Information */}
                          <PriceBox triggered={alert.triggered}>
                            <Box flex={1}>
                              <Typography variant="body2" color="text.secondary">
                                Target Price
                              </Typography>
                              <Typography variant="h6" fontWeight="bold">
                                {formatPrice(parseFloat(alert.target_price))}
                              </Typography>
                            </Box>
                            <Box flex={1} textAlign="right">
                              <Typography variant="body2" color="text.secondary">
                                Live Price
                              </Typography>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                color={currentPrice ? 'text.primary' : 'text.secondary'}
                              >
                                {currentPrice ? formatPrice(currentPrice) : 'N/A'}
                              </Typography>
                            </Box>
                          </PriceBox>

                          {/* Timestamps */}
                          <Box mt={2}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Created: {new Date(alert.created_at).toLocaleDateString()}
                            </Typography>
                            {alert.triggered_at && (
                              <Typography variant="caption" color="error.main" display="block">
                                Triggered: {new Date(alert.triggered_at).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>

                          {/* Toggle Switch */}
                          <Box display="flex" justifyContent="flex-end" mt={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={alert.enabled}
                                  onChange={() => handleToggleAlert(alert.id, alert.enabled)}
                                  color="primary"
                                />
                              }
                              label={alert.enabled ? 'Enabled' : 'Disabled'}
                            />
                          </Box>

                          {/* Triggered Overlay Effect */}
                          {alert.triggered && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, #f44336, #ff9800, #f44336)',
                                animation: `${pulseAnimation} 2s infinite`,
                              }}
                            />
                          )}
                        </CardContent>
                      </AlertCard>
                    </Grow>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Grid>

        {/* Statistics Panel */}
        <Grid item xs={12} lg={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 2
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Alert Statistics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Total Alerts</Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {alerts.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Active</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                    {alerts.filter(alert => alert.enabled).length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>Triggered</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f44336' }}>
                    {alerts.filter(alert => alert.triggered).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box>
                {alerts
                  .filter(alert => alert.triggered)
                  .slice(0, 3)
                  .map(alert => (
                    <Box key={alert.id} display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip 
                        label={alert.symbol} 
                        size="small" 
                        color="error" 
                        variant="outlined" 
                      />
                      <Typography variant="body2" color="text.secondary">
                        triggered
                      </Typography>
                    </Box>
                  ))}
                {alerts.filter(alert => alert.triggered).length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    No recent activity
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Alert Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          Create New Price Alert
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Stock Symbol"
                fullWidth
                variant="outlined"
                value={alertForm.symbol}
                onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL, GOOGL, TSLA"
                helperText="Enter the stock symbol you want to monitor"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Alert Type</InputLabel>
                <Select
                  value={alertForm.type}
                  label="Alert Type"
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                >
                  <MenuItem value="price_above">
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp color="success" />
                      Price Above (Bullish)
                    </Box>
                  </MenuItem>
                  <MenuItem value="price_below">
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingDown color="error" />
                      Price Below (Bearish)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Target Price"
                fullWidth
                variant="outlined"
                type="number"
                value={alertForm.target_price}
                onChange={(e) => setAlertForm({ ...alertForm, target_price: e.target.value })}
                placeholder="0.00"
                helperText="Enter the price threshold for the alert"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertForm.enabled}
                    onChange={(e) => setAlertForm({ ...alertForm, enabled: e.target.checked })}
                    color="primary"
                  />
                }
                label="Enable alert immediately"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateAlert}
            variant="contained"
            disabled={!alertForm.symbol || !alertForm.target_price}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            Create Alert
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
        <MenuItem 
          onClick={() => { 
            const id = menuAlert?.id; 
            handleMenuClose(); 
            if (id) handleDeleteAlert(id) 
          }} 
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Alert
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Alerts