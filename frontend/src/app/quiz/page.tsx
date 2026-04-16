"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronRight, HelpCircle, Trophy } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const QUIZZES = [
  {
    id: "nutrition-101",
    title: "Nutrition 101",
    desc: "Test your basic knowledge of healthy eating.",
    questions: [
      { q: "Which of the following is a macronutrient?", options: ["Vitamin C", "Protein", "Iron", "Calcium"], ans: 1 },
      { q: "How many liters of water should an average adult drink daily?", options: ["1-2L", "2-3L", "4-5L", "5-6L"], ans: 1 },
      { q: "Which vitamin is primarily obtained from sunlight?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], ans: 3 },
      { q: "What is the main function of carbohydrates in the body?", options: ["Building muscle", "Providing energy", "Bone strength", "Improving vision"], ans: 1 },
      { q: "Which food is the richest source of Omega-3 fatty acids?", options: ["Chicken", "Salmon", "Beef", "Pork"], ans: 1 },
      { q: "How many calories are in one gram of fat?", options: ["4", "7", "9", "12"], ans: 2 },
      { q: "Which of these is considered a 'good' type of cholesterol?", options: ["LDL", "VLDL", "HDL", "Triglycerides"], ans: 2 },
      { q: "What percentage of the human body is roughly made of water?", options: ["40%", "50%", "60%", "75%"], ans: 2 },
      { q: "Which mineral is crucial for bone health and preventing osteoporosis?", options: ["Iron", "Zinc", "Calcium", "Potassium"], ans: 2 },
      { q: "What is a common symptom of iron deficiency?", options: ["Hyperactivity", "Fatigue", "Increased thirst", "Weight gain"], ans: 1 }
    ]
  },
  {
    id: "first-aid",
    title: "First Aid Basics",
    desc: "Essential life-saving knowledge everyone should know.",
    questions: [
      { q: "What does CPR stand for?", options: ["Cardio-Pulmonary Resuscitation", "Cardio-Physical Rescue", "Cardiac-Pulseless Rest", "Central-Process Recovery"], ans: 0 },
      { q: "If someone is severely bleeding, what is the first step?", options: ["Apply a tourniquet", "Apply direct pressure", "Wash it with soap", "Give them water"], ans: 1 },
      { q: "For a minor burn, what should you run over the area?", options: ["Ice", "Warm water", "Cool water for 10 mins", "Butter"], ans: 2 },
      { q: "What should you do if someone is choking and coughing loudly?", options: ["Perform Heimlich maneuver", "Slap their back", "Encourage them to keep coughing", "Give them CPR"], ans: 2 }
    ]
  },
  {
    id: "mental-health",
    title: "Mental Wellness",
    desc: "Understand stress and how to manage it.",
    questions: [
      { q: "What is a common physical symptom of stress?", options: ["Increased hair growth", "Muscle tension", "Better vision", "Slower heart rate"], ans: 1 }
    ]
  }
]

export default function QuizPage() {
  const { t } = useLanguage()
  const [activeQuiz, setActiveQuiz] = useState<typeof QUIZZES[0] | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const startQuiz = (quiz: typeof QUIZZES[0]) => {
    setActiveQuiz(quiz)
    setCurrentQIndex(0)
    setScore(0)
    setShowResult(false)
    setSelectedOption(null)
  }

  const handleNext = () => {
    if (activeQuiz && selectedOption === activeQuiz.questions[currentQIndex].ans) {
      setScore(s => s + 1)
    }

    if (activeQuiz && currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1)
      setSelectedOption(null)
    } else {
      setShowResult(true)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 py-12 px-4 relative min-h-[80vh]">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -z-10" />

      <main className="w-full max-w-4xl space-y-12">
        <section className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t({ EN: "Health ", HI: "स्वास्थ्य ", TE: "ఆరోగ్య " })}
            <span className="text-orange-600">{t({ EN: "Quizzes", HI: "प्रश्नोत्तरी", TE: "క్విజ్‌లు" })}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            {t({ EN: "Make health education fun! Test your knowledge and earn rewards.", HI: "स्वास्थ्य शिक्षा को मजेदार बनाएं!", TE: "ఆరోగ్య విద్యను సరదాగా చేయండి!" })}
          </p>
        </section>

        {!activeQuiz ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {QUIZZES.map((quiz) => (
              <Card key={quiz.id} className="rounded-3xl border-0 shadow-lg bg-card/80 backdrop-blur-md hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => startQuiz(quiz)}>
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.desc}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost" className="text-orange-600 p-0 ml-auto gap-2 group">
                    {t({ EN: "Start Quiz", HI: "शुरू करें", TE: "ప్రారంభించు" })} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="rounded-3xl border-0 shadow-2xl bg-card border-t-4 border-t-orange-500">
                  <CardHeader>
                    <div className="flex justify-between text-sm text-muted-foreground mb-4">
                      <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
                      <span>Health Points: {score * 10}</span>
                    </div>
                    <Progress value={((currentQIndex + 1) / activeQuiz.questions.length) * 100} className="h-2 bg-muted" />
                    <CardTitle className="text-2xl mt-6">
                      {activeQuiz.questions[currentQIndex].q}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeQuiz.questions[currentQIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedOption === i 
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100" 
                            : "border-border hover:border-orange-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button 
                      onClick={handleNext} 
                      disabled={selectedOption === null}
                      className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-8"
                    >
                      {currentQIndex === activeQuiz.questions.length - 1 ? "Finish" : "Next"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <Card className="rounded-3xl border-0 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-12 text-white flex flex-col items-center">
                    <Trophy className="h-24 w-24 mb-6 text-yellow-200 drop-shadow-lg" />
                    <h2 className="text-4xl font-extrabold mb-2">Quiz Completed!</h2>
                    <p className="text-orange-100 text-xl">
                      {t({ EN: "You scored", HI: "आपका स्कोर", TE: "మీ స్కోరు" })} {score} {t({ EN: "out of", HI: "में से", TE: "నుండి" })} {activeQuiz.questions.length}
                    </p>
                  </div>
                  <CardContent className="p-8 bg-card">
                    <p className="text-lg text-muted-foreground mb-8">
                      {score === activeQuiz.questions.length ? t({ EN: "Perfect score! You're a health guru.", HI: "सही स्कोर! आप विशेषज्ञ हैं।", TE: "ఖచ్చితమైన స్కోరు!" }) : t({ EN: "Great effort! Keep reading the health hub to learn more.", HI: "अच्छा प्रयास! अधिक जानें।", TE: "మంచి ప్రయత్నం! మరింత తెలుసుకోండి." })}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => setActiveQuiz(null)} variant="outline" className="rounded-xl">
                        {t({ EN: "Back to Quizzes", HI: "प्रश्नोत्तरी पर वापस", TE: "తిరిగి వెళ్లు" })}
                      </Button>
                      <Button onClick={() => startQuiz(activeQuiz)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2">
                        {t({ EN: "Try Again", HI: "पुनः प्रयास करें", TE: "మళ్ళీ ప్రయత్నించు" })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
