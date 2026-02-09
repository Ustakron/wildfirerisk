'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Flame } from 'lucide-react';

// Define the Hotspot interface
interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  brightness: number;
  confidence: string;
  acq_date?: string;
  acq_time?: string;
}

interface MapProps {
  hotspots: Hotspot[];
}

const formatConfidence = (value: string) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'ไม่ระบุ';
  }

  if (['h', 'high'].includes(normalized)) {
    return 'สูง';
  }
  if (['n', 'nominal', 'medium'].includes(normalized)) {
    return 'ปานกลาง';
  }
  if (['l', 'low'].includes(normalized)) {
    return 'ต่ำ';
  }

  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) {
    return `${numeric}%`;
  }

  return value;
};

const formatAcqTime = (value?: string) => {
  if (!value) {
    return 'ไม่ระบุเวลา';
  }

  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return 'ไม่ระบุเวลา';
  }

  const padded = digits.padStart(4, '0').slice(-4);
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
};

const Map = ({ hotspots }: MapProps) => {
  // Center on Thailand
  const position: [number, number] = [13.7563, 100.5018];

  return (
    <MapContainer
      center={position}
      zoom={6}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {hotspots.map((spot) => {
        const brightness = Number.isFinite(spot.brightness) ? spot.brightness : 0;
        const isHigh = brightness >= 330;
        const radius = isHigh ? 9 : 6;
        const pulseClass = isHigh ? 'hotspot-pulse hotspot-pulse--strong' : 'hotspot-pulse';

        return (
          <CircleMarker
            key={spot.id}
            center={[spot.lat, spot.lon]}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: isHigh ? 0.75 : 0.6,
              weight: isHigh ? 2 : 1,
              className: pulseClass,
            }}
            radius={radius}
          >
          <Popup className="glass-popup">
            <div className="p-2 min-w-[180px] font-kanit">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-red-500">
                <Flame size={16} />
                {isHigh ? 'ตรวจพบจุดความร้อนรุนแรง' : 'ตรวจพบจุดความร้อน'}
              </h3>
              <div className="text-xs text-gray-300 space-y-2 border-t border-white/10 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">พิกัด (ละติจูด, ลองจิจูด):</span>
                  <span className="font-mono text-white">{spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ค่าความสว่าง (BT):</span>
                  <span className="font-bold text-yellow-500">{brightness.toFixed(1)} K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ระดับความเชื่อมั่น:</span>
                  <span className="text-white">{formatConfidence(spot.confidence)}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-2 text-gray-400">
                  <span>วันที่ตรวจพบ:</span>
                  <span>{spot.acq_date ?? 'ไม่ระบุวันที่'} {formatAcqTime(spot.acq_time)}</span>
                </div>
              </div>
            </div>
          </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
};

export default Map;
