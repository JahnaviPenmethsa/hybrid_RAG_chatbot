"use client"

import React, { useState, useEffect, useRef, ChangeEvent } from "react"
  
import { motion, AnimatePresence } from "framer-motion"
import { User, FileText, ImageIcon, ActivitySquare, Settings, Upload, Download, Eye, File, Save } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("basic")
  const [chatbotName, setChatbotName] = useState("SymptoBot")
  const { t } = useLanguage()

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    age: 0,
    blood_group: "",
    height: 0,
    weight: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // File inputs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState("")

  // Medical History
  const [conditions, setConditions] = useState(["Asthma", "Penicillin Allergy"])
  const [newCondition, setNewCondition] = useState("")
  
  const [medications, setMedications] = useState([
    {name: "Albuterol Inhaler", desc: "90mcg - As needed", status: "Active"}
  ])
  const [newMedName, setNewMedName] = useState("")
  const [newMedDesc, setNewMedDesc] = useState("")
  const [showAddMedForm, setShowAddMedForm] = useState(false)

  // Documents
  const [documents, setDocuments] = useState([
    { title: "Chest X-Ray - Dec 2025", type: "xray", date: "Dec 12, 2025", size: "4.2 MB", icon: ImageIcon },
    { title: "Complete Blood Count", type: "pdf", date: "Nov 3, 2025", size: "1.1 MB", icon: File },
    { title: "MRI Scan Report", type: "pdf", date: "Aug 22, 2025", size: "2.5 MB", icon: File },
  ])

  useEffect(() => {
    const savedName = localStorage.getItem("chatbotName")
    if (savedName) setChatbotName(savedName)

    // Load profile from backend DB
    fetch("http://127.0.0.1:8000/profile")
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error)
  }, [])

  const saveSettings = () => {
    localStorage.setItem("chatbotName", chatbotName)
    alert("Settings saved successfully!")
  }

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      await fetch("http://127.0.0.1:8000/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })
      alert("Profile requirements saved successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to save profile. Ensure the backend is running.")
    }
    setIsSaving(false)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0])
      setAvatarUrl(url)
    }
  }

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB"
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const type = file.type.includes("pdf") ? "pdf" : "image"
      
      setDocuments(prev => [{
        title: file.name,
        type: type,
        date: date,
        size: sizeMB,
        icon: type === "pdf" ? File : ImageIcon
      }, ...prev])
    }
  }

  const addCondition = () => {
    if (newCondition.trim()) {
      setConditions(prev => [...prev, newCondition.trim()])
      setNewCondition("")
    }
  }

  const addMedication = () => {
    if (newMedName.trim()) {
      setMedications(prev => [...prev, { name: newMedName.trim(), desc: newMedDesc.trim() || "-", status: "Active" }])
      setNewMedName("")
      setNewMedDesc("")
      setShowAddMedForm(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 relative py-12 px-4">
      <main className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t({ EN: "My Health Profile", HI: "मेरी स्वास्थ्य प्रोफ़ाइल", TE: "నా ఆరోగ్య ప్రొఫైల్" })}</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
            {[
              { id: "basic", label: t({ EN: "Basic Details", HI: "विवरण", TE: "ప్రాథమిక వివరాలు" }), icon: User },
              { id: "history", label: t({ EN: "Medical History", HI: "चिकित्सा इतिहास", TE: "వైద్య చరిత్ర" }), icon: ActivitySquare },
              { id: "documents", label: t({ EN: "Lab Reports", HI: "रिपोर्ट्स", TE: "ల్యాబ్ నివేదికలు" }), icon: FileText },
              { id: "settings", label: t({ EN: "Settings", HI: "सेटिंग्स", TE: "సెట్టింగులు" }), icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    isActive 
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </aside>

          {/* Content Area */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "basic" && (
                <motion.div
                  key="basic"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Update your personal details to get better insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-6 mb-6">
                        <div className="h-24 w-24 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center text-teal-600 text-3xl font-bold overflow-hidden shadow-sm">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            profile.full_name ? profile.full_name.substring(0, 2).toUpperCase() : "NA"
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />
                        <Button variant="outline" className="rounded-xl" onClick={() => photoInputRef.current?.click()}>
                          Change Photo
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} type="email" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Age</label>
                          <Input value={profile.age} onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})} type="number" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Blood Group</label>
                          <Input value={profile.blood_group} onChange={(e) => setProfile({...profile, blood_group: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Height (cm)</label>
                          <Input value={profile.height} onChange={(e) => setProfile({...profile, height: parseFloat(e.target.value) || 0})} type="number" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Weight (kg)</label>
                          <Input value={profile.weight} onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || 0})} type="number" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button 
                          onClick={saveProfile} 
                          disabled={isSaving}
                          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Medical History</CardTitle>
                      <CardDescription>Keep track of your past conditions and medications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <ActivitySquare className="h-5 w-5 text-teal-600" /> Chronic Conditions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {conditions.map((cond, i) => (
                            <span key={i} className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
                              {cond}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 max-w-sm mt-3">
                          <Input value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="E.g., Diabetes" className="rounded-xl h-9" />
                          <Button onClick={addCondition} size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">Add</Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <ActivitySquare className="h-5 w-5 text-teal-600" /> Current Medications
                        </h3>
                        <div className="space-y-3">
                          {medications.map((med, i) => (
                            <div key={i} className="bg-muted/50 p-4 rounded-2xl flex justify-between items-center border border-transparent">
                              <div>
                                <p className="font-medium">{med.name}</p>
                                <p className="text-xs text-muted-foreground mr-2">{med.desc}</p>
                              </div>
                              <span className="text-xs bg-card px-2 py-1 rounded-md border">{med.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        {showAddMedForm ? (
                          <div className="bg-muted/30 p-4 rounded-2xl border space-y-3">
                            <Input value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder="Medication Name" className="rounded-xl bg-background" />
                            <Input value={newMedDesc} onChange={e => setNewMedDesc(e.target.value)} placeholder="Dosage / Description" className="rounded-xl bg-background" />
                            <div className="flex gap-2">
                              <Button onClick={addMedication} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex-1">Save</Button>
                              <Button variant="outline" onClick={() => setShowAddMedForm(false)} className="rounded-xl flex-1">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" onClick={() => setShowAddMedForm(true)} className="rounded-xl w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground">
                            + Add New Medication
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "documents" && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle>Advanced Vault</CardTitle>
                        <CardDescription>Securely store and share X-Rays, PDFs, and Lab Reports.</CardDescription>
                      </div>
                      <div>
                        <input type="file" accept="image/*,.pdf" className="hidden" ref={docInputRef} onChange={handleDocUpload} />
                        <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => docInputRef.current?.click()}>
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Document List */}
                      {documents.map((doc, i) => {
                        const Icon = doc.icon
                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${doc.type === 'pdf' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium truncate max-w-[200px] sm:max-w-xs">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">{doc.date} • {doc.size}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="rounded-full"><Eye className="h-4 w-4"/></Button>
                              <Button variant="ghost" size="icon" className="rounded-full"><Download className="h-4 w-4"/></Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="rounded-3xl border-0 shadow-xl shadow-black/5 dark:shadow-white/5 bg-card/80 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Personalization & Settings</CardTitle>
                      <CardDescription>Customize your SymptoTrack AI experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <label className="text-sm font-medium">Chatbot Name (Personalization)</label>
                          <p className="text-xs text-muted-foreground">Give your AI health assistant a custom name that will be used in the chat interface.</p>
                          <Input 
                            value={chatbotName} 
                            onChange={(e) => setChatbotName(e.target.value)}
                            placeholder="e.g., Dr. Smith" 
                            className="rounded-xl mt-2 max-w-sm" 
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                      <Button onClick={saveSettings} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg gap-2 mt-4 transition-all hover:scale-[1.02]">
                        <Save className="h-4 w-4" /> Save Preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
