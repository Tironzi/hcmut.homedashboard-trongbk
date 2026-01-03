"use client"

import { useState, useEffect } from "react"
// 🔹 Import component theo đúng cấu trúc file của bạn
import { LoginSignup } from "@/components/auth/login-signup"
import { Dashboard } from "@/components/dashboard"

// 🔹 1. Định nghĩa kiểu ngôn ngữ (TypeScript)
export type Language = "vi" | "en";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // 🔹 2. Thêm state ngôn ngữ (cha)
  const [language, setLanguage] = useState<Language>("vi")

  // 3. Dùng useEffect để kiểm tra localStorage KHI TẢI TRANG
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []); 

  // 4. Cập nhật hàm onLogout để xóa sạch localStorage
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username'); // Quan trọng: xóa cả username
    setIsAuthenticated(false);
  }

  // 5. Nếu đang loading (đang kiểm tra token), hiển thị màn hình chờ
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        Đang tải...
      </div>
    );
  }

  // 6. Khi đã hết loading
  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        // 🔹 7. Truyền state xuống LoginSignup (để đồng bộ)
        <LoginSignup 
          onSuccess={() => setIsAuthenticated(true)} 
          language={language}
          setLanguage={setLanguage}
        />
      ) : (
        // 🔹 8. Truyền state xuống Dashboard
        <Dashboard 
          onLogout={handleLogout} 
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  )
}
