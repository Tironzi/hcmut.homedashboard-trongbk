"use client"

import type React from "react"
import { useState } from "react"
import axios, { isAxiosError } from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

// Tự động đổi Link: Nếu đang chạy thật (Production) thì dùng Render, còn ở nhà thì dùng Localhost
const DOMAIN = process.env.NODE_ENV === "production"
  ? process.env.NEXT_PUBLIC_BACKEND_URL
  : "http://localhost:5000";

const API_BASE_URL = `${DOMAIN}/api/auth`;


interface LoginProps {
  onSuccess: () => void
}

const translations = {
  vi: {
    title: "Đăng nhập vào tài khoản",
    appName: "Smart Home",
    username: "Tài khoản",
    password: "Mật khẩu",
    email: "Email",
    login: "Đăng nhập",
    processing: "Đang xử lý...",
    forgotPassword: "Quên mật khẩu?",
    resetTitle: "Quên mật khẩu",
    sendResetRequest: "Gửi yêu cầu",
    backToLogin: "Quay lại đăng nhập",
    errorDefault: "Đã xảy ra lỗi. Vui lòng thử lại.",
    resetSuccess: "Yêu cầu đã được gửi. Vui lòng kiểm tra email."
  },
  en: {
    title: "Sign in to your account",
    appName: "Smart Home",
    username: "Username",
    password: "Password",
    email: "Email",
    login: "Login",
    processing: "Processing...",
    forgotPassword: "Forgot password?",
    resetTitle: "Forgot Password",
    sendResetRequest: "Send Request",
    backToLogin: "Back to Login",
    errorDefault: "An error occurred. Please try again.",
    resetSuccess: "Request sent. Please check your email."
  }
}

export function LoginSignup({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [language, setLanguage] = useState<"vi" | "en">("vi")

  const t = translations[language]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password })
      const { token, username: loggedInUsername } = response.data

      if (token) {
        localStorage.setItem('authToken', token)
        localStorage.setItem('username', loggedInUsername)
        onSuccess()
      }
    } catch (error) {
      let messageToShow = t.errorDefault
      if (isAxiosError(error) && error.response) {
        const serverMessage = error.response.data.message
        messageToShow = serverMessage || messageToShow
      }
      setErrorMessage(messageToShow)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, { email })
      setSuccessMessage(response.data.message || t.resetSuccess)
      setEmail("")
    } catch (error) {
      let messageToShow = t.errorDefault
      if (isAxiosError(error) && error.response) {
        const serverMessage = error.response.data.message
        messageToShow = serverMessage || messageToShow
      }
      setErrorMessage(messageToShow)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 px-4">
      <Card className="w-full max-w-md border-2 relative">
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          >
            {language === "vi" ? "EN" : "VI"}
          </Button>
        </div>

        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <Lock className="w-8 h-8 text-primary" />
            <CardTitle className="text-2xl">{t.appName}</CardTitle>
          </div>
          <CardDescription className="text-center">
            {isResettingPassword ? t.resetTitle : t.title}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isResettingPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.username}</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t.password}</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {errorMessage && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.processing : t.login}
              </Button>

              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(true)
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.email}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {successMessage && (
                <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.processing : t.sendResetRequest}
              </Button>

              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(false)
                    setErrorMessage(null)
                    setSuccessMessage(null)
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t.backToLogin}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
