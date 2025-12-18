function InputGroup({ label, name, val, onChange, ...props }) {
    return (
        <div className="flex-1 min-w-0">
            <label className="block text-[9px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider truncate">{label}</label>
            <input 
                type="number" name={name} value={val} onChange={onChange}
                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 focus:bg-white focus:border-blue-500 outline-none transition-all"
                onWheel={(e) => e.target.blur()} 
                {...props} 
            />
        </div>
    );
}

export default function InputPanel({ params, onStart, onReset, isRunning, onParamChange, onClose }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // 1. Handle Checkbox
        if (type === 'checkbox') {
            let newParams = { ...params, [name]: checked };
            if (name === 'dragOn' && checked === true && params.k === 0) {
                newParams.k = 0.05;
            }
            onParamChange(newParams);
            return;
        }

        // 2. Handle Angka
        let val = parseFloat(value);
        let safeVal = isNaN(val) ? 0 : val; 

        // --- VALIDASI BATAS ---
        // A. Batas Positif (Massa, Velo, Drag, Gravitasi) -> Gak boleh minus
        if (name === 'm' && safeVal <= 0) safeVal = 0.1;
        if ((name === 'v0' || name === 'k' || name === 'g') && safeVal < 0) safeVal = 0;
        
        // B. Khusus Gunung/Elevasi: Batasi -80 s/d 80
        if (name === 'slope') {
            if (safeVal < -80) safeVal = -80; // Tambahkan ini biar aman
            if (safeVal > 80) safeVal = 80;
        }

        // --- MENYIMPAN NILAI ---
        // Izinkan ketik tanda minus '-' atau kosong ''
        let finalValue = (value === '' || value === '-') ? value : safeVal;

        // Update State
        let newParams = { ...params, [name]: finalValue };

        
        // 1. Auto-Climb (Naik Gunung/Turun Parit)
        // Kalau slope negatif, y0 otomatis jadi negatif (masuk tanah/parit)
        if (name === 'x0' || name === 'slope') {
            const currentX = name === 'x0' ? safeVal : (parseFloat(params.x0) || 0);
            const currentSlope = name === 'slope' ? safeVal : (parseFloat(params.slope) || 0);
            
            const groundHeight = currentX * Math.tan(currentSlope * Math.PI / 180);
            newParams.y0 = parseFloat(groundHeight.toFixed(2));
        }

        // 2. Preset Gravitasi
        if (name === 'gravityPreset') {
            if (value !== 'custom') {
                newParams.gravityPreset = value;
                newParams.g = parseFloat(value);
            } else {
                newParams.gravityPreset = 'custom';
            }
        }

        onParamChange(newParams);
    };

    // Fungsi ini jalan saat user(selesai edit)
    const handleBlur = (e) => {
        const { name, value } = e.target;
        let val = parseFloat(value) || 0;
        // 1. Validasi Sudut (Angle) -> WAJIB 0-360
        if (name === 'ang') {
            // Rumus matematika untuk memaksa angka selalu 0-360
            let normalizedAngle = val % 360;
            // Handle angka minus (misal -10 jadi 350)
            if (normalizedAngle < 0) normalizedAngle += 360;
            // Cek Tabrakan Gunung
            const minAngle = parseFloat(params.slope) || 0;
            if (normalizedAngle < minAngle) {
                normalizedAngle = minAngle; 
            }
            // Update UI jadi angka yang sudah rapi
            onParamChange({ ...params, ang: parseFloat(normalizedAngle.toFixed(2)) });
            return; 
        }
        // 2. Validasi Input Kosong
        if (value === '') {
            onParamChange({ ...params, [name]: 0 });
        }
    };

    const handleStart = () => { 
        const safeParams = { ...params };
        Object.keys(safeParams).forEach(key => {
            if (safeParams[key] === '') safeParams[key] = 0;
        });
        onStart({ ...safeParams, k: safeParams.dragOn ? safeParams.k : 0 }); 
    };
    return (
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 overflow-hidden flex flex-col ring-1 ring-black/5 max-h-[calc(70vh-60px)]">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100/50 bg-linear-to-b from-white to-gray-50/50">
                <h3 className="text-slate-700 font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                    🎛️ Setup
                </h3>
                <button onClick={onClose} className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-[9px]">✕</button>
            </div>
            
            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-2">
                <div className="flex gap-2">
                    <InputGroup label="X₀ (m)" name="x0" val={params.x0} onChange={handleChange} onBlur={handleBlur} />
                    <InputGroup label="Y₀ (m)" name="y0" val={params.y0} onChange={handleChange} onBlur={handleBlur} />
                </div>
                <div className="flex gap-2">
                    <InputGroup label="Velo (m/s)" name="v0" val={params.v0} onChange={handleChange} onBlur={handleBlur} />
                    <InputGroup label="Angle (°)" name="ang" val={params.ang} onChange={handleChange} onBlur={handleBlur} />
                </div>
                <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex gap-2">
                        <InputGroup label="Massa (kg)" name="m" val={params.m} onChange={handleChange} onBlur={handleBlur} min="0.1" />
                        <div className="flex-1 min-w-0">
                            <label className="block text-[9px] font-bold text-gray-400 mb-0.5 uppercase truncate">Hambatan k</label>
                            <input 
                                type="number" name="k" value={params.k} 
                                onChange={handleChange} 
                                onBlur={handleBlur} 
                                step="0.001" min="0" disabled={!params.dragOn}
                                className={`w-full px-2 py-1 border rounded-md text-[11px] font-bold transition-colors ${!params.dragOn ? 'bg-gray-100 text-gray-300 border-transparent' : 'bg-white border-blue-200 text-gray-700'}`}
                            />
                        </div>
                        <div className="w-20">
                            <label className="block text-[9px] font-bold text-gray-400 mb-0.5 uppercase">Elevasi (°)</label>
                            <input 
                                type="number" name="slope" 
                                value={params.slope} 
                                onChange={handleChange}
                                onBlur={handleBlur} 
                                min="-80" max="80"
                                className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                        <input type="checkbox" name="dragOn" checked={params.dragOn} onChange={handleChange} className="w-3 h-3 accent-blue-600 rounded" />
                        <span className="text-[9px] font-bold text-slate-500">Aktifkan Hambatan Udara</span>
                    </label>
                </div>
                <div>
                    <label className="block text-[9px] font-bold text-gray-400 mb-0.5 uppercase">Gravitasi</label>
                    <div className="flex gap-1.5">
                        <select name="gravityPreset" value={params.gravityPreset} onChange={handleChange} className="flex-1 px-2 py-1 border border-gray-200 rounded-md text-[10px] font-semibold bg-white outline-none">
                            <option value="9.8">🌍 Bumi</option>
                            <option value="1.62">🌑 Bulan</option>
                            <option value="3.72">🪐 Mars</option>
                            <option value="0">🌌 Nol G</option>
                            <option value="custom">✏️ Custom</option>
                        </select>
                        {params.gravityPreset === 'custom' && (
                            <input 
                                type="number" name="g" value={params.g} 
                                onChange={handleChange} 
                                onBlur={handleBlur} 
                                step="0.1" className="w-12 px-1 py-1 border border-blue-200 rounded-md text-[10px] font-bold text-center" 
                            />
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={handleStart} disabled={isRunning} className={`py-1.5 rounded-md font-bold text-white text-[10px] shadow-sm transition-all active:scale-95 ${isRunning ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isRunning ? '...' : 'MULAI 🚀'}
                    </button>
                    <button onClick={onReset} className="py-1.5 rounded-md font-bold text-red-500 text-[10px] border border-red-100 hover:bg-red-50 transition-all active:scale-95">
                        RESET
                    </button>
                </div>
            </div>
        </div>
    );
}