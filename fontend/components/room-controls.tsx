"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Lightbulb, Tv, Fan, Monitor, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";


// const socket = io("http://localhost:5000");   // backend của bạn
import { socket } from "@/lib/socket";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { Language } from "@/app/page";
import { io } from "socket.io-client";   // ⚡ Socket.io client

// -------------------- Types --------------------
interface RoomControlsProps {
  language: Language;
}

interface DeviceItem {
  id: string;       // UI internal ID
  device: string;   // MQTT device ID
  name: string;
  icon: any;
  room: string;
  isOn: boolean;
  brightness?: number;
  speed?: number;
}

// -------------------- Translations --------------------
const translations = {
  vi: {
    title: "Điều khiển phòng",
    livingRoom: "Phòng khách",
    bedroom: "Phòng ngủ",
    kitchen: "Phòng bếp",

    ceilingLight: "Đèn trần",
    smartTV: "Smart TV",
    ceilingFan: "Quạt trần",

    bedsideLamp: "Đèn ngủ",
    bedroomFan: "Quạt ngủ",
    kitchenLight: "Đèn bếp",
    kitchenFan: "Quạt thông gió",

    addDevice: "Thêm thiết bị",
    deviceName: "Tên thiết bị",
    room: "Phòng",
    chooseIcon: "Chọn biểu tượng",
    hasBrightness: "Có thanh sáng (brightness)",
    hasSpeed: "Có thanh tốc độ (speed)",
    add: "Thêm",
    cancel: "Hủy",
    customRoomPlaceholder: "Tên phòng mới",
    iconOther: "Khác",
    deleteDevice: "Xóa",
    confirmDelete: "Bạn có chắc muốn xóa thiết bị này?",

    brightness: "Độ sáng",
    speed: "Tốc độ",
  },
  en: {
    title: "Room Controls",
    livingRoom: "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",

    ceilingLight: "Ceiling Light",
    smartTV: "Smart TV",
    ceilingFan: "Ceiling Fan",

    bedsideLamp: "Bedside Lamp",
    bedroomFan: "Bedroom Fan",
    kitchenLight: "Kitchen Light",
    kitchenFan: "Kitchen Ventilation Fan",

    addDevice: "Add Device",
    deviceName: "Device name",
    room: "Room",
    chooseIcon: "Choose icon",
    hasBrightness: "Has brightness slider",
    hasSpeed: "Has speed slider",
    add: "Add",
    cancel: "Cancel",
    customRoomPlaceholder: "Custom room name",
    iconOther: "Other",
    deleteDevice: "Delete",
    confirmDelete: "Are you sure you want to delete this device?",

    brightness: "Brightness",
    speed: "Speed",
  },
} as const;

// -------------------- Component --------------------
export function RoomControls({ language }: RoomControlsProps) {
  const t = translations[language];

// ---------------- MQTT + SOCKET.IO ----------------
useEffect(() => {
  // 1. Lắng nghe full danh sách (code cũ của bạn)
  socket.on("device_all_update", (data) => {
    console.log("📥 device_all_update:", data);
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        isOn: data[d.device] === "ON"
      }))
    );
  });

  // 🔥 THÊM MỚI: Chủ động yêu cầu Server gửi lại state ngay khi Component này hiện ra
  console.log("🔄 Requesting initial state...");
  socket.emit("request_sync_state");

  return () => {
    socket.off("device_all_update");
  };
}, []); // Dependency rỗng là đúng

useEffect(() => {
  socket.on("device_update", (data) => {
    console.log("⚡ device_update:", data);

    setDevices((prev) =>
      prev.map((d) =>
        d.device === data.device
          ? { ...d, isOn: data.state === "ON" }
          : d
      )
    );
  });

  return () => socket.off("device_update");
}, []);


  // ---------------- Initial Devices ----------------
  const initialDevices: DeviceItem[] = [
    // Living room
    { id: "1", device: "den_tran", name: t.ceilingLight, icon: Lightbulb, room: t.livingRoom, isOn: false },
    { id: "2", device: "smart_tv", name: t.smartTV, icon: Tv, room: t.livingRoom, isOn: false },
    { id: "3", device: "quat_tran", name: t.ceilingFan, icon: Fan, room: t.livingRoom, isOn: false },

    // Bedroom
    { id: "4", device: "den_ngu", name: t.bedsideLamp, icon: Lightbulb, room: t.bedroom, isOn: false, brightness: 50 },
    { id: "5", device: "quat_ngu", name: t.bedroomFan, icon: Fan, room: t.bedroom, isOn: false, speed: 40 },

    // Kitchen
    { id: "6", device: "den_bep", name: t.kitchenLight, icon: Lightbulb, room: t.kitchen, isOn: false },
    { id: "7", device: "quat_thong_gio", name: t.kitchenFan, icon: Fan, room: t.kitchen, isOn: false },
  ];

  const [devices, setDevices] = useState<DeviceItem[]>(initialDevices);

  // ---------------- Device Add/Delete ----------------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDeviceCode, setNewDeviceCode] = useState("");
  const [newRoomSelect, setNewRoomSelect] = useState<string>("");
  const [newRoomCustom, setNewRoomCustom] = useState("");
  const [newIconKey, setNewIconKey] = useState("light");
  const [newHasBrightness, setNewHasBrightness] = useState(false);
  const [newHasSpeed, setNewHasSpeed] = useState(false);

  const iconMap: Record<string, any> = {
    light: Lightbulb,
    fan: Fan,
    tv: Tv,
    other: <Monitor></Monitor>,
  };

  // ---------------- Update UI Language ----------------
  useEffect(() => {
    const nameMap: Record<string, string> = {
      "1": t.ceilingLight,
      "2": t.smartTV,
      "3": t.ceilingFan,
      "4": t.bedsideLamp,
      "5": t.bedroomFan,
      "6": t.kitchenLight,
      "7": t.kitchenFan,
    };

    setDevices((prev) =>
      prev.map((d) =>
        nameMap[d.id]
          ? { ...d, name: nameMap[d.id] }
          : d
      )
    );
  }, [language]);

  // ---------------- Actions ----------------
  const toggleDevice = (device: DeviceItem) => {
    const newState = !device.isOn;

    // Update UI immediately
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, isOn: newState } : d))
    );

    // Gửi lệnh lên backend
    socket.emit("device_control", {
      device: device.device,
      state: newState ? "ON" : "OFF"
    });
    
  };

  const deleteDevice = (id: string) => {
    if (confirm(t.confirmDelete)) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleAddDevice = () => {
    const room = newRoomSelect === "custom" ? newRoomCustom : newRoomSelect;

    if (!newName.trim() || !room.trim() || !newDeviceCode.trim()) return;

    const newDevice: DeviceItem = {
      id: String(Date.now()),
      device: newDeviceCode.trim(), // MQTT ID
      name: newName.trim(),
      icon: iconMap[newIconKey],
      room,
      isOn: false,
      brightness: newHasBrightness ? 50 : undefined,
      speed: newHasSpeed ? 50 : undefined,
    };

    setDevices((prev) => [...prev, newDevice]);
    setIsDialogOpen(false);
  };

  // ---------------- UI ----------------
  const rooms = Array.from(new Set(devices.map((d) => d.room)));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t.title}</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">+ {t.addDevice}</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addDevice}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-3">
              <Input placeholder="Tên thiết bị" onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Device MQTT ID (vd: den_tran)" onChange={(e) => setNewDeviceCode(e.target.value)} />

              <Select value={newRoomSelect} onValueChange={setNewRoomSelect}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={t.livingRoom}>{t.livingRoom}</SelectItem>
                  <SelectItem value={t.bedroom}>{t.bedroom}</SelectItem>
                  <SelectItem value={t.kitchen}>{t.kitchen}</SelectItem>
                  <SelectItem value="custom">Phòng khác...</SelectItem>
                </SelectContent>
              </Select>

              {newRoomSelect === "custom" && (
                <Input placeholder="Tên phòng mới" onChange={(e) => setNewRoomCustom(e.target.value)} />
              )}

              <Select value={newIconKey} onValueChange={setNewIconKey}>
                <SelectTrigger><SelectValue placeholder="Chọn icon" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">💡 Light</SelectItem>
                  <SelectItem value="fan">🌀 Fan</SelectItem>
                  <SelectItem value="tv">📺 TV</SelectItem>
                  <SelectItem value="other">🔧 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button onClick={handleAddDevice}>{t.add}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.map((room) => (
        <div key={room} className="mb-6">
          <h3 className="text-sm text-muted-foreground mb-2">{room}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {devices
              .filter((d) => d.room === room)
              .map((device) => {
                const Icon = device.icon;

                return (
                  <div
                    key={device.id}
                    className={`p-4 rounded-xl border ${
                      device.isOn ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.isOn ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span>{device.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={device.isOn} onCheckedChange={() => toggleDevice(device)} />
                        <Button variant="ghost" size="sm" onClick={() => deleteDevice(device.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {device.brightness !== undefined && (
                      <div className="mt-3">
                        <Slider
                          value={[device.brightness]}
                          onValueChange={(v) => {
                            setDevices((prev) =>
                              prev.map((d) =>
                                d.id === device.id ? { ...d, brightness: v[0] } : d
                              )
                            );
                          }}
                        />
                      </div>
                    )}

                    {device.speed !== undefined && (
                      <div className="mt-3">
                        <Slider
                          value={[device.speed]}
                          onValueChange={(v) =>
                            setDevices((prev) =>
                              prev.map((d) =>
                                d.id === device.id ? { ...d, speed: v[0] } : d
                              )
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </Card>
  );
}
