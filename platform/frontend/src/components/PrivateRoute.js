import React from 'react';
import { Navigate } from 'react-router-dom';

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

const PrivateRoute = ({ children, adminOnly }) => {
  const token = localStorage.getItem('token');
  const user = getUser();

  if (!token) {
    return <Navigate to="/login" />;
  }
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

export default PrivateRoute; 