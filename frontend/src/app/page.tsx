"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Bot, ShieldCheck, Zap, Activity, Pill, Stethoscope, Syringe, Heart } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const { t } = useLanguage()

  const floatingIcons = [
    { Icon: Heart, top: "15%", left: "10%", delay: 0 },
    { Icon: Stethoscope, top: "25%", left: "80%", delay: 1.5 },
    { Icon: Pill, top: "70%", left: "15%", delay: 2.5 },
    { Icon: Syringe, top: "60%", left: "85%", delay: 0.5 },
    { Icon: Activity, top: "85%", left: "50%", delay: 3 }
  ];

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 relative overflow-hidden">
      {/* Background blobs for premium look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Floating Health Icons */}
      {floatingIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className="absolute -z-10 text-teal-600/10 dark:text-teal-200/20 blur-[2px]"
          style={{ top: item.top, left: item.left }}
          animate={{ 
            y: [0, -30, 0], 
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut"
          }}
        >
          <item.Icon className="w-32 h-32 md:w-48 md:h-48" strokeWidth={1} />
        </motion.div>
      ))}

      <main className="flex w-full max-w-6xl flex-col items-center py-20 px-4 md:py-32">
        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-center gap-6 text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
            v1.0 Now Live
          </div>
          <h1 className="max-w-3xl text-5xl md:text-6xl font-extrabold tracking-tight">
            {t({ EN: "AI-powered symptom analysis", HI: "एआई द्वारा लक्षण विश्लेषण", TE: "AI-ఆధారిత లక్షణాల విశ్లేషణ" })} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
              {t({ EN: "in seconds", HI: "सेकंड में", TE: "క్షణాల్లో" })}
            </span>
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-muted-foreground">
            {t({ 
              EN: "Check your symptoms, get instant insights, and uncover possible conditions with our advanced healthcare AI assistant.", 
              HI: "अपने लक्षणों की जांच करें, तुरंत जानकारी प्राप्त करें, और हमारे उन्नत एआई की मदद लें।", 
              TE: "మీ లక్షణాలను తనిఖీ చేయండి, తక్షణ అంతర్దృష్టులను పొందండి." 
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link href="/chat" className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 h-14 px-8 text-base transition-all hover:scale-105 active:scale-95 group">
                {t({ EN: "Start Checking", HI: "जांच शुरू करें", TE: "తనిఖీ ప్రారంభించండి" })}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/50 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300 group">
            <CardHeader>
              <div className="bg-teal-100 dark:bg-teal-900/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-teal-600 dark:text-teal-400">
                <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                  <Zap className="h-6 w-6" />
                </motion.div>
              </div>
              <CardTitle className="text-xl">{t({ EN: "Fast Analysis", HI: "तेज़ विश्लेषण", TE: "వేగవంతమైన విశ్లేషణ" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {t({ EN: "Get real-time feedback on your symptoms within seconds. No waiting in lines, just instant clarity.", HI: "सेकंड के भीतर तुरंत परिणाम प्राप्त करें।", TE: "క్షణాల్లో ఫలితాలు పొందండి." })}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/50 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300 group">
            <CardHeader>
              <div className="bg-blue-100 dark:bg-blue-900/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <motion.div whileHover={{ y: -5 }} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Bot className="h-6 w-6" />
                </motion.div>
              </div>
              <CardTitle className="text-xl">{t({ EN: "AI Suggestions", HI: "एआई सुझाव", TE: "AI సూచనలు" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {t({ EN: "Powered by state-of-the-art LLMs, our assistant maps symptoms to possible common conditions accurately.", HI: "उन्नत एआई मॉडल द्वारा संचालित।", TE: "అధునాతన AI మోడల్స్ చే నడపబడుతుంది." })}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/50 backdrop-blur-sm hover:-translate-y-2 transition-transform duration-300 group">
            <CardHeader>
              <div className="bg-purple-100 dark:bg-purple-900/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ShieldCheck className="h-6 w-6" />
                </motion.div>
              </div>
              <CardTitle className="text-xl">{t({ EN: "Secure & Private", HI: "सुरक्षित और निजी", TE: "సురక్షితమైనవి" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {t({ EN: "Your data never leaves your device and is not saved on any servers. We prioritize your privacy above all.", HI: "आपका डेटा सुरक्षित है।", TE: "మీ డేటా సురక్షితం." })}
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
