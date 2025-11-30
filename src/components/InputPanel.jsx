import { useEffect } from 'react';

export default function InputPanel({ params, onStart, onReset, isRunning, onParamChange }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let val = type === 'checkbox' ? checked : parseFloat(value);
        
        // Buat object baru
        let newParams = { ...params, [name]: val };

        if (name === 'gravityPreset') {
            if (value !== 'custom') {
                newParams = { ...newParams, gravityPreset: value, g: parseFloat(value) };
            } else {
                newParams = { ...newParams, gravityPreset: 'custom' };
            }
        } else {
            // Logic khusus DragOn (jika checkbox dinyalakan, isi default k)
            if (name === 'dragOn' && val === true && params.k === 0) {
                newParams.k = 0.05; 
            }
        }
        
        // Kirim ke Parent (App.jsx)
        onParamChange(newParams);
    };

    // Kirim perubahan angle ke parent (untuk visual meriam realtime)
    useEffect(() => {
        onParamChange(params);
    }, [params, onParamChange]);

    const handleStart = () => {
        onStart({
            ...params,
            k: params.dragOn ? params.k : 0
        });
    };

    return (
        <div className="flex-none w-full md:w-[310px] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl flex flex-col overflow-y-auto border border-white/20">
            <h3 className="text-gray-700 font-bold border-b-2 border-gray-100 pb-2 mb-4 text-sm uppercase tracking-wide">
                🎛️ Parameter Fisika
            </h3>

            {/* Posisi */}
            <div className="flex gap-2 mb-3">
                <InputGroup label="Posisi X₀ [m]" name="x0" val={params.x0} onChange={handleChange} />
                <InputGroup label="Tinggi Y₀ [m]" name="y0" val={params.y0} onChange={handleChange} />
            </div>

            {/* Gerak */}
            <div className="flex gap-2 mb-3">
                <InputGroup label="Kecepatan v₀ [m/s]" name="v0" val={params.v0} onChange={handleChange} />
                <InputGroup label="Sudut θ [°]" name="ang" val={params.ang} onChange={handleChange} />
            </div>

            {/* Benda */}
            <div className="flex gap-2 mb-3">
                <InputGroup label="Massa m [kg]" name="m" val={params.m} onChange={handleChange} min="0.1" />
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Hambatan k:</label>
                    <input 
                        type="number" name="k" value={params.k} onChange={handleChange} step="0.001"
                        disabled={!params.dragOn}
                        className={`w-full px-2 py-1.5 border-2 rounded-md font-semibold text-sm transition-colors 
                        ${!params.dragOn ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-blue-200 focus:border-blue-500 outline-none'}`}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
                <input 
                    type="checkbox" name="dragOn" id="checkDrag" 
                    checked={params.dragOn} onChange={handleChange}
                    className="w-4 h-4 accent-blue-600 cursor-pointer" 
                />
                <label htmlFor="checkDrag" className="cursor-pointer select-none">Aktifkan Hambatan Udara</label>
            </div>

            <hr className="border-gray-200 mb-4" />

            {/* Gravitasi */}
            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">Gravitasi (g) [m/s²]:</label>
                <div className="flex gap-2">
                    <select 
                        name="gravityPreset" value={params.gravityPreset} onChange={handleChange}
                        className="flex-1 px-2 py-1.5 border-2 border-gray-200 rounded-md text-sm font-semibold focus:border-blue-500 outline-none"
                    >
                        <option value="9.8">🌍 Bumi (9.8)</option>
                        <option value="1.62">🌑 Bulan (1.62)</option>
                        <option value="3.72">🪐 Mars (3.72)</option>
                        <option value="24.79">☀️ Matahari (24.8)</option>
                        <option value="0">🌌 Nol G (0)</option>
                        <option value="custom">✏️ Custom...</option>
                    </select>
                    {params.gravityPreset === 'custom' && (
                        <input 
                            type="number" name="g" value={params.g} onChange={handleChange} step="0.1" placeholder="Isi..."
                            className="w-20 px-2 py-1.5 border-2 border-blue-200 rounded-md text-sm font-semibold outline-none"
                        />
                    )}
                </div>
            </div>

            {/* Tombol */}
            <div className="mt-auto space-y-2">
                <button 
                    onClick={handleStart} disabled={isRunning}
                    className={`w-full py-2.5 rounded-md font-bold text-white text-sm shadow-md transition-all
                    ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-linear-to-r from-blue-600 to-blue-400 hover:-translate-y-0.5 hover:shadow-lg'}`}
                >
                    {isRunning ? 'Jalan...' : 'MULAI SIMULASI 🚀'}
                </button>
                <button 
                    onClick={onReset}
                    className="w-full py-2.5 rounded-md font-bold text-white text-sm shadow-md bg-linear-to-r from-red-600 to-red-400 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                    RESET 🔄
                </button>
            </div>
        </div>
    );
}

function InputGroup({ label, name, val, onChange, ...props }) {
    return (
        <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
            <input 
                type="number" name={name} value={val} onChange={onChange}
                className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-md text-sm font-semibold text-gray-800 focus:border-blue-500 outline-none bg-white focus:bg-blue-50/50"
                {...props}
            />
        </div>
    );
}