import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseChimney, faRightFromBracket, faBell } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const API_URL = 'http://localhost:5000';
const socket = io(API_URL);

// Compare two complaint arrays by _id
const arraysAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i]._id !== arr2[i]._id) return false;
  }
  return true;
};

const AdminDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const prevComplaintsRef = useRef([]);

  // New complaint modal state (if needed)
  const [showModal, setShowModal] = useState(false);
  const [complaintData, setComplaintData] = useState({
    location: '',
    description: '',
    image: null
  });

  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  // Silent background fetch for initial data
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!arraysAreEqual(sorted, prevComplaintsRef.current)) {
        setComplaints(sorted);
        prevComplaintsRef.current = sorted;
      }
    } catch (err) {
      const msg = err.response?.data.message || 'Error fetching complaints';
      setError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchComplaints();

    // Listen for real-time new complaint events
    socket.on('newComplaint', (newComplaint) => {
      setComplaints(prev => {
        const updated = [newComplaint, ...prev];
        prevComplaintsRef.current = updated;
        return updated;
      });
      toast.info('New complaint received');
    });

    // Listen for complaint reply updates
    socket.on('complaintReply', (updatedComplaint) => {
      setComplaints(prev =>
        prev.map(c => (c._id === updatedComplaint._id ? updatedComplaint : c))
      );
      prevComplaintsRef.current = prevComplaintsRef.current.map(c =>
        c._id === updatedComplaint._id ? updatedComplaint : c
      );
      toast.info('Complaint updated with reply');
    });

    return () => {
      socket.off('newComplaint');
      socket.off('complaintReply');
    };
  }, [token]);

  // Update complaint status
  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/complaints/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(prev => prev.map(c => (c._id === id ? res.data.complaint : c)));
      prevComplaintsRef.current = prevComplaintsRef.current.map(c =>
        c._id === id ? res.data.complaint : c
      );
      toast.success('Status updated');
    } catch (err) {
      const msg = err.response?.data.message || 'Error updating status';
      setError(msg);
      toast.error(msg);
    }
  };

  // Reply modal functions
  const openReplyModal = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setReplyText('');
    setShowReplyModal(true);
  };
  const closeReplyModal = () => {
    setShowReplyModal(false);
    setReplyText('');
    setSelectedComplaintId(null);
  };
  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.put(
        `${API_URL}/api/complaints/${selectedComplaintId}/reply`,
        { reply: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(prev => prev.map(c => (c._id === selectedComplaintId ? res.data.complaint : c)));
      prevComplaintsRef.current = prevComplaintsRef.current.map(c =>
        c._id === selectedComplaintId ? res.data.complaint : c
      );
      toast.success('Reply sent');
      closeReplyModal();
    } catch (err) {
      const msg = err.response?.data.message || 'Error sending reply';
      setError(msg);
      toast.error(msg);
    }
  };

  // Render complaint image URL
  const renderImage = (complaint) => {
    if (complaint.image && complaint.image.data) {
      return `${API_URL}/api/complaints/${complaint._id}/image`;
    }
    return "https://via.placeholder.com/150";
  };

  // Filter complaints based on search query
  const filteredComplaints = complaints.filter(c => {
    const dateStr = new Date(c.createdAt).toLocaleDateString();
    return (
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dateStr.includes(searchQuery)
    );
  });

  // Modal functions for new complaint
  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setComplaintData({ location: '', description: '', image: null });
  };
  const handleComplaintChange = (e) => setComplaintData({ ...complaintData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setComplaintData({ ...complaintData, image: e.target.files[0] });
  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('location', complaintData.location);
      formData.append('description', complaintData.description);
      if (complaintData.image) formData.append('image', complaintData.image);
      const res = await axios.post(`${API_URL}/api/complaints`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data.message);
      closeModal();
    } catch (err) {
      const msg = err.response?.data.message || 'Error submitting complaint';
      toast.error(msg);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !user.email) navigate('/login');
  }, [user, navigate]);

  return (
    <div className="admin-dashboard-page">
      <ToastContainer />

      {/* Navbar */}
      <div className="dashboard-navbar">
        <div className="navbar-left" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faHouseChimney} style={{ color: 'cyan', fontSize: '1.5rem', marginRight: '0.5rem' }} />
          <span className="welcome-text">Welcome, Admin</span>
        </div>
        <div className="navbar-right">
          <div className="notification-icon" title="New Complaints">
            <FontAwesomeIcon icon={faBell} style={{ color: 'cyan', fontSize: '1.5rem' }} />
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <FontAwesomeIcon icon={faRightFromBracket} style={{ color: 'cyan', fontSize: '1.4rem' }} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by location, description, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Title */}
      <h2 className="complaints-title">Your Complaints</h2>

      {/* Complaint Cards */}
      <div className="cards-container">
        {filteredComplaints.length === 0 ? (
          <p className="no-complaints-text">No complaints found.</p>
        ) : (
          filteredComplaints.map(comp => (
            <div key={comp._id} className={`complaint-card ${comp.reply && comp.reply.trim() !== "" ? 'card-replied' : 'card-no-reply'}`}>
              <div className="card-image" onClick={() => window.open(renderImage(comp), '_blank')}>
                <img src={renderImage(comp)} alt="Complaint" className="complaint-card-img" />
              </div>
              <div className="card-info">
                <h3>Location:<strong>{comp.location}</strong></h3>
                {/* New line to display the user who raised the complaint */}
                <p>
                  <strong>Complaint by:</strong> {comp.user && comp.user.name ? comp.user.name : "Unknown"}
                </p>
                <p><strong>Description:</strong> {comp.description}</p>
                <p><strong>Status:</strong> {comp.status}</p>
                <p>
                  <strong>Reply:</strong>{" "}
                  <span className={comp.reply && comp.reply.trim() !== "" ? 'reply-green' : 'reply-red'}>
                    {comp.reply && comp.reply.trim() !== "" ? comp.reply : "No Reply"}
                  </span>
                </p>
                <p className="complaint-date">{new Date(comp.createdAt).toLocaleString()}</p>
                <div className="card-actions">
                  {comp.status === 'Pending' ? (
                    <button onClick={() => updateStatus(comp._id, 'Resolved')} className="small-btn resolve-btn">
                      Resolve
                    </button>
                  ) : (
                    <button onClick={() => updateStatus(comp._id, 'Pending')} className="small-btn pending-btn">
                      Pending
                    </button>
                  )}
                  <button onClick={() => openReplyModal(comp._id)} className="small-btn reply-btn">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating New Complaint Button */}
      <div className="floating-button" onClick={openModal}>+</div>

      {/* Modal for New Complaint */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Complaint</h2>
            <form onSubmit={submitComplaint}>
              <div className="form-group">
                <label>Location:</label>
                <input type="text" name="location" value={complaintData.location} onChange={handleComplaintChange} required />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea name="description" value={complaintData.description} onChange={handleComplaintChange} required></textarea>
              </div>
              <div className="form-group">
                <label>Image (optional):</label>
                <input type="file" name="image" onChange={handleFileChange} />
              </div>
              <button type="submit" className="btn">Submit</button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="modal-overlay" onClick={closeReplyModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reply to Complaint</h2>
            <div className="form-group">
              <label>Reply:</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply here..."
              ></textarea>
            </div>
            <button onClick={submitReply} className="btn">Send Reply</button>
            <button onClick={closeReplyModal} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
