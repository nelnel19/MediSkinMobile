// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { API_URL } from '../config/api';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
  const [loading, setLoading] = useState(true);

  const PYTHON_API_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchMonthlyStats();
    fetchGradeDistribution();
    fetchDiseaseDistribution();
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
          .slice(0, 6);
        setDiseaseData(topDiseases);
      }
    } catch (err) {
      console.error('Error fetching disease distribution:', err);
    } finally {
      setLoading(false);
    }
  };

  // Professional tooltip for area chart
  const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="corporate-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-period">{label}</span>
          </div>
          <div className="tooltip-body">
            <div className="tooltip-row">
              <span className="tooltip-label">New Users</span>
              <span className="tooltip-value">{payload[0].value.toLocaleString()}</span>
            </div>
            {payload[0].payload.cumulativeUsers && (
              <div className="tooltip-row total">
                <span className="tooltip-label">Total Users</span>
                <span className="tooltip-value">{payload[0].payload.cumulativeUsers.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Professional tooltip for grade bar chart
  const GradeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const gradeDescriptions = {
        'A+': 'Excellent',
        'A': 'Very Good',
        'B+': 'Good',
        'B': 'Fair',
        'C': 'Concern',
        'D': 'Critical'
      };
      return (
        <div className="corporate-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-grade">Grade {label}</span>
            <span className="tooltip-sub">{gradeDescriptions[label]}</span>
          </div>
          <div className="tooltip-body">
            <div className="tooltip-row">
              <span className="tooltip-label">Total Analyses</span>
              <span className="tooltip-value">{payload[0].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Professional tooltip for disease bar chart
  const DiseaseTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="corporate-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-disease">{data.name.replace(/_/g, ' ')}</span>
          </div>
          <div className="tooltip-body">
            <div className="tooltip-row">
              <span className="tooltip-label">Total Cases</span>
              <span className="tooltip-value">{data.count}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Prevalence</span>
              <span className="tooltip-value">{data.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard data...</div>;

  // Professional color palette
  const areaColor = '#3B82F6';
  const areaGradientStart = 'rgba(59, 130, 246, 0.1)';
  const areaGradientEnd = 'rgba(59, 130, 246, 0)';
  
  const gradeColors = {
    'A+': '#10B981',
    'A': '#34D399',
    'B+': '#F59E0B',
    'B': '#FBBF24',
    'C': '#F97316',
    'D': '#EF4444'
  };
  
  const diseaseColors = ['#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E', '#FB923C'];

  const totalUsers = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.cumulativeUsers || 0 : 0;
  const totalDiseaseCases = diseaseData.reduce((sum, disease) => sum + disease.count, 0);
  const topDisease = diseaseData[0]?.name.replace(/_/g, ' ') || 'N/A';
  const avgUsers = monthlyData.length > 0 ? Math.round(monthlyData.reduce((sum, m) => sum + m.newUsers, 0) / monthlyData.length) : 0;
  const totalAnalyses = gradeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* User Growth Chart - Corporate Style */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-section">
              <h3 className="chart-title">User Acquisition Trend</h3>
              <p className="chart-subtitle">Monthly active user growth</p>
            </div>
            <div className="metric-group">
              <div className="metric">
                <span className="metric-label">Total Users</span>
                <span className="metric-value">{totalUsers.toLocaleString()}</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric">
                <span className="metric-label">Monthly Avg</span>
                <span className="metric-value">{avgUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={areaColor} stopOpacity={0.12}/>
                    <stop offset="100%" stopColor={areaColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  stroke="#E2E8F0" 
                  strokeWidth={1} 
                  vertical={false} 
                  strokeDasharray="3 3" 
                  horizontal={true}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 400 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                  dy={6}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 400 }} 
                  tickLine={false} 
                  axisLine={false} 
                  width={35}
                  allowDecimals={false}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: areaColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke={areaColor} 
                  strokeWidth={2} 
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: areaColor, stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skin Grade Distribution - Corporate Style */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-section">
              <h3 className="chart-title">Skin Health Assessment</h3>
              <p className="chart-subtitle">Grade distribution analysis</p>
            </div>
            <div className="metric-group">
              <div className="metric">
                <span className="metric-label">Total Analyses</span>
                <span className="metric-value">{totalAnalyses}</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric">
                <span className="metric-label">Avg Grade</span>
                <span className="metric-value">B+</span>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={gradeData} 
                margin={{ top: 5, right: 5, left: -10, bottom: 5 }} 
                barGap={8} 
                barCategoryGap={24}
              >
                <CartesianGrid 
                  stroke="#E2E8F0" 
                  strokeWidth={1} 
                  vertical={false} 
                  strokeDasharray="3 3" 
                  horizontal={true}
                />
                <XAxis 
                  dataKey="grade" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                  dy={6}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 400 }} 
                  tickLine={false} 
                  axisLine={false} 
                  width={35}
                  allowDecimals={false}
                />
                <Tooltip content={<GradeTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar 
                  dataKey="count" 
                  radius={[2, 2, 0, 0]} 
                  maxBarSize={36}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {gradeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={gradeColors[entry.grade]} 
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skin Disease Distribution - Corporate Style Full Width */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <div className="chart-title-section">
              <h3 className="chart-title">Disease Prevalence Analysis</h3>
              <p className="chart-subtitle">Most frequently diagnosed conditions</p>
            </div>
            <div className="metric-group">
              <div className="metric">
                <span className="metric-label">Total Cases</span>
                <span className="metric-value">{totalDiseaseCases.toLocaleString()}</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric">
                <span className="metric-label">Leading Condition</span>
                <span className="metric-value">{topDisease}</span>
              </div>
            </div>
          </div>
          {diseaseData.length > 0 ? (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart 
                  data={diseaseData} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
                  barGap={6}
                  barCategoryGap={12}
                >
                  <CartesianGrid 
                    stroke="#E2E8F0" 
                    strokeWidth={1} 
                    horizontal={true} 
                    vertical={false} 
                    strokeDasharray="3 3" 
                  />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 400 }} 
                    tickLine={false} 
                    axisLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                    allowDecimals={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tickFormatter={(value) => value.replace(/_/g, ' ')}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip content={<DiseaseTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <ReferenceLine x={0} stroke="#CBD5E1" strokeWidth={1} />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 2, 2, 0]} 
                    maxBarSize={24}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {diseaseData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={diseaseColors[index % diseaseColors.length]} 
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p>No disease data available</p>
              <p className="empty-subtitle">Start analyzing skin conditions to see statistics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;