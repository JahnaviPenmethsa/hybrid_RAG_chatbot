"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BarChart3, Loader2, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function EvaluatePage() {
  const [symptoms, setSymptoms] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const runEvaluation = async () => {
    if (!symptoms.trim()) return
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      })
      if (!response.ok) throw new Error("Backend error")
      const data = await response.json()
      setResult(data.data)
    } catch (err) {
      setError("Failed to connect to backend. Make sure the server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            value >= 0.7 ? "bg-green-500" :
            value >= 0.4 ? "bg-yellow-500" : "bg-red-400"
          }`}
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 items-center bg-background/50 py-12 px-4">
      <main className="w-full max-w-5xl space-y-8">

        {/* Header */}
        <section className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <FlaskConical className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            RAG{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              Evaluation
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Compare AI responses with and without Retrieval-Augmented Generation.
            See how RAG improves medical guidance quality.
          </p>
        </section>

        {/* Input */}
        <Card className="rounded-3xl border-0 shadow-lg bg-card/80 backdrop-blur-md">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runEvaluation()}
                placeholder="Enter symptoms to evaluate... e.g. fever and headache for 2 days"
                className="rounded-xl h-12 px-4"
              />
              <Button
                onClick={runEvaluation}
                disabled={!symptoms.trim() || isLoading}
                className="rounded-xl h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><BarChart3 className="h-4 w-4 mr-2" /> Evaluate</>
                }
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Without RAG */}
            <Card className="rounded-3xl border-0 shadow-lg bg-card/80 backdrop-blur-md border-t-4 border-t-red-400">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Without RAG</span>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    Score: {(result.without_rag.scores.overall_score * 100).toFixed(0)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="Keyword Coverage" value={result.without_rag.scores.keyword_coverage} />
                <ScoreBar label="Source Grounding" value={result.without_rag.scores.source_grounding} />
                <ScoreBar label="Structure Score" value={result.without_rag.scores.structure_score} />
                <ScoreBar label="Length Score" value={result.without_rag.scores.length_score} />
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Response Preview:</p>
                  <p className="text-xs text-muted-foreground/70 line-clamp-6 leading-relaxed">
                    {result.without_rag.response}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* With RAG */}
            <Card className="rounded-3xl border-0 shadow-lg bg-card/80 backdrop-blur-md border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>With RAG</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    Score: {(result.with_rag.scores.overall_score * 100).toFixed(0)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBar label="Keyword Coverage" value={result.with_rag.scores.keyword_coverage} />
                <ScoreBar label="Source Grounding" value={result.with_rag.scores.source_grounding} />
                <ScoreBar label="Structure Score" value={result.with_rag.scores.structure_score} />
                <ScoreBar label="Length Score" value={result.with_rag.scores.length_score} />
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Response Preview:</p>
                  <p className="text-xs text-muted-foreground/70 line-clamp-6 leading-relaxed">
                    {result.with_rag.response}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Verdict */}
            <Card className={`rounded-3xl border-0 shadow-lg lg:col-span-2 ${
              result.comparison.rag_improvement > 0
                ? "bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30"
                : "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30"
            }`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      {result.comparison.verdict}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.comparison.recommendation}
                    </p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`text-4xl font-extrabold ${
                      result.comparison.rag_improvement > 0 ? "text-green-600" : "text-yellow-600"
                    }`}>
                      {result.comparison.rag_improvement > 0 ? "+" : ""}
                      {(result.comparison.rag_improvement * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">RAG Improvement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}