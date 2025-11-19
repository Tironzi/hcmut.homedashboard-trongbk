import { io } from "socket.io-client";

// Kiểm tra xem code đang chạy ở chế độ nào
// Nếu là môi trường phát triển (dev) -> dùng Localhost 5000
// Nếu là môi trường thực tế (production) -> dùng link Online
const URL = process.env.NODE_ENV === "production" 
  ? "https://api.homedashboard-trongbk.online" 
  : "http://localhost:5000";

export const socket = io(URL, {
  transports: ["websocket"],
});