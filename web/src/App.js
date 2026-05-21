import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UsersList from './components/UsersList';
import FaceAnalysis from './components/FaceAnalysis';
import SkinAnalysis from './components/SkinAnalysis';
import Panel from './components/Panel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Panel />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/face-analysis" element={<FaceAnalysis />} />
            <Route path="/skin-analysis" element={<SkinAnalysis />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;