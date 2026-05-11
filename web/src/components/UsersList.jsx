// UsersList.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import '../styles/userslist.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_URL}/auth/all`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      let usersData = [];
      if (data.users && Array.isArray(data.users)) {
        usersData = data.users;
      } else if (data.data && Array.isArray(data.data)) {
        usersData = data.data;
      } else if (Array.isArray(data)) {
        usersData = data;
      }
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: users.length,
    male: users.filter(u => u.gender?.toLowerCase() === 'male').length,
    female: users.filter(u => u.gender?.toLowerCase() === 'female').length,
    other: users.filter(u => u.gender && !['male', 'female'].includes(u.gender.toLowerCase())).length
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = 
      filterGender === 'all' || 
      user.gender?.toLowerCase() === filterGender.toLowerCase();
    return matchesSearch && matchesGender;
  });

  if (loading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-error">
        <p>{error}</p>
        <button onClick={fetchUsers} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1 className="users-title">Users</h1>
        <button onClick={fetchUsers} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.male}</span>
          <span className="stat-label">Male</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.female}</span>
          <span className="stat-label">Female</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.other}</span>
          <span className="stat-label">Other</span>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="gender-filter"
        >
          <option value="all">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <p>No users found</p>
        </div>
      ) : (
        <>
          <div className="table-info">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td className="user-cell">
                      <div className="user-info">
                        {user.profileImage?.url ? (
                          <img 
                            src={user.profileImage.url} 
                            alt={user.name}
                            className="avatar"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>{user.age || '-'}</td>
                    <td>
                      <span className="gender-badge">
                        {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersList;