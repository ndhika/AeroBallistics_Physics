import React, { useState, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import Canvas from './components/Canvas';
import { useSimulation } from './hooks/useSimulation';

function App() {
  const { canvasRef, liveData, history, startSimulation, resetSimulation, draw, physics ,updatePhysicsParams } = useSimulation();
  
  // Kita simpan activeParams di sini agar OutputPanel bisa baca data settingan user
  // meskipun user mengubah input form saat simulasi berjalan.
  const [activeParams, setActiveParams] = useState(null);

  // Callback saat user mengetik di form, kita update visual meriam (sudut) real-time
  const handleParamChange = useCallback((newParams) => {
      // Pastikan physics.current ada & simulasi tidak jalan
      if(!liveData.isRunning && physics.current) {
          
          // GANTI BARIS ERROR KEMARIN DENGAN INI:
          updatePhysicsParams(newParams);
          
          draw();
      }
  }, [liveData.isRunning, draw, updatePhysicsParams, physics]);

  const handleStart = (params) => {
    setActiveParams(params);
    startSimulation(params);
  };

  const handleReset = () => {
    resetSimulation();
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-[#1e3c72] to-[#2a5298] p-4 font-sans text-slate-800 flex flex-col items-center">
      
      <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-4 drop-shadow-md text-center">
        Simulasi Gerak Parabola Pro (React)
      </h1>

      <div className="w-full max-w-[1600px] flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-100px)] min-h-[600px]">
        
        {/* Kolom Kiri */}
        <InputPanel 
          onStart={handleStart} 
          onReset={handleReset} 
          isRunning={liveData.isRunning}
          onParamChange={handleParamChange}
        />

        {/* Kolom Tengah (Canvas) */}
        <Canvas canvasRef={canvasRef} physics={physics} draw={draw} />

        {/* Kolom Kanan */}
        <OutputPanel 
          liveData={liveData} 
          historyData={history}
          activeParams={activeParams || physics.current?.params}
        />

      </div>
    </div>
  );
}

export default App;