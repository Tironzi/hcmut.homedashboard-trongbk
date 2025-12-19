"use client"

import { Zap, Sliders, Wind, Droplets, Shield, Camera, LogOut, Home } from "lucide-react"
import { Language } from "@/app/page" // Đảm bảo đường dẫn này đúng với project của bạn

interface SidebarNavProps {
  onLogout: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  language: Language
}

const translations = {
  vi: {
    quickActions: "Tác vụ nhanh",
    roomControl: "Điều khiển phòng",
    climate: "Khí hậu",
    energy: "Tiêu thụ điện",
    security: "An ninh",
    camera: "Camera",
    logout: "Đăng xuất",
  },
  en: {
    quickActions: "Quick Actions",
    roomControl: "Room Controls",
    climate: "Climate",
    energy: "Energy Usage",
    security: "Security",
    camera: "Camera",
    logout: "Logout",
  }
}

export function SidebarNav({ onLogout, activeSection, onSectionChange, language }: SidebarNavProps) {
  const t = translations[language]

  const navItems = [
    { id: "dashboard", label: t.quickActions, icon: Zap },
    { id: "room-controls", label: t.roomControl, icon: Sliders },
    { id: "climate", label: t.climate, icon: Wind },
    { id: "energy", label: t.energy, icon: Droplets },
    { id: "security", label: t.security, icon: Shield },
    { id: "camera", label: t.camera, icon: Camera },
  ]

  return (
    <aside 
      className={`
        flex flex-col bg-gradient-to-b from-purple-600 to-purple-800 text-white transition-all duration-300
        
        /* 🔹 Mobile Styles (Mặc định) */
        relative w-full h-full rounded-2xl py-6 shadow-none

        /* 🔹 Desktop Styles (Màn hình > 768px) */
        md:fixed md:left-4 md:top-4 md:h-[calc(100vh-2rem)] md:w-56 md:rounded-3xl md:shadow-xl md:py-8
      `}
    >
      
      {/* Logo Home */}
      <div className="flex justify-center mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Home className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white text-purple-700 font-semibold shadow-md"
                  : "text-purple-100 hover:bg-purple-500/40"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 pt-4 md:pt-0 md:pb-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-500/40 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{t.logout}</span>
        </button>
      </div>
    </aside>
  )
}