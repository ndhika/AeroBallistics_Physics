import React from 'react';

export default function OutputPanel({ liveData, historyData, activeParams, onClose }) {
    return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 overflow-hidden flex flex-col ring-1 ring-black/5 w-full max-h-[calc(70vh-50px)">            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100/50 bg-linear-to-b from-white to-gray-50/50">
                <h3 className="text-slate-700 font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                    📊 Data
                </h3>
                <button onClick={onClose} className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-[9px]">✕</button>
            </div>

            <div className="p-2 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                    <h4 className="text-[9px] font-extrabold text-red-500 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span></span>
                        Aktif
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <Badge label="Posisi" val={`${activeParams?.x0},${activeParams?.y0}`} />
                        <Badge label="Velo" val={activeParams?.v0} />
                        <Badge label="Sudut" val={activeParams?.ang} />
                        <Badge label="Massa" val={activeParams?.m} />
                        <Badge label="Drag" val={activeParams?.dragOn ? activeParams?.k : 'Off'} />
                        <Badge label="Grav" val={activeParams?.g} />
                    </div>

                    <div className="space-y-1.5">
                        <ResultRow label="Waktu" value={liveData.t.toFixed(2)} unit="s" color="red" />
                        <ResultRow label="Jarak" value={Math.abs(liveData.x - (activeParams?.x0||0)).toFixed(2)} unit="m" color="red" />
                        <ResultRow label="Tinggi" value={liveData.hMax.toFixed(2)} unit="m" color="red" />
                    </div>
                </div>
                <div className="border-t border-dashed border-slate-200"></div>
                {/* HISTORY */}
                <div className={`transition-all duration-300 ${liveData.isRunning ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                    <h4 className="text-[9px] font-extrabold text-blue-500 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Last
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
                            </div>
                            <div className="space-y-1.5">
                                <ResultRow label="Waktu" value={historyData.t} unit="s" color="blue" />
                                <ResultRow label="Jarak" value={historyData.dist} unit="m" color="blue" />
                                <ResultRow label="Tinggi" value={historyData.height} unit="m" color="blue" />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4 text-[9px] text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">No Data</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({ label, val }) {
    return (
        <div className="bg-slate-50 px-1.5 py-1 rounded border border-slate-100 flex flex-col justify-center min-w-0">
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide truncate">{label}</span>
            <span className="text-[10px] font-bold text-slate-700 truncate">{val}</span>
        </div>
    );
}

function ResultRow({ label, value, unit, color }) {
    const isRed = color === 'red';
    return (
        <div className={`flex justify-between items-center px-2 py-1.5 rounded-lg border-l-2 shadow-sm bg-white ${isRed ? 'border-red-500' : 'border-blue-500'}`}>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
            <div className="flex items-baseline gap-0.5">
                <span className={`text-sm font-mono font-bold ${isRed ? 'text-red-600' : 'text-blue-600'}`}>{value}</span>
                <span className="text-[8px] text-slate-400 font-bold">{unit}</span>
            </div>
        </div>
    );
}