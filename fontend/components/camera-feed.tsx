"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// ... (giữ nguyên interface và props)


const STREAM_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_CAMERA_URL      // Localtonet (Vercel)
    : "http://localhost:5000/cam";           // Backend local


export function CameraFeed({ language }: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isError, setIsError] = useState(false)
  
  // Ref để can thiệp trực tiếp vào thẻ img
  const imgRef = useRef<HTMLImageElement>(null)

  // 🧹 HÀM DỌN DẸP QUAN TRỌNG
  const cleanupStream = () => {
    if (imgRef.current) {
      // Gán src rỗng để trình duyệt ngắt ngay kết nối socket cũ
      imgRef.current.src = "";
      imgRef.current.removeAttribute("src");
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Khi bấm Pause: Dọn dẹp trước rồi mới set state
      cleanupStream();
      setIsPlaying(false);
    } else {
      // Khi bấm Play: Tăng key để force reload
      setRefreshKey(prev => prev + 1);
      setIsError(false);
      setIsPlaying(true);
    }
  };

  const forceReload = () => {
    cleanupStream(); // Ngắt cái cũ trước
    setIsPlaying(false);
    
    // Timeout nhỏ để đảm bảo socket đã đóng hoàn toàn
    setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        setIsError(false);
        setIsPlaying(true);
    }, 100);
  };

  // Tự động dọn dẹp khi component unmount
  useEffect(() => {
    return () => cleanupStream();
  }, []);

  const t = {
    title: language === "vi" ? "Nguồn Camera" : "Camera Feed",
    pause: language === "vi" ? "Tạm dừng" : "Pause",
    play: language === "vi" ? "Phát" : "Play",
    reconnect: language === "vi" ? "Đang kết nối lại..." : "Reconnecting..."
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={forceReload}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <div className="w-full aspect-[4/3] bg-slate-900 flex items-center justify-center relative overflow-hidden">

            {isPlaying && !isError && (
              <img
                ref={imgRef} // 👈 Gắn ref vào đây
                key={refreshKey}
                src={`${STREAM_URL}?t=${refreshKey}`}
                alt="Live Stream"
                className="w-full h-full object-cover"
                onError={() => {
                  console.log("⚠️ Stream error");
                  cleanupStream(); // Lỗi thì cũng phải dọn
                  setIsError(true);
                }}
              />
            )}

            {(!isPlaying || isError) && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs">
                {isError ? t.reconnect : t.pause}
              </div>
            )}
          </div>
        </div>

        <Button className="w-full" onClick={handlePlayPause}>
          {isPlaying ? <><Pause className="w-4 h-4 mr-1" /> {t.pause}</> :
            <><Play className="w-4 h-4 mr-1" /> {t.play}</>}
        </Button>

      </CardContent>
    </Card>
  )
}