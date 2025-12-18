import { useRef, useState, useCallback } from 'react';

export function useSimulation() {
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const [liveData, setLiveData] = useState({ isRunning: false, t: 0, x: 0, y: 0, hMax: 0 });
    const [history, setHistory] = useState(null);
    
    // Physics Engine 
    const physics = useRef({
        x: 0, y: 0, vx: 0, vy: 0, t: 0,
        mass: 1, k: 0, g: 9.8, 
        
        dt: 0.001,           
        minDt: 0.0001,       
        maxDt: 0.005,       
        targetError: 0.001,  
        
        ballAngle: 0,
        angleDeg: 45,
        maxHeight: 0,
        trajectory: [],
        prevTrajectory: [],
        
        runParams: {}, 
        
        view: { x: 0, y: 0, scale: 10, isDragging: false, lmx: 0, lmy: 0 },  
        touch: { lastDist: 0, isPinching: false },
        params: { x0:0, y0:0, v0:50, ang:45, m:1, k:0, g:9.8, dragOn:false, slope: 0 }
    });

    // --- COORDINATE SYSTEMS (World <-> Screen) ---
    const worldToScreenX = (wx, width) => (wx * physics.current.view.scale) + physics.current.view.x + (width * 0.1); 
    const worldToScreenY = (wy, height) => height - (wy * physics.current.view.scale) - physics.current.view.y - (height * 0.1); 
    const screenToWorldX = (sx, width) => (sx - physics.current.view.x - (width * 0.1)) / physics.current.view.scale;
    const screenToWorldY = (sy, height) => (height - sy - physics.current.view.y - (height * 0.1)) / physics.current.view.scale;

    // --- IMPROVED PHYSICS: RK4 INTEGRATION METHOD ---
    const computeAcceleration = (vx, vy, p) => {
        const v = Math.sqrt(vx*vx + vy*vy);
        
        if (v < 1e-10) {
            return { ax: 0, ay: -p.g };
        }
        
        const F = p.k * v * v;
        const ax = -(F * (vx/v)) / p.mass;
        const ay = -p.g - (F * (vy/v)) / p.mass;
        
        return { ax, ay };
    };

    const rk4Step = (x, y, vx, vy, dt, p) => {
        // K1
        const k1 = computeAcceleration(vx, vy, p);
        const k1_vx = k1.ax;
        const k1_vy = k1.ay;
        
        // K2
        const k2 = computeAcceleration(
            vx + 0.5 * k1_vx * dt,
            vy + 0.5 * k1_vy * dt,
            p
        );
        const k2_vx = k2.ax;
        const k2_vy = k2.ay;
        
        // K3
        const k3 = computeAcceleration(
            vx + 0.5 * k2_vx * dt,
            vy + 0.5 * k2_vy * dt,
            p
        );
        const k3_vx = k3.ax;
        const k3_vy = k3.ay;
        
        // K4
        const k4 = computeAcceleration(
            vx + k3_vx * dt,
            vy + k3_vy * dt,
            p
        );
        const k4_vx = k4.ax;
        const k4_vy = k4.ay;
        
        // Weighted average
        const new_vx = vx + (dt / 6) * (k1_vx + 2*k2_vx + 2*k3_vx + k4_vx);
        const new_vy = vy + (dt / 6) * (k1_vy + 2*k2_vy + 2*k3_vy + k4_vy);
        
        // Position update (using average velocity)
        const avg_vx = (vx + new_vx) / 2;
        const avg_vy = (vy + new_vy) / 2;
        const new_x = x + avg_vx * dt;
        const new_y = y + avg_vy * dt;
        
        return { x: new_x, y: new_y, vx: new_vx, vy: new_vy };
    };

    // --- ADAPTIVE TIMESTEP ---
    const adaptiveTimestep = (p) => {
        const v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        const accel = Math.sqrt(p.g*p.g + (p.k * v * v / p.mass)**2);
        
        // Timestep based on velocity and acceleration
        // dt = sqrt(2 * error / accel)
        let newDt = p.dt;
        
        if (accel > 0) {
            newDt = Math.sqrt(2 * p.targetError / accel);
        }
        
        // Clamp between min and max
        newDt = Math.max(p.minDt, Math.min(p.maxDt, newDt));
        
        // Adjust based on velocity too (smaller timestep for high speed)
        if (v > 100) {
            newDt *= 0.5;
        }
        
        return newDt;
    };

    // --- DRAWING FUNCTIONS ---
    const drawRulerAndGrid = (ctx, canvas) => {
        const p = physics.current;
        const { width, height } = canvas;
        
        // Ambil sudut kemiringan
        const slopeRad = (p.params.slope || 0) * Math.PI / 180;
        const tanSlope = Math.tan(slopeRad);

        const { scale } = p.view;

        // 1. Langit Clean
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#89CFF0"); grad.addColorStop(1, "#f0f8ff");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);

        // 2. LOGIKA GRID PINTAR
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

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; 
        ctx.lineWidth = 1;
        
        for (let i = startWorldX; i <= endWorldX; i += step) {
            let px = worldToScreenX(i, width);
            ctx.moveTo(px, 0); ctx.lineTo(px, height);
        }
        ctx.stroke();

        // 4. GAMBAR TANAH / GUNUNG (POLYGON MIRING)
        const worldX_Left = screenToWorldX(0, width);
        const worldY_Left = worldX_Left * tanSlope;
        const screenY_Left = worldToScreenY(worldY_Left, height);

        const worldX_Right = screenToWorldX(width, width);
        const worldY_Right = worldX_Right * tanSlope;
        const screenY_Right = worldToScreenY(worldY_Right, height);

        ctx.beginPath();
        ctx.moveTo(0, screenY_Left);       
        ctx.lineTo(width, screenY_Right);   
        ctx.lineTo(width, height);          
        ctx.lineTo(0, height);              
        ctx.closePath();

        ctx.fillStyle = "#55b76d"; 
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, screenY_Left);
        ctx.lineTo(width, screenY_Right);
        ctx.strokeStyle = "#2e7d32"; 
        ctx.lineWidth = 3; 
        ctx.stroke();

        // 5. ANGKA & TICK MARK
        ctx.fillStyle = "#1a3c34"; 
        ctx.textAlign = "center";
        ctx.font = "bold 11px Segoe UI, sans-serif";
        ctx.beginPath();
        ctx.strokeStyle = "#1a3c34"; 
        ctx.lineWidth = 2;

        for (let i = startWorldX; i <= endWorldX; i += step) {
            let px = worldToScreenX(i, width);
            let pyWorld = i * tanSlope; 
            let py = worldToScreenY(pyWorld, height); 

            ctx.moveTo(px, py); 
            ctx.lineTo(px, py + 8);
            
            ctx.fillText(i + "m", px, py + 22);
        }
        ctx.stroke();
    };

    const drawBaseStructure = (ctx, canvas) => {
        const p = physics.current;
        const x0 = p.params.x0;
        const y0 = p.params.y0; 

        const slopeRad = (p.params.slope || 0) * Math.PI / 180;
        const groundY_at_X0 = x0 * Math.tan(slopeRad);
        if (Math.abs(y0 - groundY_at_X0) < 0.1) return;
        const px = worldToScreenX(x0, canvas.width);
        const py = worldToScreenY(y0, canvas.height);
        const pGround = worldToScreenY(groundY_at_X0, canvas.height);
        
        const structWidth = Math.max(40, p.view.scale * 5); 
        
        if (y0 > groundY_at_X0) {
            ctx.fillStyle = "#95a5a6"; 
            ctx.fillRect(px - structWidth/2, py, structWidth, pGround - py);
            
            ctx.strokeStyle = "#7f8c8d";
            ctx.lineWidth = 2;
            ctx.strokeRect(px - structWidth/2, py, structWidth, pGround - py);
            
            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            for(let i = py + 10; i < pGround; i+=20) {
                ctx.moveTo(px - structWidth/2, i);
                ctx.lineTo(px + structWidth/2, i);
            }
            ctx.stroke();

            ctx.fillStyle = "#34495e";
            ctx.fillRect(px - structWidth/2 - 5, py, structWidth + 10, 6);
        } 
        else {
            const holeWidth = structWidth * 1.5; 

            ctx.fillStyle = "#f0f8ff"; 
            ctx.fillRect(px - holeWidth/2, pGround, holeWidth, py - pGround);

            ctx.strokeStyle = "#5d4037"; 
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            ctx.moveTo(px - holeWidth/2, pGround);
            ctx.lineTo(px - holeWidth/2, py);
            
            ctx.lineTo(px + holeWidth/2, py);
            
            ctx.lineTo(px + holeWidth/2, pGround);
            ctx.stroke();

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
        const cannonLen = Math.max(50, p.view.scale * 6); 
        const cannonWidth = cannonLen * 0.35; 

        const radius = cannonLen + 30;
        const targetRad = -p.angleDeg * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(px, py); 
        ctx.lineTo(px + radius, py); 
        ctx.arc(px, py, radius, 0, targetRad, true);
        ctx.closePath(); 
        
        ctx.fillStyle = "rgba(52, 152, 219, 0.15)"; 
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, targetRad, true);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(52, 152, 219, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(targetRad); 
        
        const grad = ctx.createLinearGradient(0, -cannonWidth/2, 0, cannonWidth/2);
        grad.addColorStop(0, "#2c3e50"); grad.addColorStop(0.5, "#7f8c8d"); grad.addColorStop(1, "#2c3e50");   
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -cannonWidth/2 * 0.8); ctx.lineTo(cannonLen, -cannonWidth/2 * 0.6); 
        ctx.lineTo(cannonLen, cannonWidth/2 * 0.6); ctx.lineTo(0, cannonWidth/2 * 0.8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#1a252f"; ctx.fillRect(0, -cannonWidth/2, cannonLen * 0.15, cannonWidth);
        ctx.fillStyle = "#34495e"; ctx.beginPath(); ctx.roundRect(cannonLen - 5, -cannonWidth/2 * 0.7 - 2, 12, cannonWidth * 0.7 + 4, 2); ctx.fill();
        ctx.strokeStyle = "#1a252f"; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
        
        const wheelSize = cannonWidth * 0.7; 
        ctx.beginPath(); ctx.arc(px, py + (wheelSize*0.3), wheelSize, 0, Math.PI * 2); ctx.fillStyle = "#2d3436"; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py + (wheelSize*0.3), wheelSize * 0.6, 0, Math.PI * 2); ctx.fillStyle = "#95a5a6"; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py + (wheelSize*0.3), wheelSize * 0.2, 0, Math.PI * 2); ctx.fillStyle = "#2c3e50"; ctx.fill();

        ctx.font = "bold 12px Segoe UI";
        const textRad = radius + 20;
        const tx = px + textRad * Math.cos(targetRad);
        const ty = py + textRad * Math.sin(targetRad);
        
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

        if (!isPrev && traj.length > 2) {
            const peak = traj.reduce((max, p) => p.y > max.y ? p : max, traj[0]);

            if (peak && peak.y > 1.0) {
                const px = worldToScreenX(peak.x, canvas.width);
                const py = worldToScreenY(peak.y, canvas.height);

                const text = `H: ${peak.y.toFixed(1)}m`;
                ctx.font = "bold 10px sans-serif";
                const metrics = ctx.measureText(text);
                const w = metrics.width + 12; 
                const h = 20;
                
                const boxX = px - w / 2;
                const boxY = py - 30; 

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

    const drawGameBall = (ctx, x, y, radius, angle) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle); 

        const grad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.2, 0, 0, radius);
        grad.addColorStop(0, "#ff7675"); 
        grad.addColorStop(0.5, "#d63031"); 
        grad.addColorStop(1, "#631819"); 
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0);
        ctx.moveTo(0, -radius); ctx.lineTo(0, radius);
        ctx.stroke();

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

        if(p.trajectory.length > 0 || liveData.isRunning) {
            let bx = worldToScreenX(p.x, canvas.width);
            let by = worldToScreenY(p.y, canvas.height);
            let ballRadius = Math.max(6, p.view.scale * 0.5); 
            drawGameBall(ctx, bx, by, ballRadius, p.ballAngle);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveData.isRunning]);

    // --- INTERACTION LOGIC ---
    const handleWheel = (e) => {
        e.preventDefault();
        const p = physics.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const zoomFactor = 1.1;
        const direction = e.deltaY < 0 ? 1 : -1;
        const factor = direction > 0 ? zoomFactor : 1/zoomFactor;
        const newScale = Math.max(0.5, Math.min(100, p.view.scale * factor));

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const wx = screenToWorldX(mx, canvas.width);
        const wy = screenToWorldY(my, canvas.height);

        p.view.scale = newScale;

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

        if (p.view.isDragging) {
            p.view.x += mouseX - p.view.lmx;
            p.view.y -= mouseY - p.view.lmy; 
            p.view.lmx = mouseX;
            p.view.lmy = mouseY;
            draw();
            return;
        }

        if (!liveData.isRunning) {
            const cannonScreenX = worldToScreenX(p.params.x0, canvas.width);
            const cannonScreenY = worldToScreenY(p.params.y0, canvas.height);
            
            const dx = mouseX - cannonScreenX;
            const dy = cannonScreenY - mouseY; 
            
            let rawDeg = Math.atan2(dy, dx) * 180 / Math.PI;
            if (rawDeg < 0) rawDeg += 360; 
            
            let slope = p.params.slope || 0;
            
            let relativeAngle = rawDeg - slope;
            while (relativeAngle < -180) relativeAngle += 360;
            while (relativeAngle > 180) relativeAngle -= 360;

            let finalAngle = rawDeg;

            if (relativeAngle < 0) {
                if (relativeAngle > -90) {
                    finalAngle = slope;
                } else {
                    finalAngle = slope + 180;
                }
            } 
            p.angleDeg = (finalAngle + 360) % 360;

            if(onAngleChange) onAngleChange(p.angleDeg);
            draw();
        }
    };

    const handleTouchStart = (e) => {
        const p = physics.current;
        if (e.touches.length === 1) {
            p.view.isDragging = true;
            p.view.lmx = e.touches[0].clientX;
            p.view.lmy = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            p.touch.isPinching = true;
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

        if (e.touches.length === 1 && p.view.isDragging) {
            const mx = e.touches[0].clientX;
            const my = e.touches[0].clientY;
            const speed = 1.5; 
            p.view.x += (mx - p.view.lmx) * speed;
            p.view.y -= (my - p.view.lmy) * speed;
            
            p.view.lmx = mx;
            p.view.lmy = my;
            draw();
        } 
        else if (e.touches.length === 2 && p.touch.isPinching) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const zoomSpeed = 0.005; 
            const delta = dist - p.touch.lastDist;
            const factor = 1 + (delta * zoomSpeed);
            const newScale = Math.max(0.5, Math.min(50, p.view.scale * factor));
            
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
        if (e.touches.length < 2) p.touch.isPinching = false;
        if (e.touches.length === 0) p.view.isDragging = false;
    };

    const interactions = {
        handleWheel,     
        handleMouseMove,  
        handleTouchStart, 
        handleTouchMove, 
        handleTouchEnd    
    };

    // --- IMPROVED PHYSICS LOOP WITH RK4 AND ADAPTIVE TIMESTEP ---
    const updatePhysics = () => {
        const p = physics.current;
        
        // Use adaptive timestep
        const dt = adaptiveTimestep(p);
        
        // Use RK4 integration
        const result = rk4Step(p.x, p.y, p.vx, p.vy, dt, p);
        
        p.x = result.x;
        p.y = result.y;
        p.vx = result.vx;
        p.vy = result.vy;
        p.t += dt;
        
        // Ball rotation based on actual velocity
        const v = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        p.ballAngle += (v * dt) * 0.5; 

        if (p.y > p.maxHeight) p.maxHeight = p.y;
        p.trajectory.push({x: p.x, y: p.y});
    };

    const animate = () => {
        const p = physics.current;
        const speedMultiplier = 10; 

        const slopeRad = (p.params.slope || 0) * Math.PI / 180;
        const tanSlope = Math.tan(slopeRad);

        for(let i=0; i < speedMultiplier; i++) { 
            const prevX = p.x;
            const prevY = p.y;
            const prevT = p.t;
            
            updatePhysics();
            
            const groundHeight = p.x * tanSlope;
            
            if(p.y <= groundHeight && p.vy < 0) {
                // HIGH-PRECISION INTERPOLATION
                const prevDist = prevY - (prevX * tanSlope);
                const currDist = p.y - (p.x * tanSlope);
                
                // Use more accurate interpolation
                if (Math.abs(currDist - prevDist) > 1e-10) {
                    const fraction = prevDist / (prevDist - currDist);
                    
                    // Clamp fraction to valid range
                    const safeFraction = Math.max(0, Math.min(1, fraction));
                    
                    p.x = prevX + (p.x - prevX) * safeFraction;
                    p.y = prevY + (p.y - prevY) * safeFraction; 
                    p.t = prevT + (p.t - prevT) * safeFraction;
                    
                    // Interpolate velocity too for accuracy
                    p.vx = p.vx * (1 - safeFraction);
                    p.vy = p.vy * (1 - safeFraction);
                    
                    // This eliminates the small gap due to interpolation error
                    const exactGroundY = p.x * tanSlope;
                    p.y = exactGroundY;
                    
                    // This simulates perfect inelastic collision with ground
                    const nx = -Math.sin(slopeRad);
                    const ny = Math.cos(slopeRad);
                    const vn = p.vx * nx + p.vy * ny;
                    
                    // Remove normal component (coefficient of restitution = 0)
                    p.vx -= vn * nx;
                    p.vy -= vn * ny;
                }
                
                setLiveData(prev => ({ 
                    ...prev, isRunning: false, t: p.t, x: p.x, y: p.y, hMax: p.maxHeight 
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
        
        if (p.t > 0 && p.trajectory.length > 0) {
            const dataToSave = p.runParams && Object.keys(p.runParams).length > 0 ? p.runParams : p.params;
            const slopeRad = (dataToSave.slope || 0) * Math.PI / 180;
            const slantDistFromZero = Math.abs(p.x / Math.cos(slopeRad));
            
            setHistory({
                t: p.t,                    
                dist: p.x,                 
                slant: slantDistFromZero,  
                height: p.maxHeight,       
                impactY: p.y,             
                params: { ...dataToSave } 
            });
        }
        
        if(p.trajectory.length > 0) p.prevTrajectory = [...p.trajectory];
        
        if(params) {
            p.params = { ...p.params, ...params }; 
            p.angleDeg = params.ang;
        }
        p.runParams = { ...p.params };
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
        p.runParams = {};        
        
        if (canvas) {
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