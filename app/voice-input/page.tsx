'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { Mic, Square, Volume2, Upload, CheckCircle, AlertCircle, RefreshCw, MapPin, ArrowRight } from 'lucide-react'

type AnalysisResult = {
  riskLevel: 'low' | 'medium' | 'high'
  suggestedAction: string
  symptoms: string[]
  recommendations: string[]
  emergencyCare: string
  careSpecialties?: string[]
  diseaseKeywords?: string[]
  originalTranscript?: string
  location?: { latitude: number; longitude: number } | null
  nearbyHealthCenters?: any[]
  id?: string
}

const LANGUAGE_OPTIONS = [
  { label: 'English (India)', value: 'en-IN' },
  { label: 'Hindi (हिन्दी)', value: 'hi-IN' },
  { label: 'Tamil (தமிழ்)', value: 'ta-IN' },
  { label: 'Telugu (తెలుగు)', value: 'te-IN' },
  { label: 'Kannada (ಕನ್ನಡ)', value: 'kn-IN' },
]

function getBestMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export default function VoiceInputPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [language, setLanguage] = useState('en-IN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([])
  const [roomInfo, setRoomInfo] = useState<any | null>(null)
  const [locationMode, setLocationMode] = useState<'current' | 'previous' | 'skip'>('current')
  const [locationMessage, setLocationMessage] = useState('We will use your current location to suggest nearby health centers after analysis.')
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)

  const hasAudioInputs = useMemo(() => devices.length > 0, [devices])
  const selectedHospital = useMemo(
    () => nearbyHospitals.find((hospital) => String(hospital.id) === String(selectedHospitalId)) || null,
    [nearbyHospitals, selectedHospitalId]
  )

  const resolveSelectedLocation = async () => {
    if (locationMode === 'skip') {
      setLocationMessage('Nearby health center suggestions will be shown without distance sorting.')
      return null
    }

    if (locationMode === 'previous') {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('lastKnownLocation') : null
      if (!stored) {
        throw new Error('No previously saved location found. Switch to current location to continue.')
      }

      const parsed = JSON.parse(stored)
      if (!Number.isFinite(parsed?.latitude) || !Number.isFinite(parsed?.longitude)) {
        throw new Error('Saved location is invalid. Switch to current location to continue.')
      }

      setLocationMessage('Using your previously saved location for nearby health center suggestions.')
      return {
        latitude: Number(parsed.latitude),
        longitude: Number(parsed.longitude),
      }
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported in this browser.')
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
      })
    })

    const nextLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('lastKnownLocation', JSON.stringify(nextLocation))
    }

    setLocationMessage('Using your current location for nearby health center suggestions.')
    return nextLocation
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return

    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = allDevices.filter((d) => d.kind === 'audioinput')

    setDevices(audioInputs)

    setSelectedDeviceId((prev) => {
      if (prev && audioInputs.some((d) => d.deviceId === prev)) return prev
      return audioInputs[0]?.deviceId || ''
    })
  }

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof MediaRecorder !== 'undefined'

    setIsSupported(supported)

    if (!supported) {
      setError('Your browser does not support microphone recording.')
      return
    }

    let mounted = true

    const load = async () => {
      try {
        if (!mounted) return
        await refreshDevices()
      } catch (e) {
        console.error('Device load error:', e)
      }
    }

    load()

    const handleDeviceChange = () => {
      load()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      mounted = false
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }

      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = async () => {
    setError(null)
    setTranscript('')
    setAnalysis(null)
    setSaveSuccess(null) // Reset save success status

    if (!isSupported) {
      setError('This browser cannot record audio.')
      return
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not available in this browser.')
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
            deviceId: { exact: selectedDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
          : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
      }

      let stream: MediaStream

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (firstErr: any) {
        console.warn('Primary mic request failed, falling back to default mic:', firstErr)

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (selectedDeviceId) {
          setSelectedDeviceId('')
        }
      }

      streamRef.current = stream
      chunksRef.current = []

      const mimeType = getBestMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const type = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        setAudioBlob(blob)

        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
        }

        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setAudioUrl(url)
      }

      recorder.onerror = (event) => {
        console.error('Recorder error:', event)
        setError('Recording failed unexpectedly.')
        setIsRecording(false)
        stopStream()
      }

      recorder.start()
      setIsRecording(true)

      await refreshDevices()
    } catch (err: any) {
      console.error('Microphone access error:', err)

      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setError('No microphone found. Check your system input device and browser permissions.')
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Allow access in browser settings.')
      } else if (err?.name === 'NotReadableError') {
        setError('Microphone is busy or unavailable. Close other apps using the mic.')
      } else {
        setError(err?.message || 'Could not access microphone.')
      }

      setIsRecording(false)
      stopStream()
    }
  }

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } finally {
      setIsRecording(false)
      stopStream()
    }
  }

  const resetAll = () => {
    setTranscript('')
    setAnalysis(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setError(null)
    setSaveSuccess(null) // Reset save success status

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }

  const analyzeVoice = async () => {
    if (!audioBlob) return

    setLoading(true)
    setTranscript('')
    setAnalysis(null)
    setError(null)
    setSaveSuccess(null) // Reset save success status
    setNearbyHospitals([])
    setRoomInfo(null)
    setSelectedHospitalId(null)

    try {
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.webm')
      formData.append('language_code', language)

      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) {
        const text = await transcribeRes.text()
        throw new Error(text || 'Transcription failed')
      }

      const transcribeData = await transcribeRes.json()
      const text = transcribeData.transcript || transcribeData.text || ''
      setTranscript(text)

      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      const userId = user?._id || user?.id || null

      const location = await resolveSelectedLocation()

      const analyzeRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          language: language,
          userId: userId,
          location: location,
        }),
      })

      if (!analyzeRes.ok) {
        const text = await analyzeRes.text()
        throw new Error(text || 'Analysis failed')
      }

      const result = await analyzeRes.json()
      setAnalysis({
        riskLevel: result.riskLevel || 'low',
        suggestedAction: result.suggestedAction || 'Review the symptoms carefully.',
        symptoms: Array.isArray(result.symptoms) ? result.symptoms : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        emergencyCare: result.emergencyCare || 'Not specified. Seek help if symptoms worsen.',
        careSpecialties: Array.isArray(result.careSpecialties) ? result.careSpecialties : [],
        diseaseKeywords: Array.isArray(result.diseaseKeywords) ? result.diseaseKeywords : [],
        originalTranscript: text, // Set the original transcript here
        location: result.location || location,
        nearbyHealthCenters: Array.isArray(result.nearbyHealthCenters) ? result.nearbyHealthCenters : [],
        id: result.id,
      })
      setSaveSuccess(true)
      const matchedCenters = Array.isArray(result.nearbyHealthCenters) ? result.nearbyHealthCenters : []
      setNearbyHospitals(matchedCenters)
      setSelectedHospitalId(matchedCenters[0]?.id ? String(matchedCenters[0].id) : null)
    } catch (err: any) {
      console.error('Processing failed:', err)
      setError(err?.message || 'Failed to transcribe or analyze audio.')
      setSaveSuccess(false) // Indicate failure
    } finally {
      setLoading(false)
    }
  }

  const handleSpeech = async () => {
    if (!analysis) return

    setIsSpeaking(true)
    try {
      const spokenCenters = nearbyHospitals.slice(0, 3).map((center) => {
        const doctorCount = Array.isArray(center.doctors) ? center.doctors.length : 0
        return `${center.name}${center.distance ? ` at ${center.distance}` : ''} with ${doctorCount} matched doctor${doctorCount === 1 ? '' : 's'}`
      })

      const selectedCenterMessage = selectedHospital
        ? `You can now review available doctors at ${selectedHospital.name} and request a video or voice call if the doctor is available.`
        : ''

      const nearbyCentersMessage =
        spokenCenters.length > 0
          ? `Nearby suggested health centers are: ${spokenCenters.join('. ')}.`
          : 'No nearby health centers were matched for these symptoms.'

      // Create a readable summary for synthesis
      const summary = `
        Identified symptoms include: ${analysis.symptoms.join(', ')}.
        The risk assessment is ${analysis.riskLevel}.
        Our recommendation is: ${analysis.suggestedAction}.
        Specifically: ${analysis.recommendations[0]}.
        Important note: ${analysis.emergencyCare}.
        ${nearbyCentersMessage}
        ${selectedCenterMessage}
      `.substring(0, 500) // Keep it concise for synthesis

      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summary,
          language: language,
        }),
      })

      if (!response.ok) throw new Error('Speech synthesis failed')

      const data = await response.json()
      if (data.audioContent) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`)
        audio.onended = () => setIsSpeaking(false)
        await audio.play()
      } else {
        setIsSpeaking(false)
      }
    } catch (err) {
      console.error('Speech error:', err)
      setIsSpeaking(false)
      setError('Could not play voice feedback.')
    }
  }

  const createConsultationRoom = async (doctor: { id: string; name: string }, callType: 'video' | 'voice') => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const user = storedUser ? JSON.parse(storedUser) : null

      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          doctorName: doctor.name,
          patientName: user?.name || 'Patient',
          patientId: user?._id || user?.id || null,
          callType,
          symptoms: analysis?.symptoms || [],
          recommendations: analysis?.recommendations || [],
          suggestedAction: analysis?.suggestedAction || '',
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create consultation room')
      setRoomInfo(data)
    } catch (err: any) {
      setError(err.message || 'Could not create consultation room.')
    }
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
            AI Voice Checkup
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Speak naturally about your symptoms. Our AI will transcribe and analyze them in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Recording Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50 group-hover:opacity-80 transition-opacity" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Record
                  </h2>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-secondary/20 border-none text-sm font-medium rounded-full px-4 py-1.5 focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer hover:bg-secondary/30"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Visualizer Area */}
                <div className="relative aspect-square rounded-3xl bg-gradient-to-tr from-secondary/30 to-background flex items-center justify-center border border-border/20 shadow-inner overflow-hidden">
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 bg-primary/5 animate-pulse-slow" />
                      <div className="flex items-end gap-1.5 h-16">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-primary rounded-full animate-audio-bar"
                            style={{ 
                              height: `${20 + Math.random() * 80}%`,
                              animationDelay: `${i * 0.1}s` 
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className={`transition-all duration-500 transform ${isRecording ? 'scale-110' : 'scale-100'}`}>
                    {error ? (
                      <div className="text-center px-4">
                        <div className="w-32 h-32 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-destructive/30">
                          <AlertCircle className="w-16 h-16 text-destructive" />
                        </div>
                        <p className="text-destructive font-bold text-sm leading-tight">{error}</p>
                      </div>
                    ) : isRecording ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                        <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.5)] border-4 border-white/20">
                          <Mic className="w-14 h-14 text-white animate-wiggle" />
                        </div>
                      </div>
                    ) : audioUrl ? (
                      <div className="text-center">
                        <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-accent/30 group-hover:border-accent/50 transition-colors">
                          <CheckCircle className="w-16 h-16 text-emerald-500" />
                        </div>
                        <p className="text-emerald-600 font-bold text-lg">Audio Ready</p>
                      </div>
                    ) : (
                      <div className="text-center opacity-60">
                        <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-border group-hover:border-primary/50 transition-all">
                          <Mic className="w-16 h-16 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">Click to start</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Location For Nearby Centers</label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        {
                          value: 'current',
                          label: 'Current',
                          description: 'Use live GPS location now',
                        },
                        {
                          value: 'previous',
                          label: 'Previous',
                          description: 'Reuse last saved location',
                        },
                        {
                          value: 'skip',
                          label: 'Skip',
                          description: 'Show suggestions without distance',
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setLocationMode(option.value as 'current' | 'previous' | 'skip')}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            locationMode === option.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border/50 bg-background hover:bg-secondary/10'
                          }`}
                        >
                          <p className="text-sm font-bold">{option.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{locationMessage}</p>
                  </div>

                  {hasAudioInputs && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Microphone</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          className="flex-1 bg-background border border-border/50 text-sm font-medium rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                          {devices.map((device, index) => (
                            <option key={device.deviceId || index} value={device.deviceId}>
                              {device.label || `Microphone ${index + 1}`}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={refreshDevices}
                          className="rounded-xl border-border/50"
                        >
                          <RefreshCw className="w-4 h-4 cursor-pointer" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {error ? (
                    <Button
                      onClick={startRecording}
                      className="w-full h-14 text-lg font-bold bg-primary text-white rounded-2xl"
                    >
                      Try Again
                    </Button>
                  ) : !isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={loading}
                      className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <Mic className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                      Start Voice Input
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="w-full h-14 text-lg font-bold bg-destructive hover:bg-destructive/90 text-white shadow-xl shadow-destructive/20 rounded-2xl animate-bounce-subtle"
                    >
                      <Square className="w-6 h-6 mr-2 fill-current" />
                      Stop Recording
                    </Button>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-muted/50 p-4 rounded-2xl border border-border/50">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Review Audio</label>
                        <audio src={audioUrl} controls className="w-full h-8 accent-primary" />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={analyzeVoice}
                          disabled={loading}
                          className="flex-1 h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-xl rounded-2xl flex items-center justify-center gap-3 group overflow-hidden relative"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <>
                              <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                              Analyze Symptoms
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={resetAll}
                          className="h-14 px-6 rounded-2xl border-border/50"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-8 min-h-[600px]">
            {!transcript && !loading && !analysis && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                  <Volume2 className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground/60">No Analysis Yet</h3>
                <p className="text-muted-foreground/40 max-w-sm mt-2">
                  Once you finish recording and click analyze, your results will appear here.
                </p>
              </div>
            )}

            {loading && !analysis && (
              <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-muted rounded-3xl" />
                <div className="h-24 bg-muted rounded-3xl" />
                <div className="h-64 bg-muted rounded-3xl" />
              </div>
            )}

            {(transcript || analysis) && (
              <div className="space-y-6 animate-in fade-in duration-700">
                {transcript && (
                  <Card className="p-8 border-border/50 bg-card/50 backdrop-blur-md shadow-xl rounded-3xl relative">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 bg-primary/5 px-2 py-1 rounded">Transcript</span>
                    </div>
                    <p className="text-xl leading-relaxed font-medium italic text-foreground/80">
                      "{transcript}"
                    </p>
                  </Card>
                )}

                {analysis && (
                  <div className="grid gap-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Card className={`p-6 rounded-3xl border-2 transition-all shadow-lg ${
                        analysis.riskLevel === 'high' ? 'bg-destructive/10 border-destructive/30' :
                        analysis.riskLevel === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-accent/10 border-accent/20'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className={`w-5 h-5 ${
                            analysis.riskLevel === 'high' ? 'text-destructive' :
                            analysis.riskLevel === 'medium' ? 'text-yellow-600' :
                            'text-accent'
                          }`} />
                          <span className="text-xs font-black uppercase tracking-widest opacity-60">Risk Assessment</span>
                        </div>
                        <p className={`text-4xl font-black capitalize tracking-tight ${
                          analysis.riskLevel === 'high' ? 'text-destructive' :
                          analysis.riskLevel === 'medium' ? 'text-yellow-700' :
                          'text-accent'
                        }`}>
                          {analysis.riskLevel}
                        </p>
                      </Card>

                      <Card className="p-6 rounded-3xl border-border/50 bg-card/50 backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs font-black uppercase tracking-widest opacity-60">Suggested Action</span>
                        </div>
                        <p className="text-lg font-bold leading-tight text-primary/80">
                          {analysis.suggestedAction}
                        </p>
                      </Card>
                    </div>

                    <Card className="p-8 border-border/50 bg-card/50 shadow-xl rounded-3xl">
                      <h3 className="text-lg font-black uppercase tracking-widest opacity-40 mb-6">Identified Symptoms</h3>
                      <div className="flex flex-wrap gap-3">
                        {analysis.symptoms.length > 0 ? (
                          analysis.symptoms.map((symptom) => (
                            <div key={symptom} className="flex items-center gap-2 bg-secondary/30 text-secondary-foreground border border-secondary/20 px-4 py-2 rounded-2xl font-bold text-sm hover:bg-secondary/50 transition-colors">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              {symptom}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground font-medium italic">No specific symptoms identified.</p>
                        )}
                      </div>
                    </Card>

                    <Card className="p-8 border-border/50 bg-card/50 shadow-xl rounded-3xl">
                      <h3 className="text-lg font-black uppercase tracking-widest opacity-40 mb-6">When to Seek Emergency Care</h3>
                      <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium leading-relaxed">
                        <div className="flex items-start gap-4">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <p>{analysis.emergencyCare}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-8 border-border/50 bg-card/50 shadow-xl rounded-3xl">
                      <h3 className="text-lg font-black uppercase tracking-widest opacity-40 mb-6">Expert Recommendations</h3>
                      <div className="grid gap-4">
                        {analysis.recommendations.length > 0 ? (
                          analysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-black text-sm">
                                {i + 1}
                              </div>
                              <p className="text-md font-medium text-foreground/80 pt-1 leading-snug">{rec}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground font-medium italic">General health monitoring advised.</p>
                        )}
                      </div>
                    </Card>

                    {nearbyHospitals.length > 0 && (
                      <Card className="p-8 border-primary/20 bg-primary/5 rounded-3xl shadow-xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <MapPin className="w-24 h-24 -rotate-12" />
                        </div>
                        <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                          <MapPin className="w-6 h-6" />
                          Recommended Nearby Health Centers
                        </h3>
                        <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/60">
                              Step 1: Choose A Suggested Center
                            </p>
                            {nearbyHospitals.map((hospital, idx) => {
                              const isSelected = String(selectedHospitalId) === String(hospital.id)
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedHospitalId(String(hospital.id))}
                                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                                    isSelected
                                      ? 'border-primary bg-white/80 shadow-lg'
                                      : 'border-primary/10 bg-white/50 hover:border-primary/30 hover:translate-x-1'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <h4 className="font-bold text-foreground">{hospital.name}</h4>
                                      <p className="text-sm text-muted-foreground">{hospital.address}</p>
                                      <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">{hospital.distance}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{hospital.phone}</span>
                                      </div>
                                    </div>
                                    <div className={`rounded-full p-2 ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                      <ArrowRight className="w-5 h-5" />
                                    </div>
                                  </div>
                                  <p className="mt-3 text-xs text-muted-foreground">
                                    {hospital.doctors?.length || 0} symptom-matched doctor{hospital.doctors?.length === 1 ? '' : 's'} available
                                  </p>
                                </button>
                              )
                            })}
                          </div>

                          <div className="rounded-2xl bg-background/70 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/60">
                              Step 2: View Available Doctors
                            </p>
                            {selectedHospital ? (
                              <div className="mt-4 space-y-4">
                                <div>
                                  <h4 className="text-lg font-bold">{selectedHospital.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Doctors below are matched against the symptoms and specialties from your analysis.
                                  </p>
                                </div>

                                {selectedHospital.doctors?.length > 0 ? (
                                  selectedHospital.doctors.map((doctor: any) => {
                                    const supportsVideo = (doctor.availableModes || []).includes('video')
                                    const supportsVoice = (doctor.availableModes || []).includes('voice')

                                    return (
                                      <div key={doctor.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
                                        <div>
                                          <p className="font-semibold">{doctor.name}</p>
                                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {(doctor.diseasesHandled || []).join(', ') || (doctor.careNeeds || []).join(', ')}
                                          </p>
                                          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-primary/60">
                                            Available: {(doctor.availableModes || []).join(' • ') || 'in_person'}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            onClick={() => createConsultationRoom(doctor, 'video')}
                                            className="gap-2"
                                            disabled={!supportsVideo}
                                          >
                                            Request Video Call
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => createConsultationRoom(doctor, 'voice')}
                                            className="gap-2"
                                            disabled={!supportsVoice}
                                          >
                                            Request Voice Call
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                    No doctors are currently matched for this center based on the analyzed symptoms.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                Choose a suggested health center to see its available doctors.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-primary/10 flex justify-center">
                          <Button variant="link" className="text-primary font-bold gap-2" asChild>
                            <a href="/map">View all hospitals on live map <ArrowRight className="w-4 h-4" /></a>
                          </Button>
                        </div>
                      </Card>
                    )}

                    {analysis.location && (
                      <Card className="p-6 border-border/50 bg-card/50 rounded-3xl shadow-lg">
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-3">Location Used For Matching</h3>
                        <p className="text-sm text-muted-foreground">
                          {analysis.location.latitude.toFixed(5)}, {analysis.location.longitude.toFixed(5)}
                        </p>
                      </Card>
                    )}

                    {analysis.originalTranscript && (
                      <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Real Transcript</h3>
                        <p className="text-muted-foreground italic leading-relaxed">"{analysis.originalTranscript}"</p>
                      </div>
                    )}

                    {roomInfo && (
                      <Card className="rounded-3xl border-secondary/20 bg-secondary/10 p-6">
                        <h3 className="text-lg font-bold text-secondary-foreground">Consultation Room Ready</h3>
                        <div className="mt-4 space-y-2 text-sm">
                          <p><strong>Room ID:</strong> {roomInfo.roomID}</p>
                          {/* <p><strong>Token:</strong> {roomInfo.token || 'Token not configured yet'}</p> */}
                          <p>{roomInfo.message}</p>
                          {roomInfo.consultationId && (
                            <Button variant="outline" asChild>
                              <a href={`/consultations/${roomInfo.consultationId}`}>Open Consultation Room</a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={handleSpeech}
                        disabled={isSpeaking}
                        className="flex-1 h-16 text-xl font-black bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-2xl rounded-3xl gap-4 group"
                      >
                        {isSpeaking ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Speaking...
                          </div>
                        ) : (
                          <>
                            <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            Hear AI Response
                          </>
                        )}
                      </Button>
                      <Button className="flex-1 h-16 text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 rounded-3xl gap-4 group">
                        <Upload className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                        Save to History
                      </Button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] mt-4 font-bold opacity-40">
                      Encrypted with AES-256 for your privacy
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
