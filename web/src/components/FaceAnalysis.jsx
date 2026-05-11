import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  Tooltip,
  Avatar,
  Badge
} from '@mui/material';
import {
  Delete,
  Refresh,
  CalendarToday,
  EmojiEvents,
  Star,
  StarBorder,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { API_URL } from '../config/api';

const FaceAnalysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Grade order for sorting
  const gradeOrder = {
    'A+': 0,
    'A': 1,
    'B+': 2,
    'B': 3,
    'C': 4,
    'D': 5,
    'Unknown': 6
  };

  // Group analyses by skin grade
  const groupBySkinGrade = () => {
    const grouped = {};
    
    analyses.forEach(analysis => {
      let grade = 'Unknown';
      
      // Extract grade from analysis data
      if (analysis.skinGrade) {
        if (typeof analysis.skinGrade === 'object' && analysis.skinGrade.grade) {
          grade = analysis.skinGrade.grade;
        } else if (typeof analysis.skinGrade === 'string') {
          grade = analysis.skinGrade;
        }
      } else if (analysis.analysisData?.skin_grade?.grade) {
        grade = analysis.analysisData.skin_grade.grade;
      } else if (analysis.analysisData?.skinGrade?.grade) {
        grade = analysis.analysisData.skinGrade.grade;
      }
      
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      grouped[grade].push({ ...analysis, extractedGrade: grade });
    });
    
    // Sort grades in order
    const sortedGrouped = {};
    Object.keys(grouped)
      .sort((a, b) => (gradeOrder[a] || 999) - (gradeOrder[b] || 999))
      .forEach(grade => {
        sortedGrouped[grade] = grouped[grade].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
      });
    
    return sortedGrouped;
  };

  // Get grade color
  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#4CAF50',
      'A': '#8BC34A',
      'B+': '#CDDC39',
      'B': '#FFC107',
      'C': '#FF9800',
      'D': '#F44336',
      'Unknown': '#9E9E9E'
    };
    return colors[grade] || colors['Unknown'];
  };

  // Get grade icon
  const getGradeIcon = (grade) => {
    const icons = {
      'A+': <EmojiEvents sx={{ color: '#FFD700' }} />,
      'A': <Star sx={{ color: '#4CAF50' }} />,
      'B+': <StarBorder sx={{ color: '#CDDC39' }} />,
      'B': <TrendingUp sx={{ color: '#FFC107' }} />,
      'C': <TrendingDown sx={{ color: '#FF9800' }} />,
      'D': <Warning sx={{ color: '#F44336' }} />,
      'Unknown': <Info sx={{ color: '#9E9E9E' }} />
    };
    return icons[grade] || icons['Unknown'];
  };

  // Fetch ALL analysis history
  const fetchAllHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/history/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyses(result.data || []);
        calculateStats(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from all analyses
  const calculateStats = (allAnalyses) => {
    const totalAnalyses = allAnalyses.length;
    
    // Calculate grade distribution
    const gradeCount = {};
    allAnalyses.forEach(analysis => {
      let grade = 'Unknown';
      if (analysis.skinGrade) {
        if (typeof analysis.skinGrade === 'object' && analysis.skinGrade.grade) {
          grade = analysis.skinGrade.grade;
        } else if (typeof analysis.skinGrade === 'string') {
          grade = analysis.skinGrade;
        }
      } else if (analysis.analysisData?.skin_grade?.grade) {
        grade = analysis.analysisData.skin_grade.grade;
      }
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });
    
    // Calculate average acne score
    let totalAcneScore = 0;
    let validScores = 0;
    allAnalyses.forEach(analysis => {
      const acneScore = analysis.analysisData?.acne || 
                       analysis.analysisData?.skin_attributes?.acne || 
                       analysis.analysisData?.skinGrade?.components?.acne?.score || 0;
      if (acneScore > 0) {
        totalAcneScore += acneScore;
        validScores++;
      }
    });
    const averageAcneScore = validScores > 0 ? Math.round(totalAcneScore / validScores) : 0;
    
    setStats({
      totalAnalyses,
      gradeDistribution: gradeCount,
      averageAcneScore
    });
  };

  // Delete analysis
  const handleDelete = async () => {
    if (!selectedAnalysis) return;
    
    try {
      const response = await fetch(`${API_URL}/api/history/${selectedAnalysis.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchAllHistory();
        setDeleteDialogOpen(false);
        setSelectedAnalysis(null);
      } else {
        throw new Error('Failed to delete analysis');
      }
    } catch (err) {
      console.error('Error deleting analysis:', err);
      setError(err.message);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllHistory();
    setRefreshing(false);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'Just now';
  };

  useEffect(() => {
    fetchAllHistory();
  }, []);

  const groupedAnalyses = groupBySkinGrade();
  const gradeTabs = Object.keys(groupedAnalyses);

  // Render analysis card
  const AnalysisCard = ({ analysis }) => {
    const grade = analysis.extractedGrade;
    const gradeColor = getGradeColor(grade);
    const analysisData = analysis.analysisData;
    
    const acneScore = analysisData?.acne || 
                     analysisData?.skin_attributes?.acne || 
                     analysisData?.skinGrade?.components?.acne?.score || 0;
    
    const stainScore = analysisData?.skin_attributes?.stain || 
                      analysisData?.skinGrade?.components?.stain?.score || 0;
    
    const darkCircleScore = analysisData?.skin_attributes?.dark_circle ||
                           analysisData?.skinGrade?.components?.dark_circle?.score || 0;
    
    const age = analysisData?.age || 'N/A';
    const gender = analysisData?.gender || 'N/A';
    const userEmail = analysis.userEmail || 'Unknown User';
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ bgcolor: gradeColor }}>
                  {getGradeIcon(grade)}
                </Avatar>
                <Typography variant="h6" component="div">
                  Skin Grade: 
                  <span style={{ color: gradeColor, fontWeight: 'bold', marginLeft: '8px' }}>
                    {grade}
                  </span>
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <CalendarToday sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                {formatDate(analysis.timestamp)}
                <span style={{ marginLeft: '8px' }}>
                  ({getTimeAgo(analysis.timestamp)})
                </span>
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                User: {userEmail} | Age: {age} | Gender: {gender}
              </Typography>
            </Box>
            
            <Tooltip title="Delete Analysis">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => {
                  setSelectedAnalysis(analysis);
                  setDeleteDialogOpen(true);
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Acne Severity
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={acneScore} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#ffebee',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: acneScore > 60 ? '#f44336' : acneScore > 30 ? '#ff9800' : '#4caf50'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {acneScore}%
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pigmentation
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stainScore} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#fff3e0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: stainScore > 60 ? '#ff9800' : '#ffc107'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {stainScore}%
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Dark Circles
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={darkCircleScore} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: '#e8eaf6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: darkCircleScore > 60 ? '#9c27b0' : '#673ab7'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {darkCircleScore}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {analysisData?.acne_regions?.primary_affected_area && (
            <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Primary Concern Area:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {analysisData.acne_regions.primary_affected_area.region} - 
                {analysisData.acne_regions.primary_affected_area.severity}
              </Typography>
            </Box>
          )}
          
          {analysisData?.skin_grade?.strengths && analysisData.skin_grade.strengths.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                <Typography variant="caption" fontWeight="bold">Strengths:</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analysisData.skin_grade.strengths.join(', ')}
              </Typography>
            </Box>
          )}
          
          {analysisData?.skin_grade?.weaknesses && analysisData.skin_grade.weaknesses.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Warning sx={{ fontSize: 16, color: '#ff9800' }} />
                <Typography variant="caption" fontWeight="bold">Areas to Improve:</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analysisData.skin_grade.weaknesses.join(', ')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              All Face Analysis History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete history of all face analyses - grouped by skin grade
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
        
        {stats && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: '#e8f5e9' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {stats.totalAnalyses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Analyses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: '#fff3e0' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {stats.averageAcneScore || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Acne Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: '#e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {Object.keys(stats.gradeDistribution || {}).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Grade Levels
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {analyses.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Face Analyses Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No analysis history available in the database.
          </Typography>
        </Paper>
      )}
      
      {analyses.length > 0 && (
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {gradeTabs.map((grade, index) => (
              <Tab 
                key={grade}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGradeIcon(grade)}
                    <span>Grade {grade}</span>
                    <Badge 
                      badgeContent={groupedAnalyses[grade].length} 
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {gradeTabs.map((grade, index) => (
              <Box
                key={grade}
                role="tabpanel"
                hidden={selectedTab !== index}
              >
                {selectedTab === index && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ color: getGradeColor(grade) }}>
                        Grade {grade} - {groupedAnalyses[grade].length} Analysis
                        {groupedAnalyses[grade].length !== 1 ? 'es' : ''}
                      </Typography>
                    </Box>
                    
                    {groupedAnalyses[grade].map((analysis) => (
                      <AnalysisCard key={analysis.id} analysis={analysis} />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      )}
      
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Analysis</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this analysis? This action cannot be undone.
          </Typography>
          {selectedAnalysis && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                Date: {formatDate(selectedAnalysis.timestamp)}
              </Typography>
              <Typography variant="body2">
                Grade: {selectedAnalysis.extractedGrade}
              </Typography>
              <Typography variant="body2">
                User: {selectedAnalysis.userEmail || 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FaceAnalysis;