"use client"

import { AlertTriangle, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Language } from "@/app/page";
import { socket } from "@/lib/socket";

const translations = {
  vi: {
    title: "Tác vụ nhanh",
    Alarm: "Báo động",
    firePump: "Bơm chữa cháy",
  },
  en: {
    title: "Quick Actions",
    Alarm: "Alarm",
    firePump: "Fire Pump",
  }
}

interface QuickActionsProps {
  language: Language;
}

const MQTT_DEVICE_MAP: Record<string, string> = {
  "all-alarm": "bao_dong",
  "fire-pump": "bom",
};
const MQTT_DEVICE_MAP_REVERSE: Record<string, string> = {
  "bao_dong": "all-alarm",
  "bom": "fire-pump",
};

export function QuickActions({ language }: QuickActionsProps) {
  const [activeActions, setActiveActions] = useState<Set<string>>(new Set())
  const t = translations[language];

  // Cập nhật trạng thái từ backend:
  useEffect(() => {
    // Khi server trả về trạng thái thiết bị
    const onDeviceUpdate = (data: { device: string, state: "ON" | "OFF" }) => {
      const quickActionId = MQTT_DEVICE_MAP_REVERSE[data.device];
      if (!quickActionId) return;
      setActiveActions(prev => {
        const next = new Set(prev);
        if (data.state === "ON") {
          next.add(quickActionId);
        } else {
          next.delete(quickActionId);
        }
        return next;
      });
    };

    socket.on("device_update", onDeviceUpdate);

    // Đồng bộ lại trạng thái toàn bộ nếu server trả về tất cả
    const onAllUpdate = (data: Record<string, string>) => {
      setActiveActions(() => {
        const next = new Set<string>();
        for (const [device, state] of Object.entries(data)) {
          const quickActionId = MQTT_DEVICE_MAP_REVERSE[device];
          if (quickActionId && state === "ON") {
            next.add(quickActionId);
          }
        }
        return next;
      });
    };

    socket.on("device_all_update", onAllUpdate);

    // Yêu cầu server sync trạng thái khi lên page
    socket.emit("request_sync_state");

    return () => {
      socket.off("device_update", onDeviceUpdate);
      socket.off("device_all_update", onAllUpdate);
    };
  }, []);

  const actions = [
    { id: "all-alarm", icon: AlertTriangle, label: t.Alarm, color: "bg-red-500" },
    { id: "fire-pump", icon: Flame, label: t.firePump, color: "bg-orange-500" },
  ];

  const handleToggleAction = (id: string) => {
    setActiveActions((prev) => {
      const next = new Set(prev)
      const isActive = next.has(id);
      if (isActive) {
        next.delete(id)
      } else {
        next.add(id)
      }

      // Gửi trạng thái điều khiển lên backend
      const mqttDevice = MQTT_DEVICE_MAP[id]
      if (mqttDevice) {
        socket.emit("device_control", {
          device: mqttDevice,
          state: isActive ? "OFF" : "ON"
        });
      }
      return next
    })
  }

  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold mb-4 text-foreground">{t.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          const isActive = activeActions.has(action.id)

          return (
            <div
              key={action.id}
              className="flex items-center justify-between p-3 md:p-4 border border-input rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div 
                  className={`w-9 md:w-10 h-9 md:h-10 rounded-lg ${action.color} flex items-center justify-center text-white flex-shrink-0`}
                >
                  <Icon className="w-4 md:w-5 h-4 md:h-5" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground truncate">
                  {action.label}
                </span>
              </div>

              <button
                onClick={() => handleToggleAction(action.id)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center flex-shrink-0 ${
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