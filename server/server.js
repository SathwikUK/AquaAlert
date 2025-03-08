// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for real‑time notifications
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Make io accessible in routes via req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', complaintRoutes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
