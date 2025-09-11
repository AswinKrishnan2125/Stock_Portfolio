import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Psychology,
  ExpandMore,
  Refresh,
  FilterList
} from '@mui/icons-material'
import axios from 'axios'
import { useStockLive } from '../contexts/StockLiveProvider'

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [cached, setCached] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    recommendation: 'all',
    risk_level: 'all',
    min_confidence: 0
  })

  const { interestedSymbols } = useStockLive()

  useEffect(() => {
    // On navigation, load from cache only (no model call)
    fetchCachedRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRecommendations = async () => {
  try {
    setLoading(true)
    setError('')
    // Explicitly trigger model call on refresh
  const response = await axios.post('/recommendations/', {
      force: true,
      filters,
    })

  setRecommendations(response.data.recommendations || [])
  setCached(Boolean(response.data.cached) === true)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    setError('Failed to load recommendations')
  } finally {
    setLoading(false)
  }
}

  const fetchCachedRecommendations = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/recommendations/')
      const recs = response.data.recommendations || []
      // Don't overwrite fresh results with empty cached payloads
      if (Array.isArray(recs) && recs.length > 0) {
        setRecommendations(recs)
        setCached(Boolean(response.data.cached) === true)
      }
    } catch (error) {
      console.error('Error fetching cached recommendations:', error)
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }


  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BUY':
        return 'success'
      case 'BUY':
        return 'primary'
      case 'HOLD':
        return 'warning'
      case 'SELL':
        return 'error'
      case 'STRONG_SELL':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatPrice = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n.toFixed(2) : '0.00'
  }

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return 'success'
      case 'MEDIUM':
        return 'warning'
      case 'HIGH':
        return 'error'
      default:
        return 'default'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success'
    if (confidence >= 60) return 'warning'
    return 'error'
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.recommendation !== 'all' && rec.recommendation !== filters.recommendation) {
      return false
    }
    if (filters.risk_level !== 'all' && rec.risk_level !== filters.risk_level) {
      return false
    }
    if (rec.confidence_score < filters.min_confidence) {
      return false
    }
    return true
  })

  const getRecommendationIcon = (recommendation) => {
    return recommendation.includes('BUY') ? <TrendingUp /> : <TrendingDown />
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filter
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchRecommendations}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Recommendations ({filteredRecommendations.length})
          </Typography>
          
          {filteredRecommendations.length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  No recommendations match your current filters.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredRecommendations.map((rec) => (
              <Card key={rec.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {rec.symbol} - {rec.company_name}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          icon={getRecommendationIcon(rec.recommendation)}
                          label={rec.recommendation}
                          color={getRecommendationColor(rec.recommendation)}
                          variant="filled"
                        />
                        <Chip
                          label={`Risk: ${rec.risk_level}`}
                          color={getRiskLevelColor(rec.risk_level)}
                          variant="outlined"
                        />
                        <Chip
                          label={`${rec.time_horizon}`}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" color="primary">
                        ${formatPrice(rec.target_price)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Current: ${formatPrice(rec.current_price)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Confidence Score</Typography>
                      <Typography variant="body2" color={getConfidenceColor(rec.confidence_score)}>
                        {rec.confidence_score}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={rec.confidence_score}
                      color={getConfidenceColor(rec.confidence_score)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2" color="primary">
                        View Analysis & Reasoning
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        {rec.reasoning}
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Typography variant="body2" color="textSecondary">
                          Potential Return: {rec.potential_return}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Updated: {new Date(rec.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendation Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Total Recommendations:</Typography>
                  <Typography variant="h6">{recommendations.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Buy Recommendations:</Typography>
                  <Typography variant="h6" color="success.main">
                    {recommendations.filter(r => r.recommendation.includes('BUY')).length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>High Confidence (80%+):</Typography>
                  <Typography variant="h6" color="success.main">
                    {recommendations.filter(r => r.confidence_score >= 80).length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Average Confidence:</Typography>
                  <Typography variant="h6">
                    {Math.round(recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Model Info
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Our AI recommendations are generated using advanced machine learning models that analyze:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" color="textSecondary">
                  Technical indicators and price patterns
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  Fundamental analysis and financial ratios
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  Market sentiment and news analysis
                </Typography>
                <Typography component="li" variant="body2" color="textSecondary">
                  Historical performance data
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Note: These are AI-generated recommendations and should not be considered as financial advice.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Recommendations</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Recommendation Type</InputLabel>
              <Select
                value={filters.recommendation}
                label="Recommendation Type"
                onChange={(e) => setFilters({ ...filters, recommendation: e.target.value })}
              >
                <MenuItem value="all">All Recommendations</MenuItem>
                <MenuItem value="STRONG_BUY">Strong Buy</MenuItem>
                <MenuItem value="BUY">Buy</MenuItem>
                <MenuItem value="HOLD">Hold</MenuItem>
                <MenuItem value="SELL">Sell</MenuItem>
                <MenuItem value="STRONG_SELL">Strong Sell</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={filters.risk_level}
                label="Risk Level"
                onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
              >
                <MenuItem value="all">All Risk Levels</MenuItem>
                <MenuItem value="LOW">Low Risk</MenuItem>
                <MenuItem value="MEDIUM">Medium Risk</MenuItem>
                <MenuItem value="HIGH">High Risk</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Minimum Confidence Score"
              type="number"
              fullWidth
              variant="outlined"
              value={filters.min_confidence}
              onChange={(e) => setFilters({ ...filters, min_confidence: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => { setFilterDialogOpen(false); fetchRecommendations(); }} 
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Recommendations
