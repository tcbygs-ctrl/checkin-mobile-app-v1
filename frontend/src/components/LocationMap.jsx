import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon path broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], map.getZoom()); }, [lat, lng]);
  return null;
}

/**
 * LocationMap
 * @param {number} userLat - current user latitude
 * @param {number} userLng - current user longitude
 * @param {Array}  locations - checkin_locations from API
 * @param {boolean} isInZone - whether user is in an allowed zone
 */
export default function LocationMap({ userLat, userLng, locations = [], isInZone = false }) {
  const center = userLat && userLng ? [userLat, userLng] : [13.7563, 100.5018];

  const userIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:${isInZone ? '#16a34a' : '#2563eb'};
      border:3px solid #fff;
      box-shadow:0 0 0 3px ${isInZone ? '#16a34a55' : '#2563eb55'};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <div>
      {/* Status bar */}
      <div style={{
        padding: '10px 14px', borderRadius: '8px 8px 0 0',
        background: isInZone ? '#dcfce7' : '#fee2e2',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600,
        color: isInZone ? 'var(--success)' : 'var(--danger)',
      }}>
        {isInZone
          ? <><CheckCircle size={16} /> ตำแหน่งรองรับการเข้า-ออกงาน</>
          : <><XCircle size={16} /> ตำแหน่งปัจจุบันไม่อยู่ในพื้นที่ที่กำหนด</>
        }
      </div>

      <MapContainer
        center={center}
        zoom={15}
        style={{ height: 280, width: '100%', borderRadius: '0 0 8px 8px' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <RecenterMap lat={userLat} lng={userLng} />

        {/* Check-in zones */}
        {locations.map((loc) => (
          <Circle
            key={loc.id}
            center={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
            radius={loc.radius_meters}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.12, weight: 2 }}
          >
            <Popup>
              <strong>{loc.name}</strong><br />
              รัศมี {loc.radius_meters} ม.
            </Popup>
          </Circle>
        ))}

        {/* Zone center markers */}
        {locations.map((loc) => (
          <Marker key={`m-${loc.id}`} position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}>
            <Popup><strong>{loc.name}</strong><br />{loc.description}</Popup>
          </Marker>
        ))}

        {/* User position */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup>ตำแหน่งของคุณ</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
