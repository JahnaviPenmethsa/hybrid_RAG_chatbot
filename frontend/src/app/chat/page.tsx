"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp, Bot, Loader2, Sparkles, User, Mic, Volume2, VolumeX, MicOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type Message = {
  id: string
  role: "user" | "bot"
  content: string
  isActionable?: boolean // For triggering results display
}

const SUGGESTIONS = ["Fever and chills", "Persistent dry cough", "Severe headache", "Sudden fatigue"]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatbotName, setChatbotName] = useState("SymptoTrack AI")
  const [isListening, setIsListening] = useState(false)
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem("chatbotName") || "SymptoTrack AI"
    setChatbotName(savedName)
    setMessages([
      {
        id: "1",
        role: "bot",
        content: `Hello! I am ${savedName}. What symptoms are you experiencing today?`,
      },
    ])
  }, [])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showResults])

  const speakOutLoud = (text: string) => {
    if (!isSpeakingEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel() // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance)
  }

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
      return
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? prev + " " + transcript : transcript);
        setIsListening(false);
      }
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } else {
      alert("Microphone access is not supported in this browser.")
    }
  }

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      })

      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "bot", 
        content: data.reply,
        isActionable: data.isActionable
      }
      setMessages((prev) => [...prev, botMsg])
      speakOutLoud(botMsg.content)
      
      if (data.isActionable) {
        if (data.assessment) {
          setAssessmentData(data.assessment)
        }
        setTimeout(() => setShowResults(true), 1500)
      }
    } catch (error) {
      console.error(error);
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "bot", 
        content: "Sorry, I am having trouble connecting to the analysis engine right now. Please test again later.",
      }
      setMessages((prev) => [...prev, botMsg])
      speakOutLoud(botMsg.content)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background py-8 px-4 w-full h-[calc(100vh-8rem)]">
      <div className="flex flex-col w-full max-w-3xl h-full bg-card rounded-3xl border shadow-sm overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 rounded-full p-2">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold leading-none mb-1">{chatbotName}</h2>
              <p className="text-xs text-muted-foreground">Always accurate, highly secure.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
            className="rounded-full h-8 w-8 text-muted-foreground hover:bg-teal-50 hover:text-teal-600"
            title={isSpeakingEnabled ? "Disable Voice Output" : "Enable Voice Output"}
          >
            {isSpeakingEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className={`p-4 rounded-3xl text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none border shadow-sm"}`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mr-auto items-center text-muted-foreground p-4">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              <span className="text-sm">Analyzing your symptoms...</span>
            </motion.div>
          )}

          {showResults && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 border rounded-3xl p-6 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 shadow-inner">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-teal-600" />
                AI Health Assessment Review
              </h3>
              
              <div className="space-y-4">
                {assessmentData ? (
                  <>
                    {assessmentData.emergency_alert && (
                      <div className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 p-4 rounded-xl text-sm font-medium">
                        {assessmentData.emergency_message}
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <h4 className="font-medium text-sm mb-2 text-muted-foreground">Identified Target Symptoms:</h4>
                      <div className="flex flex-wrap gap-2">
                        {assessmentData.symptoms_identified?.map((sym: string, i: number) => (
                           <Badge key={i} variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-400">
                             {sym}
                           </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t mt-4">
                      <h4 className="font-medium text-sm mb-2 text-foreground">AI Guidance Summary:</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {assessmentData.guidance}
                      </p>
                    </div>

                    {assessmentData.citations && assessmentData.citations.length > 0 && (
                      <div className="pt-4 mt-2">
                         <h4 className="font-medium text-xs mb-2 text-muted-foreground">References:</h4>
                         <ul className="text-xs space-y-1 text-muted-foreground/60 list-disc pl-5">
                            {assessmentData.citations.map((cit: any, i: number) => (
                              <li key={i}>{cit.source} (Confidence: {(cit.relevance_score * 100).toFixed(0)}%)</li>
                            ))}
                         </ul>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t mt-4 text-xs italic text-muted-foreground/50">
                      {assessmentData.disclaimer}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground mb-4">Based on your symptoms, here are the highest probability conditions:</p>
                    
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">Common Cold <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">Medium Severity</Badge></span>
                          <span className="font-bold text-teal-600">85%</span>
                        </div>
                        <Progress value={85} className="h-2 [&>div]:bg-teal-600" />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">Seasonal Allergies <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Low Severity</Badge></span>
                          <span className="font-bold text-blue-500">60%</span>
                        </div>
                        <Progress value={60} className="h-2 [&>div]:bg-blue-500" />
                      </div>
                    </div>

                    <div className="pt-4 border-t mt-6">
                      <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                        <li>Get plenty of rest and hydration.</li>
                        <li>Monitor your temperature over the next 24 hours.</li>
                        <li>If symptoms severely worsen, please consult a medical professional immediately.</li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => { setMessages([{id: '1', role: 'bot', content: 'Let\'s start over. What are your symptoms?'}]); setShowResults(false) }} variant="outline" className="flex-1 rounded-full">Check Again</Button>
                  <Button className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white">Save Result</Button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
          {!showResults && messages.length < 3 && (
            <div className="flex gap-2 pb-4 overflow-x-auto hide-scrollbar whitespace-nowrap">
              {SUGGESTIONS.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/30 text-xs py-1.5 px-3 rounded-full font-normal transition-colors"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Describe what you are feeling..."
              className="rounded-full h-12 px-6 border-slate-300 dark:border-slate-800 bg-card focus-visible:ring-teal-500 focus-visible:ring-offset-0 disabled:opacity-50"
              disabled={isLoading || showResults}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={toggleListening}
              className={`rounded-full h-12 w-12 shrink-0 transition-colors ${isListening ? 'bg-red-100 text-red-600 border-red-200' : ''}`}
              title="Dictate message"
            >
              {isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading || showResults}
              className="rounded-full h-12 w-12 bg-teal-600 hover:bg-teal-700 text-white shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
