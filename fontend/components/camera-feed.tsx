"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
// 🔹 1. Import kiểu Language (từ file page.tsx)
import { Language } from "@/app/page";

// 🔹 2. Định nghĩa interface để NHẬN prop 'language'
interface CameraFeedProps {
  language: Language;
}

// 🔹 3. Thêm đối tượng dịch thuật
const translations = {
  vi: {
    title: "Nguồn Camera",
    pause: "Tạm dừng",
    play: "Phát",
    mute: "Tắt tiếng",
    unmute: "Bật tiếng",
    cameraName: "Camera Cửa Trước",
    status: "Trực tuyến",
    info: "Tín hiệu: 95% | P.giải: 1080p"
  },
  en: {
    title: "Camera Feed",
    pause: "Pause",
    play: "Play",
    mute: "Mute",
    unmute: "Unmute",
    cameraName: "Front Door Camera",
    status: "Online",
    info: "Signal: 95% | Res: 1080p"
  }
}

// 🔹 4. Nhận prop { language }
export function CameraFeed({ language }: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  // 🔹 5. Chọn bộ dịch dựa trên prop
  const t = translations[language];

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        {/* 🔹 6. Sử dụng text đã dịch */}
        <CardTitle className="text-lg">{t.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          {/* Camera Feed Placeholder */}
          <div className="w-full aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,100,255,0.1),transparent_70%)]" />
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className="w-12 h-12 rounded-full border-2 border-primary/50 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500" />
              </div>
              <span className="text-xs text-red-500 font-medium">LIVE</span>
            </div>

            {/* Recording indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500/90 px-2 py-1 rounded text-xs text-white font-medium">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              REC
            </div>

            {/* Timestamp */}
            <div className="absolute bottom-3 left-3 text-xs text-white/70 font-mono">
              {new Date().toLocaleTimeString("vi-VN")}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                {t.pause}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                {t.play}
              </>
            )}
          </Button>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? t.unmute : t.mute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Camera Info */}
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.cameraName}</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{t.status}</span>
          </div>
          <div className="text-xs text-muted-foreground">{t.info}</div>
        </div>
      </CardContent>
    </Card>
  )
}
