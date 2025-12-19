"use client"

import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import { Flame, AlertTriangle } from "lucide-react";

const t = {
  vi: {
    firePopupTitle: "Cảnh báo",
    firePopupMsg: "Phát hiện khói/khí gas!",
    firePopupClose: "Tắt cảnh báo",
    motionPopupTitle: "Cảnh báo chuyển động",
    motionPopupMsg: "Có người đột nhập!",
    motionPopupClose: "Tắt cảnh báo chuyển động",
  },
  en: {
    firePopupTitle: "Warning",
    firePopupMsg: "Smoke/Gas detected!",
    firePopupClose: "Dismiss Alarm",
    motionPopupTitle: "Motion Alert",
    motionPopupMsg: "Intrusion detected!",
    motionPopupClose: "Dismiss Motion Alarm",
  }
};

export default function AlarmListener({ language = "vi" }: { language?: "vi" | "en" }) {
  const [showFirePopup, setShowFirePopup] = useState(false);
  const [showMotionPopup, setShowMotionPopup] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const content = t[language];

  useEffect(() => {
    // Unlock audio
    const unlockAudio = () => {
      alarmAudioRef.current?.play().then(() => {
        alarmAudioRef.current?.pause();
        if (alarmAudioRef.current) alarmAudioRef.current.currentTime = 0;
      }).catch(() => {});
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
    const handleFireEvent = (data: { status: "ALARM" | "CLEAR" }) => {
      if (data.status === "ALARM") {
        setShowFirePopup(true);
        alarmAudioRef.current?.play().catch(()=>{});
      }
    };

    const handleMotionEvent = (data: { status: "DETECTED" | "CLEAR" }) => {
      if (data.status === "DETECTED") {
        setShowMotionPopup(true);
        alarmAudioRef.current?.play().catch(()=>{});
      }
    };

    socket.on("mq2", handleFireEvent);
    socket.on("motion", handleMotionEvent);

    if (socket.connected) socket.emit("request_sync_state");
    socket.on("connect", () => socket.emit("request_sync_state"));

    return () => {
      socket.off("mq2", handleFireEvent);
      socket.off("motion", handleMotionEvent);
      socket.off("connect");
    };
  }, []);

  const stopAlarmAudio = () => {
    alarmAudioRef.current?.pause();
    if (alarmAudioRef.current) alarmAudioRef.current.currentTime = 0;
  };

  const handleFireDismiss = () => {
    setShowFirePopup(false);
    stopAlarmAudio();
  };
  const handleMotionDismiss = () => {
    setShowMotionPopup(false);
    stopAlarmAudio();
  };

  return (
    <>
      <audio src="/sounds/alarm.mp3" ref={alarmAudioRef} loop preload="auto" />

      {showFirePopup && (
        <div className="fixed z-[9999] inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white border-4 border-red-600 rounded-xl px-10 py-10 shadow-2xl flex flex-col items-center animate-bounce-slow max-w-sm mx-4">
            <Flame className="w-20 h-20 text-red-600 animate-pulse mb-6" />
            <div className="text-3xl font-extrabold text-red-700 mb-2 uppercase tracking-wider text-center">
                {content.firePopupTitle}
            </div>
            <div className="mb-8 text-xl font-semibold text-gray-800 text-center">
                {content.firePopupMsg}
            </div>
            <button
              className="px-8 py-3 bg-red-600 text-white font-bold text-lg rounded-full hover:bg-red-700 active:scale-95 transition-all shadow-lg ring-4 ring-red-200"
              onClick={handleFireDismiss}
            >
              {content.firePopupClose}
            </button>
          </div>
        </div>
      )}

      {showMotionPopup && (
        <div className="fixed z-[9998] inset-0 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white border-4 border-amber-500 rounded-xl px-10 py-10 shadow-2xl flex flex-col items-center animate-bounce-slow max-w-sm mx-4">
            <AlertTriangle className="w-20 h-20 text-amber-500 animate-pulse mb-6" />
            <div className="text-3xl font-extrabold text-amber-700 mb-2 uppercase tracking-wider text-center">
                {content.motionPopupTitle}
            </div>
            <div className="mb-8 text-xl font-semibold text-gray-800 text-center">
                {content.motionPopupMsg}
            </div>
            <button
              className="px-8 py-3 bg-amber-500 text-white font-bold text-lg rounded-full hover:bg-amber-600 active:scale-95 transition-all shadow-lg ring-4 ring-amber-200"
              onClick={handleMotionDismiss}
            >
              {content.motionPopupClose}
            </button>
          </div>
        </div>
      )}
    </>
  );
}