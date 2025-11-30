import { useEffect, useState } from "react";
import useSimulation from "./hooks/useSimulation";

import Canvas from "./components/Canvas";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";

export default function App() {

  const {
    params, setParams,
    state, setState,
    view, setView,
    trajectory, setTrajectory,
    prevTrajectory,
    startSimulation,
    resetSimulation,
    stopSimulation
  } = useSimulation();

  // Untuk history snapshot
  const [prevParams, setPrevParams] = useState(null);
  const [prevState, setPrevState] = useState(null);

  // Ambil history ketika startSimulation dipanggil
  useEffect(() => {
    // Kalau simulation baru saja dimulai, simpan snapshot history
    if (state.running && trajectory.length === 1) {

      // Simpan prevParams sebelum perubahan
      setPrevParams({ ...params });

      // Simpan prevState (snapshot sebelum gerak)
      setPrevState({
        t: 0,
        x: params.x0,
        y: params.y0,
        maxHeight: params.y0
      });
    }
  }, [state.running]);

  return (
    <div className="w-full h-screen p-4 bg-gradient-to-br from-blue-900 to-blue-600 flex flex-col">

      <h1 className="text-center text-white font-extrabold text-xl drop-shadow mb-2">
        Simulasi Gerak Parabola Modern (React + Canvas)
      </h1>

      <div className="flex flex-1 gap-4 overflow-hidden">

        {/* LEFT PANEL */}
        <InputPanel 
          params={params}
          setParams={setParams}
          startSimulation={startSimulation}
          resetSimulation={() => {
            resetSimulation();
            setPrevParams(null);
            setPrevState(null);
          }}
        />

        {/* CANVAS */}
        <Canvas
          params={params}
          state={state}
          view={view}
          trajectory={trajectory}
          prevTrajectory={prevTrajectory}
          setView={setView}
          setParams={setParams}
          startSimulation={() => {
            // Simpan history lama
            setPrevParams({ ...params });
            setPrevState({ ...state });

            startSimulation();
          }}
          setTrajectory={setTrajectory}
        />

        {/* RIGHT PANEL */}
        <OutputPanel 
          params={params}
          state={state}
          prevParams={prevParams}
          prevState={prevState}
        />

      </div>
    </div>
  );
}
