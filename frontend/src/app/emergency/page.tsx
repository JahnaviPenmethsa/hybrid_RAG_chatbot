"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Phone, MapPin, Search } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function EmergencyPage() {
  const { t } = useLanguage()
  const [mapQuery, setMapQuery] = useState("hospitals near me")

  const EMERGENCY_CONTACTS = [
    { title: "National Emergency / Police", number: "112 / 100", icon: AlertTriangle },
    { title: "Ambulance", number: "108", icon: Phone },
    { title: "Women Helpline", number: "1091", icon: Phone },
    { title: "Fire Brigade", number: "101", icon: Phone },
  ]

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 relative py-12 px-4">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -z-10" />

      <main className="w-full max-w-6xl space-y-12">
        <section className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mb-4 animate-pulse">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-red-600 dark:text-red-500">
            {t({ EN: "Emergency & Resources", HI: "आपातकालीन और संसाधन", TE: "అత్యవసర మరియు వనరులు" })}
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            {t({ EN: "Quick access to emergency contacts, nearby hospitals, and pharmacies.", HI: "आपातकालीन संपर्कों और अस्पतालों तक त्वरित पहुंच।", TE: "అత్యవసర పరిచయాలకు తక్షణ ప్రవేశం." })}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Emergency Contacts */}
          <div className="space-y-6 lg:col-span-1">
            <h2 className="text-2xl font-bold">{t({ EN: "Quick Dial", HI: "त्वरित डायल", TE: "క్విక్ డయల్" })}</h2>
            <div className="grid gap-4">
              {EMERGENCY_CONTACTS.map((contact, i) => (
                <Card key={i} className="border-l-4 border-l-red-500 rounded-2xl shadow-md bg-card/80 backdrop-blur-md hover:-translate-y-1 transition-transform">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{contact.title}</p>
                      <p className="text-2xl font-extrabold text-red-600">{contact.number}</p>
                    </div>
                    <a href={`tel:${contact.number}`}>
                      <Button variant="ghost" size="icon" className="rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40">
                        <contact.icon className="h-5 w-5" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Maps / Directory */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">{t({ EN: "Nearby Facilities", HI: "निकटवर्ती सुविधाएं", TE: "సమీప సౌకర్యాలు" })}</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setMapQuery("hospitals near me")} 
                  variant={mapQuery.includes("hospitals") ? "default" : "outline"}
                  className="rounded-xl flex-1 sm:flex-none"
                >
                  <MapPin className="mr-2 h-4 w-4" /> {t({ EN: "Hospitals", HI: "अस्पताल", TE: "ఆసుపత్రులు" })}
                </Button>
                <Button 
                  onClick={() => setMapQuery("pharmacies near me")} 
                  variant={mapQuery.includes("pharmacies") ? "default" : "outline"}
                  className="rounded-xl flex-1 sm:flex-none"
                >
                  <Search className="mr-2 h-4 w-4" /> {t({ EN: "Pharmacies", HI: "फार्मेसी", TE: "మందుల షాపులు" })}
                </Button>
              </div>
            </div>
            
            <Card className="rounded-3xl border-0 shadow-lg overflow-hidden bg-card/80 backdrop-blur-md h-[500px]">
              <CardContent className="p-0 h-full">
                <iframe
                  title="Google Maps"
                  width="100%"
                  height="100%"
                  className="border-0 h-full"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                ></iframe>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
    </div>
  )
}
