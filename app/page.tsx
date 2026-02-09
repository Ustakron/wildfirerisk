'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Flame, Info, MapPin } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Hotspot {
  id: string;
  lat: number;
  lon: number;
  brightness: number;
  confidence: string;
  acq_date?: string;
  acq_time?: string;
}

export default function Home() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const res = await fetch('/api/v1/hotspots');
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.data || data.data.length === 0) {
          // Graceful handling of 0 records or initial empty state
          if (data.data && data.data.length === 0) {
            setError("No active fires detected or data source empty.");
          } else {
            setError("Failed to load data.");
          }
          setHotspots([]);
        } else {
          setHotspots(data.data);
          setError(null);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch data');
        setHotspots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotspots();
    // Refresh every 5 minutes
    const interval = setInterval(fetchHotspots, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <Map hotspots={hotspots} />
      </div>

      {/* Cyberpunk UI Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-4 md:p-6 flex flex-col h-full justify-between">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start pointer-events-auto gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 text-white shadow-2xl max-w-md w-full md:w-auto transform transition-all hover:scale-[1.02]">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3">
              <Flame className="text-red-500 fill-red-500/20 animate-pulse" size={28} />
              Wildfire Watch TH
            </h1>
            <p className="text-gray-300 text-sm mt-2 font-medium">Real-time satellite monitoring system</p>
            <div className="flex gap-4 mt-4 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                LIVE
              </div>
              <div className="flex items-center gap-1"><Info size={12} /> DATA: NASA FIRMS</div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 text-white shadow-2xl pointer-events-auto flex items-center gap-4">
            <div className="text-center">
              <span className="block text-3xl font-bold text-red-500 tabular-nums">{loading ? '...' : hotspots.length}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Active Hotspots</span>
            </div>
          </div>
        </header>

        {/* Alerts / Error Banner */}
        {error && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full max-w-lg pointer-events-auto px-4">
            <div className="bg-red-950/90 border border-red-500 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md">
              <AlertTriangle className="text-red-500 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-100 mb-1">Warning: Data Unavailable</h3>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Legend */}
        <footer className="pointer-events-auto w-full flex justify-between items-end">
          <div className="hidden md:block"></div> {/* Spacer */}
          <div className="glass-panel p-2 px-4 rounded-full border border-white/5 backdrop-blur-sm bg-black/60 text-gray-500 text-xs font-mono">
            Lat: 13.75 | Lon: 100.50 [TH]
          </div>
        </footer>
      </div>
    </main>
  );
}
