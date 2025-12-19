"use client"

import { useEffect, useState } from "react"
import { Thermometer, Droplets } from "lucide-react"
import { Card } from "@/components/ui/card"
import { socket } from "@/lib/socket"
import { Language } from "@/app/page"

interface ClimateControlProps {
  language: Language;
}

const translations = {
  vi: {
    title: "Khí hậu",
    temperature: "Nhiệt độ",
    humidity: "Độ ẩm",
  },
  en: {
    title: "Climate",
    temperature: "Temperature",
    humidity: "Humidity",
  }
}

export function ClimateControl({ language }: ClimateControlProps) {
  const t = translations[language];

  // ----- STATE REALTIME -----
  const [temperature, setTemperature] = useState<number>(0)
  const [humidity, setHumidity] = useState<number>(0)

  // ----- SOCKET.IO RECEIVE -----
  useEffect(() => {
    // Yêu cầu server gửi lại dữ liệu lần nữa mỗi khi tab được mở
    socket.emit("request_sync_state")
  }, [])
  
  useEffect(() => {
    socket.on("climate_update", (data) => {
      console.log("📥 climate_update:", data)
      if (data.temperature !== undefined) setTemperature(data.temperature)
      if (data.humidity !== undefined) setHumidity(data.humidity)
    })

    return () => {
      socket.off("climate_update")
    }
  }, [])

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-foreground">{t.title}</h2>

      <div className="space-y-4">
        {/* Temperature */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.temperature}</div>
              <div className="text-lg font-semibold text-foreground">
                {temperature}°C
              </div>
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.humidity}</div>
              <div className="text-lg font-semibold text-foreground">
                {humidity}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}