'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import {
  Upload, FileText, Trash2, MessageSquare, CheckCircle,
  AlertTriangle, Activity, Calendar, Hospital, User,
  ChevronRight, Loader2, Bot, Send, ClipboardList,
  ShieldCheck, Tag, X, Microscope,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Analysis {
  findings: string
  normalValues: string[]
  abnormalValues: string[]
  riskFactors: string[]
}

interface Report {
  _id: string
  title?: string
  fileName?: string
  fileUrl?: string
  mimeType?: string
  reportType: string
  testName?: string
  hospitalName?: string
  doctorName?: string
  testDate?: string
  reportDate?: string
  analysis?: Analysis
  ocrStatus?: string
  pineconeDocId?: string
  isVerified?: boolean
  tags?: string[]
  notes?: string
  createdAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function reportTypeLabel(t: string) {
  const map: Record<string, string> = {
    blood_test: 'Blood Test', xray: 'X-Ray', ultrasound: 'Ultrasound',
    ct_scan: 'CT Scan', prescription: 'Prescription', Other: 'Other',
  }
  return map[t] || t
}

function BadgePill({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [tab, setTab] = useState<'details' | 'chat'>('details')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchReports() }, [])
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const getUserId = () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    return stored ? JSON.parse(stored)?._id : '65f123456789012345678901'
  }

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/reports?userId=${getUserId()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Report[] = await res.json()
      setReports(data)
    } catch (err) {
      console.error('Fetch reports failed:', err)
    }
  }

  const selectReport = useCallback(async (report: Report) => {
    setLoadingDetail(true)
    setChatMessages([])
    setTab('details')
    try {
      const res = await fetch(`/api/reports/${report._id}`)
      const full: Report = await res.json()
      setSelectedReport(full)
    } catch {
      setSelectedReport(report)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', getUserId())
      const res = await fetch('/api/reports/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setReports(prev => [data.report, ...prev])
      selectReport(data.report)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setReports(prev => prev.filter(r => r._id !== id))
      if (selectedReport?._id === id) setSelectedReport(null)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedReport || chatLoading) return
    const question = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: question }])
    setChatLoading(true)
    try {
      const res = await fetch(`/api/reports/${selectedReport._id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || data.error || 'No response.',
      }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Medical Reports</h1>
          <p className="text-indigo-300 mt-1">Upload, analyze & chat with your medical documents using AI</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Left: Upload + List ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Card */}
            <div
              onClick={() => !uploadLoading && fileInputRef.current?.click()}
              className="relative rounded-2xl border-2 border-dashed border-indigo-500/40 bg-white/5 backdrop-blur-md p-8 text-center cursor-pointer hover:border-indigo-400/70 hover:bg-white/8 transition-all group"
            >
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={handleFileUpload} disabled={uploadLoading} />
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-500/30 transition-all">
                {uploadLoading
                  ? <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                  : <Upload className="w-7 h-7 text-indigo-400" />}
              </div>
              <p className="font-semibold text-white">{uploadLoading ? 'Processing report…' : 'Upload Medical Report'}</p>
              <p className="text-xs text-indigo-300 mt-1">PDF, PNG, JPG — Max 10MB</p>
              {uploadLoading && (
                <div className="mt-3">
                  <div className="h-1 w-full bg-indigo-900 rounded-full overflow-hidden">
                    <div className="h-1 bg-indigo-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-xs text-indigo-400 mt-1">OCR & AI analysis running…</p>
                </div>
              )}
            </div>

            {/* Reports List */}
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                  <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <p className="text-indigo-200 text-sm">No reports uploaded yet</p>
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => selectReport(r)}
                    className={`rounded-xl px-4 py-3.5 cursor-pointer transition-all flex items-center gap-3 group
                      ${selectedReport?._id === r._id
                        ? 'bg-indigo-600/40 border border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30'}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${selectedReport?._id === r._id ? 'bg-indigo-500' : 'bg-indigo-500/20'}`}>
                      <Microscope className={`w-4 h-4 ${selectedReport?._id === r._id ? 'text-white' : 'text-indigo-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{r.testName || r.title || r.fileName}</p>
                      <p className="text-xs text-indigo-300">{reportTypeLabel(r.reportType)} · {formatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.pineconeDocId && (
                        <span title="RAG indexed" className="text-emerald-400">
                          <Activity className="w-3 h-3" />
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(r._id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-indigo-400/50" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right: Detail Panel ────────────────────────────── */}
          <div className="lg:col-span-3">
            {!selectedReport ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 h-full min-h-96 flex items-center justify-center text-center p-10">
                <div>
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-indigo-400" />
                  </div>
                  <p className="text-white font-semibold text-lg">Select a report</p>
                  <p className="text-indigo-300 text-sm mt-1">View extracted data & chat with your report using AI</p>
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 h-full min-h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : (
              <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
                {/* Report Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedReport.testName || selectedReport.title || selectedReport.fileName}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <BadgePill label={reportTypeLabel(selectedReport.reportType)} color="bg-indigo-500/30 text-indigo-200" />
                        {selectedReport.isVerified && <BadgePill label="Verified" color="bg-emerald-500/30 text-emerald-200" />}
                        {selectedReport.pineconeDocId && <BadgePill label="RAG Indexed" color="bg-purple-500/30 text-purple-200" />}
                        <BadgePill label={selectedReport.ocrStatus || 'pending'} color="bg-amber-500/30 text-amber-200" />
                      </div>
                    </div>
                    {selectedReport.fileUrl && (
                      <a href={selectedReport.fileUrl} target="_blank" rel="noreferrer"
                        className="flex-shrink-0 text-xs text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg px-3 py-1.5 hover:bg-indigo-500/20 transition-all">
                        View File ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {(['details', 'chat'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-3 text-sm font-medium transition-all capitalize flex items-center justify-center gap-2
                        ${tab === t ? 'text-white border-b-2 border-indigo-400 bg-white/5' : 'text-indigo-400 hover:text-white hover:bg-white/5'}`}>
                      {t === 'details' ? <ClipboardList className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      {t === 'details' ? 'Report Details' : 'AI Chat'}
                    </button>
                  ))}
                </div>

                {/* ── Details Tab ─────────────────────────────── */}
                {tab === 'details' && (
                  <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-18rem)]">

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Hospital, label: 'Hospital', value: selectedReport.hospitalName },
                        { icon: User, label: 'Doctor', value: selectedReport.doctorName },
                        { icon: Calendar, label: 'Test Date', value: formatDate(selectedReport.testDate) },
                        { icon: Calendar, label: 'Report Date', value: formatDate(selectedReport.reportDate) },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-3.5 h-3.5 text-indigo-400" />
                            <p className="text-xs text-indigo-300 uppercase tracking-wide">{label}</p>
                          </div>
                          <p className="text-sm text-white font-medium">{value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Findings */}
                    {selectedReport.analysis?.findings && (
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-semibold text-blue-300">AI Findings</h3>
                        </div>
                        <p className="text-sm text-blue-100 leading-relaxed">{selectedReport.analysis.findings}</p>
                      </div>
                    )}

                    {/* Normal Values */}
                    {(selectedReport.analysis?.normalValues?.length ?? 0) > 0 && (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-sm font-semibold text-emerald-300">Normal Values</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.analysis!.normalValues.map((v, i) => (
                            <span key={i} className="bg-emerald-500/20 text-emerald-200 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Abnormal Values */}
                    {(selectedReport.analysis?.abnormalValues?.length ?? 0) > 0 && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <h3 className="text-sm font-semibold text-red-300">Abnormal Values</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.analysis!.abnormalValues.map((v, i) => (
                            <span key={i} className="bg-red-500/20 text-red-200 text-xs px-2.5 py-1 rounded-full border border-red-500/30">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {(selectedReport.analysis?.riskFactors?.length ?? 0) > 0 && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-semibold text-amber-300">Risk Factors</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.analysis!.riskFactors.map((v, i) => (
                            <span key={i} className="bg-amber-500/20 text-amber-200 text-xs px-2.5 py-1 rounded-full border border-amber-500/30">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {(selectedReport.tags?.length ?? 0) > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-3.5 h-3.5 text-indigo-400" />
                          <p className="text-xs text-indigo-300 uppercase tracking-wide">Tags</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.tags!.map((t, i) => (
                            <span key={i} className="bg-indigo-500/20 text-indigo-200 text-xs px-2.5 py-1 rounded-full border border-indigo-500/30">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedReport.notes && (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <p className="text-xs text-indigo-300 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-indigo-100">{selectedReport.notes}</p>
                      </div>
                    )}

                    {/* RAG info */}
                    {selectedReport.pineconeDocId && (
                      <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 flex items-center gap-3">
                        <Activity className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-purple-300">Vector Indexed in Pinecone</p>
                          <p className="text-xs text-purple-400 font-mono truncate">{selectedReport.pineconeDocId}</p>
                        </div>
                      </div>
                    )}

                    {/* Switch to chat CTA */}
                    <button onClick={() => setTab('chat')}
                      className="w-full py-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-sm font-medium flex items-center justify-center gap-2 transition-all">
                      <Bot className="w-4 h-4" />
                      Ask AI about this report
                    </button>
                  </div>
                )}

                {/* ── Chat Tab ─────────────────────────────────── */}
                {tab === 'chat' && (
                  <div className="flex flex-col h-[calc(100vh-18rem)]">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-10">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-8 h-8 text-indigo-400" />
                          </div>
                          <p className="text-white font-semibold">Medical AI Assistant</p>
                          <p className="text-indigo-300 text-sm mt-1">Ask anything about this report</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {[
                              'What are the key findings?',
                              'Explain the abnormal values',
                              'What are the risk factors?',
                              'Is there anything I should be concerned about?',
                            ].map(q => (
                              <button key={q} onClick={() => { setChatInput(q); }}
                                className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 transition-all">
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-indigo-600/50 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-indigo-200" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                            ${msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-sm'
                              : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/10'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {chatLoading && (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/50 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-indigo-200" />
                          </div>
                          <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            <span className="text-sm text-indigo-300">Searching report context…</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ask about this medical report…"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                          disabled={chatLoading}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition-all"
                        />
                        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 flex items-center justify-center transition-all flex-shrink-0">
                          <Send className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <p className="text-xs text-indigo-500 mt-1.5 text-center">
                        {selectedReport.pineconeDocId ? '✦ Powered by Pinecone RAG + Gemini' : '✦ Powered by Gemini AI'}
                      </p>
                    </div>
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
