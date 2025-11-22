"use client"

import { Camera, Lock, AlertTriangle, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react" // 🔹 1. Import thêm useEffect
// 🔹 2. Import kiểu Language (từ file page.tsx)
import { Language } from "@/app/page";

interface SecurityDevice {
  id: string
  name: string
  icon: any
  status: string
  color: string
  isOn: boolean
}

// 🔹 3. Định nghĩa interface để NHẬN prop 'language'
interface SecurityPanelProps {
  language: Language;
}

// 🔹 4. Thêm đối tượng dịch thuật
const translations = {
  vi: {
    title: "An ninh",
    cameraName: "Camera Cửa Trước",
    cameraStatus: "Đang hoạt động",
    doorsName: "Tất cả các cửa",
    doorsStatus: "Đã khóa",
    motionName: "Cảm biến chuyển động",
    motionStatus: "3 đang hoạt động",
    fireName: "Báo cháy",
    fireStatus: "Đang hoạt động"
  },
  en: {
    title: "Security",
    cameraName: "Front Door Camera",
    cameraStatus: "Active",
    doorsName: "All Doors",
    doorsStatus: "Locked",
    motionName: "Motion Sensors",
    motionStatus: "3 active",
    fireName: "Fire Alarm",
    fireStatus: "Active"
  }
}

// 🔹 5. Nhận prop { language }
export function SecurityPanel({ language }: SecurityPanelProps) {
  // 🔹 6. Chọn bộ dịch dựa trên prop
  const t = translations[language];

  // 🔹 7. Tạo một hàm helper để lấy danh sách thiết bị dựa trên ngôn ngữ
  const getInitialDevices = (lang: Language): SecurityDevice[] => {
    const t_lang = translations[lang]; // Lấy đúng bản dịch
    return [
      {
        id: "camera",
        name: t_lang.cameraName,
        icon: Camera,
        status: t_lang.cameraStatus,
        color: "accent",
        isOn: true,
      },
      {
        id: "doors",
        name: t_lang.doorsName,
        icon: Lock,
        status: t_lang.doorsStatus,
        color: "chart-3",
        isOn: true,
      },
      {
        id: "motion",
        name: t_lang.motionName,
        icon: AlertTriangle,
        status: t_lang.motionStatus,
        color: "primary",
        isOn: true,
      },
      {
        id: "fire",
        name: t_lang.fireName,
        icon: Flame,
        status: t_lang.fireStatus,
        color: "red-500",
        isOn: true,
      },
    ]
  };
  
  // 🔹 8. Khởi tạo state bằng hàm helper
  const [devices, setDevices] = useState<SecurityDevice[]>(getInitialDevices(language));

  // 🔹 9. Dùng useEffect để CẬP NHẬT state khi 'language' thay đổi
  // (Việc này sẽ reset các nút gạt (toggle), nhưng đảm bảo ngôn ngữ được cập nhật)
  useEffect(() => {
    setDevices(getInitialDevices(language));
  }, [language]); // Chạy lại khi 'language' thay đổi

  const toggleDevice = (id: string) => {
    setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, isOn: !device.isOn } : device)))
  }

  return (
    <Card className="p-6">
      {/* 🔹 10. Sử dụng text đã dịch */}
      <h2 className="text-lg font-semibold mb-4 text-foreground">{t.title}</h2>

      <div className="space-y-3">
        {devices.map((device) => {
          const Icon = device.icon
          return (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                {/* (Lưu ý: Tailwind CSS có thể không nhận diện màu 'động' (dynamic)
                   nếu bạn dùng `text-${device.color}`. Bạn có thể cần 
                   ánh xạ (map) màu một cách rõ ràng nếu nó không hiển thị) */}
                <div className={`w-10 h-10 rounded-lg bg-${device.color}/10 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${device.color}`} />
                </div>
                <div>
                  {/* Tên và status giờ đã được dịch */}
                  <div className="text-sm font-medium text-foreground">{device.name}</div>
                  <div className="text-xs text-muted-foreground">{device.status}</div>
                </div>
              </div>
              <Switch checked={device.isOn} onCheckedChange={() => toggleDevice(device.id)} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
