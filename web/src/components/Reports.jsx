// Reports.jsx - TEXT-ONLY REPORT WITH PROFESSIONAL TABLE LAYOUT
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import '../styles/reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const PYTHON_API_URL = 'https://mediskin-backend-python.onrender.com';

  useEffect(() => {
    fetchAllDataAndGenerateReport();
  }, []);

  const fetchAllDataAndGenerateReport = async () => {
    setLoading(true);
    try {
      const historyRes = await fetch(`${API_URL}/api/history/all`);
      const historyData = await historyRes.json();
      
      const usersRes = await fetch(`${API_URL}/auth/all`);
      const usersData = await usersRes.json();
      
      const monthlyRes = await fetch(`${API_URL}/auth/monthly-stats`);
      const monthlyData = await monthlyRes.json();
      
      const diseaseRes = await fetch(`${PYTHON_API_URL}/skin-history-statistics`);
      const diseaseData = await diseaseRes.json();
      
      let allEntries = [];
      if (diseaseData.all_entries && Array.isArray(diseaseData.all_entries)) {
        allEntries = diseaseData.all_entries;
      }
      
      if (historyData.success && usersData.success) {
        const analyses = historyData.data || [];
        const users = usersData.users || [];
        
        let diseaseStats = [];
        if (diseaseData.disease_stats && Array.isArray(diseaseData.disease_stats)) {
          diseaseStats = diseaseData.disease_stats
            .filter(stat => stat && stat.name && stat.name !== 'undefined' && stat.name !== 'null')
            .map(stat => ({
              name: stat.name.replace(/_/g, ' '),
              count: stat.count,
              percentage: stat.percentage
            }));
        }
        
        const report = generateReport(analyses, users, diseaseStats, monthlyData.data || [], diseaseData.total_entries || 0, allEntries);
        setReportData(report);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (analyses, users, diseaseStats, monthlyData, totalDiseaseEntries, allEntries) => {
    const genderCount = { male: 0, female: 0 };
    const acneByGender = { male: [], female: [] };
    const userMap = new Map();
    
    users.forEach(user => {
      userMap.set(user.email, user);
      if (user.gender === 'male' || user.gender === 'female') {
        genderCount[user.gender]++;
      }
    });
    
    analyses.forEach(analysis => {
      const user = userMap.get(analysis.userEmail);
      if (user && (user.gender === 'male' || user.gender === 'female')) {
        const acneScore = analysis.analysisData?.acne || 
                         analysis.analysisData?.skin_attributes?.acne || 0;
        if (acneScore > 0) {
          acneByGender[user.gender].push(acneScore);
        }
      }
    });
    
    const avgAcneMale = acneByGender.male.length > 0 
      ? Math.round(acneByGender.male.reduce((a, b) => a + b, 0) / acneByGender.male.length) 
      : 0;
    const avgAcneFemale = acneByGender.female.length > 0 
      ? Math.round(acneByGender.female.reduce((a, b) => a + b, 0) / acneByGender.female.length) 
      : 0;
    
    const totalUsers = users.length;
    const totalAnalysesCount = analyses.length;
    const highestAcneGender = avgAcneMale > avgAcneFemale ? 'Males' : 'Females';
    const highestAcneValue = Math.max(avgAcneMale, avgAcneFemale);
    
    const gradeCount = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0 };
    analyses.forEach(analysis => {
      let grade = analysis.skinGrade;
      if (!grade || grade === 'Unknown') {
        const acneScore = analysis.analysisData?.acne || 
                         analysis.analysisData?.skin_attributes?.acne || 0;
        if (acneScore <= 15) grade = 'A+';
        else if (acneScore <= 30) grade = 'A';
        else if (acneScore <= 45) grade = 'B+';
        else if (acneScore <= 60) grade = 'B';
        else if (acneScore <= 75) grade = 'C';
        else grade = 'D';
      }
      if (gradeCount.hasOwnProperty(grade)) gradeCount[grade]++;
    });
    
    const mostCommonGrade = Object.entries(gradeCount).reduce((a, b) => a[1] > b[1] ? a : b, ['N/A', 0]);
    const mostCommonPercentage = totalAnalysesCount > 0 ? Math.round((mostCommonGrade[1] / totalAnalysesCount) * 100) : 0;
    
    const acneByAge = {};
    analyses.forEach(analysis => {
      const user = userMap.get(analysis.userEmail);
      if (user && user.age) {
        const acneScore = analysis.analysisData?.acne || 
                         analysis.analysisData?.skin_attributes?.acne || 0;
        const ageGroup = user.age < 20 ? 'Under 20' : user.age < 30 ? '20-29' : user.age < 40 ? '30-39' : user.age < 50 ? '40-49' : '50+';
        if (!acneByAge[ageGroup]) acneByAge[ageGroup] = { sum: 0, count: 0 };
        acneByAge[ageGroup].sum += acneScore;
        acneByAge[ageGroup].count++;
      }
    });
    
    const avgAcneByAge = Object.entries(acneByAge).map(([group, data]) => ({
      ageGroup: group,
      avgAcne: data.count > 0 ? Math.round(data.sum / data.count) : 0
    }));
    const highestAgeGroup = avgAcneByAge.reduce((max, item) => item.avgAcne > max.avgAcne ? item : max, { ageGroup: 'N/A', avgAcne: 0 });
    
    const regionCounts = { 'Forehead': 0, 'Left Cheek': 0, 'Right Cheek': 0, 'Chin': 0, 'Nose': 0 };
    analyses.forEach(analysis => {
      const regions = analysis.analysisData?.acne_regions?.primary_affected_area;
      if (regions && regions.region && regionCounts.hasOwnProperty(regions.region)) {
        regionCounts[regions.region]++;
      }
    });
    const totalWithRegion = Object.values(regionCounts).reduce((a, b) => a + b, 0);
    const mostAffectedRegion = Object.entries(regionCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0]);
    const affectedPercentage = totalWithRegion > 0 ? Math.round((mostAffectedRegion[1] / totalWithRegion) * 100) : 0;
    
    const monthlyTrend = monthlyData.map(month => ({ month: month.month, newUsers: month.newUsers }));
    let previousUsers = 0;
    const growthRates = monthlyTrend.map(month => {
      const growth = previousUsers > 0 ? ((month.newUsers - previousUsers) / previousUsers) * 100 : 0;
      previousUsers = month.newUsers;
      return growth;
    });
    const avgMonthlyGrowth = growthRates.length > 0 ? Math.round(growthRates.reduce((a, b) => a + b, 0) / growthRates.length * 10) / 10 : 0;
    const bestMonth = monthlyTrend.reduce((max, m) => m.newUsers > max.newUsers ? m : max, monthlyTrend[0] || { month: 'N/A', newUsers: 0 });
    
    const totalDiseaseCases = totalDiseaseEntries || diseaseStats.reduce((sum, d) => sum + (d.count || 0), 0);
    const topDisease = diseaseStats.length > 0 ? diseaseStats.reduce((max, d) => (d.count || 0) > (max.count || 0) ? d : max, diseaseStats[0]) : null;
    const leastCommonDisease = diseaseStats.length > 0 ? diseaseStats.reduce((min, d) => (d.count || 0) < (min.count || 0) ? d : min, diseaseStats[0]) : null;
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    allEntries.forEach(entry => {
      if (entry.confidence && entry.confidence > 0) {
        totalConfidence += entry.confidence;
        confidenceCount++;
      }
    });
    const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;
    
    const diseaseVariety = diseaseStats.length;
    const topDiseases = diseaseStats.slice(0, 3).map((d, idx) => {
      const rank = idx + 1;
      let suffix = 'th';
      if (rank === 1) suffix = 'st';
      else if (rank === 2) suffix = 'nd';
      else if (rank === 3) suffix = 'rd';
      return `${rank}${suffix}: ${d.name} with ${d.count} case${d.count !== 1 ? 's' : ''} (${Math.round(d.percentage)}%)`;
    });
    
    const uniqueUsersDiagnosed = new Set();
    allEntries.forEach(entry => {
      if (entry.user_id) {
        uniqueUsersDiagnosed.add(entry.user_id);
      }
    });
    const userDiagnosisRate = totalUsers > 0 ? Math.round((uniqueUsersDiagnosed.size / totalUsers) * 100) : 0;
    
    const keyFindings = [
      `${highestAcneGender} have ${highestAcneValue}% average acne severity, significantly higher than other genders.`,
      `Grade ${mostCommonGrade[0]} is the most common skin grade, representing ${mostCommonPercentage}% of all analyses.`,
      `Users aged ${highestAgeGroup.ageGroup} show the highest acne severity at ${highestAgeGroup.avgAcne}% average.`,
      `The ${mostAffectedRegion[0]} is the most commonly affected area, accounting for ${affectedPercentage}% of acne cases.`,
      `User acquisition is growing at ${avgMonthlyGrowth}% month-over-month, with ${bestMonth.month} as the peak period.`,
      `${totalDiseaseCases} skin disease diagnoses recorded across ${diseaseVariety} unique conditions.`,
      `${userDiagnosisRate}% of platform users have received at least one skin disease diagnosis.`,
      `Average AI diagnostic confidence: ${avgConfidence}% — indicating ${avgConfidence >= 70 ? 'high' : avgConfidence >= 50 ? 'moderate' : 'developing'} reliability.`
    ];
    
    if (topDisease && topDisease.name && topDisease.name !== 'Unknown' && topDisease.count > 0) {
      keyFindings.push(`${topDisease.name} is the most frequently diagnosed condition, accounting for ${Math.round(topDisease.percentage)}% of all cases (${topDisease.count} occurrences).`);
    }
    
    if (topDiseases.length > 0) {
      keyFindings.push(`Top diagnosed conditions: ${topDiseases.join(', ')}.`);
    }
    
    if (leastCommonDisease && leastCommonDisease.name !== topDisease?.name && leastCommonDisease.count > 0 && leastCommonDisease.count < 3) {
      keyFindings.push(`${leastCommonDisease.name} is the rarest diagnosis with ${leastCommonDisease.count} case${leastCommonDisease.count !== 1 ? 's' : ''}.`);
    }
    
    if (diseaseStats.length >= 2 && topDisease && topDisease.count > 0) {
      const secondDisease = diseaseStats[1];
      if (secondDisease && secondDisease.count > 0) {
        const ratio = (topDisease.count / secondDisease.count).toFixed(1);
        keyFindings.push(`${topDisease.name} is ${ratio}x more common than ${secondDisease.name}.`);
      }
    }
    
    return {
      generatedAt: new Date().toISOString(),
      keyFindings
    };
  };
  
  const exportReport = () => {
    if (!reportData) return;
    
    const reportContent = `
MEDISKIN ANALYTICS
Key Findings Report
${new Date(reportData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

────────────────────────────────────────────────────────────────────────────────

KEY FINDINGS

${reportData.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n\n')}

────────────────────────────────────────────────────────────────────────────────

This report was automatically generated by Mediskin Analytics System.
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediskin_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportJSON = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediskin_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Helper function to render finding text with highlighted numbers
  const renderFindingText = (finding) => {
    // Split by patterns: percentages (e.g., 45%), multipliers (e.g., 2.5x), standalone numbers
    const parts = finding.split(/(\d+(?:\.\d+)?%|\d+(?:\.\d+)?x|\b\d+(?:\.\d+)?\b)/g);
    
    return parts.map((part, idx) => {
      if (part?.match(/\d+(?:\.\d+)?%/)) {
        return <span key={idx} className="metric-badge percentage-badge">{part}</span>;
      } else if (part?.match(/\d+(?:\.\d+)?x/)) {
        return <span key={idx} className="metric-badge">{part}</span>;
      } else if (part?.match(/^\d+(?:\.\d+)?$/)) {
        return <span key={idx} className="highlight-number">{part}</span>;
      }
      return part;
    });
  };
  
  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }
  
  if (!reportData) {
    return (
      <div className="reports-container">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3>No Data Available</h3>
          <p>Unable to generate report. Please ensure data is available.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="reports-container">
      <div className="report-header">
        <div className="header-left">
          <h1>Key Findings Report</h1>
          <p className="header-subtitle">Mediskin Analytics</p>
        </div>
        <div className="header-right">
          <div className="report-date">
            <span className="date-label">Generated</span>
            <strong>{new Date(reportData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </div>
          <div className="export-buttons">
            <button className="export-btn" onClick={exportReport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 9l5 5 5-5M12 4v10"/>
              </svg>
              Export TXT
            </button>
            <button className="export-btn" onClick={exportJSON}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v16h16V8l-4-4H4z"/>
                <path d="M8 12h8M8 16h4"/>
              </svg>
              Export JSON
            </button>
          </div>
        </div>
      </div>
      
      <div className="report-body">
        {/* Key Findings Section - Professional Table Layout */}
        <div className="section">
          <div className="section-header">
            <div className="section-indicator"></div>
            <h2>Key Findings</h2>
          </div>
          <div className="findings-table-wrapper">
            <table className="findings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                {reportData.keyFindings.map((finding, i) => (
                  <tr key={i}>
                    <td>{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <p className="finding-text">
                        {renderFindingText(finding)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="report-footer">
          <div className="footer-divider"></div>
          <p className="footer-text">Mediskin Analytics System — Automated Report</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;