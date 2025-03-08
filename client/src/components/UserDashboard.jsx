// src/components/UserDashboard.jsx
import React, { useContext, useState } from 'react';
import axios from 'axios';
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
    } catch (err) {
      setError(err.response?.data.message || 'Error submitting complaint');
      setMessage('');
    }
  };

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
      </div>
    </div>
  );
};

export default UserDashboard;
