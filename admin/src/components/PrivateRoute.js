import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Check if user is authenticated (simple localStorage check)
  const isAuthenticated = localStorage.getItem('adminToken');

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  // Render children if authenticated
  return children;
};

export default PrivateRoute;