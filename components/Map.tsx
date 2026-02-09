'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix Leaflet's default icon path issues in Next.js
import L from 'leaflet';

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
      
      {hotspots.map((spot) => (
        <CircleMarker
          key={spot.id}
          center={[spot.lat, spot.lon]}
          pathOptions={{ 
            color: '#ef4444', // red-500
            fillColor: '#ef4444', 
            fillOpacity: 0.7,
            weight: 0 // no border
          }}
          radius={Math.max(3, spot.brightness / 100)} // Scale radius by brightness slightly
        >
          <Popup className="glass-popup">
            <div className="p-2 min-w-[150px]">
              <h3 className="font-bold text-red-500 mb-1">🔥 Hotspot Detected</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p><strong>Lat:</strong> {spot.lat.toFixed(4)}</p>
                <p><strong>Lon:</strong> {spot.lon.toFixed(4)}</p>
                <p><strong>Brightness:</strong> {spot.brightness}</p>
                <p><strong>Confidence:</strong> {spot.confidence}%</p>
                <p><strong>Time:</strong> {spot.acq_date} {spot.acq_time}</p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default Map;
