export default function InputPanel({ params, setParams, startSimulation, resetSimulation }) {

  // Utility untuk update params
  const update = (key, value) => {
    setParams(p => ({ ...p, [key]: value }));
  };

  return (
    <div className="w-[300px] bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-4 overflow-y-auto">
      <h3 className="text-gray-800 font-bold text-sm uppercase mb-3 border-b pb-1">🎛️ Parameter Fisika</h3>

      {/* ========================= */}
      {/* POSISI */}
      {/* ========================= */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-600">Posisi X₀ [m]</label>
          <input 
            type="number" 
            value={params.x0}
            onChange={e => update("x0", parseFloat(e.target.value))}
            className="w-full mt-1 px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Tinggi Y₀ [m]</label>
          <input 
            type="number" 
            value={params.y0}
            onChange={e => update("y0", parseFloat(e.target.value))}
            className="w-full mt-1 px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>
      </div>

      {/* ========================= */}
      {/* KECEPATAN & SUDUT */}
      {/* ========================= */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-600">Kecepatan v₀ [m/s]</label>
          <input 
            type="number" 
            value={params.v0}
            onChange={e => update("v0", parseFloat(e.target.value))}
            className="w-full mt-1 px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Sudut θ [°]</label>
          <input 
            type="number" 
            value={params.angle}
            onChange={e => update("angle", parseFloat(e.target.value))}
            className="w-full mt-1 px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>
      </div>

      {/* ========================= */}
      {/* MASSA & DRAG */}
      {/* ========================= */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-600">Massa [kg]</label>
          <input 
            type="number" 
            value={params.mass}
            min="0.1"
            onChange={e => update("mass", parseFloat(e.target.value))}
            className="w-full mt-1 px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Hambatan k</label>
          <input 
            type="number" 
            step="0.001"
            disabled={!params.dragEnable}
            value={params.dragK}
            onChange={e => update("dragK", parseFloat(e.target.value))}
            className={`w-full mt-1 px-2 py-1 rounded-md text-sm border 
              ${params.dragEnable ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100"}`}
          />
        </div>
      </div>

      {/* CHECKBOX DRAG */}
      <div className="flex items-center mb-4">
        <input 
          type="checkbox"
          checked={params.dragEnable}
          onChange={e => update("dragEnable", e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm font-semibold text-gray-600">Aktifkan Hambatan Udara</label>
      </div>

      {/* ========================= */}
      {/* GRAVITY */}
      {/* ========================= */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Gravitasi (g) [m/s²]</label>

        {/* PRESET */}
        <select
          className="w-full px-2 py-1 rounded-md border border-gray-300 text-sm"
          onChange={(e) => {
            if (e.target.value === "custom") return;
            update("gravity", parseFloat(e.target.value));
          }}
        >
          <option value="9.8">🌍 Bumi (9.8)</option>
          <option value="1.62">🌑 Bulan (1.62)</option>
          <option value="3.72">🪐 Mars (3.72)</option>
          <option value="24.79">☀️ Matahari (24.8)</option>
          <option value="0">🌌 Nol G (0)</option>
          <option value="custom">✏️ Custom…</option>
        </select>

        {/* CUSTOM INPUT */}
        <input 
          type="number"
          value={params.gravity}
          onChange={e => update("gravity", parseFloat(e.target.value))}
          className="w-full mt-2 px-2 py-1 rounded-md border border-gray-300 text-sm"
        />

      </div>

      {/* ========================= */}
      {/* BUTTONS */}
      {/* ========================= */}
      <button
        onClick={startSimulation}
        className="w-full py-2 mb-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition"
      >
        🚀 MULAI SIMULASI
      </button>

      <button
        onClick={resetSimulation}
        className="w-full py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold shadow transition"
      >
        🔄 RESET
      </button>
    </div>
  );
}
