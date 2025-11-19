"use client"
import { SmartHomeHeader } from "@/components/smart-home-header"
import { QuickActions } from "@/components/quick-actions"
import { RoomControls } from "@/components/room-controls"
import { ClimateControl } from "@/components/climate-control"
import { SecurityPanel } from "@/components/security-panel"
import { EnergyUsage } from "@/components/energy-usage"
import { CameraFeed } from "@/components/camera-feed"
// 🔹 1. Import kiểu 'Language' từ file cha
import { Language } from "@/app/page"; 

// 🔹 2. Cập nhật interface để nhận props mới
interface DashboardProps {
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 🔹 3. Nhận props
export function Dashboard({ onLogout, language, setLanguage }: DashboardProps) {
  return (
    <>
      {/* 🔹 4. Truyền props xuống Header */}
      <SmartHomeHeader 
        onLogout={onLogout} 
        language={language} 
        setLanguage={setLanguage} 
      />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* 🔹 5. Truyền 'language' xuống các component con */}
        {/* (Bạn sẽ phải cập nhật các component này để nhận prop 'language') */}
        <QuickActions language={language} />

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-6">
            <RoomControls language={language} />
            <EnergyUsage language={language} />
          </div>

          <div className="space-y-6">
            <ClimateControl language={language} />
            <SecurityPanel language={language} />
            <CameraFeed language={language} />
          </div>
        </div>
      </main>
    </>
  )
}