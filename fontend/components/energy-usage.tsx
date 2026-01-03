"use client"

import { Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts"
import { Language } from "@/app/page"
import { socket } from "@/lib/socket"
import { useState, useEffect } from "react"

const translations = {
  vi: {
    title: "Biểu đồ tiêu thụ trong ngày",
    comparison: "Điện áp: {voltage}V | Dòng: {current}A",
    current: "Công suất hiện tại",
    today: "Tổng hôm nay",
    thisMonth: "Tổng tháng này",
    yAxisLabel: "Tiêu thụ (Wh)",
    tooltipLabel: "Đã dùng",
    waiting: "Đang tải dữ liệu...",
    accumulated: "Tích lũy",
    totalReal: "Tổng thực tế"
  },
  en: {
    title: "Daily Consumption Chart",
    comparison: "Voltage: {voltage}V | Current: {current}A",
    current: "Current Power",
    today: "Total Today",
    thisMonth: "Total Month",
    yAxisLabel: "Consumption (Wh)",
    tooltipLabel: "Used",
    waiting: "Loading data...",
    accumulated: "Accumulated",
    totalReal: "Total Real"
  }
}

interface Props { language: Language; }

export function EnergyUsage({ language }: Props) {
  const t = translations[language];

  // State lưu dữ liệu
  const [data, setData] = useState({
    voltage: 0, current: 0, power: 0,
    energyTodayWh: 0, energyMonthWh: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [comparison, setComparison] = useState("");

  useEffect(() => {
    const handleUpdate = (newData: any) => {
      setData({
        voltage: newData.voltage || 0,
        current: newData.current || 0,
        power: newData.power || 0,
        energyTodayWh: newData.energyTodayWh || 0,
        energyMonthWh: newData.energyMonthWh || 0
      });
      
      // Nhận 24 điểm dữ liệu từ server
      setChartData(newData.chartData || []);

      setComparison(t.comparison
        .replace("{voltage}", (newData.voltage || 0).toFixed(1))
        .replace("{current}", (newData.current || 0).toFixed(2))
      );
    };

    socket.on("energy_dashboard_update", handleUpdate);
    if (socket.connected) socket.emit("request_sync_state");
    socket.on("connect", () => socket.emit("request_sync_state"));

    return () => {
      socket.off("energy_dashboard_update", handleUpdate);
      socket.off("connect");
    };
  }, [language, t.comparison]);

  const formatEnergy = (wh: number) => wh >= 1000 ? `${(wh/1000).toFixed(2)} kWh` : `${wh.toFixed(2)} Wh`;
  const formatPower = (w: number) => w >= 1000 ? `${(w/1000).toFixed(2)} kW` : `${w.toFixed(0)} W`;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-2 text-blue-600">
          <Zap className="w-4 h-4" /> <span className="text-sm font-medium">{comparison}</span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" /> <span className="text-xs text-gray-500">{t.current}</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatPower(data.power)}</div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="text-xs text-muted-foreground mb-2">{t.today}</div>
          <div className="text-2xl font-bold">{formatEnergy(data.energyTodayWh)}</div>
          <div className="text-xs text-gray-400 mt-1">{t.accumulated}</div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="text-xs text-muted-foreground mb-2">{t.thisMonth}</div>
          <div className="text-2xl font-bold">{formatEnergy(data.energyMonthWh)}</div>
          <div className="text-xs text-gray-400 mt-1">{t.totalReal}</div>
        </div>
      </div>

      {/* Biểu đồ Năng lượng theo giờ (Wh) */}
      <div className="h-96 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {/* Dùng AreaChart để tô màu phía dưới nhìn cho nguy hiểm */}
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
              
              <XAxis 
                dataKey="time" 
                stroke="#6B7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                interval={2} // Cách 2 tiếng hiện 1 nhãn cho đỡ rối
              />
              
              {/* QUAN TRỌNG: domain=['auto', 'auto'] giúp biểu đồ tự phóng to theo dữ liệu */}
              <YAxis 
                stroke="#6B7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']} 
                label={{ value: "Wh", angle: -90, position: "insideLeft" }} 
              />
              
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(v: number) => [`${v} Wh`, t.tooltipLabel]} 
              />
              
              <Area 
                type="monotone" 
                dataKey="energy" 
                stroke="#2563EB" 
                fill="#3B82F6" 
                fillOpacity={0.2} 
                strokeWidth={2} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="flex justify-center h-full items-center text-gray-400">{t.waiting}</div>}
      </div>
    </Card>
  )
}