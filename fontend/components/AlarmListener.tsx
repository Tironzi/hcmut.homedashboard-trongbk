"use client"

import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { Flame, AlertTriangle, X, Lock } from "lucide-react";

const t = {
  vi: {
    fireMsg: "🔥 Phát hiện khói/khí gas!",
    motionMsg: "⚠️ Có người đột nhập!",
    doorMsg: "🚪 Cảnh báo: Mở cửa sai quá 5 lần!",
  },
  en: {
    fireMsg: "🔥 Smoke/Gas detected!",
    motionMsg: "⚠️ Intrusion detected!",
    doorMsg: "🚪 Warning: Door unlock failed 5 times!",
  }
};

export default function AlarmListener({ language = "vi" }: { language?: "vi" | "en" }) {
  const [showFirePopup, setShowFirePopup] = useState(false);
  const [showMotionPopup, setShowMotionPopup] = useState(false);
  const [showDoorPopup, setShowDoorPopup] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const content = t[language];

  // Hàm dừng âm thanh an toàn
  const stopAlarmAudio = () => {
    try {
      alarmAudioRef.current?.pause();
      if (alarmAudioRef.current) alarmAudioRef.current.currentTime = 0;
    } catch (e) {
      console.error("Audio stop error:", e);
    }
  };

  useEffect(() => {
    // Unlock audio browser policy (Mở khóa âm thanh trong im lặng)
    const unlockAudio = () => {
      const audio = alarmAudioRef.current;
      if (audio) {
        // 1. Tắt tiếng trước khi play nhử
        audio.muted = true; 
        
        audio.play().then(() => {
          // 2. Pause ngay lập tức
          audio.pause();
          audio.currentTime = 0;
          
          // 3. Bật lại tiếng để dành cho báo động thật
          audio.muted = false; 
        }).catch((e) => console.error("Audio unlock error:", e));
      }
      
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    // --- 1. XỬ LÝ BÁO CHÁY ---
    const handleFireEvent = (data: { status: "ALARM" | "CLEAR" }) => {
      console.log("🔥 [AlarmListener] Fire event:", data);
      
      if (data.status === "ALARM") {
        const isDismissed = sessionStorage.getItem("fire_dismissed");
        if (!isDismissed) {
          setShowFirePopup(true);
          alarmAudioRef.current?.play().catch(() => {});
        }
      } else {
        // 👇 SỬA Ở ĐÂY: Thêm stopAlarmAudio() khi hết báo động
        sessionStorage.removeItem("fire_dismissed");
        setShowFirePopup(false);
        stopAlarmAudio(); 
      }
    };

    // --- 2. XỬ LÝ CHUYỂN ĐỘNG ---
    const handleMotionEvent = (data: { status: "DETECTED" | "CLEAR" }) => {
      console.log("⚠️ [AlarmListener] Motion event:", data);
      
      if (data.status === "DETECTED") {
        const isDismissed = sessionStorage.getItem("motion_dismissed");
        if (!isDismissed) {
          setShowMotionPopup(true);
          alarmAudioRef.current?.play().catch(() => {});
        }
      } else {
        // 👇 SỬA Ở ĐÂY
        sessionStorage.removeItem("motion_dismissed");
        setShowMotionPopup(false);
        stopAlarmAudio();
      }
    };

    // --- 3. XỬ LÝ CỬA ---
    const handleDoorEvent = (data: { status: "ALARM" | "CLEAR" }) => {
      console.log("🚪 [AlarmListener] door_breach event received:", data);
      
      if (data.status === "ALARM") {
        const isDismissed = sessionStorage.getItem("door_dismissed");
        if (!isDismissed) {
          console.log("✅ [AlarmListener] SHOWING DOOR POPUP!");
          setShowDoorPopup(true);
          alarmAudioRef.current?.play().catch(() => {});
        }
      } else {
        // 👇 SỬA Ở ĐÂY
        sessionStorage.removeItem("door_dismissed");
        setShowDoorPopup(false);
        stopAlarmAudio();
      }
    };

    socket.on("mq2", handleFireEvent);
    socket.on("motion", handleMotionEvent);
    socket.on("door_breach", handleDoorEvent);

    if (socket.connected) socket.emit("request_sync_state");
    socket.on("connect", () => socket.emit("request_sync_state"));

    return () => {
      socket.off("mq2", handleFireEvent);
      socket.off("motion", handleMotionEvent);
      socket.off("door_breach", handleDoorEvent);
      socket.off("connect");
    };
  }, []);

  // --- CÁC HÀM TẮT POPUP THỦ CÔNG ---

  const handleFireDismiss = () => {
    setShowFirePopup(false);
    stopAlarmAudio();
    sessionStorage.setItem("fire_dismissed", "true"); 
  };

  const handleMotionDismiss = () => {
    setShowMotionPopup(false);
    stopAlarmAudio();
    sessionStorage.setItem("motion_dismissed", "true"); 
  };

  const handleDoorDismiss = () => {
    setShowDoorPopup(false);
    stopAlarmAudio();
    sessionStorage.setItem("door_dismissed", "true"); 
  };

  return (
    <>
      <audio src="/sounds/mixkit.wav" ref={alarmAudioRef} loop preload="auto" />

      {/* 🔥 FIRE ALARM */}
      {showFirePopup && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pt-4 animate-slide-down">
          <div className="bg-red-600 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md w-full border-2 border-red-700">
            <Flame className="w-8 h-8 flex-shrink-0 animate-pulse" />
            <div className="flex-1 font-semibold text-lg">
              {content.fireMsg}
            </div>
            <button
              onClick={handleFireDismiss}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-700 hover:bg-red-800 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ MOTION ALARM */}
      {showMotionPopup && (
        <div className="fixed top-20 left-0 right-0 z-[9998] flex justify-center px-4 animate-slide-down">
          <div className="bg-amber-500 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md w-full border-2 border-amber-600">
            <AlertTriangle className="w-8 h-8 flex-shrink-0 animate-pulse" />
            <div className="flex-1 font-semibold text-lg">
              {content.motionMsg}
            </div>
            <button
              onClick={handleMotionDismiss}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-700 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 🚪 DOOR ALARM */}
      {showDoorPopup && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center px-4 animate-slide-down">
          <div className="bg-yellow-400 text-red-600 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md w-full border-2 border-yellow-500">
            <Lock className="w-8 h-8 flex-shrink-0 animate-pulse text-red-600" />
            <div className="flex-1 font-bold text-lg text-red-600">
              {content.doorMsg}
            </div>
            <button
              onClick={handleDoorDismiss}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all active:scale-95"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}