// SkinAnalysis.jsx
import React, { useState, useEffect } from 'react';
import '../styles/skinanalysis.css';

const SkinAnalysis = () => {
  const [statistics, setStatistics] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [diseaseEntries, setDiseaseEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL = 'https://mediskin-backend-python.onrender.com';

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/skin-history-statistics`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (diseaseName) => {
    setLoadingDetails(true);
    setIsModalOpen(true);
    try {
      const response = await fetch(`${API_BASE_URL}/skin-history-by-disease/${encodeURIComponent(diseaseName)}`);
      if (!response.ok) throw new Error('Failed to fetch disease history');
      const data = await response.json();
      setDiseaseEntries(data.entries || []);
      setSelectedDisease(diseaseName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDisease(null);
    setDiseaseEntries([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceClass = (confidence) => {
    if (confidence >= 70) return 'confidence-high';
    if (confidence >= 45) return 'confidence-medium';
    return 'confidence-low';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analysis data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Unable to load data</h3>
        <p>{error}</p>
        <button onClick={fetchStatistics} className="retry-button">Try Again</button>
      </div>
    );
  }

  if (!statistics || statistics.total_entries === 0) {
    return (
      <div className="skin-analysis-wrapper">
        <div className="skin-analysis-container">
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h3>No Analysis Data</h3>
            <p>No skin analysis records found in the database.<br />Start analyzing to see statistics here.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredDiseases = statistics.disease_stats.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topDisease = statistics.disease_stats.reduce((max, d) => d.count > max.count ? d : max, statistics.disease_stats[0]);

  return (
    <div className="skin-analysis-wrapper">
      <div className="skin-analysis-container">
        {/* Header */}
        <div className="header-section">
          <div className="title-section">
            <h1>Skin Disease Analysis</h1>
            <p>Comprehensive overview of detection results and disease distribution</p>
          </div>
          <div className="header-stats">
            <div className="header-stat-item">
              <div className="header-stat-value">{statistics.total_entries}</div>
              <div className="header-stat-label">Total Scans</div>
            </div>
            <div className="header-stat-item">
              <div className="header-stat-value">{statistics.disease_stats.length}</div>
              <div className="header-stat-label">Conditions</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-pill">
            <span>Most Common</span> {topDisease.name.replace(/_/g, ' ')}
          </div>
          <div className="quick-pill">
            <span>Detection Rate</span> {topDisease.percentage}%
          </div>
          <div className="quick-pill">
            <span>Active Cases</span> {statistics.total_entries}
          </div>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <div className="search-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by disease name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Disease Grid */}
        <div className="diseases-grid">
          {filteredDiseases.map((disease) => (
            <div 
              key={disease.name} 
              className="disease-card"
              onClick={() => openModal(disease.name)}
            >
              <div className="card-top">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div className="card-title">
                  <h4>{disease.name.replace(/_/g, ' ')}</h4>
                  <p>Skin Condition</p>
                </div>
                <div className="card-count">
                  {disease.count}<small> cases</small>
                </div>
              </div>
              <div className="card-body">
                <div className="metric-row">
                  <span className="metric-label">Prevalence Rate</span>
                  <span className="metric-value">{disease.percentage}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${disease.percentage}%` }}></div>
                </div>
              </div>
              <div className="card-footer">
                <span>View Detailed Report</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDiseases.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3>No Results Found</h3>
            <p>No diseases match "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDisease?.replace(/_/g, ' ') || 'Disease Details'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            {loadingDetails ? (
              <div className="loading-spinner-small" />
            ) : (
              <>
                <div className="modal-summary">
                  <span className="modal-summary-label">Total Entries</span>
                  <span className="modal-summary-value">{diseaseEntries.length}</span>
                </div>
                
                <div className="modal-content">
                  {diseaseEntries.map((entry, idx) => (
                    <div key={entry.id} className="entry-card">
                      <div className="entry-header">
                        <span className="entry-number">Entry #{idx + 1}</span>
                        <span className={`confidence-badge ${getConfidenceClass(entry.confidence)}`}>
                          {entry.confidence}% confidence
                        </span>
                      </div>
                      
                      <div className="entry-details">
                        <div className="detail-row">
                          <span className="detail-label">User ID</span>
                          <span className="detail-value">{entry.user_id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Analysis Date</span>
                          <span className="detail-value">{formatDate(entry.created_at_display)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Status</span>
                          <span className={`status-badge ${entry.status === 'completed' ? 'status-completed' : 'status-pending'}`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                      
                      {entry.image_url && (
                        <div className="entry-image-link">
                          <a href={entry.image_url} target="_blank" rel="noopener noreferrer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Medical Image
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinAnalysis;