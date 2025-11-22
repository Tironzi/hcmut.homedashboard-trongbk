"use client"

import { Power, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useState } from "react"
// 🔹 1. Import kiểu Language (từ file page.tsx)
import { Language } from "@/app/page";

// 🔹 2. Thêm đối tượng dịch thuật
const translations = {
  vi: {
    title: "Tác vụ nhanh",
    allLights: "Tất cả đèn",
    allAlarm: "Tất cả báo động",
  },
  en: {
    title: "Quick Actions",
    allLights: "All Lights",
    allAlarm: "All Alarm",
  }
}

// 🔹 3. Định nghĩa interface để NHẬN prop 'language'
interface QuickActionsProps {
  language: Language;
}

// 🔹 4. Nhận prop { language }
export function QuickActions({ language }: QuickActionsProps) {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  // 🔹 5. Chọn bộ dịch dựa trên prop
  const t = translations[language];

  // 🔹 6. Cập nhật mảng actions để dùng text từ 't'
  const actions = [
    { id: "all-lights", icon: Power, label: t.allLights, color: "bg-accent" },
    { id: "all-alarm", icon: AlertTriangle, label: t.allAlarm, color: "bg-red-500" },
  ]

  const toggleAction = (id: string) => {
    setActiveActions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Card className="p-6">
      {/* 🔹 7. Sử dụng text đã dịch */}
      <h2 className="text-lg font-semibold mb-4 text-foreground">{t.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          const isActive = activeActions.has(action.id)

          return (
            <div
              key={action.id}
              className="flex items-center justify-between p-4 border border-input rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                {/* 🔹 8. Đã dùng 'action.label' (lấy từ 't' ở bước 6) */}
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </div>

              <button
                onClick={() => toggleAction(action.id)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                  isActive ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
