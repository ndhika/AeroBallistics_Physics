import { useRef, useState, useCallback } from 'react';

export function useSimulation() {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const [liveData, setLiveData] = useState({ t: 0, x: 0, y: 0, hMax: 0, isRunning: false });
    const [history, setHistory] = useState(null);

    // Physics Engine (Refs)
    const physics = useRef({
        // Physics Vars
        x: 0, y: 0, vx: 0, vy: 0, t: 0,
        mass: 1, k: 0, g: 9.8, 
        
        // --- UBAH DISINI: MODE PRESISI TINGGI ---
        dt: 0.005, // (Sebelumnya 0.02) - Langkah lebih kecil = Akurasi Tinggi
        // ----------------------------------------

        ballAngle: 0,
        angleDeg: 45,
        maxHeight: 0,
        trajectory: [],
        prevTrajectory: [],
        // Viewport (Camera)
        view: { x: 0, y: 0, scale: 10, isDragging: false, lmx: 0, lmy: 0 },  
        touch: { lastDist: 0, isPinching: false },
        // Input User
        params: { x0:0, y0:0, v0:50, ang:45, m:1, k:0, g:9.8, dragOn:false }
    });

    // --- COORDINATE SYSTEMS (World <-> Screen) ---
    const worldToScreenX = (wx, width) => (wx * physics.current.view.scale) + physics.current.view.x + (width * 0.1); 
    const worldToScreenY = (wy, height) => height - (wy * physics.current.view.scale) - physics.current.view.y - (height * 0.1); 
    const screenToWorldX = (sx, width) => (sx - physics.current.view.x - (width * 0.1)) / physics.current.view.scale;
    const screenToWorldY = (sy, height) => (height - sy - physics.current.view.y - (height * 0.1)) / physics.current.view.scale;

    // --- DRAWING FUNCTIONS ---
    const drawRulerAndGrid = (ctx, canvas) => {
        const p = physics.current;
        const { width, height } = canvas;
        const { scale } = p.view;
        // 1. Langit Clean
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#89CFF0"); grad.addColorStop(1, "#f0f8ff");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
        const groundY = worldToScreenY(0, height);
        // 2. LOGIKA GRID PINTAR (AUTO-SPACING)
        let step = 1;
        const minPixelGap = 60; 

        if (scale * 1 >= minPixelGap) step = 1;         
        else if (scale * 5 >= minPixelGap) step = 5;    
        else if (scale * 10 >= minPixelGap) step = 10;  
        else if (scale * 50 >= minPixelGap) step = 50;  
        else if (scale * 100 >= minPixelGap) step = 100;
        else step = 500;                                

        const startWorldX = Math.floor(screenToWorldX(0, width) / step) * step;
        const endWorldX = Math.ceil(screenToWorldX(width, width) / step) * step;

        // 3. Grid Vertikal (Tipis & Transparan)
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; 
        ctx.lineWidth = 1;
        
        for (let i = startWorldX; i <= endWorldX; i += step) {
            let px = worldToScreenX(i, width);
            ctx.moveTo(px, 0); ctx.lineTo(px, height);
        }
        ctx.stroke();

        // 4. Tanah
        ctx.fillStyle = "#55b76d"; 
        ctx.fillRect(0, groundY, width, height - groundY);
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY);
        ctx.strokeStyle = "#2e7d32"; ctx.lineWidth = 3; ctx.stroke();

        // 5. Angka & Tick Mark
        ctx.fillStyle = "#1a3c34"; 
        ctx.textAlign = "center";
        ctx.font = "bold 11px Segoe UI, sans-serif";
        ctx.beginPath();
        ctx.strokeStyle = "#1a3c34"; 
        ctx.lineWidth = 2;

        for (let i = startWorldX; i <= endWorldX; i += step) {
            let px = worldToScreenX(i, width);
            
            // Gambar garis tick mark
            ctx.moveTo(px, groundY); 
            ctx.lineTo(px, groundY + 8);
            
            // Gambar Angka
            ctx.fillText(i + "m", px, groundY + 22);
        }
        ctx.stroke();
    };

    // --- FUNGSI GAMBAR STRUKTUR (GEDUNG / PARIT) ---
    const drawBaseStructure = (ctx, canvas) => {
        const p = physics.current;
        const x0 = p.params.x0;
        const y0 = p.params.y0; 
        if (Math.abs(y0) < 0.1) return;
        const px = worldToScreenX(x0, canvas.width);
        const py = worldToScreenY(y0, canvas.height);
        const groundY = worldToScreenY(0, canvas.height); 

        // Lebar struktur menyesuaikan zoom
        const structWidth = Math.max(40, p.view.scale * 5); 

        if (y0 > 0) {
            // 1. Badan Beton
            ctx.fillStyle = "#95a5a6"; 
            ctx.fillRect(px - structWidth/2, py, structWidth, groundY - py);
            // 2. Garis Pinggir & Detail
            ctx.strokeStyle = "#7f8c8d";
            ctx.lineWidth = 2;
            ctx.strokeRect(px - structWidth/2, py, structWidth, groundY - py);
            // 3. Garis-garis arsitektur
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            // Gambar garis horizontal setiap beberapa pixel
            for(let i = py + 10; i < groundY; i+=20) {
                ctx.moveTo(px - structWidth/2, i);
                ctx.lineTo(px + structWidth/2, i);
            }
            ctx.stroke();
            // 4. Lantai atas (Platform)
            ctx.fillStyle = "#34495e";
            ctx.fillRect(px - structWidth/2 - 5, py, structWidth + 10, 6);
        } else {
            // 1. Lubang
            ctx.fillStyle = "#f0f8ff"; 
            // Lebar lubang sedikit lebih lebar dari meriam
            const holeWidth = structWidth * 1.5; 
            ctx.fillRect(px - holeWidth/2, groundY, holeWidth, py - groundY);
            // 2. Dinding Parit (Kiri & Kanan)
            ctx.strokeStyle = "#5d4037"; 
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Dinding Kiri
            ctx.moveTo(px - holeWidth/2, groundY);
            ctx.lineTo(px - holeWidth/2, py);
            // Lantai Dasar Parit
            ctx.lineTo(px + holeWidth/2, py);
            // Dinding Kanan
            ctx.lineTo(px + holeWidth/2, groundY);
            ctx.stroke();
            // 3. Detail Tanah di Dinding (Arsiran)
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fillRect(px - holeWidth/2, py, holeWidth, 4); 
        }
    };

    const drawCannonUI = (ctx, canvas) => {
        const p = physics.current;
        const x0 = p.params.x0;
        const y0 = p.params.y0;

        const px = worldToScreenX(x0, canvas.width);
        const py = worldToScreenY(y0, canvas.height);
        
        // --- 1. LOGIKA UKURAN (LEBIH BESAR & JELAS) ---
        const cannonLen = Math.max(50, p.view.scale * 6); 
        const cannonWidth = cannonLen * 0.35; // Proporsional

        // --- 2. GAMBAR BUSUR DERAJAT (Di Belakang Meriam) ---
        const radius = cannonLen + 30;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, radius, 0, -p.angleDeg * Math.PI / 180, true);
        ctx.fillStyle = "rgba(52, 152, 219, 0.15)"; 
        ctx.fill();
        ctx.closePath();
        
        // Garis pinggir busur
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, -p.angleDeg * Math.PI / 180, true);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(52, 152, 219, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // --- 3. GAMBAR MERIAM (BARREL) ---
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-p.angleDeg * Math.PI / 180); 
        
        // A. Efek 3D Metalik (Gradient)
        // Membuat gradasi dari atas ke bawah (Gelap -> Terang -> Gelap)
        const grad = ctx.createLinearGradient(0, -cannonWidth/2, 0, cannonWidth/2);
        grad.addColorStop(0, "#2c3e50");   
        grad.addColorStop(0.5, "#7f8c8d"); 
        grad.addColorStop(1, "#2c3e50");   

        // B. Badan Utama Meriam
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -cannonWidth/2 * 0.8); 
        ctx.lineTo(cannonLen, -cannonWidth/2 * 0.6); 
        ctx.lineTo(cannonLen, cannonWidth/2 * 0.6);
        ctx.lineTo(0, cannonWidth/2 * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // C. Detail: Cincin Pangkal (Base Ring)
        ctx.fillStyle = "#1a252f";
        ctx.fillRect(0, -cannonWidth/2, cannonLen * 0.15, cannonWidth);

        // D. Detail: Kepala Meriam (Muzzle Brake)
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.roundRect(cannonLen - 5, -cannonWidth/2 * 0.7 - 2, 12, cannonWidth * 0.7 + 4, 2);
        ctx.fill();
        ctx.strokeStyle = "#1a252f";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        
        // Roda Luar
        const wheelSize = cannonWidth * 0.7; 
        ctx.beginPath(); 
        ctx.arc(px, py + (wheelSize*0.3), wheelSize, 0, Math.PI * 2); 
        ctx.fillStyle = "#2d3436";
        ctx.fill();
        
        // Velg Dalam
        ctx.beginPath(); 
        ctx.arc(px, py + (wheelSize*0.3), wheelSize * 0.6, 0, Math.PI * 2); 
        ctx.fillStyle = "#95a5a6";
        ctx.fill();
        
        // Poros Tengah (Pivot)
        ctx.beginPath(); 
        ctx.arc(px, py + (wheelSize*0.3), wheelSize * 0.2, 0, Math.PI * 2); 
        ctx.fillStyle = "#2c3e50"; 
        ctx.fill();

        // --- 5. TEKS DERAJAT (Di Ujung Busur) ---
        ctx.font = "bold 12px Segoe UI";
        ctx.fillStyle = "#f6fdff";
        const textRad = radius + 20;
        const rad = -p.angleDeg * Math.PI / 180 / 2;
        const tx = px + textRad * Math.cos(rad);
        const ty = py + textRad * Math.sin(rad);
        
        // Background putih kecil di belakang teks biar bacaannya jelas
        const textStr = p.angleDeg.toFixed(1) + "°";
        const textWidth = ctx.measureText(textStr).width;
        ctx.fillStyle = "rgb(0, 1, 29)";
        ctx.fillRect(tx - textWidth/2 - 4, ty - 10, textWidth + 8, 20);
        
        ctx.fillStyle = "#f6fdff";
        ctx.fillText(textStr, tx, ty + 4);
    };

    const drawTrajectory = (ctx, canvas, traj, color, isPrev) => {
        if(traj.length === 0) return;
        
        ctx.beginPath(); 
        ctx.strokeStyle=color; 
        ctx.lineWidth=3; 
        ctx.setLineDash(isPrev?[10,5]:[5,5]);
        
        let started = false;
        for(let i=0; i<traj.length; i+=2) { 
            let px = worldToScreenX(traj[i].x, canvas.width);
            let py = worldToScreenY(traj[i].y, canvas.height);
            
            if (px < -100 || px > canvas.width + 100 || py < -100 || py > canvas.height + 100) continue;
            
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
        }
        ctx.stroke(); 
        ctx.setLineDash([]);

        // --- 2. FITUR BARU: LABEL TITIK TERTINGGI (HANYA JIKA BUKAN PREV) ---
        if (!isPrev && traj.length > 2) {
            
            const peak = traj.reduce((max, p) => p.y > max.y ? p : max, traj[0]);

            if (peak && peak.y > 1.0) {
                // Konversi posisi puncak ke layar
                const px = worldToScreenX(peak.x, canvas.width);
                const py = worldToScreenY(peak.y, canvas.height);

                // Setup Teks
                const text = `H: ${peak.y.toFixed(1)}m`;
                ctx.font = "bold 10px sans-serif";
                const metrics = ctx.measureText(text);
                const w = metrics.width + 12; 
                const h = 20;
                
                // Posisi kotak (sedikit di atas garis)
                const boxX = px - w / 2;
                const boxY = py - 30; 

                // Gambar Background Kotak Hitam
                ctx.beginPath();
                ctx.fillStyle = "#0f172a"; 
                if (ctx.roundRect) {
                    ctx.roundRect(boxX, boxY, w, h, 4);
                } else {
                    ctx.rect(boxX, boxY, w, h);
                }
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(px, boxY + h); 
                ctx.lineTo(px - 4, boxY + h);
                ctx.lineTo(px, boxY + h + 4); 
                ctx.lineTo(px + 4, boxY + h);
                ctx.fill();

                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, px, boxY + h/2 + 1);
            }
        }
    };

    // --- FUNGSI GAMBAR BOLA GAME ---
    const drawGameBall = (ctx, x, y, radius, angle) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle); // Rotasi bola sesuai fisika

        // 1. Badan Bola (Merah Gradient 3D)
        const grad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.2, 0, 0, radius);
        grad.addColorStop(0, "#ff7675"); 
        grad.addColorStop(0.5, "#d63031"); 
        grad.addColorStop(1, "#631819"); 
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Garis/Motif (Agar kelihatan berputar)
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Gambar motif silang atau garis melengkung
        ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius); ctx.lineTo(0, radius);
        ctx.stroke();

        // 3. Highlight Kilap Putih (Glossy)
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.ellipse(-radius*0.3, -radius*0.3, radius*0.4, radius*0.25, Math.PI/4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const p = physics.current;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRulerAndGrid(ctx, canvas);
        drawBaseStructure(ctx, canvas); 
        drawTrajectory(ctx, canvas, p.prevTrajectory, "rgba(52, 152, 219, 0.5)", true);
        drawTrajectory(ctx, canvas, p.trajectory, "#e74c3c", false);
        drawCannonUI(ctx, canvas);

        // --- BOLA ANIMASI GAME ---
        if(p.trajectory.length > 0 || liveData.isRunning) {
            let bx = worldToScreenX(p.x, canvas.width);
            let by = worldToScreenY(p.y, canvas.height);
            // Ukuran bola menyesuaikan zoom, tapi ada batas minimal biar gak ilang
            let ballRadius = Math.max(6, p.view.scale * 0.5); 
            drawGameBall(ctx, bx, by, ballRadius, p.ballAngle);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveData.isRunning]);

    // --- INTERACTION LOGIC ---
    // 1. Zoom ke arah Mouse
    const handleWheel = (e) => {
        e.preventDefault();
        const p = physics.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 1. Hitung Zoom Factor
        const zoomFactor = 1.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        const factor = direction > 0 ? zoomFactor : 1/zoomFactor;
        const newScale = Math.max(0.5, Math.min(100, p.view.scale * factor));

        // 2. Hitung Posisi Mouse di Dunia (Sebelum Zoom)
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        // Rumus kebalikan dari worldToScreen
        const wx = screenToWorldX(mx, canvas.width);
        const wy = screenToWorldY(my, canvas.height);

        // 3. Terapkan Scale Baru
        p.view.scale = newScale;

        // 4. Geser Viewport (Pan) supaya titik zoom tetap di bawah mouse
        p.view.x = mx - (wx * newScale) - (canvas.width * 0.1);
        p.view.y = (canvas.height - my) - (wy * newScale) - (canvas.height * 0.1);

        draw();
    };

    const handleMouseMove = (e, onAngleChange) => {
        const p = physics.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        // A. Panning (Klik Kanan Geser)
        if (p.view.isDragging) {
            p.view.x += mouseX - p.view.lmx;
            p.view.y -= mouseY - p.view.lmy; 
            p.view.lmx = mouseX;
            p.view.lmy = mouseY;
            draw();
            return;
        }
        // B. Aiming (Gerakin Meriam)
        if (!liveData.isRunning) {
            const cannonScreenX = worldToScreenX(p.params.x0, canvas.width);
            const cannonScreenY = worldToScreenY(p.params.y0, canvas.height);
            const dx = mouseX - cannonScreenX;
            const dy = cannonScreenY - mouseY; 
            if (dx > -50) {
                let deg = Math.max(0, Math.min(90, Math.atan2(dy, dx) * 180 / Math.PI));
                p.angleDeg = deg;
                if(onAngleChange) onAngleChange(deg);
                draw();
            }
        }
    };
    // BAGIAN B: INTERAKSI SENTUH (MOBILE) 
    const handleTouchStart = (e) => {
        const p = physics.current;
        if (e.touches.length === 1) {
            // 1 Jari = Mulai Geser
            p.view.isDragging = true;
            p.view.lmx = e.touches[0].clientX;
            p.view.lmy = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            // 2 Jari = Mulai Cubit (Zoom)
            p.touch.isPinching = true;
            // Hitung jarak awal 2 jari
            p.touch.lastDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    };

    const handleTouchMove = (e) => {
        const p = physics.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // KASUS 1: GESER (1 JARI)
        if (e.touches.length === 1 && p.view.isDragging) {
            const mx = e.touches[0].clientX;
            const my = e.touches[0].clientY;
            // Sensitivitas geser HP (1.5x lebih cepat biar enak)
            const speed = 1.5; 
            p.view.x += (mx - p.view.lmx) * speed;
            p.view.y -= (my - p.view.lmy) * speed;
            
            p.view.lmx = mx;
            p.view.lmy = my;
            draw();
        } 
        // KASUS 2: ZOOM (2 JARI / CUBIT)
        else if (e.touches.length === 2 && p.touch.isPinching) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            // Hitung seberapa besar perubahan jarak jari
            const zoomSpeed = 0.005; 
            const delta = dist - p.touch.lastDist;
            const factor = 1 + (delta * zoomSpeed);
            const newScale = Math.max(0.5, Math.min(50, p.view.scale * factor));
            // Zoom Center: Fokus ke tengah layar HP
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const wx = screenToWorldX(centerX, canvas.width);
            const wy = screenToWorldY(centerY, canvas.height);

            p.view.scale = newScale;
            p.view.x = centerX - (wx * newScale) - (canvas.width * 0.1);
            p.view.y = (canvas.height - centerY) - (wy * newScale) - (canvas.height * 0.1);

            p.touch.lastDist = dist;
            draw();
        }
    };

    const handleTouchEnd = (e) => {
        const p = physics.current;
        // Kalau jari diangkat, stop geser/zoom
        if (e.touches.length < 2) p.touch.isPinching = false;
        if (e.touches.length === 0) p.view.isDragging = false;
    };

    // =========================================
    // BAGIAN C: BUNGKUS SEMUA JADI SATU
    // =========================================
    const interactions = {
        handleWheel,     
        handleMouseMove,  
        handleTouchStart, 
        handleTouchMove, 
        handleTouchEnd    
    };

    // --- PHYSICS LOOP ---
    const updatePhysics = () => {
        const p = physics.current;
        
        let v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        let F = p.k * v * v; 
        let ax = -(F * (p.vx/v)) / p.mass;
        let ay = -p.g - (F * (p.vy/v)) / p.mass;
        if(v === 0 || isNaN(v)) { ax = 0; ay = -p.g; }
        
        //  rumus: S = v*t + 0.5*a*t^2
        p.x += p.vx * p.dt + 0.5 * ax * p.dt * p.dt;
        p.y += p.vy * p.dt + 0.5 * ay * p.dt * p.dt;
        p.vx += ax * p.dt;
        p.vy += ay * p.dt;
        p.t += p.dt;
        p.ballAngle += (v * p.dt) * 0.5; 

        if (p.y > p.maxHeight) p.maxHeight = p.y;
        p.trajectory.push({x: p.x, y: p.y});
    };

    const animate = () => {
        const p = physics.current;
        const speedMultiplier = 10; 

        for(let i=0; i < speedMultiplier; i++) { 
            const prevX = p.x;
            const prevY = p.y;
            const prevT = p.t;

            updatePhysics();
            
            if(p.y <= 0 && p.vy < 0) {
                const fraction = (0 - prevY) / (p.y - prevY); 
                
                p.x = prevX + (p.x - prevX) * fraction;
                p.t = prevT + (p.t - prevT) * fraction;
                p.y = 0;
                
                setLiveData(prev => ({ 
                    ...prev, 
                    isRunning: false, 
                    t: p.t, 
                    x: p.x, 
                    y: 0, 
                    hMax: p.maxHeight 
                }));
                cancelAnimationFrame(requestRef.current);
                draw();
                return; 
            }
        }
        draw();
        setLiveData({ t: p.t, x: p.x, y: p.y, hMax: p.maxHeight, isRunning: true });
        requestRef.current = requestAnimationFrame(animate);
    };

    const startSimulation = (params) => {
        const p = physics.current;
        
        // --- LOGIC BARU: SIMPAN HISTORY SEBELUM MULAI BARU ---
        if (p.t > 0 && p.trajectory.length > 0) {
            setHistory({
                t: p.t.toFixed(2),
                dist: Math.abs(p.x - p.params.x0).toFixed(2), 
                height: p.maxHeight.toFixed(2),
                params: { ...p.params } 
            });
        }
        if(p.trajectory.length > 0) p.prevTrajectory = [...p.trajectory];
        if(params) {
            p.params = { ...p.params, ...params }; 
            p.angleDeg = params.ang;
        }
        p.mass = p.params.m;
        p.g = p.params.g;
        p.k = p.params.dragOn ? Math.max(0, p.params.k) : 0;
        p.ballAngle = 0; 

        let rad = p.angleDeg * Math.PI / 180;
        p.x = p.params.x0; p.y = p.params.y0; p.t = 0; p.maxHeight = p.params.y0;
        p.vx = p.params.v0 * Math.cos(rad); p.vy = p.params.v0 * Math.sin(rad);
        p.trajectory = [{x: p.x, y: p.y}];
        setLiveData({ isRunning: true, t: 0, x: p.x, y: p.y, hMax: p.y });
        animate();
    };

    const updatePhysicsParams = (newParams) => {
        const safeParams = { ...newParams };
        if (safeParams.k < 0) safeParams.k = 0;
        
        physics.current.params = { ...newParams };
        physics.current.angleDeg = newParams.ang;
    };

    const resetSimulation = () => {
        const p = physics.current;
        const canvas = canvasRef.current;
        cancelAnimationFrame(requestRef.current);
        
        p.trajectory = []; 
        p.prevTrajectory = [];
        p.t = 0; p.x=0; p.y=0; p.maxHeight=0; p.angleDeg = 45;
        p.params.ang = 45;
        
        // --- RESET KAMERA KE POSISI IDEAL ---
        if (canvas) {
            // Skala zoom default
            const defaultScale = 10; 
            p.view.scale = defaultScale;
            const targetX = canvas.width * 0.2;
            const targetY = canvas.height * 0.8; 
            p.view.x = targetX - (canvas.width * 0.1);
            p.view.y = canvas.height - targetY - (canvas.height * 0.1);
        } else {
            p.view.x = 100; 
            p.view.y = -50;
        }
        setLiveData({ isRunning: false, t: 0, x: 0, y: 0, hMax: 0 });
        setHistory(null);
        draw();
    };
    return {
        canvasRef, liveData, history, startSimulation, resetSimulation, draw, physics, updatePhysicsParams, interactions
    };
}