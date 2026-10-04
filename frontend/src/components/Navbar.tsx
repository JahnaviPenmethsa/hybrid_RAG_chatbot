"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Activity, Moon, Sun, Globe } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between max-w-6xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex bg-teal-600 p-1.5 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
            SymptoTrack <span className="text-teal-600">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:text-teal-600 transition-colors">
            {t({ EN: "Home", HI: "मुख्य पृष्ठ", TE: "హోమ్" })}
          </Link>
          <Link href="/chat" className="text-sm font-medium hover:text-teal-600 transition-colors">
            {t({ EN: "Symptom Check", HI: "लक्षण जांच", TE: "రోగలక్షణ తనిఖీ" })}
          </Link>
          <Link href="/evaluate" className="text-sm font-medium hover:text-blue-500 transition-colors hidden md:inline-block">
            {t({ EN: "Evaluate", HI: "मूल्यांकन", TE: "మూల్యాంకనం" })}
          </Link>
          <Link href="/quiz" className="text-sm font-medium hover:text-orange-500 transition-colors hidden md:inline-block">
            {t({ EN: "Quizzes", HI: "प्रश्नोत्तरी", TE: "క్విజ్‌లు" })}
          </Link>
          <Link href="/emergency" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors hidden md:inline-block">
            {t({ EN: "Emergency", HI: "आपातकालीन", TE: "అత్యవసర" })}
          </Link>
          <Link href="/education" className="text-sm font-medium hover:text-purple-500 transition-colors hidden md:inline-block">
            {t({ EN: "Health Hub", HI: "स्वास्थ्य हब", TE: "ఆరోగ్య కేంద్రం" })}
          </Link>
          <Link href="/games" className="text-sm font-medium hover:text-indigo-500 transition-colors hidden md:inline-block">
            {t({ EN: "Games", HI: "खेल", TE: "ఆటలు" })}
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:text-blue-500 transition-colors hidden md:inline-block">
            {t({ EN: "Profile", HI: "प्रोफ़ाइल", TE: "ప్రొఫైల్" })}
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-teal-600 transition-colors">
            {t({ EN: "Login", HI: "लॉग इन", TE: "లాగిన్" })}
          </Link>

          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
            <Globe className="h-3 w-3 text-muted-foreground mr-1" />
            <select
              className="bg-transparent text-xs font-medium outline-none cursor-pointer text-muted-foreground"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "EN" | "HI" | "TE")}
            >
              <option value="EN">EN</option>
              <option value="HI">HI</option>
              <option value="TE">TE</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full pointer-events-auto"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}