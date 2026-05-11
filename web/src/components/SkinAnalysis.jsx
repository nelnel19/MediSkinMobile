// components/SkinAnalysis.jsx
import React, { useState, useEffect } from 'react';

const SkinAnalysis = () => {
  const [statistics, setStatistics] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [diseaseEntries, setDiseaseEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Python backend runs on port 8000
  const API_BASE_URL = 'http://localhost:8000';

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/skin-history-statistics`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseaseHistory = async (diseaseName) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE_URL}/skin-history-by-disease/${encodeURIComponent(diseaseName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch disease history');
      }
      const data = await response.json();
      setDiseaseEntries(data.entries || []);
      setSelectedDisease(diseaseName);
    } catch (err) {
      console.error('Error fetching disease history:', err);
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedDisease(null);
    setDiseaseEntries([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading skin analysis data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={fetchStatistics}>Retry</button>
      </div>
    );
  }

  if (!statistics || statistics.total_entries === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No Skin Analysis Data</h2>
        <p>No skin analysis records found in the database.</p>
        <p>Start analyzing skin conditions to see statistics here.</p>
      </div>
    );
  }

  const filteredDiseases = statistics.disease_stats.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          📊 Skin Disease Analysis Dashboard
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {statistics.total_entries}
            </div>
            <div>Total Analyses</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {statistics.disease_stats.length}
            </div>
            <div>Unique Diseases</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              {new Date().toLocaleDateString()}
            </div>
            <div>Last Updated</div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <input
            type="text"
            placeholder="🔍 Search for a disease..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '16px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredDiseases.map((disease) => (
            <div 
              key={disease.name} 
              onClick={() => fetchDiseaseHistory(disease.name)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: '1px solid #e0e0e0'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🩺</span>
                  <h3 style={{ margin: 0, color: '#2c3e50' }}>
                    {disease.name.replace(/_/g, ' ')}
                  </h3>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    background: '#667eea', 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontWeight: 'bold', 
                    fontSize: '18px',
                    marginRight: '8px'
                  }}>
                    {disease.count}
                  </span>
                  <span style={{ fontSize: '12px', color: '#7f8c8d' }}>cases</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#7f8c8d' }}>Percentage:</span>
                  <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {disease.percentage}%
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: '#ecf0f1', 
                  borderRadius: '4px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: `${disease.percentage}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #667eea, #764ba2)' 
                  }}></div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right', color: '#667eea', fontSize: '13px', fontWeight: '500' }}>
                Click to view details →
              </div>
            </div>
          ))}
        </div>

        {filteredDiseases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No diseases found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Modal for disease details */}
      {selectedDisease && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0 }}>{selectedDisease.replace(/_/g, ' ')}</h2>
              <button onClick={closeModal} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0 8px'
              }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading entries...</div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    Total Entries: <strong>{diseaseEntries.length}</strong>
                  </div>
                  <div>
                    {diseaseEntries.map((entry, index) => (
                      <div key={entry.id} style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: entry.confidence >= 70 ? '#d4edda' : entry.confidence >= 45 ? '#fff3cd' : '#f8d7da',
                            color: entry.confidence >= 70 ? '#155724' : entry.confidence >= 45 ? '#856404' : '#721c24'
                          }}>
                            {entry.confidence}% confidence
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                          <strong>User ID:</strong> {entry.user_id}
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                          <strong>Date:</strong> {formatDate(entry.created_at_display)}
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                          <strong>Status:</strong>{' '}
                          <span style={{
                            color: entry.status === 'completed' ? '#28a745' : '#dc3545',
                            textTransform: 'capitalize'
                          }}>
                            {entry.status}
                          </span>
                        </div>
                        {entry.image_url && (
                          <div style={{ marginTop: '10px' }}>
                            <a 
                              href={entry.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#667eea', textDecoration: 'none' }}
                            >
                              View Image 🔍
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
        </div>
      )}
    </div>
  );
};

export default SkinAnalysis;