'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Stethoscope, Video } from 'lucide-react'

import Navigation from '@/components/Navigation'
import ZegoCallPanel from '@/components/ZegoCallPanel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function DoctorDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedConsultationId, setSelectedConsultationId] = useState('')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [doctorSummary, setDoctorSummary] = useState('')

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  const userId = user?._id || user?.id || ''

  const fetchDashboard = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const res = await fetch(`/api/doctor/dashboard?userId=${userId}`)
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to load doctor dashboard')
      setData(payload)
      if (!selectedConsultationId && payload.consultations?.[0]?._id) {
        setSelectedConsultationId(payload.consultations[0]._id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const activeConsultation = useMemo(
    () => data?.consultations?.find((consultation: any) => consultation._id === selectedConsultationId) || null,
    [data, selectedConsultationId]
  )

  const saveReportReview = async () => {
    if (!selectedReport || !userId) return

    try {
      const res = await fetch(`/api/doctor/reports/${selectedReport._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          doctorNotes,
          doctorSummary,
          isVerified: true,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to save report review')
      setSelectedReport(payload.report)
      await fetchDashboard()
    } catch (err: any) {
      setError(err.message || 'Failed to save report review')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/70">Doctor Workspace</p>
          <h1 className="mt-2 text-4xl font-bold">{data?.doctor?.name || user?.name || 'Doctor'}</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/85">
            Review patient records, accept live consultations, and use ZEGOCLOUD voice or video calls directly from the dashboard.
          </p>
        </div>

        {error && <Card className="border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</Card>}

        {loading ? (
          <Card className="p-8">Loading doctor dashboard...</Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Specialization</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">{data?.doctor?.specialization || 'Doctor'}</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Consultations</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">{data?.consultations?.length || 0}</p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Patient Records</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">{data?.reports?.length || 0}</p>
              </Card>
            </div>

            <div id="consultations" className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
              <Card className="p-6">
                <h2 className="text-xl font-bold">Pending and Active Consultations</h2>
                <div className="mt-5 space-y-4">
                  {(data?.consultations || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No patient consultation requests yet.
                    </div>
                  ) : (
                    data.consultations.map((consultation: any) => (
                      <button
                        key={consultation._id}
                        type="button"
                        onClick={() => setSelectedConsultationId(consultation._id)}
                        className={`w-full rounded-2xl border p-4 text-left ${
                          selectedConsultationId === consultation._id ? 'border-primary bg-primary/5' : 'border-border/70'
                        }`}
                      >
                        <p className="font-semibold">{consultation.patientName || 'Patient'}</p>
                        <p className="text-sm text-muted-foreground">{consultation.callType} consultation</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{consultation.status}</p>
                      </button>
                    ))
                  )}
                </div>
              </Card>

              {activeConsultation ? (
                <ZegoCallPanel
                  consultationId={activeConsultation._id}
                  currentUser={{ id: userId, name: user?.name || 'Doctor' }}
                />
              ) : (
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">Select a consultation to open the ZEGOCLOUD call panel.</p>
                </Card>
              )}
            </div>

            <div id="records" className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
              <Card className="p-6">
                <h2 className="text-xl font-bold">Patient Records</h2>
                <div className="mt-5 space-y-4">
                  {(data?.reports || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No patient reports linked to your consultations yet.
                    </div>
                  ) : (
                    data.reports.map((report: any) => (
                      <button
                        key={report._id}
                        type="button"
                        onClick={() => {
                          setSelectedReport(report)
                          setDoctorNotes(report.doctorNotes || '')
                          setDoctorSummary(report.doctorSummary || '')
                        }}
                        className={`w-full rounded-2xl border p-4 text-left ${
                          selectedReport?._id === report._id ? 'border-primary bg-primary/5' : 'border-border/70'
                        }`}
                      >
                        <p className="font-semibold">{report.title || report.testName || 'Medical Report'}</p>
                        <p className="text-sm text-muted-foreground">{report.reportType}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {report.isVerified ? 'Verified' : 'Needs review'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold">Record Review</h2>
                {selectedReport ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Report</p>
                      <p className="mt-1 font-semibold">{selectedReport.title || selectedReport.testName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Findings</p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedReport.analysis?.findings || 'No extracted findings available.'}</p>
                    </div>
                    <Textarea
                      rows={5}
                      value={doctorSummary}
                      onChange={(e) => setDoctorSummary(e.target.value)}
                      placeholder="Clinical summary for this patient report"
                    />
                    <Textarea
                      rows={6}
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Doctor notes, treatment advice, follow-up guidance"
                    />
                    <div className="flex gap-3">
                      <Button onClick={saveReportReview}>Save Review</Button>
                      <Button variant="outline" asChild>
                        <a href={selectedReport.fileUrl} target="_blank" rel="noreferrer">Open Report</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Select a report to review and annotate.
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
