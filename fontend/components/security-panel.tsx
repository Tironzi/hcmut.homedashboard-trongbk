"use client"

import { Lock, AlertTriangle, Flame, Shield, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Language } from "@/app/page";
import { socket } from "@/lib/socket";

// --- Dịch ---
const translations = {
  vi: {
    title: "An ninh",
    simStatus: "Trạng thái SIM",
    at: "Kết nối AT",
    reg: "Đăng ký mạng",
    csq: "Chất lượng sóng",
    sim_ok: "Đã kết nối",
    sim_nok: "Chưa kết nối",
    sim_none: "Không kết nối",
    sim_home: "Mạng nhà",
    sim_roam: "Roaming",
    sim_trying: "Đang kết nối",
    signal: "Sóng",
    signal_good: "Tốt",
    signal_avg: "Trung bình",
    signal_bad: "Yếu",
    reg_ok: "Đã đăng ký",
    reg_fail: "Chưa đăng ký",
    fireName: "Báo cháy",
    fireActive: "Đang hoạt động",
    gasAlarm: "Phát hiện khói/khí gas!",
    gasClear: "Bình thường",
    motionName: "Chống trộm",
    motionIntrude: "Cảnh báo có người đột nhập!",
    motionClear: "Không phát hiện chuyển động",
    doorName: "Cửa trước",
    doorLocked: "Bình thường",
    doorBreach: "Cảnh báo nhập sai mật khẩu 5 lần!",
    callBtn: "Gọi điện",
    smsBtn: "Nhắn tin",
    auto: "Tự động",
    manual: "Thủ công",
    on: "Bật",
    off: "Tắt",
  },
  en: {
    title: "Security",
    simStatus: "SIM Status",
    at: "AT Connect",
    reg: "Network Reg.",
    csq: "Signal Quality",
    sim_ok: "Connected",
    sim_nok: "Not connected",
    sim_none: "No network",
    sim_home: "Home",
    sim_roam: "Roaming",
    sim_trying: "Connecting",
    signal: "Signal",
    signal_good: "Good",
    signal_avg: "Average",
    signal_bad: "Weak",
    reg_ok: "Registered",
    reg_fail: "Not registered",
    fireName: "Fire Alarm",
    fireActive: "Active",
    gasAlarm: "Smoke/Gas detected!",
    gasClear: "Normal",
    motionName: "Anti-theft",
    motionIntrude: "Intrusion detected!",
    motionClear: "No motion",
    doorName: "Front door",
    doorLocked: "Normal",
    doorBreach: "Password failed >5 times!",
    callBtn: "Call",
    smsBtn: "SMS",
    auto: "Auto",
    manual: "Manual",
    on: "ON",
    off: "OFF",
  }
};

interface SecurityPanelProps {
  language: Language;
}

// Helper functions (Giữ nguyên)
function getSignalLevel(csq: number) {
  if (csq <= 14 && csq >= 0) return "bg-red-500";
  if (csq >= 15 && csq <= 20) return "bg-yellow-500";
  if (csq > 20) return "bg-green-500";
  return "bg-muted";
}
function getSignalDesc(csq: number, t: any) {
  if (csq > 20) return t.signal_good;
  if (csq >= 15 && csq <= 20) return t.signal_avg;
  if (csq >= 0) return t.signal_bad;
  return "-";
}
function getRegDesc(reg: number, t: any) {
  return reg === 1 ? t.reg_ok : t.reg_fail;
}

export function SecurityPanel({ language }: SecurityPanelProps) {
  const t = translations[language];

  // --- SIM STATE ---
  const [simAt, setSimAt] = useState<number>(0);
  const [simReg, setSimReg] = useState<number>(0);
  const [simCSQ, setSimCSQ] = useState<number>(-1);

  // --- CALL / SMS ---
  const [callEnable, setCallEnable] = useState(false);
  const [smsEnable, setSmsEnable] = useState(false);

  // --- Chống trộm ---
  const [motionEnable, setMotionEnable] = useState(false);
  const [motionStatus, setMotionStatus] = useState(false);

  // --- Cửa trước ---
  const [doorEnable, setDoorEnable] = useState(false);
  const [doorAlert, setDoorAlert] = useState(false);

  // --- Báo cháy ---
  const [fireEnable, setFireEnable] = useState(false);
  const [fireAlert, setFireAlert] = useState(false);

  // --- AUTO/MANUAL MODE ---
  const [autoMode, setAutoMode] = useState(true);

  // --- Đồng bộ trạng thái với backend khi reload ---
  useEffect(() => {
    // 1. Định nghĩa handler
    const handleSimStatus = (data: {at:number,reg:number,csq:number}) => {
      setSimAt(data.at);
      setSimReg(data.reg);
      setSimCSQ(data.csq);
    };

    const handleCallSmsStatus = (data: { call: boolean; sms: boolean }) => {
      setCallEnable(!!data.call);
      setSmsEnable(!!data.sms);
    };

    const handleMotionEnable = (data: {enable: boolean}) => setMotionEnable(!!data.enable);
    const handleMotionIntrude = (data: {state: number}) => setMotionStatus(data.state === 1);

    const handleDoorEnable = (data: {enable: boolean}) => setDoorEnable(!!data.enable);
    const handleDoorBreach = (data: {state: number}) => setDoorAlert(data.state === 1);

    const handleFireEnable = (data: {enable: boolean}) => setFireEnable(!!data.enable);

    const handleMq2 = (data: {status: "ALARM" | "CLEAR"}) => {
      setFireAlert(data.status === "ALARM");
    };

    const handleSecurityMode = (data: {mode: "auto"|"manual"}) => {
      setAutoMode(data.mode === "auto");
    };

     // Handler realtime motion
  const handleMotion = (data: {status: "DETECTED"|"CLEAR"}) => {
    setMotionStatus(data.status === "DETECTED");
  };

    // 2. Lắng nghe
    socket.on("sim_status", handleSimStatus);
    socket.on("call_sms_status", handleCallSmsStatus);
    socket.on("motion_enable", handleMotionEnable);
    socket.on("motion_intrude", handleMotionIntrude);
    socket.on("motion", handleMotion);     
    socket.on("door_enable", handleDoorEnable);
    socket.on("door_breach", handleDoorBreach);
    socket.on("fire_enable", handleFireEnable);
    socket.on("mq2", handleMq2);
    socket.on("security_mode", handleSecurityMode);
    
    // 3. Gửi sync state khi mount lần đầu
    socket.emit("request_sync_state");

    // 4. Cleanup
    return () => {
      socket.off("sim_status", handleSimStatus);
      socket.off("call_sms_status", handleCallSmsStatus);
      socket.off("motion_enable", handleMotionEnable);
      socket.off("motion_intrude", handleMotionIntrude);
      socket.off("motion", handleMotion); 
      socket.off("door_enable", handleDoorEnable);
      socket.off("door_breach", handleDoorBreach);
      socket.off("fire_enable", handleFireEnable);
      socket.off("mq2", handleMq2);
      socket.off("security_mode", handleSecurityMode);
         socket.off("motion", handleMotion); 
    };
  }, []);

  // --- Lệnh điều khiển ---
  const handleMotion = (isOn: boolean) => {
    setMotionEnable(isOn);
    socket.emit("security_control", `FIR:${isOn ? 1 : 0}`);
  };
  const handleDoor = (isOn: boolean) => {
    setDoorEnable(isOn);
    socket.emit("security_control", `DOOR:${isOn ? 1 : 0}`);
  };
  const handleFire = (isOn: boolean) => {
    setFireEnable(isOn);
    socket.emit("security_control", `FIRE:${isOn ? 1 : 0}`);
  };
  const handleCall = (isOn: boolean) => {
    setCallEnable(isOn);
    socket.emit("security_control", `CALL:${isOn ? 1 : 0}`);
  };
  const handleSms = (isOn: boolean) => {
    setSmsEnable(isOn);
    socket.emit("security_control", `SMS:${isOn ? 1 : 0}`);
  };
  const handleModeChange = (auto: boolean) => {
    setAutoMode(auto);
    socket.emit("security_control", `AUTO:${auto ? 1 : 0}`);
  };

  const getRegText = () => {
    if (simReg === 1) return t.sim_home;
    if (simReg === 5) return t.sim_roam;
    if (simReg === 0) return t.sim_none;
    return t.sim_trying;
  };
  const getATText = () => (simAt === 1 ? t.sim_ok : t.sim_nok);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">{t.title}</h2>

      {/* —— 1. Trạng thái SIM —— */}
      <div className="mb-4 p-4 rounded-lg border bg-muted/50 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-primary" />
          <div className="font-medium text-foreground">{t.simStatus}</div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <div>
            {t.at}: <span className={simAt === 1 ? "text-green-600" : "text-red-500"}>{getATText()}</span>
          </div>
          <div>
            {t.reg}: <span className="text-blue-600">{getRegText()}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({getRegDesc(simReg, t)})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {t.csq}:{' '}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-white ${getSignalLevel(simCSQ)}`}>
              {simCSQ >= 0 ? simCSQ : "--"}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({getSignalDesc(simCSQ, t)})
            </span>
          </div>
        </div>
        {/* Button CALL & SMS */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between w-60 max-w-full">
            <div className="flex gap-1 items-center">
              <Phone className="w-4 h-4" />
              <span>{t.callBtn}</span>
            </div>
            <Switch checked={callEnable} onCheckedChange={handleCall} />
            <span className={`ml-3 text-sm font-medium ${callEnable ? "text-green-600" : "text-gray-500"}`}>
              {callEnable ? t.on : t.off}
            </span>
          </div>
          <div className="flex items-center justify-between w-60 max-w-full">
            <div className="flex gap-1 items-center">
              <MessageCircle className="w-4 h-4" />
              <span>{t.smsBtn}</span>
            </div>
            <Switch checked={smsEnable} onCheckedChange={handleSms} />
            <span className={`ml-3 text-sm font-medium ${smsEnable ? "text-green-600" : "text-gray-500"}`}>
              {smsEnable ? t.on : t.off}
            </span>
          </div>
        </div>
      </div>

      {/* —— 2. MODE AUTO / MANUAL —— */}
      <div className="flex gap-4 mb-4">
        <Button
          variant={autoMode ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange(true)}
        >
          {t.auto}
        </Button>
        <Button
          variant={!autoMode ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeChange(false)}
        >
          {t.manual}
        </Button>
      </div>

      {/* —— 3. Chống trộm —— */}
      <div className="mb-3 p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary" />
          <div>
            <div className="font-medium">{t.motionName}</div>
            <div className={motionStatus ? "text-red-500 text-xs" : "text-muted-foreground text-xs"}>
              {motionStatus ? t.motionIntrude : t.motionClear}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Switch checked={motionEnable} onCheckedChange={handleMotion} />
          <span className={`ml-2 text-sm font-medium ${motionEnable ? "text-green-600" : "text-gray-500"}`}>
            {motionEnable ? t.on : t.off}
          </span>
        </div>
      </div>

      {/* —— 4. Cửa trước —— */}
      <div className="mb-3 p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-accent" />
          <div>
            <div className="font-medium">{t.doorName}</div>
            <div className={doorAlert ? "text-red-500 text-xs" : "text-muted-foreground text-xs"}>
              {doorAlert ? t.doorBreach : t.doorLocked}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Switch checked={doorEnable} onCheckedChange={handleDoor} />
          <span className={`ml-2 text-sm font-medium ${doorEnable ? "text-green-600" : "text-gray-500"}`}>
            {doorEnable ? t.on : t.off}
          </span>
        </div>
      </div>

      {/* —— 5. Báo cháy + MQ2 —— */}
      <div className="mb-1 p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-red-500" />
          <div>
            <div className="font-medium">{t.fireName}</div>
            <div className={fireAlert ? "text-red-500 text-xs" : "text-muted-foreground text-xs"}>
              {fireAlert ? t.gasAlarm : t.gasClear}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Switch checked={fireEnable} onCheckedChange={handleFire} />
          <span className={`ml-2 text-sm font-medium ${fireEnable ? "text-green-600" : "text-gray-500"}`}>
            {fireEnable ? t.on : t.off}
          </span>
        </div>
      </div>
    </Card>
  );
}