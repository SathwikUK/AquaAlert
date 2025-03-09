// backend/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'VillageUser', required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    image: {
      data: Buffer,
      contentType: String
    },
    status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
    reply: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
