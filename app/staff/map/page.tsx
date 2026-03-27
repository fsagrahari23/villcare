'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { MapPin, Filter, ZoomIn, ZoomOut, CheckCircle, Clock, X } from 'lucide-react'

export default function StaffMapPage() {
  const [centers, setCenters] = useState<any[]>([])
  const [filters, setFilters] = useState({
    approved: true,
    pending: true,
    rejected: true
  })
  const [selectedCenter, setSelectedCenter] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCenters()
  }, [])

  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/staff/centers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCenters(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCenters = centers.filter(c => {
    if (c.status === 'approved' && !filters.approved) return false
    if (c.status === 'pending' && !filters.pending) return false
    if (c.status === 'rejected' && !filters.rejected) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#00aa88'
      case 'pending': return '#ffaa00'
      case 'rejected': return '#ff4444'
      default: return '#0066cc'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved'
      case 'pending': return 'Pending'
      case 'rejected': return 'Rejected'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Health Centers Map</h1>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Map Area */}
          <div className="md:col-span-3">
            <Card className="p-4 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl h-96 relative border-border/50 flex items-center justify-center">
              <div className="text-center space-y-3">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-semibold">Map View</p>
                  <p className="text-sm text-muted-foreground">
                    📍 Showing {filteredCenters.length} health centers
                  </p>
                </div>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2 border border-border">
                {[
                  { color: '#00aa88', label: 'Approved' },
                  { color: '#ffaa00', label: 'Pending' },
                  { color: '#ff4444', label: 'Rejected' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className="absolute right-4 top-4 flex flex-col gap-1">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-3 h-3" /> },
                  { key: 'pending', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
                  { key: 'rejected', label: 'Rejected', icon: <X className="w-3 h-3" /> }
                ].map((filter) => (
                  <label key={filter.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters[filter.key as keyof typeof filters]}
                      onChange={(e) => setFilters({
                        ...filters,
                        [filter.key]: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="flex items-center gap-1 text-sm">
                      {filter.icon}
                      {filter.label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Center List */}
            <Card className="p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-3">Centers ({filteredCenters.length})</h3>
              <div className="space-y-2">
                {filteredCenters.map((center) => (
                  <div
                    key={center.id}
                    onClick={() => setSelectedCenter(center)}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      selectedCenter?.id === center.id
                        ? 'ring-2 ring-primary bg-primary/10'
                        : 'hover:bg-secondary/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getStatusColor(center.status) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{center.name}</p>
                        <p className="text-xs text-muted-foreground">{center.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Selected Center Details */}
        {selectedCenter && (
          <Card className="mt-6 p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{selectedCenter.name}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">TYPE</p>
                    <p className="font-medium">{selectedCenter.type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">STATUS</p>
                    <p className={`font-medium ${
                      selectedCenter.status === 'approved' ? 'text-accent' :
                      selectedCenter.status === 'pending' ? 'text-yellow-600' :
                      'text-destructive'
                    }`}>
                      {getStatusLabel(selectedCenter.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">COORDINATES</p>
                    <p className="font-mono text-sm">{selectedCenter.lat.toFixed(4)}, {selectedCenter.lon.toFixed(4)}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed map view would render here using Leaflet or MapBox
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button className="bg-primary hover:bg-primary/90">
                    View Details
                  </Button>
                  <Button variant="outline">
                    View Timeline
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
