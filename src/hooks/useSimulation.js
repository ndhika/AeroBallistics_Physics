    import { useRef, useState, useEffect, useCallback } from 'react';

    export default function useSimulation() {
    // --- STATE PARAMETER ---
    const [params, setParams] = useState({
        x0: 0,
        y0: 0,
        v0: 50,
        angle: 45,
        mass: 1,
        dragEnable: false,
        dragK: 0,
        gravity: 9.8,
    });

    // --- STATE SIMULATION ---
    const [state, setState] = useState({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        t: 0,
        maxHeight: 0,
        running: false,
    });

    // --- TRAJECTORY ---
    const [trajectory, setTrajectory] = useState([]);
    const [prevTrajectory, setPrevTrajectory] = useState([]);

    // --- CANVAS VIEW (camera) ---
    const [view, setView] = useState({
        x: 0,
        y: 0,
        scale: 5,
        dragging: false,
        lastX: 0,
        lastY: 0,
    });

    const animRef = useRef(null);

    // ====================================================
    // =============== PHYSICS UPDATE =====================
    // ====================================================
    const updatePhysics = useCallback(() => {
        setState((s) => {
        const { mass, dragK, gravity } = params;

        let v = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        let F = dragK * v * v;

        // Avoid NaN / zero division
        let ax = v ? -(F * s.vx) / (v * mass) : 0;
        let ay = v ? -gravity - (F * s.vy) / (v * mass) : -gravity;

        let vx = s.vx + ax * 0.02;
        let vy = s.vy + ay * 0.02;
        let x = s.x + vx * 0.02;
        let y = s.y + vy * 0.02;

        let maxHeight = y > s.maxHeight ? y : s.maxHeight;
        let t = s.t + 0.02;

        return { ...s, x, y, vx, vy, t, maxHeight };
        });
    }, [params]);

    // ====================================================
    // ==================== LOOP ==========================
    // ====================================================
    const animate = useCallback(() => {
        setState((s) => {
        if (!s.running) return s;
        return s;
        });

        // 5 physics steps per frame (as in original)
        for (let i = 0; i < 5; i++) {
        updatePhysics();

        let y = state.y;
        let vy = state.vy;

        if (y <= 0 && vy < 0) {
            stopSimulation();
            return;
        }
        }

        animRef.current = requestAnimationFrame(animate);
    }, [updatePhysics, state.y, state.vy]);

    // ====================================================
    // ================== START ===========================
    // ====================================================
    const startSimulation = () => {
        // Save previous run
        if (trajectory.length > 0) {
        setPrevTrajectory([...trajectory]);
        }

        const rad = params.angle * Math.PI / 180;

        // Reset state
        setState({
        x: params.x0,
        y: params.y0,
        vx: params.v0 * Math.cos(rad),
        vy: params.v0 * Math.sin(rad),
        t: 0,
        maxHeight: params.y0,
        running: true,
        });

        setTrajectory([{ x: params.x0, y: params.y0 }]);

        animRef.current = requestAnimationFrame(animate);
    };

    // ====================================================
    // =================== STOP ===========================
    // ====================================================
    const stopSimulation = () => {
        cancelAnimationFrame(animRef.current);
        setState((s) => ({ ...s, running: false }));
    };

    // ====================================================
    // =================== RESET ==========================
    // ====================================================
    const resetSimulation = () => {
        stopSimulation();
        setTrajectory([]);
        setPrevTrajectory([]);

        setParams({
        x0: 0,
        y0: 0,
        v0: 50,
        angle: 45,
        mass: 1,
        dragEnable: false,
        dragK: 0,
        gravity: 9.8,
        });

        setView({
        x: 0,
        y: 0,
        scale: 5,
        dragging: false,
        lastX: 0,
        lastY: 0,
        });

        setState({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        t: 0,
        maxHeight: 0,
        running: false,
        });
    };

    return {
        params, setParams,
        state, setState,
        view, setView,
        trajectory, setTrajectory,
        prevTrajectory,
        startSimulation,
        resetSimulation,
        stopSimulation,
    };
    }
