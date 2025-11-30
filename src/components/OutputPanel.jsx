export default function OutputPanel({ params, state, prevParams, prevState }) {

  // Format number
  const fmt = (n) => (isNaN(n) ? "-" : Number(n).toFixed(2));

  return (
    <div className="w-[280px] bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-4 overflow-y-auto">

      {/* ========================= */}
      {/* ACTIVE RUN (RED) */}
      {/* ========================= */}
      <h3 className="text-red-600 font-bold text-sm uppercase mb-2 border-b border-red-300 pb-1">
        🔴 Percobaan Aktif
      </h3>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between"><span className="text-gray-500">Posisi:</span> <b>{params.x0}m, {params.y0}m</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Massa:</span> <b>{params.mass}kg</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Velo:</span> <b>{params.v0}m/s</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Sudut:</span> <b>{params.angle}°</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Grav:</span> <b>{params.gravity}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Drag:</span> <b>{params.dragEnable ? params.dragK : "Off"}</b></div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="mb-3">
        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-md mb-2">
          <span className="block text-[10px] font-bold text-red-600 uppercase">Waktu Tempuh (t)</span>
          <h2 className="font-mono text-lg text-red-700">{fmt(state.t)} s</h2>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-md mb-2">
          <span className="block text-[10px] font-bold text-red-600 uppercase">Jarak (R)</span>
          <h2 className="font-mono text-lg text-red-700">{fmt(Math.abs(state.x - params.x0))} m</h2>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-md">
          <span className="block text-[10px] font-bold text-red-600 uppercase">Tinggi Maksimum (H)</span>
          <h2 className="font-mono text-lg text-red-700">{fmt(state.maxHeight)} m</h2>
        </div>
      </div>


      {/* ========================= */}
      {/* HISTORY (BLUE) */}
      {/* ========================= */}
      <h3 className="text-blue-600 font-bold text-sm uppercase mt-5 mb-2 border-b border-blue-300 pb-1">
        🔵 Percobaan Lalu
      </h3>

      {/* History Params */}
      {prevParams ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between"><span className="text-gray-500">Posisi:</span> <b>{prevParams.x0}m, {prevParams.y0}m</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Massa:</span> <b>{prevParams.mass}kg</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Velo:</span> <b>{prevParams.v0}m/s</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Sudut:</span> <b>{prevParams.angle}°</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Grav:</span> <b>{prevParams.gravity}</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Drag:</span> <b>{prevParams.dragEnable ? prevParams.dragK : "Off"}</b></div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic mb-3">Belum ada data...</p>
      )}

      {/* HISTORY STATS */}
      {prevState ? (
        <div className="space-y-2">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-md flex justify-between items-center">
            <span className="text-[10px] text-blue-600 font-bold uppercase">Waktu</span>
            <strong className="font-mono text-blue-700 text-sm">{fmt(prevState.t)} s</strong>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-md flex justify-between items-center">
            <span className="text-[10px] text-blue-600 font-bold uppercase">Jarak</span>
            <strong className="font-mono text-blue-700 text-sm">
              {fmt(Math.abs(prevState.x - prevParams.x0))} m
            </strong>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-md flex justify-between items-center">
            <span className="text-[10px] text-blue-600 font-bold uppercase">Tinggi</span>
            <strong className="font-mono text-blue-700 text-sm">
              {fmt(prevState.maxHeight)} m
            </strong>
          </div>
        </div>
      ) : null}

    </div>
  );
}
