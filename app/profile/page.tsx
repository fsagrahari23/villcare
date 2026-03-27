'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { User as UserIcon, Mail, Phone, MapPin, Heart, Clock, Edit2, Save, FileText, Briefcase, X, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<any>({
    name: 'Loading...',
    email: '',
    phone: '',
    role: 'patient',
    dateOfBirth: '',
    gender: 'other',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bloodType: '',
    allergies: [],
    medications: [],
    chronicDiseases: [],
    staffId: '',
    departmentName: '',
    specialization: '',
    licenseNumber: '',
    bio: ''
  })

  const [editedProfile, setEditedProfile] = useState(profile)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null
      const userId = user?._id || "65f123456789012345678901"

      const res = await fetch(`/api/user/profile?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
      setEditedProfile(data)
    } catch (err) {
      console.error('Fetch profile failed:', err)
    }
  }

  const handleSave = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null
      const userId = user?._id || "65f123456789012345678901"

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editedProfile, userId })
      })

      if (!res.ok) throw new Error('Update failed')
      
      const data = await res.json()
      setProfile(data.user)
      setEditedProfile(data.user)
      
      // Update local storage too
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setIsEditing(false)
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your health information</p>
          </div>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="md:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: <UserIcon className="w-4 h-4" />, label: 'Full Name', key: 'name' },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', key: 'email' },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', key: 'phone' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Address', key: 'address' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'City', key: 'city' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'State', key: 'state' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Zip Code', key: 'zipCode' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      {field.icon}
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile[field.key] || ''}
                        onChange={(e) => setEditedProfile({
                          ...editedProfile,
                          [field.key]: e.target.value
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    ) : (
                      <p className="font-medium">{profile[field.key] || 'N/A'}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Bio Section */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                About Me
              </h2>
              {isEditing ? (
                <textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[100px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">{profile.bio || 'No bio provided yet.'}</p>
              )}
            </Card>

            {/* Professional Info (Staff Only) */}
            {(profile.role === 'staff' || profile.role === 'admin' || profile.role === 'doctor') && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Professional Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Staff ID', key: 'staffId' },
                    { label: 'Department', key: 'departmentName' },
                    { label: 'Specialization', key: 'specialization' },
                    { label: 'License Number', key: 'licenseNumber' }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-muted-foreground mb-1">{field.label}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProfile[field.key] || ''}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            [field.key]: e.target.value
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      ) : (
                        <p className="font-medium">{profile[field.key] || 'N/A'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Medical Info */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Medical Information
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div key="dob">
                  <label className="text-xs font-semibold text-muted-foreground mb-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedProfile.dateOfBirth || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-10"
                    />
                  ) : (
                    <p className="font-medium">{profile.dateOfBirth || 'N/A'}</p>
                  )}
                </div>
                <div key="gender">
                  <label className="text-xs font-semibold text-muted-foreground mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      value={editedProfile.gender || 'other'}
                      onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-10"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="font-medium uppercase">{profile.gender || 'Other'}</p>
                  )}
                </div>
                <div key="bloodType">
                  <label className="text-xs font-semibold text-muted-foreground mb-1">Blood Type</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.bloodType || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bloodType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-10"
                    />
                  ) : (
                    <p className="font-medium">{profile.bloodType || 'N/A'}</p>
                  )}
                </div>
              </div>

              {/* Tag Containers */}
              {[
                { label: 'Known Allergies', key: 'allergies', color: 'bg-destructive/20 text-destructive' },
                { label: 'Current Medications', key: 'medications', color: 'bg-primary/20 text-primary' },
                { label: 'Chronic Diseases', key: 'chronicDiseases', color: 'bg-yellow-500/20 text-yellow-600' }
              ].map((section) => (
                <div key={section.key} className="mb-4 last:mb-0">
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">{section.label}</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editedProfile[section.key]?.map((item: string, idx: number) => (
                          <span key={idx} className={`text-xs ${section.color} px-3 py-1 rounded-full flex items-center gap-1`}>
                            {item}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => {
                              const newList = [...editedProfile[section.key]]
                              newList.splice(idx, 1)
                              setEditedProfile({ ...editedProfile, [section.key]: newList })
                            }} />
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder={`Add ${section.label.toLowerCase()}...`}
                          className="h-8 text-xs"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const val = (e.target as HTMLInputElement).value.trim()
                              if (val && !editedProfile[section.key].includes(val)) {
                                setEditedProfile({
                                  ...editedProfile,
                                  [section.key]: [...editedProfile[section.key], val]
                                })
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile[section.key]?.length > 0 ? (
                        profile[section.key].map((item: string, idx: number) => (
                          <span key={idx} className={`text-xs ${section.color} px-3 py-1 rounded-full`}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None listed</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </Card>

            {/* Emergency Contact */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertIcon className="w-5 h-5 text-destructive" />
                Emergency Contact
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Contact Name', key: 'emergencyContact' },
                  { label: 'Phone Number', key: 'emergencyPhone' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1">{field.label}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile[field.key as keyof typeof editedProfile] as string}
                        onChange={(e) => setEditedProfile({
                          ...editedProfile,
                          [field.key]: e.target.value
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    ) : (
                      <p className="font-medium">{profile[field.key as keyof typeof profile]}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Health Summary */}
          <div>
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Health Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Last Checkup', value: 'Mar 15, 2024', icon: <Clock className="w-4 h-4" /> },
                  { label: 'Total Checkups', value: '12', icon: <Heart className="w-4 h-4" /> },
                  { label: 'Active Reports', value: '3', icon: <UserIcon className="w-4 h-4" /> }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary">{item.icon}</span>
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    </div>
                    <p className="text-lg font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">Download Records</Button>
                <Button variant="outline" className="w-full">Medical History</Button>
                <Button variant="outline" className="w-full">Settings</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function AlertIcon(props: any) {
  return <Heart {...props} />
}
