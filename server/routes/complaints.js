// backend/routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');

// Use memory storage so files are available as Buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/complaints - Submit a new complaint (Villager only)
router.post('/complaints', auth, upload.single('image'), async (req, res) => {
  try {
    const { location, description } = req.body;
    if (!location || !description)
      return res.status(400).json({ message: 'Location and description are required' });
    
    const complaintData = {
      user: req.user.id,
      location,
      description,
    };
    
    if (req.file) {
      complaintData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    const complaint = new Complaint(complaintData);
    await complaint.save();

    // Emit real‑time notification to admins
    req.io.emit('newComplaint', complaint);

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints - Retrieve all complaints (Admin only)
router.get('/complaints', adminAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('user', 'name email');
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/complaints/:id/status - Update complaint status (Admin only)
router.put('/complaints/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Pending', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!complaint)
      return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint status updated', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/complaints/:id/reply - Admin sends a reply to a complaint
router.put('/complaints/:id/reply', adminAuth, async (req, res) => {
  try {
    const { reply } = req.body;
    if (typeof reply !== 'string') {
      return res.status(400).json({ message: 'Invalid reply message' });
    }
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { reply },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    // Emit socket event so that user can see the reply in real time
    req.io.emit('complaintReply', complaint);
    res.json({ message: 'Reply sent', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints/my - Retrieve complaints for logged in user (Villager)
router.get('/complaints/my', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/complaints/:id/image - Retrieve a complaint's image
router.get('/complaints/:id/image', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (complaint && complaint.image && complaint.image.data) {
      res.set('Content-Type', complaint.image.contentType);
      return res.send(complaint.image.data);
    } else {
      res.status(404).json({ message: 'No image found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
