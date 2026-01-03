"use client"

import { useState, useEffect } from "react"
import { Home, Wifi, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Language } from "@/app/page"
import { socket } from "@/lib/socket"

interface SmartHomeHeaderProps {
  onLogout?:  () => void
  language:  Language
  setLanguage: (lang: Language) => void
}

// 🆕 Kiểu dữ liệu thông báo
interface Notification {
  id: string
  type: "fire" | "motion" | "door"
  message: string
  timestamp: Date
}

// Ngôn ngữ hỗ trợ
const translations = {
  vi: {
    appName: "Nhà Thông Minh",
    welcome: "Xin chào",
    notifications: "Thông báo",
    connectionStatus: "Trạng thái kết nối",
    noNotifications: "Chưa có thông báo",
    clearAll: "Xóa tất cả",
    fireAlert: "🔥 Phát hiện khói/khí gas!",
    motionAlert: "⚠️ Có người đột nhập!",
    doorAlert: "🚪 Cảnh báo: Mở cửa sai quá 5 lần!",
    mqtt: "MQTT Broker",
    database: "Cơ sở dữ liệu",
    connected: "Đã kết nối",
    disconnected: "Mất kết nối",
    checking: "Đang kiểm tra...",
  },
  en: {
    appName: "Smart Home",
    welcome: "Welcome back",
    notifications: "Notifications",
    connectionStatus: "Connection Status",
    noNotifications: "No notifications",
    clearAll:  "Clear all",
    fireAlert: "🔥 Smoke/Gas detected!",
    motionAlert: "⚠️ Intrusion detected!",
    doorAlert: "🚪 Warning: Door unlock failed 5 times!",
    mqtt: "MQTT Broker",
    database:  "Database",
    connected: "Connected",
    disconnected: "Disconnected",
    checking:  "Checking...",
  }
}

export function SmartHomeHeader({ language, setLanguage }: SmartHomeHeaderProps) {
  const [username, setUsername] = useState("User")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showConnectionStatus, setShowConnectionStatus] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  
  // 🆕 Trạng thái kết nối
  const [mqttConnected, setMqttConnected] = useState(false)
  const [dbConnected, setDbConnected] = useState(false)
  
  const t = translations[language]

  // 🆕 BASE URL tự động chuyển đổi theo môi trường
  const backendBaseUrl = 
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_BACKEND_URL 
      : "http://localhost:5000";

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) setUsername(storedUsername)
  }, [])

  // 🆕 Kiểm tra trạng thái Socket.IO & DB
  useEffect(() => {
    const checkConnection = () => {
      setMqttConnected(socket.connected)
    }

    checkConnection()
    socket.on("connect", () => setMqttConnected(true))
    socket.on("disconnect", () => setMqttConnected(false))

    // Kiểm tra DB qua API endpoint backend
    const fetchDbStatus = () => {
      fetch(`${backendBaseUrl}/api/health`)
        .then(res => res.json())
        .then(data => setDbConnected(data.database === "connected"))
        .catch(() => setDbConnected(false))
    }

    fetchDbStatus()
    const interval = setInterval(fetchDbStatus, 10000) // Check mỗi 10s

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      clearInterval(interval)
    }
  }, [backendBaseUrl])

  // 🆕 Hàm lấy lịch sử thông báo từ DB (Có xử lý logic Đã xem)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/api/notifications`);
        if (res.ok) {
          const data = await res.json();
          
          // Map dữ liệu từ DB sang format của Frontend
          const formattedNotifs: Notification[] = data.map((item: any) => ({
            id: item._id, // MongoDB ID
            type: item.type,
            message: item.message,
            timestamp: new Date(item.timestamp)
          }));
          
          setNotifications(formattedNotifs);
          
          // 👇 LOGIC MỚI: Kiểm tra timestamp để hiện chấm đỏ 👇
          if (formattedNotifs.length > 0) {
            const lastReadTime = localStorage.getItem("LAST_READ_TIMESTAMP");
            // Vì danh sách đã sort mới nhất lên đầu, nên lấy phần tử [0]
            const newestNotifTime = formattedNotifs[0].timestamp.getTime();

            // Nếu chưa từng xem (null) HOẶC tin mới nhất > lần xem cuối
            if (!lastReadTime || newestNotifTime > Number(lastReadTime)) {
              setHasUnread(true);
            } else {
              setHasUnread(false);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      }
    };

    fetchNotifications();
  }, [backendBaseUrl]);

  // 🆕 Lắng nghe cảnh báo Realtime từ Socket.IO
  useEffect(() => {
    const handleFireEvent = (data: { status: "ALARM" | "CLEAR" }) => {
      if (data.status === "ALARM") {
        addNotification("fire", t.fireAlert)
      }
    }

    const handleMotionEvent = (data: { status: "DETECTED" | "CLEAR" }) => {
      if (data.status === "DETECTED") {
        addNotification("motion", t.motionAlert)
      }
    }

    const handleDoorEvent = (data: { state: number }) => {
      if (data.state === 1) {
        addNotification("door", t.doorAlert)
      }
    }

    socket.on("mq2", handleFireEvent)
    socket.on("motion", handleMotionEvent)
    socket.on("door_breach", handleDoorEvent)

    return () => {
      socket.off("mq2", handleFireEvent)
      socket.off("motion", handleMotionEvent)
      socket.off("door_breach", handleDoorEvent)
    }
  }, [t])

  // 🆕 Thêm thông báo mới (Realtime)
  const addNotification = (type: "fire" | "motion" | "door", message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }
    setNotifications(prev => [newNotif, ...prev])
    setHasUnread(true) // Tin mới đến thì chắc chắn phải hiện đỏ
  }

  // 🆕 Xóa tất cả thông báo
  const clearAllNotifications = () => {
    setNotifications([])
    setHasUnread(false)
    // Cập nhật lại thời điểm đã đọc để tránh lỗi
    localStorage.setItem("LAST_READ_TIMESTAMP", Date.now().toString());
  }

  // 🆕 Mở dropdown thông báo
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    setShowConnectionStatus(false)
    
    // 👇 LOGIC MỚI: Khi mở ra là đánh dấu ĐÃ ĐỌC 👇
    if (!showNotifications) {
      setHasUnread(false)
      // Lưu thời điểm hiện tại vào bộ nhớ trình duyệt
      localStorage.setItem("LAST_READ_TIMESTAMP", Date.now().toString());
    }
  }

  // 🆕 Mở dropdown trạng thái kết nối
  const toggleConnectionStatus = () => {
    setShowConnectionStatus(!showConnectionStatus)
    setShowNotifications(false)
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo + Chữ */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t.appName}</h1>
              <p className="text-sm text-muted-foreground">{t.welcome}, {username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Nút chuyển ngôn ngữ (EN/VI) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="w-[40px]"
              title="Change Language"
            >
              {language === "vi" ? "EN" : "VI"}
            </Button>

            <ThemeToggle />

            {/* 🆕 NÚT CHUÔNG THÔNG BÁO */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleNotifications}
                title={t.notifications}
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Button>

              {/* DROPDOWN LỊCH SỬ THÔNG BÁO */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-2xl z-[9999] max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">{t.notifications}</h3>
                    {notifications.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearAllNotifications}
                        className="text-xs"
                      >
                        {t.clearAll}
                      </Button>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {t.noNotifications}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              notif.type === "fire" ? "bg-red-500" : 
                              notif.type === "motion" ? "bg-amber-500" : 
                              "bg-blue-500"
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {notif.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
  {/* 👇 Sửa thành toLocaleString để hiện cả ngày giờ */}
  {notif.timestamp.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
     hour: '2-digit', minute: '2-digit', second: '2-digit',
     day: '2-digit', month: '2-digit', year: 'numeric'
  })}
</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🆕 NÚT WIFI - TRẠNG THÁI KẾT NỐI */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleConnectionStatus}
                title={t.connectionStatus}
              >
                <Wifi className={`w-5 h-5 ${mqttConnected && dbConnected ? 'text-green-500' : 'text-red-500'}`} />
              </Button>

              {/* DROPDOWN TRẠNG THÁI KẾT NỐI */}
              {showConnectionStatus && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-2xl z-[9999]">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">{t.connectionStatus}</h3>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* MQTT Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{t.mqtt}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        mqttConnected 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {mqttConnected ? t.connected : t.disconnected}
                      </span>
                    </div>

                    {/* Database Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">{t.database}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        dbConnected 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {dbConnected ? t.connected : t.disconnected}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  )
}