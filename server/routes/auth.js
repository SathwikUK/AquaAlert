// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const VillageUser = require('../models/VillageUser'); // or "VillageUser.js"
require('dotenv').config();
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, contact, email, password, role } = req.body;
    if (!name || !contact || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }
    let user = await VillageUser.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new VillageUser({ name, contact, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please enter all required fields' });

    const user = await VillageUser.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      contact: user.contact
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user - Update user details
router.put('/user', auth, async (req, res) => {
  try {
    const { name, contact, email } = req.body;
    if (!name || !contact || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await VillageUser.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.contact = contact;
    user.email = email;
    await user.save();

    // Return updated user info
    const payload = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      contact: user.contact
    };
    res.json({ message: 'User updated successfully', user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
