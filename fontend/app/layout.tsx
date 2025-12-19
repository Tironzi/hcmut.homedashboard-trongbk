// app/layout.tsx

import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import AlarmListener from "@/components/AlarmListener";

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: 'Smart Home Dashboard',
  description: 'My smart home project',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      
      {/* THÊM "suppressHydrationWarning={true}" VÀO ĐÂY 
        ĐỂ BỎ QUA LỖI DO GRAMMARLY GÂY RA
      */}
      <body 
        className={`${geist.variable} font-sans antialiased`}
        suppressHydrationWarning={true} 
      > 
        <AlarmListener />
        {children}
        <Analytics />
      </body>
    </html>
  )
}