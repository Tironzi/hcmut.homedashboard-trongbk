const mongoose = require('mongoose');

const energySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  totalWh: { type: Number, default: 0 },
  // 👇 QUAN TRỌNG: Phải là [Number] để báo cho Mongo biết đây là Mảng
  hourly: { 
    type: [Number], 
    default: new Array(24).fill(0) 
  }
});

module.exports = mongoose.model('Energy', energySchema);
// quan trọng