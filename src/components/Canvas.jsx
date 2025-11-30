import { useEffect, useRef } from 'react';

export default function Canvas({ canvasRef, physics, draw, interactions, onAngleChange, onShoot }) {
    
    // Kita gunakan ref lokal untuk event listener agar tidak perlu re-bind terus
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;

        // Atur ukuran canvas sesuai container (Supaya tajam & fullscreen)
        const resize = () => {
            if(containerRef.current) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
                draw();
            }
        };
        // Resize observer lebih akurat daripada window resize biasa
        const ro = new ResizeObserver(resize);
        ro.observe(containerRef.current);
        // --- MOUSE EVENTS ---
        const onMouseDown = (e) => {
            if (e.button === 2 && physics.current) { 
                physics.current.view.isDragging = true;
                const rect = canvas.getBoundingClientRect();
                physics.current.view.lmx = e.clientX - rect.left;
                physics.current.view.lmy = e.clientY - rect.top;
            } else if (e.button === 0) {
                onShoot();
            }
        };
        const onMouseUp = () => { if(physics.current) physics.current.view.isDragging = false; };
        const onMouseMove = (e) => interactions?.handleMouseMove(e, onAngleChange);
        const onWheel = (e) => interactions?.handleWheel(e);
        const onContextMenu = (e) => e.preventDefault();
        // --- TOUCH EVENTS (MOBILE) ---
        const onTouchStart = (e) => {
            if(e.cancelable) e.preventDefault(); // Mencegah scroll halaman
            interactions?.handleTouchStart(e);
        };
        const onTouchMove = (e) => {
            if(e.cancelable) e.preventDefault();
            interactions?.handleTouchMove(e, onAngleChange);
        };
        const onTouchEnd = (e) => {
            interactions?.handleTouchEnd(e);
        };
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('contextmenu', onContextMenu);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        return () => {
            ro.disconnect();
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('mousemove', onMouseMove);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('contextmenu', onContextMenu);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
        };
    }, [canvasRef, draw, interactions, physics, onAngleChange, onShoot]);

    return (
        <div ref={containerRef} className="flex-1 relative w-full h-[50vh] md:h-auto overflow-hidden rounded-2xl shadow-inner bg-slate-50 border border-slate-200">
            <canvas 
                ref={canvasRef}
                className="block cursor-move touch-none w-full h-full"
            />
            {/* Overlay Controls Hint (Responsive Text) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] md:text-xs font-bold text-slate-600 pointer-events-none border border-slate-200 shadow-lg flex gap-3 whitespace-nowrap z-10">
                <span className="hidden md:inline">🖱️ <b>Kiri:</b> Tembak</span>
                <span className="hidden md:inline">🖐️ <b>Kanan:</b> Geser</span>
                <span className="md:hidden">👆 <b>1 Jari:</b> Geser</span>
                <span className="md:hidden">✌️ <b>2 Jari:</b> Zoom</span>
            </div>
        </div>
    );
}