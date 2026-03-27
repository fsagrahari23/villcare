'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'

import Navigation from '@/components/Navigation'
import ZegoCallPanel from '@/components/ZegoCallPanel'

export default function ConsultationRoomPage() {
  const params = useParams<{ id: string }>()
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = storedUser ? JSON.parse(storedUser) : null

  const currentUser = useMemo(() => ({
    id: user?._id || user?.id || '',
    name: user?.name || 'User',
  }), [user])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ZegoCallPanel consultationId={params.id} currentUser={currentUser} />
      </main>
    </div>
  )
}
