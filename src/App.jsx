import React, { useState, useCallback, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import Canvas from './components/Canvas';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const { 
    canvasRef, liveData, history, startSimulation, resetSimulation, draw, physics, 
    updatePhysicsParams, interactions 
  } = useSimulation();
  
  const [uiParams, setUiParams] = useState({
      x0: 0, y0: 0, v0: 50, ang: 45, m: 1.0, k: 0, g: 9.8, dragOn: false, gravityPreset: "9.8"
  });
  // State untuk Buka/Tutup Sidebar (Default: Terbuka di Desktop, Tertutup di HP)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  // State khusus Mobile Pop-up Stats
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  // Auto Reset view saat pertama kali load agar meriam di tengah
  useEffect(() => {
      // Delay sedikit biar canvas siap
      setTimeout(() => resetSimulation(), 100);
      // eslint-disable-next-line
  }, []);
  const handleParamChange = useCallback((newParams) => {
      setUiParams(newParams);
      if(!liveData.isRunning && physics.current) {
          updatePhysicsParams(newParams);
          draw();
      }
  }, [liveData.isRunning, draw, updatePhysicsParams, physics]);
  const handleAngleChange = useCallback((newAngle) => {
      setUiParams(prev => ({ ...prev, ang: parseFloat(newAngle.toFixed(1)) }));
  }, []);
  const handleShoot = useCallback(() => {
      if(!liveData.isRunning) {
          startSimulation(uiParams);
          // Opsional: Tutup panel otomatis saat nembak di HP biar lega
          if (window.innerWidth < 768) setIsLeftPanelOpen(false);
      }
  }, [liveData.isRunning, uiParams, startSimulation]);
  const handleReset = () => {
      resetSimulation();
      setUiParams(prev => ({ ...prev, ang: 45 }));
  };
  return (
    <div className="h-dvh w-full bg-slate-100 flex flex-col overflow-hidden relative font-sans text-slate-800">
      
      {/* ================= CANVAS (LAYER PALING BAWAH / BACKGROUND) ================= */}
      <div className="absolute inset-0 z-0">
        <Canvas 
            canvasRef={canvasRef} 
            physics={physics} 
            draw={draw} 
            interactions={interactions}
            onAngleChange={handleAngleChange} 
            onShoot={handleShoot}             
        />
      </div>
      {/* ================= HEADER (TRANSPARAN / MELAYANG) ================= */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 py-3 pointer-events-none flex justify-between items-start">
        
        {/* Judul & Versi */}
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 pointer-events-auto flex gap-3 items-center">
            <h1 className="font-extrabold text-blue-700 text-sm md:text-base">🚀 AeroBallistics</h1>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">v3.0</span>
        </div>
         {/* Tombol Buka Stats (Mobile Only) */}
        <button 
            onClick={() => setIsStatsOpen(true)}
            className="lg:hidden pointer-events-auto bg-white/90 backdrop-blur shadow-sm border border-slate-200 px-3 py-2 rounded-full text-xs font-bold text-slate-600"
        >
            📊 Data
        </button>
      </header>
      {/* ================= PANEL KIRI (POP-UP / DRAWER) ================= */}
      <div className={`absolute top-20 left-4 bottom-4 w-[320px] z-20 transition-transform duration-300 ease-in-out flex flex-col pointer-events-none ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-[340px]'}`}>
          
          {/* Container Panel (Isi) */}
          <div className="flex-1 bg-white/90 backdrop-blur-lg border border-white/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                    <h3 className="font-bold text-slate-700 text-sm">🎛️ Kontrol Panel</h3>
                    {/* Tombol Close Kecil */}
                    <button onClick={() => setIsLeftPanelOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
                </div>
                
                <div className="flex-1 overflow-z-hidden p-1 custom-scrollbar">
                    <InputPanel 
                        params={uiParams} 
                        onStart={handleShoot} 
                        onReset={handleReset} 
                        isRunning={liveData.isRunning}
                        onParamChange={handleParamChange}
                    />
                </div>
          </div>
          {/* Tombol Toggle (Gagang Laci) - Muncul saat Panel TERTUTUP */}
          {!isLeftPanelOpen && (
              <button 
                onClick={() => setIsLeftPanelOpen(true)}
                className="pointer-events-auto absolute top-0 -right-12 bg-white/90 backdrop-blur text-slate-700 p-3 rounded-r-xl shadow-md border-y border-r border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
                title="Buka Panel Parameter"
              >
                  ⚙️
              </button>
          )}
      </div>
      {/* ================= PANEL KANAN (STATS) - DESKTOP ONLY ================= */}
      {/* Di desktop dia melayang di kanan. Di mobile dia hilang (diganti pop-up stats bawah) */}
      <div className="hidden lg:block absolute top-20 right-4 w-[280px] z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl overflow-hidden pointer-events-auto max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                <OutputPanel liveData={liveData} historyData={history} activeParams={uiParams}/>
          </div>
      </div>


      {/* ================= POP-UP STATS (MOBILE ONLY) ================= */}
      {/* Side sheet dari kanan untuk HP */}
      <div className={`lg:hidden fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isStatsOpen ? 'visible' : 'invisible'}`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${isStatsOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsStatsOpen(false)} />
          <div className={`relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl p-4 overflow-y-auto transition-transform duration-300 ease-out ${isStatsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <button onClick={() => setIsStatsOpen(false)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-500">✕</button>
              <h3 className="font-bold text-lg text-slate-800 mb-6 mt-2">Data Simulasi</h3>
              <OutputPanel liveData={liveData} historyData={history} activeParams={uiParams}/>
          </div>
      </div>

    </div>
  );
}

export default App;