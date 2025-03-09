import React, { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouseChimney, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './UserDashboard.css';

const API_URL = 'http://localhost:5000';
// Create a single socket instance for this component
const socket = io(API_URL);

// Helper: compare complaint arrays by _id
const arraysAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i]._id !== arr2[i]._id) return false;
  }
  return true;
};

const UserDashboard = () => {
  const { user, token, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile state
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    contact: user?.contact || ""
  });
  const dropdownRef = useRef(null);

  // Complaints and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState([]);
  const prevComplaintsRef = useRef([]);

  // Modal state for new complaint
  const [showModal, setShowModal] = useState(false);
  const [complaintData, setComplaintData] = useState({
    location: '',
    description: '',
    image: null
  });

  // Modal state for displaying an image
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageURL, setSelectedImageURL] = useState('');

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  // Silent initial fetch (no spinner) for user's complaints
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!arraysAreEqual(sorted, prevComplaintsRef.current)) {
        setComplaints(sorted);
        prevComplaintsRef.current = sorted;
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching complaints');
    }
  };

  useEffect(() => {
    // Do the initial fetch silently on mount
    fetchComplaints();

    // Listen for new complaints (if created by this user)
    socket.on('newComplaint', (complaint) => {
      // We assume that the complaint belongs to the logged-in user if it appears in their list.
      setComplaints(prev => {
        const updated = [complaint, ...prev];
        prevComplaintsRef.current = updated;
        return updated;
      });
    });

    // Listen for reply events; update the complaint immediately by matching _id.
    socket.on('complaintReply', (updatedComplaint) => {
      setComplaints(prev => {
        const updated = prev.map(c =>
          c._id === updatedComplaint._id ? updatedComplaint : c
        );
        prevComplaintsRef.current = updated;
        return updated;
      });
    });

    return () => {
      socket.off('newComplaint');
      socket.off('complaintReply');
    };
  }, [token]);

  // Profile functions
  const toggleProfile = () => setProfileOpen(!profileOpen);
  const handleProfileChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });
  const handleProfileSave = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/user`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      setUser(res.data.user);
      setEditMode(false);
      setProfileOpen(false);
    } catch (err) {
      toast.error(err.response?.data.message || 'Error updating profile');
    }
  };

  // Filter complaints based on search query
  const filteredComplaints = complaints.filter((c) => {
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
  const handleComplaintChange = (e) =>
    setComplaintData({ ...complaintData, [e.target.name]: e.target.value });
  const handleFileChange = (e) =>
    setComplaintData({ ...complaintData, image: e.target.files[0] });
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
      toast.error(err.response?.data.message || 'Error submitting complaint');
    }
  };

  // Image modal functions
  const openImageModal = (url) => {
    setSelectedImageURL(url);
    setImageModalOpen(true);
  };
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageURL('');
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !user.email) navigate('/login');
  }, [user, navigate]);

  return (
    <div className="user-dashboard-page">
      <ToastContainer />

      {/* Navbar */}
      <div className="dashboard-navbar">
        <div className="navbar-left" onClick={() => navigate('/')}>
          <FontAwesomeIcon
            icon={faHouseChimney}
            style={{ color: 'cyan', fontSize: '1.5rem', marginRight: '1rem' }}
          />
          <span className="welcome-text">Welcome, {user.name}</span>
        </div>
        <div className="navbar-right">
          <div className="profile-icon" onClick={toggleProfile}>
            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
          </div>
          {profileOpen && (
            <div className="profile-dropdown" ref={dropdownRef}>
              {editMode ? (
                <div className="profile-edit">
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleProfileChange}
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleProfileChange}
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    name="contact"
                    value={editData.contact}
                    onChange={handleProfileChange}
                    placeholder="Contact"
                  />
                  <button onClick={handleProfileSave}>Save</button>
                </div>
              ) : (
                <div className="profile-info">
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Contact:</strong> {user.contact}
                  </p>
                  <button onClick={() => setEditMode(true)}>Edit</button>
                </div>
              )}
            </div>
          )}
          <button onClick={logout} className="logout-btn" title="Logout">
            <FontAwesomeIcon
              icon={faRightFromBracket}
              style={{ color: 'cyan', fontSize: '1.4rem' }}
            />
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
          filteredComplaints.map((comp) => (
            <div
              key={comp._id}
              className={`complaint-card ${
                comp.reply && comp.reply.trim() !== "" ? 'card-replied' : 'card-no-reply'
              }`}
            >
              <div
                className="card-image"
                onClick={() =>
                  openImageModal(`http://localhost:5000/api/complaints/${comp._id}/image`)
                }
              >
                {comp.image && comp.image.data ? (
                  <img
                    src={`http://localhost:5000/api/complaints/${comp._id}/image`}
                    alt="Complaint"
                    className="complaint-card-img"
                  />
                ) : (
                  <img
                    src="https://via.placeholder.com/100"
                    alt="No Image"
                    className="complaint-card-img"
                  />
                )}
              </div>
              <div className="card-info">
                <h3>
                  <strong>Location:</strong> {comp.location}
                </h3>
                <p>
                  <strong>Description:</strong> {comp.description}
                </p>
                <p>
                  <strong>Status:</strong> {comp.status}
                </p>
                <p>
                  <strong>Reply:</strong>{" "}
                  <span
                    className={
                      comp.reply && comp.reply.trim() !== "" ? 'reply-green' : 'reply-red'
                    }
                  >
                    {comp.reply && comp.reply.trim() !== "" ? comp.reply : "No Reply"}
                  </span>
                </p>
                <p className="complaint-date">
                  {new Date(comp.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating New Complaint Button */}
      <div className="floating-button" onClick={openModal}>
        +
      </div>

      {/* Modal for New Complaint */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Complaint</h2>
            <form onSubmit={submitComplaint}>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={complaintData.location}
                  onChange={handleComplaintChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={complaintData.description}
                  onChange={handleComplaintChange}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Image (optional):</label>
                <input type="file" name="image" onChange={handleFileChange} />
              </div>
              <button type="submit" className="btn">
                Submit
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Displaying Image */}
      {imageModalOpen && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImageURL} alt="Complaint Large" className="modal-image" />
            <button className="btn btn-secondary" onClick={closeImageModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
