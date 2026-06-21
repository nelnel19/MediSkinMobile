// Dashboard.jsx - SLIGHTLY SMALLER VERSION
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
  const [loading, setLoading] = useState(true);

  const PYTHON_API_URL = 'https://mediskin-backend-python.onrender.com';

  useEffect(() => {
    Promise.all([
      fetchMonthlyStats(),
      fetchGradeDistribution(),
      fetchDiseaseDistribution(),
      fetchGenderDistribution()
    ]).finally(() => setLoading(false));
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
      </div>
    </div>
  );
};

export default Dashboard;