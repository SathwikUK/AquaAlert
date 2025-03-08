// src/components/UserDashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const [complaintData, setComplaintData] = useState({
    location: '',
    description: '',
    image: null
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userComplaints, setUserComplaints] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setComplaintData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setComplaintData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('location', complaintData.location);
    formData.append('description', complaintData.description);
    if (complaintData.image) {
      formData.append('image', complaintData.image);
    }
    try {
      const res = await axios.post('http://localhost:5000/api/complaints', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(res.data.message);
      setError('');
      setComplaintData({ location: '', description: '', image: null });
      fetchUserComplaints();
    } catch (err) {
      setError(err.response?.data.message || 'Error submitting complaint');
      setMessage('');
    }
  };

  const fetchUserComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserComplaints(res.data);
    } catch (err) {
      console.error("Error fetching user complaints:", err);
    }
  };

  useEffect(() => {
    fetchUserComplaints();

    // Set up Socket.IO for real-time reply updates.
    const socket = io('http://localhost:5000');
    socket.on('complaintReply', (updatedComplaint) => {
      // Only update if the complaint belongs to this user.
      if (updatedComplaint.user === user._id) {
        setUserComplaints((prev) =>
          prev.map((c) => (c._id === updatedComplaint._id ? updatedComplaint : c))
        );
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [token, user._id]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <div className="dashboard-header">
          <div>
            <h2>User Dashboard</h2>
            <p>Welcome, {user.name}</p>
          </div>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
        <div className="user-details">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Contact:</strong> {user.contact}</p>
        </div>
        <div className="complaint-form">
          <h3>Submit a Complaint</h3>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={complaintData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                className="form-input"
                value={complaintData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Image (optional):</label>
              <input type="file" name="image" onChange={handleFileChange} className="form-input"/>
            </div>
            <button type="submit" className="btn">Submit Complaint</button>
          </form>
        </div>
        <div className="user-complaints">
          <h3>Your Complaints</h3>
          {userComplaints.length === 0 ? (
            <p>No complaints submitted yet.</p>
          ) : (
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Reply</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {userComplaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td>{complaint.location}</td>
                    <td>{complaint.description}</td>
                    <td>{complaint.status}</td>
                    <td>{complaint.reply && complaint.reply.trim() !== "" ? complaint.reply : "No Reply"}</td>
                    <td>{new Date(complaint.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
