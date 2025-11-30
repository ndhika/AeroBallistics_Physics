export default function OutputPanel({ liveData, historyData, activeParams }) {
    return (
        <div className="flex-none w-full md:w-[290px] bg-white/95 backdrop-blur-md p-3 me-3 rounded-xl shadow-2xl flex flex-col overflow-y-auto border border-white/20">
            {/* Bagian Merah (Aktif) */}
            <div className="mb-6">
                <h3 className="text-red-700 font-bold border-b-2 border-red-100 pb-2 mb-3 text-sm uppercase tracking-wide">
                    🔴 Percobaan Aktif
                </h3>                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <InfoItem label="Posisi" val={`${activeParams?.x0 || 0}m, ${activeParams?.y0 || 0}m`} />
                        <InfoItem label="Massa" val={`${activeParams?.m || 1}kg`} />
                        <InfoItem label="Velo" val={`${activeParams?.v0 || 50}m/s`} />
                        <InfoItem label="Sudut" val={`${activeParams?.ang || 45}°`} />
                        <InfoItem label="Grav" val={activeParams?.g || 9.8} />
                        <InfoItem label="Hambatan Udara" val={activeParams?.dragOn ? activeParams?.k : "Off"} />
                    </div>
                </div>
                <div className="space-y-2">
                    <ResultCard color="red" label="Waktu Tempuh (t)" value={`${liveData.t.toFixed(2)} s`} />
                    <ResultCard color="red" label="Jarak Jauh (R)" value={`${Math.abs(liveData.x - (activeParams?.x0||0)).toFixed(2)} m`} />
                    <ResultCard color="red" label="Tinggi Maksimum (H)" value={`${liveData.hMax.toFixed(2)} m`} />
                </div>
            </div>
            {/* Bagian Biru (History) */}
            <div className={`transition-opacity duration-300 ${liveData.isRunning ? 'opacity-60' : 'opacity-100'}`}>
                <h3 className="text-blue-700 font-bold border-b-2 border-blue-100 pb-2 mb-3 text-sm uppercase tracking-wide border-t-2 border-dashed pt-4 mt-2">
                    🔵 Percobaan Lalu
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 text-xs text-center text-gray-500">
                    {historyData ? (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-left">
                            <InfoItem label="Posisi" val={`${historyData.params.x0}m, ${historyData.params.y0}m`} />
                            <InfoItem label="Massa" val={`${historyData.params.m}kg`} />
                            <InfoItem label="Velo" val={`${historyData.params.v0}m/s`} />
                            <InfoItem label="Sudut" val={`${historyData.params.ang}°`} />
                            <InfoItem label="Grav" val={historyData.params.g} />
                            <InfoItem label="Hambatan Udara" val={historyData.params.dragOn ? historyData.params.k : "Off"} />
                        </div>
                    ) : "Belum ada data..."}
                </div>
                <div className="space-y-1">
                    <MiniResultCard label="Waktu Tempuh (t)" value={historyData ? `${historyData.t}s` : '-'} />
                    <MiniResultCard label="Jarak Jauh (R)" value={historyData ? `${historyData.dist}m` : '-'} />
                    <MiniResultCard label="Tinggi Maksimum (H)" value={historyData ? `${historyData.height}m` : '-'} />
                </div>
            </div>
        </div>
    );
}
function InfoItem({ label, val }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">{label}:</span>
            <b className="text-gray-800">{val}</b>
        </div>
    );
}
function ResultCard({ color, label, value }) {
    const borderClass = color === 'red' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50';
    const textClass = color === 'red' ? 'text-red-700' : 'text-blue-700';
    return (
        <div className={`px-3 py-2 rounded-lg border-l-4 shadow-sm bg-white ${borderClass}`}>
            <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
            <h2 className={`text-xl font-mono font-bold leading-tight ${textClass}`}>{value}</h2>
        </div>
    );
}
function MiniResultCard({ label, value }) {
    return (
        <div className="px-3 py-1.5 rounded-md border-l-4 border-blue-400 bg-blue-50/50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
            <strong className="text-sm font-mono text-blue-700">{value}</strong>
        </div>
    );
}