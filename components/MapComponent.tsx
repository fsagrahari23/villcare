'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ✅ Fix marker icon issue (IMPORTANT)
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

export default function MapComponent({ centers, userLocation }: any) {
  return (
    <MapContainer
      center={userLocation}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ✅ USER LOCATION */}
      <Marker position={userLocation}>
        <Popup>You are here</Popup>
      </Marker>

      {/* ✅ HEALTH CENTERS */}
      {centers.map((center: any) => {
        if (!center.coordinate || center.coordinate.length !== 2) return null

        const [lat, lng] = center.coordinate

        console.log("Marker:", center.name, lat, lng)

        return (
          <Marker key={center.id} position={[lat, lng]}>
            <Popup>
              <div>
                <h3 className="font-bold">{center.name}</h3>
                <p>{center.address}</p>
                <p>{center.distance}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}