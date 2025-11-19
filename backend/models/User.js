const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { 
    collection: "data_user" // 🔹 chỉ rõ collection
  }
);

// Dùng module.exports thay vì export default
module.exports = mongoose.model("User", userSchema);
