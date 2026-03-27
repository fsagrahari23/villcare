'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Props = {
  consultationId: string
  currentUser: {
    id: string
    name: string
  }
}

export default function ZegoCallPanel({ consultationId, currentUser }: Props) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const engineRef = useRef<any>(null)
  const localStreamRef = useRef<any>(null)

  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<any>(null)
  const [mode, setMode] = useState<'video' | 'voice'>('video')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const query = currentUser.id ? `?userId=${currentUser.id}` : ''
        const res = await fetch(`/api/consultations/${consultationId}${query}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load consultation')
        setConfig(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load consultation')
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => {
      void leaveRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId])

  const leaveRoom = async () => {
    const zg = engineRef.current
    const localStream = localStreamRef.current

    if (zg && config?.consultation?.roomID) {
      try {
        zg.stopPublishingStream?.(config.consultation.roomID)
      } catch {}
      try {
        zg.logoutRoom?.(config.consultation.roomID)
      } catch {}
      try {
        if (localStream) {
          zg.destroyStream?.(localStream)
        }
      } catch {}
      try {
        zg.destroyEngine?.()
      } catch {}
    }

    engineRef.current = null
    localStreamRef.current = null
  }

  const joinRoom = async (callMode: 'video' | 'voice') => {
    if (!config?.zego?.enabled) {
      setError('ZEGOCLOUD configuration is missing. Set ZEGOCLOUD_APP_ID and server settings first.')
      return
    }

    try {
      setJoining(true)
      setError('')
      setMode(callMode)

      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc')
      const zg = new ZegoExpressEngine(config.zego.appID, config.zego.server)
      engineRef.current = zg

      const roomID = config.consultation.roomID
      const token = config.zego.token || ''
      const userID = config.zego.userID || currentUser.id
      const userName = currentUser.name
      const streamID = `${roomID}_${userID}`

      zg.on?.('roomStreamUpdate', async (_roomID: string, updateType: string, streamList: any[]) => {
        if (updateType !== 'ADD') return

        for (const stream of streamList) {
          if (stream.streamID === streamID) continue
          const remoteStream = await zg.startPlayingStream(stream.streamID)
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
            void remoteVideoRef.current.play().catch(() => {})
          }
        }
      })

      await zg.loginRoom(roomID, token, { userID, userName }, { userUpdate: true })

      const source = {
        camera: {
          audio: true,
          video: callMode === 'video',
        },
      }

      const localStream = await zg.createStream(source as any)
      localStreamRef.current = localStream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
        localVideoRef.current.muted = true
        void localVideoRef.current.play().catch(() => {})
      }

      zg.startPublishingStream(streamID, localStream)
      await fetch(`/api/consultations/${consultationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to join room')
    } finally {
      setJoining(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold">Live Consultation</h3>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading call configuration...</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Local</p>
              <video ref={localVideoRef} autoPlay playsInline muted className="h-48 w-full rounded-2xl bg-black object-cover" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Remote</p>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-48 w-full rounded-2xl bg-black object-cover" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => joinRoom('video')} disabled={joining}>
              {joining && mode === 'video' ? 'Joining...' : 'Join Video Call'}
            </Button>
            <Button variant="outline" onClick={() => joinRoom('voice')} disabled={joining}>
              {joining && mode === 'voice' ? 'Joining...' : 'Join Voice Call'}
            </Button>
            <Button variant="destructive" onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>

          {config?.consultation && (
            <p className="text-sm text-muted-foreground">
              Room ID: <span className="font-mono">{config.consultation.roomID}</span>
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </Card>
  )
}
