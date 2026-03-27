'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

interface Center {
  id: string | number
  name: string
  lat: number
  lon: number
  type: string
}

interface MapComponentProps {
  centers: Center[]
  userLocation?: [number, number]
}

export default function MapComponent({ centers, userLocation = [28.6139, 77.2090] }: MapComponentProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-border bg-muted/30">
      <MapContainer
        center={userLocation}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView center={userLocation} zoom={13} />

        {/* User Location Marker */}
        <Marker position={userLocation}>
          <Popup>
            <div className="font-semibold">Your Location</div>
          </Popup>
        </Marker>

        {/* Health Center Markers */}
        {centers.map((center) => (
          <Marker
            key={center.id}
            position={[center.lat, center.lon]}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-primary">{center.name}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{center.type}</div>
                <button className="mt-2 w-full text-xs bg-primary text-primary-foreground py-1 px-2 rounded hover:bg-primary/90 transition-colors">
                  Get Directions
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
