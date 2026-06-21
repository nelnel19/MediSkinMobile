// FaceAnalysis.jsx - SQUARE CARDS MATCHING SKINANALYSIS
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import '../styles/faceanalysis.css';

const FaceAnalysis = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const gradeOrder = { 'A+': 0, 'A': 1, 'B+': 2, 'B': 3, 'C': 4, 'D': 5, 'Unknown': 6 };

  const getGradeColor = (grade) => {
    const colors = { 
      'A+': '#1A4A2F', 
      'A': '#2E7D32', 
      'B+': '#1565C0', 
      'B': '#1976D2', 
      'C': '#B45B0A', 
      'D': '#C23A3A', 
      'Unknown': '#7A8F86' 
    };
    return colors[grade] || colors['Unknown'];
  };

  const getGradeBg = (grade) => {
    const colors = { 
      'A+': '#E8F3EC', 
      'A': '#E8F5E9', 
      'B+': '#E3F2FD', 
      'B': '#E3F2FD', 
      'C': '#FEF6E6', 
      'D': '#FEF0F0', 
      'Unknown': '#F8FAFC' 
    };
    return colors[grade] || colors['Unknown'];
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groupBySkinGrade = () => {
    const grouped = {};
    analyses.forEach(analysis => {
      let grade = 'Unknown';
      if (analysis.skinGrade) {
        if (typeof analysis.skinGrade === 'object' && analysis.skinGrade.grade) grade = analysis.skinGrade.grade;
        else if (typeof analysis.skinGrade === 'string') grade = analysis.skinGrade;
      } else if (analysis.analysisData?.skin_grade?.grade) {
        grade = analysis.analysisData.skin_grade.grade;
      } else if (analysis.analysisData?.skinGrade?.grade) {
        grade = analysis.analysisData.skinGrade.grade;
      }
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push({ ...analysis, extractedGrade: grade });
    });
    const sortedGrouped = {};
    Object.keys(grouped).sort((a, b) => (gradeOrder[a] || 999) - (gradeOrder[b] || 999)).forEach(grade => {
      sortedGrouped[grade] = grouped[grade].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    return sortedGrouped;
  };

  const fetchAllHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/history/all`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  const calculateStats = (allAnalyses) => {
    const totalAnalyses = allAnalyses.length;
    const gradeCount = {};
    allAnalyses.forEach(analysis => {
      let grade = 'Unknown';
      if (analysis.skinGrade) {
        if (typeof analysis.skinGrade === 'object' && analysis.skinGrade.grade) grade = analysis.skinGrade.grade;
        else if (typeof analysis.skinGrade === 'string') grade = analysis.skinGrade;
      } else if (analysis.analysisData?.skin_grade?.grade) {
        grade = analysis.analysisData.skin_grade.grade;
      }
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });
    let totalAcneScore = 0, validScores = 0;
    allAnalyses.forEach(analysis => {
      const acneScore = analysis.analysisData?.acne || analysis.analysisData?.skin_attributes?.acne || analysis.analysisData?.skinGrade?.components?.acne?.score || 0;
      if (acneScore > 0) { totalAcneScore += acneScore; validScores++; }
    });
    const averageAcneScore = validScores > 0 ? Math.round(totalAcneScore / validScores) : 0;
    setStats({ totalAnalyses, gradeDistribution: gradeCount, averageAcneScore });
  };

  const handleDelete = async () => {
    if (!selectedAnalysis) return;
    try {
      const response = await fetch(`${API_URL}/api/history/${selectedAnalysis.id}`, { method: 'DELETE' });
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllHistory();
    setRefreshing(false);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) return `${interval}${unit === 'day' ? 'd' : unit.charAt(0)}`;
    }
    return 'now';
  };

  const getProgressColor = (score) => {
    if (score >= 70) return '#C23A3A';
    if (score >= 40) return '#B45B0A';
    return '#1A4A2F';
  };

  useEffect(() => { fetchAllHistory(); }, []);

  const groupedAnalyses = groupBySkinGrade();
  const gradeTabs = Object.keys(groupedAnalyses);

  if (loading) {
    return (
      <div className="face-analysis-wrapper">
        <div className="face-analysis-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading analysis data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="face-analysis-wrapper">
        <div className="face-analysis-container">
          <div className="error-container">
            <h3>Unable to load data</h3>
            <p>{error}</p>
            <button onClick={fetchAllHistory} className="retry-button">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalAnalyses === 0) {
    return (
      <div className="face-analysis-wrapper">
        <div className="face-analysis-container">
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3>No Face Analysis Data</h3>
            <p>No facial analysis records found in the database.</p>
          </div>
        </div>
      </div>
    );
  }

  const gradeDistribution = stats.gradeDistribution || {};
  const topGrade = Object.keys(gradeDistribution).reduce((a, b) => gradeDistribution[a] > gradeDistribution[b] ? a : b, Object.keys(gradeDistribution)[0]);

  return (
    <div className="face-analysis-wrapper">
      <div className="face-analysis-container">
        {/* Header */}
        <div className="header-section">
          <div className="title-section">
            <h1>Face Analysis History</h1>
            <p>Complete history grouped by skin grade assessment</p>
          </div>
          <div className="header-stats">
            <div className="header-stat-item">
              <div className="header-stat-value">{stats.totalAnalyses}</div>
              <div className="header-stat-label">Total Scans</div>
            </div>
            <div className="header-stat-item">
              <div className="header-stat-value">{stats.averageAcneScore || 0}%</div>
              <div className="header-stat-label">Avg Acne</div>
            </div>
            <div className="header-stat-item">
              <div className="header-stat-value">{Object.keys(gradeDistribution).length}</div>
              <div className="header-stat-label">Grades</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-pill">
            <span>Most Common</span> {topGrade || 'N/A'}
          </div>
          <div className="quick-pill">
            <span>Total Analyses</span> {stats.totalAnalyses}
          </div>
          <button className="quick-pill refresh-pill" onClick={handleRefresh} disabled={refreshing}>
            <span>⟳</span> {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          {gradeTabs.map((grade, index) => (
            <button 
              key={grade} 
              className={`tab-button ${selectedTab === index ? 'active' : ''}`} 
              onClick={() => setSelectedTab(index)}
            >
              <span>Grade {grade}</span>
              <span className="tab-count">{groupedAnalyses[grade].length}</span>
            </button>
          ))}
        </div>
        
        {/* Square Cards Grid - Matching SkinAnalysis */}
        <div className="square-cards-grid">
          {gradeTabs.map((grade, index) => (
            <div key={grade} style={{ display: selectedTab === index ? 'grid' : 'none' }} className="square-grid-inner">
              {groupedAnalyses[grade].map((analysis) => {
                const gradeColor = getGradeColor(grade);
                const gradeBg = getGradeBg(grade);
                const data = analysis.analysisData;
                const acne = data?.acne || data?.skin_attributes?.acne || data?.skinGrade?.components?.acne?.score || 0;
                const stain = data?.skin_attributes?.stain || data?.skinGrade?.components?.stain?.score || 0;
                const darkCircle = data?.skin_attributes?.dark_circle || data?.skinGrade?.components?.dark_circle?.score || 0;
                const age = data?.age || 'N/A';
                const gender = data?.gender === 'male' ? 'Male' : data?.gender === 'female' ? 'Female' : '—';
                const userEmail = analysis.userEmail || 'Unknown';
                const isExpanded = expandedCards[analysis.id];
                
                return (
                  <div className="square-card" key={analysis.id}>
                    {/* Card Top - Grade Icon + Title */}
                    <div className="square-card-top">
                      <div className="square-card-icon" style={{ background: gradeBg }}>
                        <span style={{ color: gradeColor, fontSize: '22px', fontWeight: 800 }}>{grade}</span>
                      </div>
                      <div className="square-card-title">
                        <h4>Skin Grade {grade}</h4>
                        <p>Overall Assessment</p>
                      </div>
                      <button className="square-card-menu" onClick={() => toggleExpand(analysis.id)}>
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                    
                    {/* Card Body */}
                    <div className="square-card-body">
                      {/* User Info */}
                      <div className="square-user-info">
                        <div className="square-user-avatar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <div className="square-user-details">
                          <div className="square-user-name">{userEmail.split('@')[0]}</div>
                          <div className="square-user-meta">{age} years • {gender}</div>
                        </div>
                        <div className="square-scan-date">
                          <div>{formatDate(analysis.timestamp)}</div>
                          <div className="square-time-ago">{getTimeAgo(analysis.timestamp)} ago</div>
                        </div>
                      </div>
                      
                      {/* Metrics */}
                      <div className="square-metrics">
                        <div className="square-metric">
                          <div className="square-metric-header">
                            <span>Acne Severity</span>
                            <strong>{acne}%</strong>
                          </div>
                          <div className="square-progress">
                            <div className="square-progress-fill" style={{ width: `${acne}%`, background: getProgressColor(acne) }}></div>
                          </div>
                        </div>
                        <div className="square-metric">
                          <div className="square-metric-header">
                            <span>Pigmentation</span>
                            <strong>{stain}%</strong>
                          </div>
                          <div className="square-progress">
                            <div className="square-progress-fill" style={{ width: `${stain}%`, background: getProgressColor(stain) }}></div>
                          </div>
                        </div>
                        <div className="square-metric">
                          <div className="square-metric-header">
                            <span>Dark Circles</span>
                            <strong>{darkCircle}%</strong>
                          </div>
                          <div className="square-progress">
                            <div className="square-progress-fill" style={{ width: `${darkCircle}%`, background: getProgressColor(darkCircle) }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Footer - Actions */}
                    <div className="square-card-footer">
                      <button className="square-delete-btn" onClick={() => { setSelectedAnalysis(analysis); setDeleteDialogOpen(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Delete Record
                      </button>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="square-card-expanded">
                        {data?.acne_regions?.primary_affected_area && (
                          <div className="square-expanded-item">
                            <span className="square-expanded-label">Primary Area:</span>
                            <span>{data.acne_regions.primary_affected_area.region} - {data.acne_regions.primary_affected_area.severity}</span>
                          </div>
                        )}
                        {data?.skin_grade?.strengths?.length > 0 && (
                          <div className="square-expanded-item">
                            <span className="square-expanded-label">Strengths:</span>
                            <span>{data.skin_grade.strengths.slice(0, 2).join(', ')}</span>
                          </div>
                        )}
                        {data?.skin_grade?.weaknesses?.length > 0 && (
                          <div className="square-expanded-item">
                            <span className="square-expanded-label">Improve:</span>
                            <span>{data.skin_grade.weaknesses.slice(0, 2).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteDialogOpen && (
        <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Record</h2>
              <button className="modal-close" onClick={() => setDeleteDialogOpen(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="modal-summary">
                <span className="modal-summary-label">Confirm Deletion</span>
                <span className="modal-summary-value">⚠️</span>
              </div>
              
              {selectedAnalysis && (
                <div className="delete-preview">
                  <div className="preview-item">
                    <span>Grade</span>
                    <strong>{selectedAnalysis.extractedGrade}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Date</span>
                    <strong>{formatDate(selectedAnalysis.timestamp)}</strong>
                  </div>
                  <div className="preview-item">
                    <span>User</span>
                    <strong>{selectedAnalysis.userEmail || 'Unknown'}</strong>
                  </div>
                </div>
              )}
              
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
              <button className="modal-delete" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAnalysis;