"use client"

import { Zap, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Language } from "@/app/page";

// Data
const data = [
  { time: "00:00", usage: 2.4 }, { time: "01:00", usage: 2.2 },
  { time: "02:00", usage: 2.0 }, { time: "03:00", usage: 1.9 },
  { time: "04:00", usage: 1.8 }, { time: "05:00", usage: 2.1 },
  { time: "06:00", usage: 2.5 }, { time: "07:00", usage: 3.0 },
  { time: "08:00", usage: 3.2 }, { time: "09:00", usage: 3.1 },
  { time: "10:00", usage: 3.4 }, { time: "11:00", usage: 3.8 },
  { time: "12:00", usage: 4.1 }, { time: "13:00", usage: 4.0 },
  { time: "14:00", usage: 3.9 }, { time: "15:00", usage: 3.7 },
  { time: "16:00", usage: 3.8 }, { time: "17:00", usage: 4.2 },
  { time: "18:00", usage: 4.8 }, { time: "19:00", usage: 5.0 },
  { time: "20:00", usage: 5.2 }, { time: "21:00", usage: 4.7 },
  { time: "22:00", usage: 4.0 }, { time: "23:00", usage: 3.5 },
  { time: "24:00", usage: 3.1 },
]

// Translations
const translations = {
  vi: {
    title: "Sử dụng năng lượng",
    comparison: "Giảm 12% so với hôm qua",
    current: "Hiện tại",
    today: "Hôm nay",
    thisMonth: "Tháng này",
    yAxisLabel: "kW",
    tooltipLabel: "Sử dụng"
  },
  en: {
    title: "Energy Usage",
    comparison: "12% less than yesterday",
    current: "Current",
    today: "Today",
    thisMonth: "This Month",
    yAxisLabel: "kW",
    tooltipLabel: "Usage"
  }
}

interface Props {
  language: Language;
}

export function EnergyUsage({ language }: Props) {
  const t = translations[language];

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
        <div className="flex items-center gap-2 text-blue-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">{t.comparison}</span>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">{t.current}</span>
          </div>
          <div className="text-2xl font-bold">3.8 kW</div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="text-xs text-muted-foreground mb-2">{t.today}</div>
          <div className="text-2xl font-bold">42.3 kWh</div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="text-xs text-muted-foreground mb-2">{t.thisMonth}</div>
          <div className="text-2xl font-bold">1.2 MWh</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: t.yAxisLabel, angle: -90, position: "insideLeft", fill: "#6B7280" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: 8 }}
              formatter={(v: number) => [`${v} kW`, t.tooltipLabel]}
            />

            {/* Fixed Line */}
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 3, fill: "#2563EB" }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
