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

interface DashboardProps {
  onLogout: () => void
  language: Language
  setLanguage: (lang: Language) => void
}

export function Dashboard({ onLogout, language, setLanguage }: DashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard")

  // Hàm này dùng để render nội dung dựa trên tab đang chọn
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <QuickActions language={language} />
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-3 space-y-6">
                <RoomControls language={language} />
                <EnergyUsage language={language} />
              </div>
              <div className="space-y-6">
                <ClimateControl language={language} />
                <SecurityPanel language={language} />
              </div>
            </div>
          </div>
        )
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
      {/* Sidebar cố định */}
        <SidebarNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
        language={language}
      />

      {/* Khung nội dung chính: Margin Left 64 (256px) để tránh Sidebar */}
      <div className="ml-64 transition-all duration-300">
        
        {/* Header nằm trong luồng này nên sẽ căn chỉnh chính xác */}
        <SmartHomeHeader 
          onLogout={onLogout} 
          language={language}
          setLanguage={setLanguage}
        />

        {/* Nội dung thay đổi theo tab */}
        <main className="container mx-auto px-6 py-6 max-w-7xl">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}