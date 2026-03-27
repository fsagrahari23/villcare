'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { Search, Filter, MapPin, Phone, FileText, CheckCircle, X, AlertCircle } from 'lucide-react'

export default function PendingApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const staffId = "staff_123" // Placeholder - in prod get from session

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/staff/pending')
      if (!res.ok) throw new Error('Failed to fetch pending')
      const data = await res.json()
      setApplications(data.map((app: any) => ({
        id: app._id,
        name: app.name,
        location: `${app.city || ''}, ${app.address || ''}`,
        type: app.type,
        submittedDate: new Date(app.createdAt).toLocaleDateString(),
        contact: app.phone,
        website: app.website || 'N/A',
        coordinates: `${app.latitude}, ${app.longitude}`,
        imageUrl: app.imageUrl || '',
        docs: Array.isArray(app.documents) && app.documents.length > 0
          ? app.documents.map((doc: any) => ({
              label: doc.type || 'Document',
              url: doc.url || '',
            }))
          : [{ label: 'Registration', url: '' }],
      })))
    } catch (err) {
      console.error('Fetch pending failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/approve/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      })
      if (!res.ok) throw new Error('Approval failed')
      
      setApplications(prev => prev.filter(app => app.id !== id))
      setSelectedApplication(null)
      alert('Application approved successfully!')
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    try {
      const res = await fetch(`/api/staff/reject/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason, staffId })
      })
      if (!res.ok) throw new Error('Rejection failed')

      setApplications(prev => prev.filter(app => app.id !== id))
      setSelectedApplication(null)
      setRejectReason('')
      setShowRejectReason(false)
      alert('Application rejected successfully!')
    } catch (err) {
      console.error('Rejection failed:', err)
    }
  }

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-2">Pending Approvals</h1>
        <p className="text-muted-foreground mb-8">Review and approve new hospital registrations</p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Applications List */}
          <div className="md:col-span-2">
            {/* Search and Filter */}
            <Card className="p-4 mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search center name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background hover:bg-secondary/5"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </Card>

            {/* Applications List */}
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedApplication?.id === app.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedApplication(app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{app.name}</h3>
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                          {app.type}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {app.location}
                        </p>
                        <p>Submitted: {app.submittedDate}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-full">
                      Pending Review
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          {selectedApplication ? (
            <Card className="p-6 h-fit sticky top-20">
              <h2 className="text-xl font-bold mb-4">{selectedApplication.name}</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">LOCATION</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{selectedApplication.location}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">COORDINATES</p>
                  <p className="text-sm font-mono">{selectedApplication.coordinates}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">CONTACT</p>
                  <a href={`tel:${selectedApplication.contact}`} className="text-primary hover:underline flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedApplication.contact}
                  </a>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">DOCUMENTS</p>
                  <div className="space-y-1">
                    {selectedApplication.docs.map((doc: { label: string; url: string }) => (
                      <div key={`${doc.label}-${doc.url}`} className="flex items-center gap-2 text-sm p-2 bg-secondary/10 rounded">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="flex-1">{doc.label}</span>
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">
                            Open
                          </a>
                        )}
                        <CheckCircle className="w-4 h-4 text-accent" />
                      </div>
                    ))}
                  </div>
                </div>

                {selectedApplication.imageUrl && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">CENTER IMAGE</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedApplication.imageUrl} alt={selectedApplication.name} className="w-full h-40 object-cover rounded-xl border border-border/60" />
                  </div>
                )}
              </div>

              {!showRejectReason ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(selectedApplication.id)}
                    className="flex-1 bg-accent hover:bg-accent/90 gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setShowRejectReason(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    placeholder="Provide reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReject(selectedApplication.id)}
                      className="flex-1 bg-destructive hover:bg-destructive/90"
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectReason(false)
                        setRejectReason('')
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 h-fit sticky top-20 flex items-center justify-center text-center">
              <div className="space-y-3">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Select an application to view details</p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
