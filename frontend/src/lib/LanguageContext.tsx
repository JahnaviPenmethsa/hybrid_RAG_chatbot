"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "EN" | "HI" | "TE"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (keys: Record<Language, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("EN")

  useEffect(() => {
    const storedLang = localStorage.getItem("app-language") as Language
    if (storedLang && ["EN", "HI", "TE"].includes(storedLang)) {
      setLanguage(storedLang)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("app-language", lang)
  }

  const t = (keys: Record<Language, string>) => keys[language] || keys["EN"]

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
