'use client'

import { useEffect, useState } from 'react'
import { Building2, CheckCircle2, Clock3, MapPin, Phone, Plus, Stethoscope, Video } from 'lucide-react'

import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type DoctorForm = {
  name: string
  specialization: string
  email: string
  phone: string
  qualifications: string
  experienceYears: string
  diseasesHandled: string
  careNeeds: string
  languages: string
  consultationFee: string
  availableModes: string
}

const initialDoctorForm: DoctorForm = {
  name: '',
  specialization: '',
  email: '',
  phone: '',
  qualifications: '',
  experienceYears: '',
  diseasesHandled: '',
  careNeeds: '',
  languages: '',
  consultationFee: '',
  availableModes: 'in_person,video',
}

export default function HealthCenterDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [doctorForm, setDoctorForm] = useState<DoctorForm>(initialDoctorForm)
  const [editingDoctorId, setEditingDoctorId] = useState('')
  const [savingDoctor, setSavingDoctor] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState<any>(null)

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = storedUser ? JSON.parse(storedUser) : null

  const fetchProfile = async () => {
    if (!user?._id && !user?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/healthcenters/me?userId=${user._id || user.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load health center dashboard')
      setProfile(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetDoctorForm = () => {
    setDoctorForm(initialDoctorForm)
    setEditingDoctorId('')
  }

  const submitDoctor = async () => {
    if (!user?._id && !user?.id) return

    setSavingDoctor(true)
    setError('')

    try {
      const method = editingDoctorId ? 'PUT' : 'POST'
      const url = editingDoctorId
        ? `/api/healthcenters/doctors/${editingDoctorId}`
        : '/api/healthcenters/doctors'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id || user.id,
          ...doctorForm,
          availableModes: doctorForm.availableModes.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save doctor')

      resetDoctorForm()
      await fetchProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor')
    } finally {
      setSavingDoctor(false)
    }
  }

  const startEditDoctor = (doctor: any) => {
    setEditingDoctorId(doctor._id)
    setDoctorForm({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      qualifications: (doctor.qualifications || []).join(', '),
      experienceYears: String(doctor.experienceYears || ''),
      diseasesHandled: (doctor.diseasesHandled || []).join(', '),
      careNeeds: (doctor.careNeeds || []).join(', '),
      languages: (doctor.languages || []).join(', '),
      consultationFee: String(doctor.consultationFee || ''),
      availableModes: (doctor.availableModes || []).join(','),
    })
  }

  const deleteDoctor = async (doctorId: string) => {
    if (!user?._id && !user?.id) return

    try {
      const res = await fetch(`/api/healthcenters/doctors/${doctorId}?userId=${user._id || user.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete doctor')
      await fetchProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to delete doctor')
    }
  }

  const createMeeting = async (doctor: any) => {
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: doctor.name,
          patientName: 'Patient',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create room')
      setMeetingInfo({ doctorName: doctor.name, ...data })
    } catch (err: any) {
      setError(err.message || 'Failed to create room')
    }
  }

  const center = profile?.center
  const doctors = profile?.doctors || []

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-primary-foreground/70">Health Center Dashboard</p>
              <h1 className="mt-2 text-4xl font-bold">{center?.name || 'Your Health Center'}</h1>
              <p className="mt-2 max-w-2xl text-primary-foreground/85">
                Track approval status, update your facility profile, manage doctors, and prepare for patient consultations.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/65">Status</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                {center?.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                <span className="capitalize">{center?.status || 'pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </Card>
        )}

        {loading ? (
          <Card className="p-8">Loading health center dashboard...</Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Facility</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">{center?.type?.toUpperCase() || 'CENTER'}</p>
                <p className="mt-2 text-sm text-muted-foreground">{center?.services?.join(', ') || 'Services will appear here.'}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Doctors</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">{doctors.length}</p>
                <p className="mt-2 text-sm text-muted-foreground">Available doctors currently listed by your center.</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Video Consults</h2>
                </div>
                <p className="mt-4 text-2xl font-bold">
                  {meetingInfo?.zegoEnabled ? 'Enabled' : 'Setup Needed'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Live rooms are prepared. Add Zego credentials to activate SDK-powered calls.
                </p>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
              <Card className="p-6">
                <h2 className="text-xl font-bold">Center Details</h2>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{[center?.address, center?.city, center?.state, center?.zipCode].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{center?.phone}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Specializations</p>
                    <p className="mt-1">{center?.specializations?.join(', ') || 'Not set yet'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Care Needs Covered</p>
                    <p className="mt-1">{center?.requiredNeeds?.join(', ') || 'Not set yet'}</p>
                  </div>
                  {center?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={center.imageUrl} alt={center.name} className="h-52 w-full rounded-2xl object-cover" />
                  )}
                </div>
              </Card>

              <Card id="consultations" className="p-6">
                <h2 className="text-xl font-bold">Consultation Room</h2>
                {meetingInfo ? (
                  <div className="mt-5 space-y-3 text-sm">
                    <p><strong>Doctor:</strong> {meetingInfo.doctorName}</p>
                    <p><strong>Room ID:</strong> {meetingInfo.roomID}</p>
                    <p><strong>Token:</strong> {meetingInfo.token || 'Server token not configured'}</p>
                    <div className="rounded-2xl bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                      const result = await zg.loginRoom(roomID, token, {'{'} userID, userName {'}'}){'\n'}
                      const stream = await zg.createStream(source){'\n'}
                      zg.startPublishingStream(streamID, stream){'\n'}
                      const remoteStream = await zg.startPlayingStream(streamID)
                    </div>
                    <p className="text-muted-foreground">{meetingInfo.message}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Create a room from a doctor card below. The room metadata is ready even before Zego credentials are configured.
                  </p>
                )}
              </Card>
            </div>

            <div id="doctors" className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{editingDoctorId ? 'Edit Doctor' : 'Add Doctor'}</h2>
                  {editingDoctorId && (
                    <Button variant="outline" onClick={resetDoctorForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="mt-5 grid gap-4">
                  <Input placeholder="Doctor name" value={doctorForm.name} onChange={(e) => setDoctorForm((current) => ({ ...current, name: e.target.value }))} />
                  <Input placeholder="Specialization" value={doctorForm.specialization} onChange={(e) => setDoctorForm((current) => ({ ...current, specialization: e.target.value }))} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Email" value={doctorForm.email} onChange={(e) => setDoctorForm((current) => ({ ...current, email: e.target.value }))} />
                    <Input placeholder="Phone" value={doctorForm.phone} onChange={(e) => setDoctorForm((current) => ({ ...current, phone: e.target.value }))} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Experience years" value={doctorForm.experienceYears} onChange={(e) => setDoctorForm((current) => ({ ...current, experienceYears: e.target.value }))} />
                    <Input placeholder="Consultation fee" value={doctorForm.consultationFee} onChange={(e) => setDoctorForm((current) => ({ ...current, consultationFee: e.target.value }))} />
                  </div>
                  <Textarea placeholder="Qualifications, comma separated" rows={3} value={doctorForm.qualifications} onChange={(e) => setDoctorForm((current) => ({ ...current, qualifications: e.target.value }))} />
                  <Textarea placeholder="Diseases handled, comma separated" rows={3} value={doctorForm.diseasesHandled} onChange={(e) => setDoctorForm((current) => ({ ...current, diseasesHandled: e.target.value }))} />
                  <Textarea placeholder="Care needs, comma separated" rows={3} value={doctorForm.careNeeds} onChange={(e) => setDoctorForm((current) => ({ ...current, careNeeds: e.target.value }))} />
                  <Input placeholder="Languages, comma separated" value={doctorForm.languages} onChange={(e) => setDoctorForm((current) => ({ ...current, languages: e.target.value }))} />
                  <Input placeholder="Modes: in_person,video,voice" value={doctorForm.availableModes} onChange={(e) => setDoctorForm((current) => ({ ...current, availableModes: e.target.value }))} />
                  <Button onClick={submitDoctor} disabled={savingDoctor} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {savingDoctor ? 'Saving...' : editingDoctorId ? 'Update Doctor' : 'Add Doctor'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold">Doctors</h2>
                <div className="mt-5 space-y-4">
                  {doctors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No doctors added yet. Add your first doctor to show availability to patients.
                    </div>
                  ) : doctors.map((doctor: any) => (
                    <div key={doctor._id} className="rounded-2xl border border-border/70 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{doctor.name}</h3>
                          <p className="text-sm text-primary">{doctor.specialization}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {(doctor.diseasesHandled || []).join(', ') || 'No disease tags added'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {(doctor.availableModes || []).join(' • ')}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => startEditDoctor(doctor)}>Edit</Button>
                          <Button variant="outline" onClick={() => createMeeting(doctor)}>Create Room</Button>
                          <Button variant="destructive" onClick={() => deleteDoctor(doctor._id)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
