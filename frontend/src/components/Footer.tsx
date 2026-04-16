import Link from "next/link"
import { Activity } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto bg-background/50">
      <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-lg tracking-tight">SymptoTrack AI</span>
        </div>
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} SymptoTrack AI. For demonstrative purposes only. Not a substitute for professional medical advice.
        </p>
        <div className="flex gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-teal-600 transition-colors">Privacy</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-teal-600 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
