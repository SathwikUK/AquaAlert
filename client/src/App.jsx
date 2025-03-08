// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AuthContext } from './context/AuthContext';

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user
              ? user.role === 'admin'
                ? <Navigate to="/admin" />
                : <Navigate to="/user" />
              : <Login />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/user"
          element={user && user.role !== 'admin' ? <UserDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
