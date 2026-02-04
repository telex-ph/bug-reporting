import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard';
import BugList from './pages/BugList';
import BugDetails from './pages/BugDetails';
import CreateBug from './pages/CreateBug';
import AdminManagement from './pages/AdminManagement';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/bugs" element={<PrivateRoute><BugList /></PrivateRoute>} />
            <Route path="/bugs/:id" element={<PrivateRoute><BugDetails /></PrivateRoute>} />
            <Route path="/bugs/create" element={<PrivateRoute><CreateBug /></PrivateRoute>} />
            <Route path="/admins" element={<PrivateRoute><AdminManagement /></PrivateRoute>} />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;