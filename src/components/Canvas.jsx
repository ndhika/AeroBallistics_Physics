import { useEffect, useRef } from 'react';

export default function Canvas({ canvasRef, physics, draw, interactions, onAngleChange, onShoot }) {
    
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;

        const resize = () => {
            if(containerRef.current) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
                draw();
            }
        };

        const ro = new ResizeObserver(resize);
        if (containerRef.current) ro.observe(containerRef.current);

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
        const onTouchStart = (e) => { if(e.cancelable) e.preventDefault(); interactions?.handleTouchStart(e); };
        const onTouchMove = (e) => { if(e.cancelable) e.preventDefault(); interactions?.handleTouchMove(e, onAngleChange); };
        const onTouchEnd = (e) => { interactions?.handleTouchEnd(e); };

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
        <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-slate-200 cursor-move">
            <canvas 
                ref={canvasRef}
                className="block w-full h-full touch-none"
            />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold text-slate-500 pointer-events-none border border-white/50 shadow-sm flex gap-4 select-none z-0">
                <span className="hidden md:inline">🖱️ Kiri: Tembak</span>
                <span className="hidden md:inline">🖐️ Kanan: Geser</span>
                <span className="md:hidden">👆 1 Jari: Geser</span>
                <span className="md:hidden">✌️ 2 Jari: Zoom</span>
            </div>
        </div>
    );
}