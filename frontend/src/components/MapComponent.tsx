'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { stationAPI } from '@/lib/api';
import Link from 'next/link';
import { Navigation } from 'lucide-react';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom green icon for EV stations
const evIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function FlyToLocation({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (center && !hasCentered.current) {
      map.flyTo(center, 13, { animate: true });
      hasCentered.current = true;
    }
  }, [center, map]);
  return null;
}

export default function MapComponent() {
  const [stations, setStations] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Fetch all stations from the database
    stationAPI.getAll({ limit: 500 }).then(res => {
      setStations(res.data.stations || []);
    }).catch(console.error);

    // Get user's current GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const center: [number, number] = userLoc || [20.5937, 78.9629]; // Default to India center if no location

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={userLoc ? 13 : 5} className="w-full h-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Premium looking basemap
        />
        <FlyToLocation center={userLoc} />

        {/* User Location Marker */}
        {userLoc && (
           <Marker position={userLoc}>
             <Popup>You are here</Popup>
           </Marker>
        )}

        {/* Station Markers fetched from DB */}
        {stations.map(station => {
          const lat = station.location?.coordinates?.[1];
          const lng = station.location?.coordinates?.[0];
          if (!lat || !lng) return null;

          return (
            <Marker key={station._id} position={[lat, lng]} icon={evIcon}>
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-gray-900 mb-1">{station.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{station.address?.city}, {station.address?.state}</p>
                  <div className="flex gap-2">
                    <Link href={`/stations/${station._id}`} className="flex-1 bg-[#8cc63f] text-black text-center text-xs font-bold py-2 rounded-lg hover:bg-[#74af2b] transition-colors shadow-sm">
                      View details
                    </Link>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center">
                      <Navigation size={14} />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
