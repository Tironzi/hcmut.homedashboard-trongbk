"use client";

import React, { useEffect, useState } from "react";
import { Lightbulb, Fan, Users, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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

// -------------------- Types --------------------
interface RoomControlsProps {
  language: Language;
}

interface DeviceItem {
  id: string;
  device: string;
  name: string;
  icon: any;
  room:  string;
  isOn: boolean;
}

// -------------------- Translations --------------------
const translations = {
  vi: {
    title: "Điều khiển phòng",
    livingRoom: "Phòng khách",
    ceilingLight: "Đèn trần",
    ceilingFan: "Quạt trần",
    addDevice: "Thêm thiết bị",
    deviceName: "Tên thiết bị",
    room: "Phòng",
    chooseIcon: "Chọn biểu tượng",
    add: "Thêm",
    cancel: "Hủy",
    customRoomPlaceholder: "Tên phòng mới",
    iconOther: "Khác",
    deleteDevice: "Xóa",
    confirmDelete: "Bạn có chắc muốn xóa thiết bị này? ",
    status: "Trạng thái phòng",
    occupied: "Có người",
    empty: "Không có người",
    autoMode: "Auto",
  },
  en: {
    title: "Room Controls",
    livingRoom: "Living Room",
    ceilingLight: "Ceiling Light",
    ceilingFan: "Ceiling Fan",
    addDevice: "Add Device",
    deviceName: "Device name",
    room: "Room",
    chooseIcon: "Choose icon",
    add: "Add",
    cancel: "Cancel",
    customRoomPlaceholder:  "Custom room name",
    iconOther: "Other",
    deleteDevice: "Delete",
    confirmDelete: "Are you sure you want to delete this device? ",
    status: "Room Status",
    occupied: "Occupied",
    empty: "Empty",
    autoMode: "Auto",
  },
} as const;

// -------------------- Component --------------------
export function RoomControls({ language }:  RoomControlsProps) {
  const t = translations[language];

  // State cho PEOPLE DETECTION
  const [peopleStatus, setPeopleStatus] = useState<"DETECTED" | "CLEAR">("CLEAR");
  
  // State cho AUTO MODE
  const [autoMode, setAutoMode] = useState(false);

  // ---------------- MQTT + SOCKET. IO ----------------
  useEffect(() => {
    socket.on("device_all_update", (data) => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          isOn: data[d.device] === "ON"
        }))
      );
    });

    socket.emit("request_sync_state");
    return () => {
      socket.off("device_all_update");
    };
  }, []);

  useEffect(() => {
    socket.on("device_update", (data) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.device === data. device
            ? { ...d, isOn: data.state === "ON" }
            :  d
        )
      );
    });
    return () => socket.off("device_update");
  }, []);

  // NHẬN DỮ LIỆU PEOPLE STATUS TỪ BACKEND
  useEffect(() => {
    socket.on("people", (data:  { status: "DETECTED" | "CLEAR" }) => {
      console.log("👤 People status received:", data.status);
      setPeopleStatus(data.status);
    });

    return () => {
      socket.off("people");
    };
  }, []);

  // NHẬN TRẠNG THÁI AUTO MODE TỪ BACKEND
  useEffect(() => {
    socket.on("security_mode", (data: { mode: string }) => {
      setAutoMode(data.mode === "auto");
    });

    return () => {
      socket.off("security_mode");
    };
  }, []);

  // ---------------- Initial Devices ----------------
  const initialDevices:  DeviceItem[] = [
    { id: "1", device: "den_tran", name: t.ceilingLight, icon: Lightbulb, room: t.livingRoom, isOn: false },
    { id: "2", device: "quat_tran", name: t.ceilingFan, icon: Fan, room: t.livingRoom, isOn: false },
  ];
  const [devices, setDevices] = useState<DeviceItem[]>(initialDevices);

  // ---------------- Device Add/Delete ----------------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDeviceCode, setNewDeviceCode] = useState("");
  const [newRoomSelect, setNewRoomSelect] = useState<string>("");
  const [newRoomCustom, setNewRoomCustom] = useState("");
  const [newIconKey, setNewIconKey] = useState("light");

  const iconMap: Record<string, any> = {
    light: Lightbulb,
    fan: Fan,
    other:  Lightbulb,
  };

  // ---------------- Update UI Language ----------------
  useEffect(() => {
    const nameMap: Record<string, string> = {
      "1": t.ceilingLight,
      "2": t.ceilingFan,
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
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ... d, isOn: newState } :  d))
    );
    socket.emit("device_control", {
      device:  device.device,
      state: newState ?  "ON" : "OFF"
    });
  };

  // TOGGLE AUTO MODE
  const toggleAutoMode = () => {
    const newAutoState = !autoMode;
    setAutoMode(newAutoState);
    
    const command = `AUTOR: ${newAutoState ?  "1" : "0"}`;
    socket.emit("security_control", command);
    console.log("📤 Auto mode command:", command);
  };

  const deleteDevice = (id: string) => {
    if (confirm(t.confirmDelete)) {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleAddDevice = () => {
    const room = newRoomSelect === "custom" ? newRoomCustom : newRoomSelect;
    if (! newName.trim() || !room.trim() || !newDeviceCode.trim()) return;
    const newDevice: DeviceItem = {
      id: String(Date.now()),
      device: newDeviceCode. trim(),
      name: newName.trim(),
      icon: iconMap[newIconKey],
      room,
      isOn: false,
    };
    setDevices((prev) => [...prev, newDevice]);
    setIsDialogOpen(false);
  };

  // ---------------- UI ----------------
  const rooms = Array.from(new Set(devices. map((d) => d.room)));

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
              <DialogTitle>{t. addDevice}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <Input placeholder="Tên thiết bị" onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Device MQTT ID (vd: den_tran)" onChange={(e) => setNewDeviceCode(e.target.value)} />
              <Select value={newRoomSelect} onValueChange={setNewRoomSelect}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={t.livingRoom}>{t.livingRoom}</SelectItem>
                  <SelectItem value="custom">Phòng khác... </SelectItem>
                </SelectContent>
              </Select>
              {newRoomSelect === "custom" && (
                <Input placeholder="Tên phòng mới" onChange={(e) => setNewRoomCustom(e. target.value)} />
              )}
              <Select value={newIconKey} onValueChange={setNewIconKey}>
                <SelectTrigger><SelectValue placeholder="Chọn icon" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">💡 Light</SelectItem>
                  <SelectItem value="fan">🌀 Fan</SelectItem>
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

      {/* HIỂN THỊ TRẠNG THÁI PHÒNG KHÁCH */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                peopleStatus === "DETECTED" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
              }`}
            >
              {peopleStatus === "DETECTED" ? <Users className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold">{t.status}</p>
              <p className="text-sm text-muted-foreground">
                {peopleStatus === "DETECTED" ? t.occupied :  t.empty}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              peopleStatus === "DETECTED"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {peopleStatus === "DETECTED" ?  t.occupied : t.empty}
          </div>
        </div>
      </div>

      {rooms.map((room) => (
        <div key={room} className="mb-6">
          {/* 🆕 HEADER PHÒNG + BUTTON AUTO */}
          <div className="flex items-center justify-between mb-2">
  <h3 className="text-sm text-muted-foreground">{room}</h3>
  <div className="flex items-center gap-2 mr-4">
    <span className="text-sm text-muted-foreground">{t.autoMode}</span>
    <Switch checked={autoMode} onCheckedChange={toggleAutoMode} />
  </div>
</div>


          <div className="grid gap-4 md:grid-cols-2">
            {devices
              .filter((d) => d.room === room)
              .map((device) => {
                const Icon = device.icon;
                return (
                  <div
                    key={device.id}
                    className={`p-4 rounded-xl border ${
                      device.isOn ?  "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.isOn ?  "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span>{device.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={device.isOn} onCheckedChange={() => toggleDevice(device)} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </Card>
  );
}