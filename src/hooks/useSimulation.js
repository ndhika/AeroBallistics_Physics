import { useRef, useEffect, useState, useCallback } from 'react';

export function useSimulation() {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    
    // State untuk UI (Output Panel)
    const [liveData, setLiveData] = useState({
        t: 0, x: 0, y: 0, hMax: 0, isRunning: false
    });
    
    // State untuk History (Percobaan Lalu)
    const [history, setHistory] = useState(null);

    // Refs untuk Logika Fisika (Mutable, tidak memicu re-render)
    const physics = useRef({
        x: 0, y: 0, vx: 0, vy: 0, t: 0,
        mass: 1, k: 0, g: 9.8, dt: 0.02,
        angleDeg: 45,
        maxHeight: 0,
        trajectory: [],
        prevTrajectory: [],
        view: { x: 0, y: 0, scale: 5, isDragging: false, lmx: 0, lmy: 0 },
        params: { x0:0, y0:0, v0:50, ang:45, m:1, k:0, g:9.8, dragOn:false } // Memori settingan
    });

    // --- UTILS DRAWING ---
    const worldToScreenX = (wx) => (wx * physics.current.view.scale) + physics.current.view.x + 20;
    const worldToScreenY = (wy, canvas) => (canvas.height - 40) - (wy * physics.current.view.scale) + physics.current.view.y;

    const drawEnvironment = (ctx, canvas) => {
        const p = physics.current;
        const { scale, x: vx, y: vy } = p.view;

        // Langit
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#89CFF0"); grad.addColorStop(1, "#f0f8ff");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.beginPath();
        let step = scale < 3 ? 50 : 10;
        let sx = Math.floor((-vx)/ (step*scale))*step;
        let ex = sx + (canvas.width/scale)+20;
        let sy = Math.floor(vy/(step*scale))*step;
        let ey = sy + (canvas.height/scale)+20;
        
        // Grid Vertikal
        for(let i=sx; i<=ex; i+=step) { 
            let px = worldToScreenX(i, canvas); 
            ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); 
        }
        // Grid Horizontal (sesuaikan minGridY jika ada parit)
        let minGridY = Math.min(-100, Math.floor(p.params.y0 / step) * step - step);
        for(let j=minGridY; j<=ey; j+=step) { 
            let py = worldToScreenY(j, canvas); 
            ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); 
        }
        ctx.stroke();

        // Tanah
        let gy = worldToScreenY(0, canvas);
        ctx.fillStyle = "#55b76d"; ctx.fillRect(0, gy, canvas.width, canvas.height-gy);
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy);
        ctx.strokeStyle = "#408c50"; ctx.lineWidth=3; ctx.stroke();
    };

    const drawStructure = (ctx, canvas, x0, y0) => {
        const p = physics.current;
        let sx = worldToScreenX(x0, canvas);
        let sy = worldToScreenY(y0, canvas);
        let gy = worldToScreenY(0, canvas);
        let bw = 40 * Math.max(0.6, Math.min(1.2, p.view.scale/5));

        if (y0 > 0) { // Gedung
            ctx.fillStyle="#7f8c8d"; ctx.fillRect(sx-bw/2, sy, bw, gy-sy);
            ctx.strokeStyle="#95a5a6"; ctx.lineWidth=2; ctx.strokeRect(sx-bw/2, sy, bw, gy-sy);
            ctx.fillStyle="#2c3e50"; ctx.fillRect(sx-bw/2-5, sy, bw+10, 5);
        } else if (y0 < 0) { // Parit
            let holeWidth = bw * 1.5;
            ctx.fillStyle = "#89CFF0"; ctx.fillRect(sx - holeWidth/2, gy, holeWidth, sy - gy);
            ctx.strokeStyle = "#408c50"; ctx.lineWidth=3;
            ctx.beginPath();
            ctx.moveTo(sx - holeWidth/2, gy); ctx.lineTo(sx - holeWidth/2, sy);
            ctx.lineTo(sx + holeWidth/2, sy); ctx.lineTo(sx + holeWidth/2, gy);
            ctx.stroke();
            ctx.fillStyle="#7f8c8d"; ctx.fillRect(sx - bw/2 - 5, sy, bw + 10, 5);
        }
    };

    const drawCannon = (ctx, canvas) => {
        const p = physics.current;
        // Gunakan nilai input user saat idle, atau nilai snapshot saat running
        const x0 = p.params.x0; 
        const y0 = p.params.y0;
        
        drawStructure(ctx, canvas, x0, y0);

        let px = worldToScreenX(x0, canvas);
        let py = worldToScreenY(y0, canvas);
        
        ctx.save(); ctx.translate(px, py); ctx.rotate(-p.angleDeg*Math.PI/180);
        ctx.fillStyle="#34495e"; ctx.beginPath(); ctx.roundRect(0,-9,50,18,5); ctx.fill();
        ctx.fillStyle="#e74c3c"; ctx.beginPath(); ctx.roundRect(10,-5,15,10,2); ctx.fill();
        ctx.restore();
        
        ctx.beginPath(); ctx.arc(px,py,12,0,Math.PI*2); ctx.fillStyle="#2c3e50"; ctx.fill();
        ctx.strokeStyle="#ecf0f1"; ctx.lineWidth=3; ctx.stroke();
    };

    const drawTrajectory = (ctx, canvas, traj, color, isPrev) => {
        if(traj.length === 0) return;
        ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=3; ctx.setLineDash(isPrev?[10,5]:[5,5]);
        ctx.moveTo(worldToScreenX(traj[0].x, canvas), worldToScreenY(traj[0].y, canvas));
        
        // Optimasi: Jangan gambar ribuan titik jika di luar layar jauh
        for(let i=1; i<traj.length; i++) {
            let px = worldToScreenX(traj[i].x, canvas);
            let py = worldToScreenY(traj[i].y, canvas);
            if(px > -100 && px < canvas.width+100 && py > -100 && py < canvas.height+100) {
                ctx.lineTo(px,py);
            } else {
                ctx.moveTo(px,py);
            }
        }
        ctx.stroke(); ctx.setLineDash([]);
        
        // Tanda silang jatuh
        let last = traj[traj.length-1];
        if(!isPrev && last.y <= 0 && physics.current.vy < 0) { // Sederhana cek tanah
             // logic handled in animate loop for stopping
        }
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p = physics.current; // Mengambil data dari Refs

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Panggil fungsi-fungsi gambar
        drawEnvironment(ctx, canvas);
        
        // ... (kode draw Ruler text tetap sama) ...

        drawCannon(ctx, canvas);
        drawTrajectory(ctx, canvas, p.prevTrajectory, "rgba(52, 152, 219, 0.6)", true);
        drawTrajectory(ctx, canvas, p.trajectory, "#e74c3c", false);

        // Bola
        if(p.trajectory.length > 0 || liveData.isRunning) {
            let bx = worldToScreenX(p.x); // <-- Ingat update yg worldToScreenX tadi ya
            let by = worldToScreenY(p.y, canvas);
            let r = Math.max(3, Math.min(8, 5*(p.view.scale/5)));
            ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2); ctx.fillStyle="#f1c40f"; ctx.fill(); ctx.stroke();
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveData.isRunning]); // Dependency minimal agar tidak re-create function terus

    // --- ANIMATION LOOP ---
    const updatePhysics = () => {
        const p = physics.current;
        if (p.mass <= 0) p.mass = 0.1;
        
        let v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        let F = p.k * v * v;
        let ax = -(F * (p.vx/v)) / p.mass;
        let ay = -p.g - (F * (p.vy/v)) / p.mass;
        
        if(v === 0) { ax = 0; ay = -p.g; }
        
        p.vx += ax * p.dt;
        p.vy += ay * p.dt;
        p.x += p.vx * p.dt;
        p.y += p.vy * p.dt;
        p.t += p.dt;

        if (isNaN(p.x) || isNaN(p.y)) p.y = -1;
        if(p.y > p.maxHeight) p.maxHeight = p.y;
        
        p.trajectory.push({x: p.x, y: p.y});
    };

    const animate = () => {
        const p = physics.current;
        
        for(let i=0; i<5; i++) { // Sub-stepping for accuracy
            updatePhysics();
            
            // Stop Condition: Hit ground (y <= 0) AND falling (vy < 0)
            if(p.y <= 0 && p.vy < 0) {
                p.y = 0;
                setLiveData(prev => ({ ...prev, isRunning: false, t: p.t, x: p.x, y: 0, hMax: p.maxHeight }));
                
                // Save history
                setHistory({
                    t: p.t.toFixed(2),
                    dist: Math.abs(p.x - p.params.x0).toFixed(2),
                    height: p.maxHeight.toFixed(2),
                    params: { ...p.params }
                });
                
                cancelAnimationFrame(requestRef.current);
                draw();
                return; 
            }
        }

        draw();
        
        // Update UI (Throttle bisa ditambahkan jika perlu, tapi React state update 60fps ok untuk simple data)
        setLiveData({
            t: p.t,
            x: p.x, 
            y: p.y,
            hMax: p.maxHeight,
            isRunning: true
        });

        requestRef.current = requestAnimationFrame(animate);
    };

    // --- PUBLIC ACTIONS ---
    const startSimulation = (params) => {
        const p = physics.current;
        
        // Jika ada run sebelumnya, simpan ke prevTrajectory
        if(p.trajectory.length > 0) {
            p.prevTrajectory = [...p.trajectory];
        }

        // Setup Params
        p.params = { ...params };
        p.mass = params.m;
        p.g = params.g;
        p.k = params.dragOn ? params.k : 0;
        p.angleDeg = params.ang;
        
        // Init Physics State
        let rad = params.ang * Math.PI / 180;
        p.x = params.x0;
        p.y = params.y0;
        p.t = 0;
        p.maxHeight = params.y0;
        p.vx = params.v0 * Math.cos(rad);
        p.vy = params.v0 * Math.sin(rad);
        p.trajectory = [{x: p.x, y: p.y}];

        setLiveData({ isRunning: true, t: 0, x: p.x, y: p.y, hMax: p.y });
        animate();
    };

    const resetSimulation = () => {
        const p = physics.current;
        cancelAnimationFrame(requestRef.current);
        p.trajectory = [];
        p.prevTrajectory = [];
        p.t = 0; p.x=0; p.y=0; p.maxHeight=0;
        p.angleDeg = 45;
        setLiveData({ isRunning: false, t: 0, x: 0, y: 0, hMax: 0 });
        setHistory(null);
        draw();
    };

    const updatePhysicsParams = (newParams) => {
        physics.current.params = { ...newParams };
        physics.current.angleDeg = newParams.ang;
    };

    // Handle Resize & Init Draw
    useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    return {
        canvasRef,
        liveData,
        history,
        startSimulation,
        resetSimulation,
        draw, // Expose draw for manual interaction updates
        physics, // Expose physics for direct manipulation (zooming/panning)
        updatePhysicsParams
    };
}