"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, Sparkles, TrendingUp, Trophy, Salad, Activity, Droplets } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const LEVELS = ["Beginner", "Moderate", "Advanced"]

const BLOGS = [
  { title: "Building a Starter Diet Plan", level: "Beginner", category: "Diet", icon: Salad, readTime: "5 min", desc: "Understand macros, pros and cons of common foods, and basic hydration.", url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  { title: "Skincare Basics for All Seasons", level: "Beginner", category: "Skincare", icon: Droplets, readTime: "4 min", desc: "How to combat seasonal diseases with simple skincare routines.", url: "https://medlineplus.gov/skincosmetics.html" },
  { title: "First Aid: The Golden Hour", level: "Beginner", category: "First Aid", icon: Activity, readTime: "6 min", desc: "Basic first aid techniques you must know for emergencies like burns, cuts, and CPR basics.", url: "https://www.redcross.org/take-a-class/first-aid/learning-first-aid" },
  { title: "Yoga & Meditation for Focus", level: "Moderate", category: "Yoga", icon: Brain, readTime: "7 min", desc: "Intermediate asanas and mindful breathing to reset your nervous system.", url: "https://www.nccih.nih.gov/health/yoga-what-you-need-to-know" },
  { title: "High-Intensity Interval Training", level: "Advanced", category: "Exercises", icon: Activity, readTime: "10 min", desc: "Push your limits with advanced HIIT circuits tailored for athletes.", url: "https://www.hsph.harvard.edu/nutritionsource/high-intensity-interval-training/" },
]

export default function EducationPage() {
  const [activeLevel, setActiveLevel] = useState("Beginner")
  const { t } = useLanguage()

  const filteredBlogs = BLOGS.filter(b => b.level === activeLevel)

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 py-12 px-4 relative">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

      <main className="w-full max-w-6xl space-y-12">
        {/* Header Section */}
        <section className="text-center space-y-4">
          <Badge variant="outline" className="text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
            {t({ EN: "Learn & Grow", HI: "सीखें और बढ़ें", TE: "నేర్చుకోండి & ఎదగండి" })}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
             {t({ EN: "Health ", HI: "स्वास्थ्य ", TE: "ఆరోగ్య " })}
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-600">
              {t({ EN: "Education Hub", HI: "शिक्षा हब", TE: "విద్య కేంద్రం" })}
             </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            {t({ EN: "Explore curated articles on diet, skincare, fitness, and mental wellness. Select your experience level to get started.", HI: "स्वास्थ्य और फिटनेस पर लेख पढ़ें। अनुभव स्तर चुनें।", TE: "ఆహారం, ఫిట్‌నెస్ గురించి కథనాలను చదవండి." })}
          </p>
        </section>

        {/* Level Selector */}
        <div className="flex justify-center gap-2 md:gap-4 p-2 bg-card rounded-2xl shadow-sm max-w-md mx-auto border border-border/50">
          {LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeLevel === level 
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" 
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredBlogs.map((blog, idx) => {
            const Icon = blog.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card 
                  className="rounded-3xl border-0 shadow-lg shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md h-full hover:-translate-y-1 transition-transform group cursor-pointer"
                  onClick={() => window.open(blog.url, '_blank')}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-2xl text-purple-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        {blog.readTime}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">{blog.title}</CardTitle>
                    <Badge className="w-fit my-2 bg-teal-100 text-teal-800 hover:bg-teal-100">{blog.category}</Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{blog.desc}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="text-purple-600 p-0 hover:bg-transparent hover:text-purple-700"
                    >
                      Read Article →
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </section>

        {/* Lifestyle & Mindset Section */}
        <section className="mt-16 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-[3rem] p-8 md:p-12 border border-teal-500/20">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="h-8 w-8 text-teal-600" />
                {t({ EN: "Hack Your Lifestyle", HI: "जीवन शैली में सुधार", TE: "మీ జీవనశైలిని మార్చుకోండి" })}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t({ EN: "Tired of doomscrolling? Break the cycle with these simple, science-backed brain tricks and earn rewards for staying active.", HI: "स्मार्टफोन की लत कम करें और सक्रिय रहें।", TE: "స్మార్ట్‌ఫోన్ వ్యసనాన్ని తగ్గించుకోండి." })}
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "The 20-20-20 Rule", desc: "Every 20 mins, look 20 feet away for 20 seconds to prevent eye strain." },
                  { title: "Grayscale Challenge", desc: "Turn your phone to grayscale to drastically reduce the urge to doomscroll." },
                  { title: "Hydration Check", desc: "Drink 1 glass of water before you open your social media apps." }
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-background/60 shadow-sm">
                    <Sparkles className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-80 flex-shrink-0 space-y-6">
              <Card className="rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white transform rotate-2 hover:rotate-0 transition-transform">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-300" /> {t({ EN: "Daily Rewards", HI: "दैनिक पुरस्कार", TE: "దినసరి బహుమతులు" })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold">+150</span>
                    <p className="text-purple-200">{t({ EN: "Health Points Earned", HI: "हेल्थ पॉइंट्स", TE: "ఆరోగ్య పాయింట్లు" })}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Screen Time Goal</span>
                      <span>80%</span>
                    </div>
                    <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 w-[80%] rounded-full" />
                    </div>
                  </div>
                  <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 rounded-xl mt-4">
                    Claim Reward
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
