"use client"

import { useState } from "react"
// Import components
import { SidebarNav } from "@/components/ui/sidebar-nav"
import { SmartHomeHeader } from "@/components/smart-home-header"
import { QuickActions } from "@/components/quick-actions"
import { RoomControls } from "@/components/room-controls"
import { ClimateControl } from "@/components/climate-control"
import { SecurityPanel } from "@/components/security-panel"
import { EnergyUsage } from "@/components/energy-usage"
import { CameraFeed } from "@/components/camera-feed"
import { Language } from "@/lib/types"
// Import Icon cho Mobile Menu
import { Menu, X } from "lucide-react"

interface DashboardProps {
  onLogout: () => void
  language: Language
  setLanguage: (lang: Language) => void
}

export function Dashboard({ onLogout, language, setLanguage }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  // 🔹 State mới: Quản lý bật/tắt menu trên mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 🔹 Hàm xử lý khi chọn tab: Cập nhật tab và đóng menu mobile
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <QuickActions language={language} />
            
            {/* 🔹 Responsive Grid: 1 cột trên mobile, 4 cột trên màn hình lớn */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-4">
              
              {/* Cột trái (chiếm 3 phần) */}
              <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                <RoomControls language={language} />
                <EnergyUsage language={language} />
              </div>
              
              {/* Cột phải (chiếm 1 phần) */}
              <div className="space-y-4 sm:space-y-6">
                <ClimateControl language={language} />
                <SecurityPanel language={language} />
              </div>
            </div>
          </div>
        )
      // Các case khác giữ nguyên logic animate và truyền language
      case "room-controls":
        return <div className="animate-in fade-in duration-500"><RoomControls language={language} /></div>
      case "climate":
        return <div className="animate-in fade-in duration-500"><ClimateControl language={language} /></div>
      case "energy":
        return <div className="animate-in fade-in duration-500"><EnergyUsage language={language} /></div>
      case "security":
        return <div className="animate-in fade-in duration-500"><SecurityPanel language={language} /></div>
      case "camera":
        return <div className="animate-in fade-in duration-500"><CameraFeed language={language} /></div>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* 🔹 1. Sidebar cho Desktop (Ẩn trên mobile) */}
      <div className="hidden md:block">
        <SidebarNav
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onLogout={onLogout}
          language={language}
        />
      </div>

      {/* 🔹 2. Nút Hamburger Menu (Chỉ hiện trên mobile - md:hidden) */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 🔹 3. Overlay (Lớp phủ mờ khi mở menu mobile) */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* 🔹 4. Sidebar cho Mobile (Trượt từ dưới lên) */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out max-h-[85vh] overflow-y-auto bg-background border-t rounded-t-2xl shadow-2xl ${
          mobileMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-4 pb-8">
          <SidebarNav 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            onLogout={onLogout} 
            language={language}
          />
        </div>
      </div>

      {/* 🔹 5. Khung nội dung chính */}
      {/* ml-0 trên mobile (để full màn hình), md:ml-64 trên desktop (để tránh sidebar) */}
      <div className="ml-0 md:ml-64 transition-all duration-300">
        
        <SmartHomeHeader 
          onLogout={onLogout} 
          language={language}
          setLanguage={setLanguage}
        />

        {/* Padding responsive: px-4 cho mobile, px-6 cho desktop */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}