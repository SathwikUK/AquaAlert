// backend/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    image: {
      data: Buffer,
      contentType: String
    },
    status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
    reply: { type: String, default: "" }  // New field for admin reply
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
