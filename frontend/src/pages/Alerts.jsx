import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Chip, Alert, CircularProgress, Switch, FormControlLabel, Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material'
import axios from 'axios'

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


  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/alerts/')
      setAlerts(response.data) // assuming backend returns a list of alerts
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
      setAlerts([...alerts, response.data]) // add new alert from backend
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

  const getAlertTypeIcon = (type) =>
    type === 'price_above' ? <TrendingUp color="success" /> : <TrendingDown color="error" />

  const getAlertTypeText = (type) =>
    type === 'price_above' ? 'Price Above' : 'Price Below'

  const getAlertStatusColor = (triggered) =>
    triggered ? 'error' : 'default'

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
        <Typography variant="h4">Price Alerts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Alert
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Alerts
              </Typography>
              {alerts.length === 0 ? (
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  No alerts configured. Create your first price alert to get started!
                </Typography>
              ) : (
                <List>
                  {alerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                      <ListItem>
                        <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
                          {getAlertTypeIcon(alert.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="h6" >{alert.symbol}</Typography>
                              <Chip
                                label={getAlertTypeText(alert.type)}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={alert.triggered ? 'Triggered' : 'Active'}
                                size="small"
                                color={getAlertStatusColor(alert.triggered)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                Target: ${alert.target_price} | Current: ${alert.current_price || 'N/A'}
                              </Typography>
                              <Typography variant="caption" component="div" color="textSecondary">
                                Created: {new Date(alert.created_at).toLocaleDateString()}
                                {alert.triggered_at && ` | Triggered: ${new Date(alert.triggered_at).toLocaleDateString()}`}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={alert.enabled}
                                onChange={() => handleToggleAlert(alert.id, alert.enabled)}
                                color="primary"
                              />
                            }
                            label=""
                          />
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteAlert(alert.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < alerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alert Statistics
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Alerts:</Typography>
                  <Typography variant="h6">{alerts.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Active Alerts:</Typography>
                  <Typography variant="h6" color="primary">
                    {alerts.filter(alert => alert.enabled).length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Triggered:</Typography>
                  <Typography variant="h6" color="error">
                    {alerts.filter(alert => alert.triggered).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Alert Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Price Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Stock Symbol"
                fullWidth
                variant="outlined"
                value={alertForm.symbol}
                onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., AAPL"
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
                  <MenuItem value="price_above">Price Above</MenuItem>
                  <MenuItem value="price_below">Price Below</MenuItem>
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
                placeholder="e.g., 150.00"
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
                label="Enable Alert"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAlert}
            variant="contained"
            disabled={!alertForm.symbol || !alertForm.target_price}
          >
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Alerts
