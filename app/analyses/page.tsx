'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, MapPin, Volume2 } from 'lucide-react'

import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type SymptomAnalysisRecord = {
  _id: string
  createdAt: string
  originalTranscript: string
  englishTranscript: string
  languageCode?: string
  location?: {
    latitude?: number
    longitude?: number
  }
  analysis?: {
    riskLevel?: 'low' | 'medium' | 'high'
    symptoms?: string[]
    recommendations?: string[]
    suggestedAction?: string
    emergencyCare?: string
    careSpecialties?: string[]
    diseaseKeywords?: string[]
  }
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<SymptomAnalysisRecord[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  const userId = user?._id || user?.id || ''

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/analyses?userId=${userId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load symptom analyses')
        setAnalyses(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data[0]?._id) {
          setSelectedId(data[0]._id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analyses')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const selectedAnalysis = useMemo(
    () => analyses.find((item) => item._id === selectedId) || analyses[0] || null,
    [analyses, selectedId]
  )

  const speakAnalysis = async () => {
    if (!selectedAnalysis) return

    try {
      setSpeaking(true)
      setError('')
      const analysis = selectedAnalysis.analysis || {}
      const summary = `
        Symptoms found: ${(analysis.symptoms || []).join(', ') || 'not specified'}.
        Risk level: ${analysis.riskLevel || 'low'}.
        Suggested action: ${analysis.suggestedAction || 'Please review your health status carefully'}.
        Recommendations: ${(analysis.recommendations || []).slice(0, 2).join('. ') || 'No recommendations available'}.
        Emergency note: ${analysis.emergencyCare || 'Seek emergency care if symptoms worsen'}.
      `.substring(0, 500)

      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summary,
          language: selectedAnalysis.languageCode || 'en-IN',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Speech synthesis failed')

      if (data.audioContent) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`)
        audio.onended = () => setSpeaking(false)
        await audio.play()
      } else {
        setSpeaking(false)
      }
    } catch (err: any) {
      setSpeaking(false)
      setError(err.message || 'Could not speak this analysis')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
          <h1 className="text-4xl font-bold">Symptom Analysis History</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Review your previous voice symptom analyses and listen to a spoken summary whenever you need it.
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </Card>
        )}

        {loading ? (
          <Card className="p-8">Loading analyses...</Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <Card className="p-6">
              <h2 className="text-xl font-bold">Previous Analyses</h2>
              <div className="mt-5 space-y-3">
                {analyses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No symptom analyses found yet.
                  </div>
                ) : (
                  analyses.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setSelectedId(item._id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        selectedAnalysis?._id === item._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:bg-muted/30'
                      }`}
                    >
                      <p className="font-semibold line-clamp-2">{item.originalTranscript}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              {selectedAnalysis ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Selected Analysis</p>
                      <h2 className="mt-2 text-2xl font-bold capitalize">
                        {selectedAnalysis.analysis?.riskLevel || 'low'} Risk
                      </h2>
                    </div>
                    <Button onClick={speakAnalysis} disabled={speaking} className="gap-2">
                      <Volume2 className="h-4 w-4" />
                      {speaking ? 'Speaking...' : 'Speak Analysis'}
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-muted/30 p-4 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recorded</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{new Date(selectedAnalysis.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-muted/30 p-4 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Location</p>
                      <div className="mt-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>
                          {selectedAnalysis.location?.latitude && selectedAnalysis.location?.longitude
                            ? `${selectedAnalysis.location.latitude.toFixed(4)}, ${selectedAnalysis.location.longitude.toFixed(4)}`
                            : 'No location saved'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Original Transcript</p>
                    <p className="mt-2 rounded-2xl bg-muted/30 p-4 text-sm leading-relaxed">
                      {selectedAnalysis.originalTranscript}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Symptoms</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(selectedAnalysis.analysis?.symptoms || []).map((symptom) => (
                        <span key={symptom} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Suggested Action</p>
                    <p className="mt-2 text-sm">{selectedAnalysis.analysis?.suggestedAction || 'No suggested action available.'}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommendations</p>
                    <div className="mt-2 space-y-2">
                      {(selectedAnalysis.analysis?.recommendations || []).map((recommendation, index) => (
                        <div key={`${recommendation}-${index}`} className="rounded-2xl border border-border/60 p-3 text-sm">
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                      <p>{selectedAnalysis.analysis?.emergencyCare || 'No emergency guidance available.'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Choose an analysis to view its details.
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
