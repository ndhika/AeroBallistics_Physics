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

useEffect(() => {
    setTimeout(() => resetSimulation(), 100);
    // eslint-disable-next-line
}, []);

const [showSetup, setShowSetup] = useState(true);
const [showData, setShowData] = useState(false); 

// Sanitasi params agar physics engine tidak menerima string kosong
const sanitizeParams = (p) => {
    const clean = { ...p };
    ['x0', 'y0', 'v0', 'ang', 'm', 'k', 'g'].forEach(k => {
        if (clean[k] === '') clean[k] = 0;
    });
    return clean;
};

const handleParamChange = useCallback((newParams) => {
    setUiParams(newParams);
    if(!liveData.isRunning && physics.current) {
        updatePhysicsParams(sanitizeParams(newParams));
        draw();
    }
}, [liveData.isRunning, draw, updatePhysicsParams, physics]);

const handleAngleChange = useCallback((newAngle) => {
    setUiParams(prev => ({ ...prev, ang: parseFloat(newAngle.toFixed(1)) }));
}, []);

const handleShoot = useCallback(() => {
    if(!liveData.isRunning) {
        startSimulation(sanitizeParams(uiParams));
    }
}, [liveData.isRunning, uiParams, startSimulation]);

const handleReset = () => {
    resetSimulation();
    setUiParams(prev => ({ ...prev, ang: 45 }));
};

return (
    <div className="fixed inset-0 w-full h-full bg-slate-100 overflow-hidden font-sans text-slate-800">
    <div className="fixed inset-0 z-9999 bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center landscape:hidden">
        <h2 className="text-xl font-bold mb-2">Putar Layar 🔄</h2>
        <p className="text-slate-400 text-xs">Gunakan mode Landscape.</p>
    </div>
        <div className="hidden landscape:block w-full h-full relative">
            <header className="absolute top-2 left-2 right-2 h-10 z-40 flex justify-between items-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/40 pointer-events-auto flex items-center gap-2">
                    <span className="text-sm">🚀</span>
                    <h1 className="font-bold text-slate-700 text-xs tracking-wide">
                        Aero<span className="text-blue-600">Ballistics by Dhika</span>
                    </h1>
                </div>
                
                <div className="flex gap-2 pointer-events-auto">
                    <button 
                        onClick={() => setShowSetup(!showSetup)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm border
                        ${showSetup ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/90 text-slate-600 hover:bg-white'}`}
                    >
                        ⚙️ Setup
                    </button>
                    <button 
                        onClick={() => setShowData(!showData)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm border
                        ${showData ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/90 text-slate-600 hover:bg-white'}`}
                    >
                        📊 Data
                    </button>
                </div>
            </header>

            {/* CANVAS */}
            <div className="absolute inset-0 z-0 bg-slate-200">
                <Canvas 
                    canvasRef={canvasRef} physics={physics} draw={draw} interactions={interactions}
                    onAngleChange={handleAngleChange} onShoot={handleShoot}             
                />
                <button 
                    onClick={handleShoot}
                    className={`absolute bottom-4 left-4 z-10 w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-xl border-2 border-white transition-all hover:scale-110 active:scale-95
                    ${liveData.isRunning ? 'bg-slate-400 cursor-not-allowed' : 'bg-linear-to-tr from-blue-500 to-indigo-600 text-white animate-bounce-slow'}`}
                >🚀</button>
            </div>

            <div className={`
                absolute top-14 left-2 z-50 
                w-[220px] md:w-[300px] max-w-[45%] h-fit max-h-[85vh]
                transition-all duration-300 ease-out origin-top-left
                ${showSetup ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}
            `}>
                <InputPanel 
                    params={uiParams} onStart={handleShoot} onReset={handleReset} 
                    isRunning={liveData.isRunning} onParamChange={handleParamChange}
                    onClose={() => setShowSetup(false)}
                />
            </div>

            <div className={`
                absolute top-14 right-2 z-50 
                w-[220px] md:w-[300px] max-w-[45%] h-fit max-h-[85vh]
                transition-all duration-300 ease-out origin-top-right
                ${showData ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}
            `}>
                <OutputPanel 
                    liveData={liveData} historyData={history} activeParams={uiParams}
                    onClose={() => setShowData(false)}
                />
            </div>
        </div>
    </div>
    );
}

export default App;