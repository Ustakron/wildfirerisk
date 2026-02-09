'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Flame, Info } from 'lucide-react';

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

type ErrorState = 'empty' | 'fetch' | null;

export default function Home() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);

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

        if (!Array.isArray(data.data) || data.data.length === 0) {
          setError('empty');
          setHotspots([]);
        } else {
          setHotspots(data.data);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        setError('fetch');
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

  const errorContent =
    error === 'empty'
      ? {
          title: 'ยังไม่พบจุดความร้อนในประเทศไทย',
          message: 'ข้อมูล 24 ชั่วโมงล่าสุดจาก NASA FIRMS ยังไม่พบจุดความร้อนในพื้นที่ประเทศไทย',
        }
      : error === 'fetch'
        ? {
            title: 'เชื่อมต่อข้อมูลไม่สำเร็จ',
            message: 'ระบบไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
          }
        : null;

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden font-kanit">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <Map hotspots={hotspots} />
      </div>

      {/* Cyberpunk UI Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 pointer-events-none p-4 md:p-6 flex flex-col h-full justify-between">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start pointer-events-auto gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 text-white shadow-2xl max-w-md w-full md:w-auto transform transition-all hover:scale-[1.02]">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent flex items-center gap-3">
              <Flame className="text-red-500 fill-red-500/20 animate-pulse" size={28} />
              ระบบพยากรณ์ความเสี่ยงไฟป่า (ประเทศไทย)
            </h1>
            <p className="text-gray-300 text-sm mt-2 font-medium tracking-wide">
              แดชบอร์ดเฝ้าระวังไฟป่าและจุดความร้อนแบบเรียลไทม์
            </p>
            <div className="flex gap-4 mt-4 text-[10px] text-gray-400 font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                ติดตามสถานการณ์สด
              </div>
              <div className="flex items-center gap-1"><Info size={12} /> ข้อมูล: NASA FIRMS (VIIRS 24 ชม.)</div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40 text-white shadow-2xl pointer-events-auto flex items-center gap-4">
            <div className="text-center">
              <span className="block text-3xl font-bold text-red-500 tabular-nums leading-none">
                {loading ? '...' : hotspots.length.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">
                จุดความร้อน 24 ชม. ล่าสุด
              </span>
            </div>
          </div>
        </header>

        {/* Alerts / Error Banner */}
        {errorContent && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-full max-w-lg pointer-events-auto px-4">
            <div className="bg-red-950/90 border border-red-500 text-white p-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-4 banner-in backdrop-blur-md">
              <AlertTriangle className="text-red-500 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-red-100 mb-1">{errorContent.title}</h3>
                <p className="text-sm text-red-300/80">{errorContent.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Legend */}
        <footer className="pointer-events-auto w-full flex justify-between items-end">
          <div className="hidden md:block">
            <div className="glass-panel p-3 px-5 rounded-xl border border-white/10 backdrop-blur-md bg-black/40 text-[10px] text-gray-400 flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                <span>วงกลมใหญ่ = ความร้อนสูง</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/70"></div>
                <span>วงกลมเล็ก = ความร้อนปานกลาง</span>
              </div>
            </div>
          </div>
          <div className="glass-panel p-2 px-4 rounded-full border border-white/5 backdrop-blur-sm bg-black/60 text-gray-500 text-[10px] font-mono tracking-tighter">
            ศูนย์กลางแผนที่ประเทศไทย: 13.7563N | 100.5018E
          </div>
        </footer>
      </div>
    </main>
  );
}
