// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import './AdminDashboard.css';

// Connect to Socket.IO on the backend
const socket = io('http://localhost:5000');

const AdminDashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');

  // Fetch all complaints from the API
  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(res.data);
    } catch (err) {
      setError(err.response?.data.message || 'Error fetching complaints');
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Listen for new complaint notifications
    socket.on('newComplaint', (newComplaint) => {
      setComplaints((prev) => [newComplaint, ...prev]);
    });

    return () => {
      socket.off('newComplaint');
    };
  }, [token]);

  // Update complaint status
  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/complaints/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? res.data.complaint : c))
      );
    } catch (err) {
      setError(err.response?.data.message || 'Error updating status');
    }
  };

  // Render image from stored binary data
  const renderImage = (complaint) => {
    if (complaint.image && complaint.image.data && complaint.image.data.data && complaint.image.data.data.length > 0) {
      const base64String = btoa(
        new Uint8Array(complaint.image.data.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      return `data:${complaint.image.contentType};base64,${base64String}`;
    }
    return "https://via.placeholder.com/150";
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="complaints-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>User</th>
                <th>Location</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => (
                <tr key={complaint._id}>
                  <td>
                    <img
                      src={renderImage(complaint)}
                      alt="Complaint"
                      className="complaint-image"
                    />
                  </td>
                  <td>
                    {complaint.user && complaint.user.name 
                      ? complaint.user.name 
                      : "No Name"}
                  </td>
                  <td>{complaint.location}</td>
                  <td>{complaint.description}</td>
                  <td>{complaint.status}</td>
                  <td>{new Date(complaint.createdAt).toLocaleString()}</td>
                  <td>
                    {complaint.status === 'Pending' ? (
                      <button
                        onClick={() => updateStatus(complaint._id, 'Resolved')}
                        className="small-btn resolve-btn"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(complaint._id, 'Pending')}
                        className="small-btn pending-btn"
                      >
                        Mark as Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
