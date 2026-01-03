require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');
const Energy = require('./models/energy_data'); 
const Notification = require('./models/Notification');
const moment = require('moment');
// ========================== MODEL ==========================
let User = require('./models/User');
const Device = require("./models/Device");
if (User.default) User = User.default;

// ========================== CONFIG ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env. MONGO_URI;

// --- MQTT HiveMQ Cloud ---
const MQTT_URL = process.env.MQTT_URL;
const MQTT_OPTIONS = {
  username: process.env.MQTT_USERNAME,
  password: process. env.MQTT_PASSWORD,
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
  call: false,
  sms: false,
  motion: false,
  motionStatus: false,
  fire: false,
  fireStatus:  false,
  door: false,
  doorStatus: false,
  auto: false
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
    const { username, password } = req. body;
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
let lastPeopleStatus = { status: "CLEAR" };
let lastMotionStatus = { status: "CLEAR" };
let lastPzemData = { voltage: 0, current: 0, power: 0, energy: 0 };
let lastDoorStatus = { status: "CLEAR" };


let lastPzemUpdateTime = null;

mqttClient.on("connect", () => {
  console.log("🌐 MQTT Connected (HiveMQ Cloud)");

  mqttClient.subscribe("smarthome/report", (err) => {
    if (! err) console.log("📡 Subscribed → smarthome/report");
    else console.error("❌ Subscribe error:  smarthome/report", err);
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
  mqttClient.subscribe("smarthome/people", (err) => {
    if (!err) console.log("📡 Subscribed → smarthome/people");
    else console.error("❌ Subscribe error: smarthome/people", err);
  });
  mqttClient.subscribe("smarthome/pzem", (err) => {
    if (!err) console.log("📡 Subscribed → smarthome/pzem");
    else console.error("❌ Subscribe error: smarthome/pzem", err);
  });
  mqttClient.subscribe("smarthome/door", (err) => {
    if (!err) console.log("📡 Subscribed → smarthome/door");
    else console.error("❌ Subscribe error: smarthome/door", err);
  });
});

// ================= MQTT MESSAGE HANDLER ==================
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 MQTT:", topic, data);

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

    if (topic === "smarthome/sim_status") {
      if (data.at === 0) {
        data.reg = 0;
        data.csq = -1;
      }
      lastSimStatus = data;
      io.emit("sim_status", data);
    }

    // --- XỬ LÝ BÁO CHÁY (MQ2) ---
    if (topic === "smarthome/mq2") {
      // Chỉ lưu khi trạng thái chuyển từ CLEAR -> ALARM (hoặc lần đầu tiên)
      if (data.status === "ALARM" && lastMq2Status.status !== "ALARM") {
         await Notification.create({
            type: 'fire',
            message: 'Phát hiện khói/khí gas!'
         });
         console.log("🔥 Đã lưu cảnh báo cháy vào DB");
      }

      io.emit("mq2", data);
      lastMq2Status = data;
      currentSecurityState.fireStatus = (data.status === "ALARM");
    }

    // --- XỬ LÝ CHUYỂN ĐỘNG (MOTION) ---
    if (topic === "smarthome/motion") {
      // Chỉ lưu khi phát hiện chuyển động mới
      if (data.status === "DETECTED" && lastMotionStatus.status !== "DETECTED") {
         await Notification.create({
            type: 'motion',
            message: 'Phát hiện có người đột nhập!'
         });
         console.log("⚠️ Đã lưu cảnh báo chuyển động vào DB");
      }

      io.emit("motion", data);
      lastMotionStatus = data;
      currentSecurityState.motionStatus = (data.status === "DETECTED");
    }

    if (topic === "smarthome/people") {
      lastPeopleStatus = data;
      io.emit("people", data);
      console.log("👤 People status:", data. status);
    }

    if (topic === "smarthome/pzem") {
      const currentTime = Date.now();
      
      if (lastPzemUpdateTime !== null) {
        const timeDiffMs = currentTime - lastPzemUpdateTime;
        const timeDiffHours = timeDiffMs / (1000 * 3600);
        const powerW = data.power || 0;
        const deltaWh = powerW * timeDiffHours; 

       // --- CODE XỬ LÝ DATABASE MỚI (FIX CỨNG) ---
        // 👇 SỬA: Ép về UTC+7
        const todayStr = moment().utcOffset(7).format("YYYY-MM-DD");
        const currentHour = moment().utcOffset(7).hour();

        try {
          // 1. Tìm bản ghi hôm nay
          let energyRecord = await Energy.findOne({ date: todayStr });
          
          // 2. Nếu chưa có thì TẠO MỚI VỚI MẢNG CỐ ĐỊNH
          if (!energyRecord) {
            console.log(`✨ Đang tạo mới ngày ${todayStr} với mảng Array chuẩn...`);
            energyRecord = await Energy.create({ 
                date: todayStr,
                totalWh: 0,
                // 👇 ÉP BUỘC TẠO MẢNG 24 SỐ 0 NGAY LẬP TỨC
                hourly: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
            });
          }

          // 3. Cập nhật dữ liệu
          await Energy.updateOne(
            { date: todayStr },
            { 
              $inc: { 
                totalWh: deltaWh,               
                [`hourly.${currentHour}`]: deltaWh 
              } 
            }
          );
        } catch (dbErr) {
          console.error("Lỗi lưu DB Energy:", dbErr);
        }
        // -------------------------------------------
      }

      lastPzemUpdateTime = currentTime;
      lastPzemData = data;
      
      fetchAndEmitEnergyData(); 
    }

    // --- XỬ LÝ CỬA (DOOR) ---
    if (topic === "smarthome/door") {
      console.log("📥 [MQTT] Door data received:", data);

      // 👇 THÊM ĐOẠN NÀY: Lưu vào DB nếu có báo động mới
      if (data.status === "ALARM" && lastDoorStatus.status !== "ALARM") {
         try {
           await Notification.create({
              type: 'door',
              message: 'Cảnh báo: Mở cửa sai quá 5 lần!'
           });
           console.log("🚪 Đã lưu cảnh báo cửa vào DB");
         } catch (err) {
           console.error("❌ Lỗi lưu thông báo cửa:", err);
         }
      }
      // ------------------------------------------------

      io.emit("door_breach", data);
      console.log("🚪 [Backend] Emitted door_breach with:", data);

      lastDoorStatus = data;
      currentSecurityState.doorStatus = (data.status === "ALARM");
    }

  } catch (err) {
    console.error("❌ MQTT JSON Error:", err);
  }
});

app.get("/", (req, res) => {
  res.send("Hello!   Server is running fine.");
});

// =============================================================
// 🔥 SOCKET.IO HANDLER
// =============================================================
io. on("connection", async (socket) => {
  console.log("🟢 Client Connected:", socket.id);

  const sendCurrentState = async () => {

    // ==================== 1.  CLIMATE (Nhiệt độ, độ ẩm) ====================
    socket.emit("climate_update", {
      temperature: lastState.temp || 0,
      humidity: lastState.humi || 0,
      air: lastState.air || "Good",
    });

    // ==================== 2. SENSORS (Cảm biến) ====================
    socket.emit("sim_status", lastSimStatus);
    socket.emit("people", lastPeopleStatus);


    // ==================== 3. SECURITY (An ninh) ====================

    // 3.1. Trạng thái cảm biến an ninh (Đồng nhất format)
    socket.emit("mq2", lastMq2Status);
    socket.emit("door", lastDoorStatus);
    socket.emit("motion", lastMotionStatus);

    // Chỉ gửi door_breach khi CÓ cảnh báo
    if (currentSecurityState.doorStatus) {
      socket.emit("door_breach", lastDoorStatus);
    }

    // 3.2. Trạng thái bật/tắt các tính năng an ninh
    socket.emit("call_sms_status", {
      call: currentSecurityState.call,
      sms: currentSecurityState.sms
    });
    socket.emit("fire_enable", { enable: currentSecurityState.fire });
    socket.emit("motion_enable", { enable: currentSecurityState.motion });
    socket.emit("door_enable", { enable: currentSecurityState.door });

    // 3.4. Chế độ Auto/Manual
    socket.emit("security_mode", {
      mode: currentSecurityState.auto ? "auto" : "manual"
    });

    // ==================== 4. DEVICES (Relay/Thiết bị) ====================
    try {
      const devicesFromDb = await Device.find({});
      const deviceMap = {};
      devicesFromDb.forEach(d => {
        deviceMap[d. deviceId] = d. state;
        lastState.devices[d.deviceId] = d.state;
      });
      socket.emit("device_all_update", deviceMap);
    } catch (err) {
      console.error("Lỗi lấy DB:", err);
    }
    fetchAndEmitEnergyData();
  };

  sendCurrentState();

  socket.on("request_sync_state", () => {
    sendCurrentState();
  });

  socket.on("security_control", (cmd) => {
    let k, v;
    if (typeof cmd === 'string') {
      [k, v] = cmd.split(":");
    } else if (cmd && typeof cmd === 'object') {
      k = cmd.type;
      v = cmd.value;
    }
    v = Number(v);

    switch (k) {
      case "CALL":  currentSecurityState.call = !!v; break;
      case "SMS": currentSecurityState. sms = !!v; break;
      case "FIR": currentSecurityState. motion = !!v; break;
      case "DOOR": currentSecurityState.door = !!v; break;
      case "FIRE": currentSecurityState.fire = !!v; break;
      case "AUTO": currentSecurityState.auto = !!v; break;
      case "AUTOR": currentSecurityState.auto = !!v; break;
    }

    // 🆕 GỬI LẠI TRẠNG THÁI AUTO CHO TẤT CẢ CLIENT
    if (k === "AUTO" || k === "AUTOR") {
      io.emit("security_mode", {
        mode: currentSecurityState.auto ? "auto" : "manual"
      });
    }

    let toSend = typeof cmd === 'string' ? cmd :  JSON.stringify(cmd);
    mqttClient.publish("smarthome/control", toSend, () => {
      console.log("📤 MQTT Published:", toSend);
    });
  });

  socket.on("device_control", async (data) => {
    mqttClient.publish("smarthome/control", JSON.stringify(data));
    lastState. devices[data.device] = data.state;
    await Device.findOneAndUpdate(
      { deviceId: data. device },
      { state: data.state, updatedAt: Date.now() },
      { upsert: true }
    );
    io.emit("device_update", data);
  });
});

// =============================================================
// 🎥 ESP32-CAM STREAMING
// =============================================================
const CAM_URL = "http://172.20.10.4/stream";
let clients = new Set();
let lastChunk = null;
const BOUNDARY = "123456789000000000000987654321";

function connectCamera() {
  console.log("🔌 Connecting to ESP32-CAM...");

  const req = http.get(CAM_URL, (camRes) => {
    console.log("📡 Connected to ESP32-CAM");

    camRes.on("data", (chunk) => {
      lastChunk = chunk;

      for (const res of clients) {
        if (res.writableEnded || res.destroyed || res. closed) {
          clients.delete(res);
          continue;
        }

        try {
          res.write(chunk, (err) => {
            if (err) {
              console. log("⚠️ Write error, destroying client");
              res.end();
              clients.delete(res);
            }
          });
        } catch (error) {
          console.log("❌ Catch write error");
          clients.delete(res);
        }
      }
    });

    camRes.on("end", () => {
      console.log("⚠️ Camera ended, reconnecting.. .");
      setTimeout(connectCamera, 1000);
    });
  });

  req.on("error", () => {
    console.log("❌ Camera connection error, retrying...");
    setTimeout(connectCamera, 2000);
  });
}

app.get("/cam", (req, res) => {
  res.writeHead(200, {
    "Content-Type": `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma":  "no-cache",
    "Expires": "0",
    "Connection": "close"
  });

  if (lastChunk) {
    res.write(lastChunk);
  }

  clients.add(res);

  req.on("close", () => {
    console.log("🔴 Viewer closed");
    res.end();
    clients.delete(res);
  });

  res.on("error", () => {
    console.log("⚠️ Viewer connection error");
    res.end();
    clients.delete(res);
  });
});

setInterval(() => {
  clients.forEach((res) => {
    if (res.writableEnded || res.destroyed) {
      console.log("🧹 Cleaning dead client.. .");
      clients.delete(res);
    }
  });
}, 3000);

connectCamera();

app.get("/api/health", (req, res) => {
  const status = mongoose.connection.readyState;
  let dbStatusStr = "disconnected";
  if (status === 1) dbStatusStr = "connected";
  else if (status === 2) dbStatusStr = "connecting";
  else if (status === 3) dbStatusStr = "disconnecting";

  res.json({
    database: dbStatusStr,
    timestamp: new Date().toISOString()
  });
});
// API lấy lịch sử thông báo (Lấy 20 tin mới nhất)
app.get("/api/notifications", async (req, res) => {
  try {
    const notifs = await Notification.find()
      .sort({ timestamp: -1 }) // Mới nhất lên đầu
      .limit(20);              // Giới hạn 20 tin
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy thông báo" });
  }
});

// Hàm tính toán và gửi dữ liệu tổng hợp cho Client
async function fetchAndEmitEnergyData() {
  try {
    const todayStr = moment().utcOffset(7).format("YYYY-MM-DD");
    
    // 1. Lấy dữ liệu hôm nay
    let todayRecord = await Energy.findOne({ date: todayStr });
    
    // Tạo dữ liệu an toàn
    let safeTotalWh = 0;
    let safeHourly = new Array(24).fill(0);

    if (todayRecord) {
        safeTotalWh = todayRecord.totalWh || 0;
        if (Array.isArray(todayRecord.hourly) && todayRecord.hourly.length > 0) {
            safeHourly = todayRecord.hourly;
        }
    }

    // 2. Tính tổng tháng
    const startOfMonth = moment().utcOffset(7).startOf('month').format("YYYY-MM-DD");
    const monthRecords = await Energy.find({ date: { $gte: startOfMonth } });
    const monthTotalWh = monthRecords.reduce((sum, rec) => sum + (rec.totalWh || 0), 0);

    // 3. Xử lý dữ liệu biểu đồ: Gửi đủ 24 giờ (0h - 23h)
    // KHÔNG gộp 2 tiếng nữa để nhìn rõ từng khung giờ
    const chartData = [];
    for (let i = 0; i < 24; i++) { // Chạy từ 0 đến 23
      const val = safeHourly[i] || 0;
      const timeLabel = `${i}h`; // Nhãn đơn giản: 0h, 1h, ... 23h
      chartData.push({
        time: timeLabel,
        energy: parseFloat(val.toFixed(2)) // Làm tròn 2 số lẻ
      });
    }

    // Gửi xuống Client
    io.emit("energy_dashboard_update", {
      voltage: lastPzemData.voltage || 0,
      current: lastPzemData.current || 0,
      power: lastPzemData.power || 0,
      energyTodayWh: safeTotalWh,
      energyMonthWh: monthTotalWh,
      chartData: chartData
    });

  } catch (e) {
    console.error("Lỗi tính toán Energy:", e);
  }
}
// =============================================================
// 🚀 START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});