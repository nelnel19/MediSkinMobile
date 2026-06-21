// App.js - WITH REPORTS ROUTE, HOMEPAGE, AND LOGIN (Using HashRouter)
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UsersList from './components/UsersList';
import FaceAnalysis from './components/FaceAnalysis';
import SkinAnalysis from './components/SkinAnalysis';
import Reports from './components/Reports';
import Panel from './components/Panel';
import Homepage from './components/Homepage';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default route - redirect to homepage */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Login route - no Panel sidebar */}
          <Route path="/login" element={<Login />} />
          
          {/* Homepage route - no Panel sidebar */}
          <Route path="/home" element={<Homepage />} />
          
          {/* Dashboard routes with Panel */}
          <Route path="/*" element={
            <>
              <Panel />
              <div className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<UsersList />} />
                  <Route path="/face-analysis" element={<FaceAnalysis />} />
                  <Route path="/skin-analysis" element={<SkinAnalysis />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;