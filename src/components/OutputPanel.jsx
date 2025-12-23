export default function OutputPanel({ liveData, historyData, activeParams, onClose }) {
    const slopeDeg = activeParams?.slope || 0;
    const slopeRad = slopeDeg * Math.PI / 180;
    
    const x0 = activeParams?.x0 || 0;
    const y0 = activeParams?.y0 || 0;
    
    // Current values
    const currentX = liveData.x || 0;
    const currentY = liveData.y || 0;
    
    const dx = currentX - x0;
    const dy = currentY - y0;
    const currentSlant = Math.sqrt(dx * dx + dy * dy);
    
    // Ground elevation at current X
    const groundY = currentX * Math.tan(slopeRad);
    const heightAboveGround = (currentY - groundY) * Math.cos(slopeRad);
    

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 overflow-hidden flex flex-col ring-1 ring-black/5 w-full max-h-[calc(70vh-60px)]">            
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100/50 bg-linear-to-b from-white to-gray-50/50">
                <h3 className="text-slate-700 font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                    📊 Data
                </h3>
                <button onClick={onClose} className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-[9px]">✕</button>
            </div>
            
            <div className="p-2 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                    <h4 className="text-[9px] font-extrabold text-red-500 uppercase mb-2 tracking-widest flex items-center gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                            {liveData.isRunning && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            )}
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        {liveData.isRunning ? 'Running' : 'Current'}
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <Badge label="Posisi" val={`${activeParams?.x0},${activeParams?.y0}`} />
                        <Badge label="Velo" val={activeParams?.v0} />
                        <Badge label="Sudut" val={activeParams?.ang} />
                        <Badge label="Massa" val={activeParams?.m} />
                        <Badge label="Drag" val={activeParams?.dragOn ? activeParams?.k : 'Off'} />
                        <Badge label="Grav" val={activeParams?.g} />
                        <Badge label="Elevasi" val={(activeParams?.slope || 0) + '°'} />
                    </div>
                    <div className="space-y-1">
                        <ResultRow label="⏱ Waktu Terbang" value={liveData.t.toFixed(2)} unit="s" color="red" />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <ResultRow 
                                label="📏 Jarak Datar (X)" 
                                value={currentX.toFixed(2)} 
                                unit="m" 
                                color="red" 
                            />
                            <ResultRow 
                                label="📐 Jarak Miring (R)" 
                                value={currentSlant.toFixed(2)} 
                                unit="m" 
                                color="red" 
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <ResultRow 
                                label="⛰ Puncak Max (Y)" 
                                value={liveData.hMax.toFixed(2)} 
                                unit="m" 
                                color="red" 
                                smallLabel 
                            />
                            <ResultRow 
                                label="🎯 Tinggi Akhir" 
                                value={currentY.toFixed(2)} 
                                unit="m" 
                                color="red" 
                                smallLabel 
                            />                        
                        </div>
                        {slopeDeg !== 0 && liveData.isRunning && heightAboveGround > 0.5 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                <div className="text-[8px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                                    ⚠️ TERRAIN INFO
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px]">
                                    <div>
                                        <span className="text-amber-600 font-semibold">Elevasi Tanah:</span>
                                        <span className="ml-1 font-mono font-bold text-amber-800">
                                            {groundY.toFixed(2)}m
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-amber-600 font-semibold">Tinggi ⊥ Tanah:</span>
                                        <span className="ml-1 font-mono font-bold text-amber-800">
                                            {heightAboveGround.toFixed(2)}m
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="border-t border-dashed border-slate-200"></div>
                
                <div className={`transition-all duration-300 ${liveData.isRunning ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                    <h4 className="text-[9px] font-extrabold text-blue-500 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Last Run
                    </h4>
                    
                    {historyData ? (
                        <>
                            <div className="grid grid-cols-2 gap-1.5 mb-2">
                                <Badge label="Posisi" val={`${historyData.params.x0},${historyData.params.y0}`} />
                                <Badge label="Velo" val={historyData.params.v0} />
                                <Badge label="Sudut" val={historyData.params.ang} />
                                <Badge label="Massa" val={historyData.params.m} />
                                <Badge label="Drag" val={historyData.params.dragOn ? historyData.params.k : 'Off'} />
                                <Badge label="Grav" val={historyData.params.g} />
                                <Badge label="Elevasi" val={(historyData.params.slope || 0) + '°'} />
                            </div>
                            <div className="space-y-1">
                                <ResultRow 
                                    label="⏱ Waktu Terbang" 
                                    value={historyData.t} 
                                    unit="s" 
                                    color="blue" 
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <ResultRow 
                                        label="📏 Jarak Datar (X)" 
                                        value={historyData.dist} 
                                        unit="m" 
                                        color="blue" 
                                    />
                                    <ResultRow 
                                        label="📐 Jarak Miring (R)" 
                                        value={historyData.slant || '-'} 
                                        unit="m" 
                                        color="blue" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <ResultRow 
                                        label="⛰ Tinggi ⊥ Max" 
                                        value={historyData.height} 
                                        unit="m" 
                                        color="blue" 
                                    />
                                    <ResultRow 
                                        label="🎯 Tinggi Akhir" 
                                        value={historyData.impactY || '-'} 
                                        unit="m" 
                                        color="blue" 
                                    />
                                </div>
                                {!liveData.isRunning && (
                                    <ComparisonInfo liveData={liveData} historyData={historyData} />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4 text-[9px] text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                            Tidak ada data sebelumnya
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ComparisonInfo({ liveData, historyData }) {
    const histDist = typeof historyData.dist === 'string' ? parseFloat(historyData.dist) : historyData.dist;
    const histT = typeof historyData.t === 'string' ? parseFloat(historyData.t) : historyData.t;
    const histHeight = typeof historyData.height === 'string' ? parseFloat(historyData.height) : historyData.height;
    
    const xDiff = Math.abs(liveData.x - histDist);
    const tDiff = Math.abs(liveData.t - histT);
    const hDiff = Math.abs(liveData.hMax - histHeight);
    
    const showComparison = xDiff > 0.5 || tDiff > 0.1 || hDiff > 0.5;
    
    if (!showComparison) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                <div className="text-[8px] font-bold text-green-700 flex items-center gap-1">
                    ✅ Data sama dengan run sebelumnya
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
            <div className="text-[8px] font-bold text-blue-700 mb-1">📊 Perbandingan</div>
            <div className="space-y-0.5 text-[8px]">
                {xDiff > 0.5 && (
                    <div className="flex justify-between">
                        <span className="text-blue-600">Δ Jarak:</span>
                        <span className="font-mono font-bold text-blue-800">{xDiff.toFixed(2)}m</span>
                    </div>
                )}
                {tDiff > 0.1 && (
                    <div className="flex justify-between">
                        <span className="text-blue-600">Δ Waktu:</span>
                        <span className="font-mono font-bold text-blue-800">{tDiff.toFixed(2)}s</span>
                    </div>
                )}
                {hDiff > 0.5 && (
                    <div className="flex justify-between">
                        <span className="text-blue-600">Δ Tinggi ⊥:</span>
                        <span className="font-mono font-bold text-blue-800">{hDiff.toFixed(2)}m</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ label, val }) {
    return (
        <div className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100 flex flex-col justify-center min-w-0">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide truncate">
                {label}
            </span>
            <span className="text-[10px] font-bold text-slate-700 truncate">
                {val}
            </span>
        </div>
    );
}

function ResultRow({ label, value, unit, color, smallLabel, precision = 2 }) {
    const isRed = color === 'red';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const displayValue = isNaN(numValue) ? value : numValue.toFixed(precision);
    
    return (
        <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border-l-2 shadow-sm bg-white ${
            isRed ? 'border-red-500' : 'border-blue-500'
        }`}>
            <span className={`font-bold text-slate-500 uppercase tracking-wide ${
                smallLabel ? 'text-[7px]' : 'text-[8px]'
            }`}>
                {label}
            </span>
            <div className="flex items-baseline gap-0.5">
                <span className={`text-sm font-mono font-bold ${
                    isRed ? 'text-red-600' : 'text-blue-600'
                }`}>
                    {displayValue}
                </span>
                <span className="text-[8px] text-slate-400 font-bold">{unit}</span>
            </div>
        </div>
    );
}