"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, User, Mail, Lock, ShieldCheck } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { t } = useLanguage()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleForgot = () => {
    setEmailError("")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address first to reset password.")
      return
    }
    alert("Password reset link sent to your email!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setPasswordError("")

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!isValidEmail) {
      setEmailError("Please enter a valid email address.")
      return
    }

    if (!isLogin) {
      const isValidPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]\-_+={}\|;:'",.<>/?`~])(?!.*\s).{8,}$/.test(password)
      if (!isValidPassword) {
        setPasswordError("Password must have at least 8 characters: uppercase, lowercase, number, special character, and no spaces.")
        return
      }
    }

    setIsLoading(true)

    const endpoint = isLogin ? "/login" : "/signup"
    const payload = isLogin 
      ? { email, password } 
      : { full_name: fullName, email, password }

    try {
      const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed")
      }

      // Success
      alert(isLogin ? "Login successful!" : "Account created successfully! Please sign in.")
      if (isLogin) {
        // Simple client-side auth placeholder via localStorage
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/" // redirect to home
      } else {
        setIsLogin(true) // switch to login tab
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background/50 relative overflow-hidden py-12 px-4">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <Card className="rounded-3xl border-0 shadow-2xl shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-2xl flex items-center justify-center mb-4 text-teal-600 mx-auto">
              {isLogin ? <User className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin 
                ? t({ EN: "Welcome back", HI: "वापसी पर स्वागत है", TE: "తిరిగి స్వాగతం" }) 
                : t({ EN: "Create an account", HI: "खाता बनाएं", TE: "ఖాతాను సృష్టించండి" })}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Enter your credentials to access your profile" 
                : "Sign up to track your health journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="text" 
                      placeholder="John Doe" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="pl-9 rounded-xl" 
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    required 
                    className={`pl-9 rounded-xl ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                  />
                </div>
                {emailError && <p className="text-xs text-red-500 font-medium">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  {isLogin && (
                    <button type="button" onClick={handleForgot} className="text-xs text-teal-600 hover:underline bg-transparent border-0 cursor-pointer">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    required
                    className={`pl-9 rounded-xl ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`} 
                  />
                </div>
                {passwordError && <p className="text-xs text-red-500 font-medium">{passwordError}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-base shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pt-2 pb-6 border-t mt-4 border-border/50">
            <p className="text-sm text-muted-foreground mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-teal-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
