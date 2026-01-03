const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['fire', 'motion', 'door'] // Chỉ chấp nhận 3 loại này
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now } // Tự động lấy giờ hiện tại
});

module.exports = mongoose.model('Notification', notificationSchema);