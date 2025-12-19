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
const Device = require("./models/Device");
if (User.default) User = User.default;

// ========================== CONFIG ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- MQTT HiveMQ Cloud ---
const MQTT_URL = process.env.MQTT_URL;
const MQTT_OPTIONS = {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: process.env.MQTT_RECONNECT_PERIOD || 2000,
};

// ========================== INIT APP ==========================
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.ORIGIN_FRONTEND,
  "http://localhost:3000"
];

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ==== SECURITY STATE TOÀN CỤC ====
const currentSecurityState = {
  call: true,
  sms: true,
  motion: true,
  motionStatus: false,
  fire: true,
  fireStatus: false,
  door: true,
  doorStatus: false,
  auto: true
};

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
const mqttClient = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

// ===Biến lưu trạng thái mới nhất=====
let lastState = { devices: {} };
let lastSimStatus = { at: 0, reg: 0, csq: 0 };
let lastMq2Status = { status: "CLEAR" };

mqttClient.subscribe("smarthome/report", (err) => {
  if (!err) console.log("📡 Subscribed → smarthome/report");
  else console.error("❌ Subscribe error: smarthome/report", err);
});
mqttClient.subscribe("smarthome/dht11", (err) => {
  if (!err) console.log("📡 Subscribed → smarthome/dht11");
  else console.error("❌ Subscribe error: smarthome/dht11", err);
});
mqttClient.subscribe("smarthome/sim_status", (err) => {
  if (!err) console.log("📡 Subscribed → smarthome/sim_status");
  else console.error("❌ Subscribe error: smarthome/sim_status", err);
});
mqttClient.subscribe("smarthome/mq2", (err) => {
  if (!err) console.log("📡 Subscribed → smarthome/mq2");
  else console.error("❌ Subscribe error: smarthome/mq2", err);
});
mqttClient.subscribe("smarthome/motion", (err) => {
  if (!err) console.log("📡 Subscribed → smarthome/motion");
  else console.error("❌ Subscribe error: smarthome/motion", err);
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
    if (data.device && data.state !== undefined) {
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

    // ===== SIM STATUS =====
    if (topic === "smarthome/sim_status") {
      if (data.at === 0) {
        data.reg = 0;
        data.csq = -1;
      }
      lastSimStatus = data;
      io.emit("sim_status", data);
    }

    // ===== MQ2 - GAS/SMOKE ALARM =====
    if (topic === "smarthome/mq2") {
      io.emit("mq2", data);
      lastMq2Status = data;
      // sync fireStatus if desired
      currentSecurityState.fireStatus = (data.status === "ALARM");
    }
    if (topic === "smarthome/motion") {
      const data = JSON.parse(message.toString());
      io.emit("motion", data);
      currentSecurityState.motionStatus = (data.status === "DETECTED");
    }

    // Sync other security state if your firmware sends them...
    // Example: custom topic or custom JSON content (TODO: user edit)

  } catch (err) {
    console.error("❌ MQTT JSON Error:", err);
  }
});

// =============================================================
// 🔥 SOCKET.IO HANDLER
// =============================================================
io.on("connection", async (socket) => {
  console.log("🟢 Client Connected:", socket.id);

  // GỬI ĐẦY ĐỦ TRẠNG THÁI NGAY KHI KẾT NỐI VÀ SAU KHI FE YÊU CẦU ĐỒNG BỘ
  const sendCurrentState = async () => {
    socket.emit("climate_update", {
      temperature: lastState.temp || 0,
      humidity: lastState.humi || 0,
      air: lastState.air || "Good",
    });
    socket.emit("sim_status", lastSimStatus);
    socket.emit("mq2", lastMq2Status);

    socket.emit("call_sms_status", { call: currentSecurityState.call, sms: currentSecurityState.sms });
    socket.emit("motion_enable", { enable: currentSecurityState.motion });
    socket.emit("motion_intrude", { state: currentSecurityState.motionStatus ? 1 : 0 });
    socket.emit("fire_enable", { enable: currentSecurityState.fire });
    socket.emit("mq2", { status: currentSecurityState.fireStatus ? "ALARM" : "CLEAR" });
    socket.emit("door_enable", { enable: currentSecurityState.door });
    socket.emit("door_breach", { state: currentSecurityState.doorStatus ? 1 : 0 });
    socket.emit("security_mode", { mode: currentSecurityState.auto ? "auto" : "manual" });
 socket.emit("motion", {
    status: currentSecurityState.motionStatus ? "DETECTED" : "CLEAR"
  });
    try {
      const devicesFromDb = await Device.find({});
      const deviceMap = {};
      devicesFromDb.forEach(d => {
        deviceMap[d.deviceId] = d.state;
        lastState.devices[d.deviceId] = d.state;
      });
      socket.emit("device_all_update", deviceMap);
    } catch (err) {
      console.error("Lỗi lấy DB:", err);
    }
  };

  // Gửi ngay khi client vừa connect
  sendCurrentState();

  // FE gọi sync → server gửi lại mọi trạng thái
  socket.on("request_sync_state", () => {
    sendCurrentState();
  });

  // FE điều khiển security control (lưu lại trạng thái)
  socket.on("security_control", (cmd) => {
    // Parse: Hỗ trợ cả dạng "KEY:VALUE" và object
    let k, v;
    if (typeof cmd === 'string') {
      [k, v] = cmd.split(":");
    } else if (cmd && typeof cmd === 'object') {
      k = cmd.type;
      v = cmd.value;
    }
    v = Number(v);

    // Ánh xạ update trạng thái
    switch (k) {
      case "CALL": currentSecurityState.call = !!v; break;
      case "SMS":  currentSecurityState.sms = !!v; break;
      case "FIR":  currentSecurityState.motion = !!v; break; // Đảm bảo mapping giống FE
      case "DOOR": currentSecurityState.door = !!v; break;
      case "FIRE": currentSecurityState.fire = !!v; break;
      case "AUTO": currentSecurityState.auto = !!v; break;
      // add more if needed
    }

    // Publish xuống MQTT
    let toSend = typeof cmd === 'string' ? cmd : JSON.stringify(cmd);
    mqttClient.publish("smarthome/control", toSend, () => {
      console.log("📤 MQTT Published:", toSend);
    });
  });

  socket.on("device_control", async (data) => {
    mqttClient.publish("smarthome/control", JSON.stringify(data));
    lastState.devices[data.device] = data.state;
    await Device.findOneAndUpdate(
      { deviceId: data.device },
      { state: data.state, updatedAt: Date.now() },
      { upsert: true }
    );
    io.emit("device_update", data);
  });
});
const CAM_URL = "http://172.20.10.4/stream";

let clients = new Set();
let lastChunk = null;  // quan trọng!

const BOUNDARY = "123456789000000000000987654321";

function connectCamera() {
  console.log("🔌 Connecting to ESP32-CAM...");

  const req = http.get(CAM_URL, (camRes) => {
    console.log("📡 Connected to ESP32-CAM");

    camRes.on("data", (chunk) => {
      lastChunk = chunk; // Lưu chunk để client mới có hình ngay

      // 🛠️ SỬA LẠI ĐOẠN NÀY: Kiểm tra kỹ việc ghi dữ liệu
      for (const res of clients) {
        // Nếu kết nối đã đóng hoặc bị hủy, xóa ngay khỏi list
        if (res.writableEnded || res.destroyed || res.closed) {
          clients.delete(res);
          continue;
        }

        try {
          // Gửi chunk, nếu có lỗi callback sẽ bắt được
          const success = res.write(chunk, (err) => {
            if (err) {
              // Lỗi ghi (client đã ngắt), destroy socket và xóa
              console.log("⚠️ Write error, destroying client");
              res.end(); 
              clients.delete(res);
            }
          });
          
          // Nếu buffer đầy hoặc write trả về false (backpressure), có thể cân nhắc drop client nếu cần
          // Nhưng quan trọng là try/catch bên dưới
        } catch (error) {
            console.log("❌ Catch write error");
            clients.delete(res);
        }
      }
    });

    camRes.on("end", () => {
      console.log("⚠️ Camera ended, reconnecting...");
      setTimeout(connectCamera, 1000);
    });
  });

  req.on("error", () => {
    console.log("❌ Camera connection error, retrying...");
    setTimeout(connectCamera, 2000);
  });
}
// ... (các phần import giữ nguyên)

function connectCamera() {
  console.log("🔌 Connecting to ESP32-CAM...");

  const req = http.get(CAM_URL, (camRes) => {
    console.log("📡 Connected to ESP32-CAM");

    camRes.on("data", (chunk) => {
      lastChunk = chunk; // Lưu chunk để client mới có hình ngay

      // 🛠️ SỬA LẠI ĐOẠN NÀY: Kiểm tra kỹ việc ghi dữ liệu
      for (const res of clients) {
        // Nếu kết nối đã đóng hoặc bị hủy, xóa ngay khỏi list
        if (res.writableEnded || res.destroyed || res.closed) {
          clients.delete(res);
          continue;
        }

        try {
          // Gửi chunk, nếu có lỗi callback sẽ bắt được
          const success = res.write(chunk, (err) => {
            if (err) {
              // Lỗi ghi (client đã ngắt), destroy socket và xóa
              console.log("⚠️ Write error, destroying client");
              res.end(); 
              clients.delete(res);
            }
          });
          
          // Nếu buffer đầy hoặc write trả về false (backpressure), có thể cân nhắc drop client nếu cần
          // Nhưng quan trọng là try/catch bên dưới
        } catch (error) {
            console.log("❌ Catch write error");
            clients.delete(res);
        }
      }
    });

    camRes.on("end", () => {
      console.log("⚠️ Camera ended, reconnecting...");
      setTimeout(connectCamera, 1000);
    });
  });

  req.on("error", () => {
    console.log("❌ Camera connection error, retrying...");
    setTimeout(connectCamera, 2000);
  });
}

// ... (Giữ nguyên route /cam)


  // 🧹 Sửa lại hàm dọn dẹp trong CameraFeed.tsx
  const cleanupStream = () => {
    if (imgRef.current) {
      // Bước 1: Gán src = "" để ngắt stream hình ảnh
      imgRef.current.src = ""; 
      imgRef.current.removeAttribute("src");

      // Bước 2: (Mẹo) Gán một src rác nhẹ để trình duyệt "quên" hẳn kết nối cũ
      // Điều này giúp giải phóng socket khỏi pool của Chrome nhanh hơn
      imgRef.current.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="; 
    }
  };

app.get("/cam", (req, res) => {
  // console.log("🟢 New viewer connected"); // Comment bớt log cho đỡ rác

  res.writeHead(200, {
    "Content-Type": `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
    "Cache-Control": "no-cache, no-store, must-revalidate", // Thêm no-store
    "Pragma": "no-cache",
    "Expires": "0",
    "Connection": "close" // Quan trọng: Báo trình duyệt không giữ alive
  });
  if (lastChunk) {
    res.write(lastChunk);
  }

  clients.add(res);

  req.on("close", () => {
    console.log("🔴 Viewer closed (pause/tab closed)");
    res.end();
    clients.delete(res);
  });

  res.on("error", () => {
    console.log("⚠️ Viewer connection error");
    res.end();
    clients.delete(res);
  });
});

// Cleanup ghost clients
setInterval(() => {
  clients.forEach((res) => {
    if (res.writableEnded || res.destroyed) {
      console.log("🧹 Cleaning dead client...");
      clients.delete(res);
    }
  });
}, 3000);

// Start camera connection
connectCamera();


// =============================================================
// 🚀 START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
