require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

// ========================== MODEL ==========================
let User = require('./models/User');
const Device = require("./models/Device"); // nhớ import
if (User.default) User = User.default;

// ========================== CONFIG ==========================
const PORT = process.env.PORT || 5000;

// --- MongoDB ---
const MONGO_URI = process.env.MONGO_URI;

// --- MQTT HiveMQ Cloud ---
const MQTT_URL = process.env.MQTT_URL;
const MQTT_OPTIONS = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: process.env.MQTT_RECONNECT_PERIOD || 2000
};


// ========================== INIT APP ==========================
const app = express();
const server = http.createServer(app);

// --- CẤU HÌNH DANH SÁCH CHO PHÉP TRUY CẬP (CORS) ---
const allowedOrigins = [
  process.env.ORIGIN_FRONTEND,             // 1. Link Online (lấy từ file .env)
  "https://homedashboard-trongbk.online",  // 2. Link Online (dự phòng viết cứng)
  "http://127.0.0.1:3000"                  // 3. Link Localhost (để bạn code ở nhà)
];

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MIDDLEWARE (Express)
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// ========================== CONNECT MONGODB ==========================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => console.error('❌ Lỗi MongoDB:', err));

// ========================== AUTH API ==========================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY_123',
      { expiresIn: '1h' }
    );

    res.json({ token, username: user.username });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});


// =============================================================
// 🔥 MQTT + SOCKET.IO — REALTIME SMARTHOME
// =============================================================

// MQTT connect
const mqttClient = mqtt.connect(MQTT_URL, MQTT_OPTIONS);
// ---- Update climate ----


let lastState = {
  devices: {}
};


mqttClient.on("connect", () => {
  console.log("🌐 MQTT Connected (HiveMQ Cloud)");

  mqttClient.subscribe("smarthome/report", (err) => {
    if (!err) console.log("📡 Subscribed → smarthome/report");
    else console.error("❌ Subscribe error:", err);
  });
  mqttClient.subscribe("smarthome/dht11", (err) => {
    if (!err) console.log("📡 Subscribed → smarthome/dht11");
    else console.error("❌ Subscribe error:", err);
  });
});
// ================= MQTT ==================

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 MQTT:", data);

    // ====== CLIMATE ======
    if (data.temp !== undefined || data.humi !== undefined || data.air !== undefined) {
      lastState.temp = data.temp;
      lastState.humi = data.humi;
      lastState.air = data.air;

      io.emit("climate_update", {
        temperature: data.temp,
        humidity: data.humi,
        air: data.air
      });
    }

    // ====== DEVICE ======
    if (data.device && data.state) {
      const deviceId = data.device;
      const state = data.state;

      lastState.devices[deviceId] = state;

      await Device.findOneAndUpdate(
        { deviceId },
        { state, updatedAt: Date.now() },
        { upsert: true }
      );

      io.emit("device_update", { device: deviceId, state });
    }

  } catch (err) {
    console.error("❌ MQTT JSON Error:", err);
  }
});



// =============================================================
// 🔥 OPTIONAL API — FRONTEND GỬI LỆNH ĐIỀU KHIỂN → MQTT 
// (hiện tại không xài restAPI nhưng để xem cách hoạt động của restAPI)
// =============================================================
app.post('/api/device/control', (req, res) => {
  const { device, state } = req.body;

  const payload = JSON.stringify({ device, state });

  mqttClient.publish("smarthome/control", payload, () => {
    console.log("📤 MQTT Published:", payload);
  });

  res.json({ ok: true });
});


// =============================================================
// 🔥 SOCKET.IO HANDLER
// =============================================================
io.on("connection", async (socket) => {
  console.log("🟢 Client Connected:", socket.id);

// ====================================================
  // HÀM GỬI DỮ LIỆU (Tách ra để tái sử dụng)
  // ====================================================
  const sendCurrentState = async () => {
    // 1. Gửi Climate
    socket.emit("climate_update", {
      temperature: lastState.temp || 0,
      humidity: lastState.humi || 0,
      air: lastState.air || "Good",
    });

    // 2. Gửi Devices từ DB
    try {
      const devicesFromDb = await Device.find({});
      const deviceMap = {};
      devicesFromDb.forEach(d => {
        deviceMap[d.deviceId] = d.state;
        lastState.devices[d.deviceId] = d.state; 
      });
      console.log("📤 Sync state cho client:", socket.id);
      socket.emit("device_all_update", deviceMap);
    } catch (err) {
      console.error("Lỗi lấy DB:", err);
    }
  };

  // Gửi ngay khi vừa connect (giữ nguyên logic cũ của bạn)
  sendCurrentState();

  // 🔥 THÊM MỚI: Lắng nghe yêu cầu đồng bộ từ Frontend
  socket.on("request_sync_state", () => {
    console.log("🔄 Client yêu cầu đồng bộ lại state:", socket.id);
    sendCurrentState();
  });
  // ============================================
  // 🔥 NHẬN LỆNH TỪ FRONTEND → MQTT + DB + realtime
  // ============================================
  socket.on("device_control", async (data) => {
    console.log("📥 Web gửi điều khiển:", data);

    // 1) Publish xuống ESP32
    mqttClient.publish("smarthome/control", JSON.stringify(data));

    // 2) Update cache ngay
    lastState.devices[data.device] = data.state;

    // 3) Lưu vào DB
    await Device.findOneAndUpdate(
      { deviceId: data.device },
      { state: data.state, updatedAt: Date.now() },
      { upsert: true }
    );

    // 4) Phát realtime cho TẤT CẢ web
    io.emit("device_update", data);
  });
});




// =============================================================
// 🚀 START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
