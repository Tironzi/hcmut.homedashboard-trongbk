const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  state: { type: String, default: "OFF" },   // ON / OFF / PWM / SPEED
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Device", DeviceSchema);
