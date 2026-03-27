'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { MapPin, Navigation2, Phone, Globe, CheckCircle, Clock, AlertCircle } from 'lucide-react'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted animate-pulse rounded-2xl">
      <div className="text-center space-y-2">
        <MapPin className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading Map...</p>
      </div>
    </div>
  )
})

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [nearestCenters, setNearestCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<any>(null)

  const getCurrentLocation = async () => {
    setLoading(true)
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      }) as GeolocationPosition

      const { latitude, longitude } = position.coords
      setUserLocation({ lat: latitude, lon: longitude })

      // Fetch real nearby centers
      const res = await fetch(`/api/hospitals/nearby?lat=${latitude}&lng=${longitude}`)
      if (!res.ok) throw new Error('Failed to fetch nearby centers')
      const data = await res.json()
      setNearestCenters(data)
    } catch (err) {
      console.error('Location error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-2">Find Health Centers</h1>
        <p className="text-muted-foreground mb-8">Locate nearby hospitals and health centers</p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="md:col-span-2">
            <div className="h-[500px] w-full">
              {userLocation ? (
                <div className="h-full w-full relative group">
                  <MapComponent
                    centers={nearestCenters}
                    userLocation={[userLocation.lat, userLocation.lon]}
                  />
                  <div className="absolute top-4 right-4 z-[1000]">
                    <Button onClick={getCurrentLocation} variant="secondary" size="sm" className="gap-2 shadow-lg glass">
                      <Navigation2 className="w-4 h-4" />
                      Refresh Location
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="h-full w-full flex items-center justify-center bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl border-dashed border-2 border-border/50">
                  <div className="text-center space-y-4 p-8">
                    <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto">
                      <MapPin className="w-12 h-12 text-primary animate-bounce-slow" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Enable Location</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Allow location access to discover health centers and medical facilities near you.
                      </p>
                    </div>
                    <Button onClick={getCurrentLocation} disabled={loading} className="bg-primary hover:bg-primary/90 gap-2 px-8">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Locating...
                        </>
                      ) : (
                        <>
                          <Navigation2 className="w-4 h-4" />
                          Find Nearby Centers
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Filters */}
          <div>
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-3">
                {['All Types', 'Hospital', 'UHC'].map((filter) => (
                  <label key={filter} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">{filter}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-semibold mb-3">Radius</h4>
                <input type="range" min="1" max="20" defaultValue="5" className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">5 km</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Nearby Centers */}
        {nearestCenters.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Nearby Health Centers</h2>
            <div className="grid gap-4">
              {nearestCenters.map((center) => (
                <Card
                  key={center.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedCenter?.id === center.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCenter(center)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{center.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          center.status === 'approved'
                            ? 'bg-accent/20 text-accent flex items-center gap-1'
                            : 'bg-yellow-500/20 text-yellow-600 flex items-center gap-1'
                        }`}>
                          {center.status === 'approved' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{center.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{center.distance}</p>
                      <p className="text-xs text-muted-foreground">km away</p>
                    </div>
                  </div>

                  {selectedCenter?.id === center.id && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-primary" />
                        <a href={`tel:${center.phone}`} className="text-primary hover:underline">
                          {center.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-primary" />
                        <a href={`https://${center.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {center.website}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-primary hover:bg-primary/90 gap-2 text-xs">
                          <Navigation2 className="w-3 h-3" />
                          Get Directions
                        </Button>
                        <Button variant="outline" className="flex-1 text-xs">
                          Contact
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
