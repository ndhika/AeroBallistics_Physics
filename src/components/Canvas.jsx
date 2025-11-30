import React, { useEffect } from 'react';

export default function Canvas({ canvasRef, physics, draw }) {

    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;

        // Mouse Dragging Logic
        let isDragging = false;
        let lmx = 0, lmy = 0;

        const onMouseDown = (e) => {
            if(e.button === 2) { // Kanan
                isDragging = true; lmx = e.clientX; lmy = e.clientY;
                if(physics.current) physics.current.view.isDragging = true;
            }
        };

        const onMouseMove = (e) => {
            if(isDragging && physics.current) {
                physics.current.view.x += e.clientX - lmx;
                physics.current.view.y += e.clientY - lmy;
                lmx = e.clientX; 
                lmy = e.clientY;
                draw();
            }
        };

        const onMouseUp = () => { isDragging = false; if(physics.current) physics.current.view.isDragging = false; };
        
        const onWheel = (e) => {
            e.preventDefault();
            if(!physics.current) return;
            let sc = e.deltaY < 0 ? 1.1 : 0.9;
            physics.current.view.scale = Math.max(0.2, Math.min(50, physics.current.view.scale * sc));
            draw();
        };

        // Context Menu prevent
        const onContextMenu = (e) => e.preventDefault();

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('contextmenu', onContextMenu);

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('contextmenu', onContextMenu);
        };
    }, [canvasRef, physics, draw]);

    return (
        <div className="flex-1 relative overflow-hidden rounded-xl shadow-2xl h-[400px] md:h-auto">
            <canvas 
                ref={canvasRef}
                width={800} height={600}
                className="w-full h-full bg-white cursor-grab active:cursor-grabbing touch-none block"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-1.5 rounded-full text-xs pointer-events-none whitespace-nowrap hidden md:block">
                🖱️ <b>Klik Kiri:</b> Tembak (di Panel) | 🖐️ <b>Klik Kanan:</b> Geser Kamera | 🔍 <b>Scroll:</b> Zoom
            </div>
        </div>
    );
}