import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import BugDetails from './pages/BugDetails/BugDetails';
import Login from './pages/Login/Login';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /admin/login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Redirect /admin to /admin/login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Login Route (No Layout) */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Routes (With Layout) */}
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/bug-list" 
          element={
            <PrivateRoute>
              <Layout><div style={{padding: '2rem'}}>Bug List - Coming Soon</div></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/bug-details/:id" 
          element={
            <PrivateRoute>
              <Layout><BugDetails /></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/create-bug" 
          element={
            <PrivateRoute>
              <Layout><div style={{padding: '2rem'}}>Create Bug - Coming Soon</div></Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <PrivateRoute>
              <Layout><div style={{padding: '2rem'}}>Settings - Coming Soon</div></Layout>
            </PrivateRoute>
          } 
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;