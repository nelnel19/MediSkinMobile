import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import UsersList from './components/UsersList';
import FaceAnalysis from './components/FaceAnalysis';
import SkinAnalysis from './components/SkinAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/face-analysis" element={<FaceAnalysis />} />
          <Route path="/skin-analysis" element={<SkinAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;