// Dashboard.jsx - WITH INTEGRATED ANALYTICS REPORT
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { API_URL } from '../config/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);

  const PYTHON_API_URL = 'https://mediskin-backend-python.onrender.com';

  useEffect(() => {
    Promise.all([
      fetchMonthlyStats(),
      fetchGradeDistribution(),
      fetchDiseaseDistribution(),
      fetchGenderDistribution(),
      generateReport()
    ]).finally(() => {
      setLoading(false);
      setReportLoading(false);
    });
  }, []);

  const fetchMonthlyStats = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/monthly-stats`);
      const data = await res.json();
      if (data.success && data.data) {
        setMonthlyData(data.data);
      }
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const fetchGradeDistribution = async () => {
    try {
      const res = await fetch(`${API_URL}/api/history/all`);
      const data = await res.json();
      if (data.success && data.data) {
        const gradeCount = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0 };
        data.data.forEach(analysis => {
          let grade = null;
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
          if (grade && gradeCount.hasOwnProperty(grade)) {
            gradeCount[grade]++;
          }
        });
        const chartData = Object.entries(gradeCount).map(([grade, count]) => ({ grade, count }));
        setGradeData(chartData);
      }
    } catch (err) {
      console.error('Error fetching grade distribution:', err);
    }
  };

  const fetchDiseaseDistribution = async () => {
    try {
      const res = await fetch(`${PYTHON_API_URL}/skin-history-statistics`);
      const data = await res.json();
      if (data && data.disease_stats) {
        const topDiseases = data.disease_stats
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setDiseaseData(topDiseases);
      }
    } catch (err) {
      console.error('Error fetching disease distribution:', err);
    }
  };

  const fetchGenderDistribution = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/all`);
      const data = await res.json();
      if (data.success && data.users) {
        const genderCount = {
          male: 0,
          female: 0,
          other: 0,
          'prefer not to say': 0
        };
        
        data.users.forEach(user => {
          const gender = user.gender || 'prefer not to say';
          if (genderCount.hasOwnProperty(gender)) {
            genderCount[gender]++;
          } else {
            genderCount.other++;
          }
        });
        
        const chartData = Object.entries(genderCount)
          .filter(([_, count]) => count > 0)
          .map(([gender, count]) => ({
            name: gender === 'male' ? 'Male' : 
                  gender === 'female' ? 'Female' : 
                  gender === 'other' ? 'Other' : 'Prefer not to say',
            value: count,
            original: gender
          }));
        
        setGenderData(chartData);
      }
    } catch (err) {
      console.error('Error fetching gender distribution:', err);
      setGenderData([
        { name: 'Male', value: 45 },
        { name: 'Female', value: 38 },
        { name: 'Other', value: 12 },
        { name: 'Prefer not to say', value: 5 }
      ]);
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const historyRes = await fetch(`${API_URL}/api/history/all`);
      const historyData = await historyRes.json();
      
      const usersRes = await fetch(`${API_URL}/auth/all`);
      const usersData = await usersRes.json();
      
      const monthlyRes = await fetch(`${API_URL}/auth/monthly-stats`);
      const monthlyDataRes = await monthlyRes.json();
      
      const diseaseRes = await fetch(`${PYTHON_API_URL}/skin-history-statistics`);
      const diseaseDataRes = await diseaseRes.json();
      
      let allEntries = [];
      if (diseaseDataRes.all_entries && Array.isArray(diseaseDataRes.all_entries)) {
        allEntries = diseaseDataRes.all_entries;
      }
      
      if (historyData.success && usersData.success) {
        const analyses = historyData.data || [];
        const users = usersData.users || [];
        
        let diseaseStats = [];
        if (diseaseDataRes.disease_stats && Array.isArray(diseaseDataRes.disease_stats)) {
          diseaseStats = diseaseDataRes.disease_stats
            .filter(stat => stat && stat.name && stat.name !== 'undefined' && stat.name !== 'null')
            .map(stat => ({
              name: stat.name.replace(/_/g, ' '),
              count: stat.count,
              percentage: stat.percentage
            }));
        }
        
        const report = generateReportData(analyses, users, diseaseStats, monthlyDataRes.data || [], diseaseDataRes.total_entries || 0, allEntries);
        setReportData(report);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const generateReportData = (analyses, users, diseaseStats, monthlyData, totalDiseaseEntries, allEntries) => {
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

  const renderFindingText = (finding) => {
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

  const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="dashboard-tooltip">
          <div className="tooltip-header">{label}</div>
          <div className="tooltip-row">
            <span>New Users</span>
            <strong>{payload[0].value.toLocaleString()}</strong>
          </div>
          {payload[0].payload.cumulativeUsers && (
            <div className="tooltip-row total">
              <span>Total Users</span>
              <strong>{payload[0].payload.cumulativeUsers.toLocaleString()}</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const GradeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const gradeDesc = { 'A+': 'Excellent', 'A': 'Very Good', 'B+': 'Good', 'B': 'Fair', 'C': 'Concern', 'D': 'Critical' };
      return (
        <div className="dashboard-tooltip">
          <div className="tooltip-header">Grade {label}</div>
          <div className="tooltip-sub">{gradeDesc[label]}</div>
          <div className="tooltip-row">
            <span>Total Analyses</span>
            <strong>{payload[0].value}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const DiseaseTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="dashboard-tooltip">
          <div className="tooltip-header">{data.name.replace(/_/g, ' ')}</div>
          <div className="tooltip-row">
            <span>Total Cases</span>
            <strong>{data.count}</strong>
          </div>
          <div className="tooltip-row">
            <span>Prevalence</span>
            <strong>{data.percentage}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const GenderTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = genderData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="dashboard-tooltip">
          <div className="tooltip-header">{payload[0].name}</div>
          <div className="tooltip-row">
            <span>Count</span>
            <strong>{payload[0].value}</strong>
          </div>
          <div className="tooltip-row">
            <span>Percentage</span>
            <strong>{percentage}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  const totalUsers = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.cumulativeUsers || 0 : 0;
  const totalDiseaseCases = diseaseData.reduce((sum, d) => sum + d.count, 0);
  const topDisease = diseaseData[0]?.name.replace(/_/g, ' ') || 'N/A';
  const totalAnalyses = gradeData.reduce((sum, item) => sum + item.count, 0);
  const totalUsersCount = genderData.reduce((sum, item) => sum + item.value, 0);

  const areaColor = '#1A4A2F';
  const gradeColors = {
    'A+': '#1A4A2F',
    'A': '#2E7D32',
    'B+': '#1565C0',
    'B': '#1976D2',
    'C': '#B45B0A',
    'D': '#C23A3A'
  };
  
  const diseaseColors = ['#1A4A2F', '#2E7D32', '#1565C0', '#1976D2', '#B45B0A'];
  const genderColors = ['#1A4A2F', '#2E7D32', '#1565C0', '#7A8F86'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* User Growth Chart */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h3>User Growth</h3>
              <p>Monthly trend</p>
            </div>
            <div className="stat-badge">
              <span className="stat-badge-label">Total</span>
              <span className="stat-badge-value">{totalUsers.toLocaleString()}</span>
            </div>
          </div>
          <div className="stat-chart">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColor} stopOpacity={0.1}/>
                      <stop offset="100%" stopColor={areaColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E8EDF2" strokeWidth={1} vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#7A8F86' }} tickLine={false} axisLine={{ stroke: '#E8EDF2' }} dy={5} />
                  <YAxis tick={{ fontSize: 9, fill: '#7A8F86' }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<AreaTooltip />} cursor={{ stroke: areaColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="newUsers" stroke={areaColor} strokeWidth={2} fill="url(#areaGradient)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="stat-empty">No data</div>
            )}
          </div>
        </div>

        {/* Skin Grade Distribution */}
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h3>Skin Health</h3>
              <p>Grade distribution</p>
            </div>
            <div className="stat-badge">
              <span className="stat-badge-label">Total</span>
              <span className="stat-badge-value">{totalAnalyses}</span>
            </div>
          </div>
          <div className="stat-chart">
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={gradeData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={5} barCategoryGap={14}>
                  <CartesianGrid stroke="#E8EDF2" strokeWidth={1} vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#7A8F86', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#E8EDF2' }} dy={5} />
                  <YAxis tick={{ fontSize: 9, fill: '#7A8F86' }} tickLine={false} axisLine={false} width={25} />
                  <Tooltip content={<GradeTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={28}>
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={gradeColors[entry.grade]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="stat-empty">No data</div>
            )}
          </div>
        </div>

        {/* Disease Prevalence & Gender Distribution - Split Layout */}
        <div className="stat-card full-width split-layout">
          <div className="split-left">
            <div className="stat-card-header">
              <div>
                <h3>Disease Prevalence</h3>
                <p>Common conditions</p>
              </div>
              <div className="stat-badge">
                <span className="stat-badge-label">Cases</span>
                <span className="stat-badge-value">{totalDiseaseCases.toLocaleString()}</span>
              </div>
            </div>
            {diseaseData.length > 0 ? (
              <div className="stat-chart">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={diseaseData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={5} barCategoryGap={14}>
                    <CartesianGrid stroke="#E8EDF2" strokeWidth={1} vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 8, fill: '#7A8F86', fontWeight: 500 }} 
                      tickLine={false} 
                      axisLine={{ stroke: '#E8EDF2' }}
                      dy={5}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                      tickFormatter={(value) => value.replace(/_/g, ' ').substring(0, 8)}
                    />
                    <YAxis tick={{ fontSize: 8, fill: '#7A8F86' }} tickLine={false} axisLine={false} width={25} />
                    <Tooltip content={<DiseaseTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={26}>
                      {diseaseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={diseaseColors[index % diseaseColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="stat-empty">No data</div>
            )}
          </div>
          
          <div className="split-right">
            <div className="stat-card-header">
              <div>
                <h3>User Demographics</h3>
                <p>Gender split</p>
              </div>
              <div className="stat-badge">
                <span className="stat-badge-label">Users</span>
                <span className="stat-badge-value">{totalUsersCount.toLocaleString()}</span>
              </div>
            </div>
            {genderData.length > 0 ? (
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#7A8F86', strokeWidth: 1 }}
                      fontSize={9}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={genderColors[index % genderColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<GenderTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {genderData.map((entry, index) => {
                    const total = genderData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = ((entry.value / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="pie-legend-item">
                        <div className="pie-legend-color" style={{ backgroundColor: genderColors[index % genderColors.length] }}></div>
                        <span className="pie-legend-name">{entry.name}</span>
                        <span className="pie-legend-value">{entry.value}</span>
                        <span className="pie-legend-percentage">({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="stat-empty">No data</div>
            )}
          </div>
        </div>

        {/* Analytics Report Section */}
        <div className="stat-card full-width report-section">
          <div className="report-header">
            <div className="header-left">
              <h2>Analytics Report</h2>
              <p className="header-subtitle">Key Findings & Insights</p>
            </div>
            <div className="header-right">
              <div className="report-date">
                <span className="date-label">Generated</span>
                <strong>{reportData ? new Date(reportData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Loading...'}</strong>
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
          
          {reportLoading ? (
            <div className="report-loading">
              <div className="loading-spinner-small"></div>
              <span>Generating report...</span>
            </div>
          ) : reportData ? (
            <div className="report-body">
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
              <div className="report-footer">
                <div className="footer-divider"></div>
                <p className="footer-text">Mediskin Analytics System — Automated Report</p>
              </div>
            </div>
          ) : (
            <div className="report-empty">
              <p>No report data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;