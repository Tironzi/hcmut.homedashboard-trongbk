"use client"

import { Zap, Sliders, Wind, Droplets, Shield, Camera, LogOut, Home } from "lucide-react"
import { Language } from "@/app/page"

interface SidebarNavProps {
  onLogout: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  language: Language
}

// 🔹 Từ điển ngôn ngữ
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
    <aside className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-56 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col rounded-3xl shadow-xl py-8">
      
      {/* Logo Home */}
      <div className="flex justify-center mb-8">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Home className="w-7 h-7 text-purple-600" />
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
      <div className="px-4 pb-4">
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
