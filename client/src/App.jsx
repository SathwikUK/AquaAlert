// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';  // <--- NEW
import { AuthContext } from './context/AuthContext';

// Import global wave background & resets
import './index.css';

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/*
          At the root "/", we check if the user is logged in.
          - If user is logged in and role === 'admin', go to /admin
          - If user is logged in and role !== 'admin', go to /user
          - Otherwise, show the public HomePage
        */}
        <Route
          path="/"
          element={
            user
              ? user.role === 'admin'
                ? <Navigate to="/admin" />
                : <Navigate to="/user" />
              : <HomePage />
          }
        />

        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/user"
          element={
            user && user.role !== 'admin'
              ? <UserDashboard />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
