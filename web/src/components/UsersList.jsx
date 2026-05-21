import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import '../styles/userslist.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUsers();
    fetchWeeklyStats();
    fetchMonthlyStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_URL}/auth/all`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      let usersData = [];
      if (data.users && Array.isArray(data.users)) usersData = data.users;
      else if (data.data && Array.isArray(data.data)) usersData = data.data;
      else if (Array.isArray(data)) usersData = data;
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/weekly-stats`);
      const data = await response.json();
      if (data.success) setWeeklyStats(data.data);
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/monthly-stats`);
      const data = await response.json();
      if (data.success) setMonthlyStats(data.data);
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const genderStats = {
    total: users.length,
    male: users.filter(u => u.gender?.toLowerCase() === 'male').length,
    female: users.filter(u => u.gender?.toLowerCase() === 'female').length,
    other: users.filter(u => u.gender && !['male', 'female'].includes(u.gender.toLowerCase())).length,
    malePercentage: users.length ? ((users.filter(u => u.gender?.toLowerCase() === 'male').length / users.length) * 100).toFixed(1) : 0,
    femalePercentage: users.length ? ((users.filter(u => u.gender?.toLowerCase() === 'female').length / users.length) * 100).toFixed(1) : 0,
  };

  const ageGroups = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
  users.forEach(user => {
    if (user.age) {
      if (user.age >= 18 && user.age <= 24) ageGroups['18-24']++;
      else if (user.age >= 25 && user.age <= 34) ageGroups['25-34']++;
      else if (user.age >= 35 && user.age <= 44) ageGroups['35-44']++;
      else if (user.age >= 45 && user.age <= 54) ageGroups['45-54']++;
      else if (user.age >= 55) ageGroups['55+']++;
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || user.gender?.toLowerCase() === filterGender.toLowerCase();
    return matchesSearch && matchesGender;
  });

  const totalNewUsersThisWeek = weeklyStats.reduce((sum, day) => sum + day.newUsers, 0);
  const averageAge = users.reduce((sum, user) => sum + (user.age || 0), 0) / (users.filter(u => u.age).length || 1);
  const activeUsers = users.filter(u => u.role === 'user').length;

  // Chart Data
  const weeklyChartData = {
    labels: weeklyStats.map(day => day.date),
    datasets: [
      {
        label: 'New Users',
        data: weeklyStats.map(day => day.newUsers),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3B82F6',
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const monthlyChartData = {
    labels: monthlyStats.map(month => month.month),
    datasets: [
      {
        label: 'New Users',
        data: monthlyStats.map(month => month.newUsers),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8B5CF6',
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const genderChartData = {
    labels: ['Female', 'Male', 'Other'],
    datasets: [
      {
        data: [genderStats.female, genderStats.male, genderStats.other],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981'],
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const ageChartData = {
    labels: Object.keys(ageGroups),
    datasets: [
      {
        label: 'Users',
        data: Object.values(ageGroups),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8B5CF6',
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const cumulativeChartData = {
    labels: weeklyStats.map(day => day.date),
    datasets: [
      {
        label: 'Total Users',
        data: weeklyStats.map(day => day.cumulativeUsers),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#1E293B',
        bodyColor: '#64748B',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F1F5F9',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          color: '#64748B',
          font: { size: 11 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748B',
          font: { size: 11 },
        },
      },
    },
  };

  const genderChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#475569',
          font: { size: 11 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = genderStats.total;
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-error">
        <p>{error}</p>
        <button onClick={fetchUsers} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">User Analytics</h1>
        </div>
        <button onClick={fetchUsers} className="refresh-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-item">
          <span className="metric-value">{genderStats.total}</span>
          <span className="metric-label">Total</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-item">
          <span className="metric-value">{activeUsers}</span>
          <span className="metric-label">Active</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-item">
          <span className="metric-value">{Math.round(averageAge)}</span>
          <span className="metric-label">Avg Age</span>
        </div>
        <div className="metric-divider"></div>
        <div className="metric-item">
          <span className="metric-value">+{totalNewUsersThisWeek}</span>
          <span className="metric-label">This Week</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Directory
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-panel">
          <div className="two-columns">
            <div className="card">
              <div className="card-header">
                <h3>Gender</h3>
              </div>
              <div className="chart-container-small">
                <Doughnut data={genderChartData} options={genderChartOptions} />
              </div>
              <div className="gender-stats">
                <div className="gender-row">
                  <span>Female</span>
                  <span>{genderStats.female} ({genderStats.femalePercentage}%)</span>
                </div>
                <div className="gender-row">
                  <span>Male</span>
                  <span>{genderStats.male} ({genderStats.malePercentage}%)</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Age Groups</h3>
              </div>
              <div className="chart-container-small">
                <Bar data={ageChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              </div>
            </div>
          </div>

          <div className="card full-width">
            <div className="card-header">
              <h3>Recent Joiners</h3>
            </div>
            <div className="recent-list">
              {users.slice(0, 4).map(user => (
                <div key={user._id} className="recent-item">
                  <div className="recent-avatar">
                    {user.profileImage?.url ? (
                      <img src={user.profileImage.url} alt={user.name} />
                    ) : (
                      <div className="avatar-initial">{user.name?.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="recent-info">
                    <div className="recent-name">{user.name}</div>
                    <div className="recent-email">{user.email}</div>
                  </div>
                  <div className="recent-date">{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="tab-panel">
          <div className="card full-width">
            <div className="card-header">
              <h3>Weekly Registrations</h3>
            </div>
            <div className="chart-container-large">
              <Bar data={weeklyChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card full-width">
            <div className="card-header">
              <h3>Monthly Registrations</h3>
            </div>
            <div className="chart-container-large">
              <Bar data={monthlyChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card full-width">
            <div className="card-header">
              <h3>User Growth Trend</h3>
            </div>
            <div className="chart-container-large">
              <Line data={cumulativeChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { ...chartOptions.plugins.tooltip } } }} />
            </div>
          </div>
        </div>
      )}

      {/* Directory Tab */}
      {activeTab === 'users' && (
        <div className="tab-panel">
          <div className="filters">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
              <option value="all">All</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="table-info">{filteredUsers.length} users</div>

          <div className="table-container">
            <table className="user-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Age</th><th>Gender</th><th>Role</th></tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 10).map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        {user.profileImage?.url ? (
                          <img src={user.profileImage.url} alt={user.name} className="user-avatar" />
                        ) : (
                          <div className="user-avatar-placeholder">{user.name?.charAt(0).toUpperCase()}</div>
                        )}
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>{user.age || '-'}</td>
                    <td><span className={`gender-tag ${user.gender?.toLowerCase()}`}>{user.gender || '-'}</span></td>
                    <td><span className={`role-tag ${user.role}`}>{user.role || 'user'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;