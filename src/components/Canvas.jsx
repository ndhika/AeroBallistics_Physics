import { useEffect, useRef } from 'react';
import useSimulation from '../hooks/useSimulation';

export default function Canvas({ 
    params, state, view, trajectory, prevTrajectory,
    setView, setParams, startSimulation, setTrajectory 
}) {

    const canvasRef = useRef(null);

  // ======================================================
  // WORLD → SCREEN
    const worldToScreenX = (wx, vw) => (wx * vw.scale) + vw.x + 20;
    const worldToScreenY = (wy, vw, height) =>
    (height - 40) - (wy * vw.scale) + vw.y;

  // ======================================================
  // DRAW ENVIRONMENT (sky, grid, ground)
  const drawEnvironment = (ctx, w, h, vw, params) => {
    let grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#89CFF0");
    grad.addColorStop(1, "#f0f8ff");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // GRID
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    let step = vw.scale < 3 ? 50 : 10;

    let sx = Math.floor((-vw.x) / (step * vw.scale)) * step;
    let ex = sx + (w / vw.scale) + 20;
    let sy = Math.floor(vw.y / (step * vw.scale)) * step;
    let ey = sy + (h / vw.scale) + 20;

    let minGridY = Math.min(
      -100,
      Math.floor(params.y0 / step) * step - step
    );

    for (let i = sx; i <= ex; i += step) {
      let px = worldToScreenX(i, vw);
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
    }

    for (let j = minGridY; j <= ey; j += step) {
      let py = worldToScreenY(j, vw, h);
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
    }

    ctx.stroke();

    // GROUND
    let gy = worldToScreenY(0, vw, h);
    ctx.fillStyle = "#55b76d";
    ctx.fillRect(0, gy, w, h - gy);

    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.strokeStyle = "#408c50";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // ======================================================
  // DRAW STRUCTURE (GEDUNG / PARIT)
  const drawStructure = (ctx, x0, y0, vw, w, h) => {
    let sx = worldToScreenX(x0, vw);
    let sy = worldToScreenY(y0, vw, h);
    let gy = worldToScreenY(0, vw, h);

    let bw = 40 * Math.max(0.6, Math.min(1.2, vw.scale / 5));

    if (y0 > 0) {
      // GEDUNG
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(sx - bw/2, sy, bw, gy - sy);

    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - bw/2, sy, bw, gy - sy);

    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(sx - bw/2 - 5, sy, bw + 10, 5);

    } else if (y0 < 0) {
      // PARIT
      let holeWidth = bw * 1.5;

      ctx.fillStyle = "#89CFF0";
      ctx.fillRect(sx - holeWidth/2, gy, holeWidth, sy - gy);

      ctx.strokeStyle = "#408c50";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(sx - holeWidth/2, gy);
      ctx.lineTo(sx - holeWidth/2, sy);
      ctx.lineTo(sx + holeWidth/2, sy);
      ctx.lineTo(sx + holeWidth/2, gy);
      ctx.stroke();

      ctx.fillStyle = "#7f8c8d";
      ctx.fillRect(sx - bw/2 - 5, sy, bw + 10, 5);
    }
  };

  // ======================================================
  // DRAW CANNON
  const drawCannon = (ctx, vw, w, h, params) => {
    let { x0, y0, angle } = params;

    drawStructure(ctx, x0, y0, vw, w, h);

    let px = worldToScreenX(x0, vw);
    let py = worldToScreenY(y0, vw, h);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-angle * Math.PI / 180);

    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.roundRect(0, -9, 50, 18, 5);
    ctx.fill();

    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.roundRect(10, -5, 15, 10, 2);
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#2c3e50";
    ctx.fill();

    ctx.strokeStyle = "#ecf0f1";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // ======================================================
  // DRAW TRAJECTORY
  const drawTrajectory = (ctx, traj, vw, w, h, color, isPrev) => {
    if (traj.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash(isPrev ? [10,5] : [5,5]);

    ctx.moveTo(
      worldToScreenX(traj[0].x, vw),
      worldToScreenY(traj[0].y, vw, h)
    );

    for (let i = 1; i < traj.length; i++) {
      let px = worldToScreenX(traj[i].x, vw);
      let py = worldToScreenY(traj[i].y, vw, h);
      ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  };

  // ======================================================
  // MAIN DRAW
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    drawEnvironment(ctx, w, h, view, params);
    drawCannon(ctx, view, w, h, params);
    drawTrajectory(ctx, prevTrajectory, view, w, h, "rgba(52,152,219,0.6)", true);
    drawTrajectory(ctx, trajectory, view, w, h, "#e74c3c", false);

    // BALL
    if (trajectory.length > 0 || state.running) {
      let bx = worldToScreenX(state.running ? state.x : params.x0, view);
      let by = worldToScreenY(state.running ? state.y : params.y0, view, h);

      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#f1c40f";
      ctx.fill();
    }
  };

  // ======================================================
  // AUTO DRAW ON STATE CHANGE
  useEffect(() => {
    draw();
  }, [params, state, trajectory, prevTrajectory, view]);

  // ======================================================
  // MOUSE EVENTS
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      startSimulation();
    } else if (e.button === 2) {
      setView(v => ({ ...v, dragging: true, lastX: e.clientX, lastY: e.clientY }));
    }
  };

  const handleMouseMove = (e) => {
    if (!view.dragging) return;

    setView((v) => ({
      ...v,
      x: v.x + (e.clientX - v.lastX),
      y: v.y + (e.clientY - v.lastY),
      lastX: e.clientX,
      lastY: e.clientY
    }));
  };

  const handleMouseUp = () => {
    setView(v => ({ ...v, dragging: false }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    let scale = e.deltaY < 0 ? view.scale * 1.1 : view.scale * 0.9;

    setView(v => ({
      ...v,
      scale: Math.max(0.2, Math.min(50, scale))
    }));
  };

  return (
    <div className="flex-1 relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full bg-white rounded-xl shadow-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 
                      bg-black/70 text-white px-4 py-1 rounded-full 
                      text-xs pointer-events-none whitespace-nowrap">
        🖱️ Klik Kiri: Tembak | 🖐️ Klik Kanan: Geser Kamera | 🔍 Scroll: Zoom
      </div>
    </div>
  );
}
