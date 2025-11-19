"use client"

import React, { useState, useEffect } from "react"
import { Home, Settings, Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
// 🔹 1. Import kiểu 'Language' từ file cha
import { Language } from "@/app/page";

// 🔹 2. Cập nhật interface để nhận props mới
interface SmartHomeHeaderProps {
  onLogout?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 🔹 3. Thêm đối tượng dịch thuật
const translations = {
  vi: {
    appName: "Smart Home",
    welcome: "Chào mừng trở lại",
    notifications: "Thông báo",
    settings: "Cài đặt",
    profile: "Hồ sơ",
    logout: "Đăng xuất"
  },
  en: {
    appName: "Smart Home",
    welcome: "Welcome back",
    notifications: "Notifications",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout"
  }
}

// 🔹 4. Nhận props
export function SmartHomeHeader({ onLogout, language, setLanguage }: SmartHomeHeaderProps) {
  const [username, setUsername] = useState("Guest")
  // 🔹 5. Chọn bộ dịch dựa trên prop
  const t = translations[language];

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Home className="w-5 h-5" />
            </div>
            <div>
              {/* 🔹 6. Sử dụng text đã dịch */}
              <h1 className="text-xl font-semibold text-foreground">{t.appName}</h1>
              <p className="text-sm text-muted-foreground">{t.welcome}, {username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🔹 7. Thêm nút chuyển ngôn ngữ */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="w-[40px]" // Thêm chiều rộng cố định để tránh nhảy layout
            >
              {language === "vi" ? "EN" : "VI"}
            </Button>
            
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative" title={t.notifications}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" title={t.settings}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" title={t.profile}>
              <User className="w-5 h-5" />
            </Button>
            {onLogout && (
              <Button variant="ghost" size="icon" onClick={onLogout} title={t.logout}>
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}