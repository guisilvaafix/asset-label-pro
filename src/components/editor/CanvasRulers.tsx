import { useEffect, useRef } from 'react';

interface CanvasRulersProps {
    width: number; // Canvas width in pixels
    height: number; // Canvas height in pixels
    zoom: number; // Zoom level (100 = 100%)
    mmToPx: number; // Conversion factor
}

export function CanvasRulers({ width, height, zoom, mmToPx }: CanvasRulersProps) {
    const horizontalRulerRef = useRef<HTMLCanvasElement>(null);
    const verticalRulerRef = useRef<HTMLCanvasElement>(null);

    const RULER_SIZE = 32; // Ruler thickness in pixels (aumentado para melhor legibilidade)
    const MAJOR_TICK_SIZE = 14;
    const MINOR_TICK_SIZE = 8;
    const TINY_TICK_SIZE = 4;

    useEffect(() => {
        drawHorizontalRuler();
        drawVerticalRuler();
    }, [width, height, zoom, mmToPx]);

    const drawHorizontalRuler = () => {
        const canvas = horizontalRulerRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = RULER_SIZE * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${RULER_SIZE}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, RULER_SIZE);

        // Background with subtle gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, RULER_SIZE);
        gradient.addColorStop(0, '#fafbfc');
        gradient.addColorStop(1, '#f3f4f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, RULER_SIZE);

        // Bottom border with shadow effect
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, RULER_SIZE - 0.5);
        ctx.lineTo(width, RULER_SIZE - 0.5);
        ctx.stroke();

        // Subtle inner shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, RULER_SIZE - 2, width, 2);

        const widthMm = width / mmToPx;
        const step = determineStep(widthMm, width);

        // Draw ticks and labels
        for (let mm = 0; mm <= widthMm; mm += step.minor) {
            const x = mm * mmToPx;

            if (x > width) break;

            const isMajor = mm % step.major === 0;
            const isMinor = mm % step.medium === 0;

            let tickSize = TINY_TICK_SIZE;
            let strokeStyle = '#9ca3af';
            let lineWidth = 0.5;

            if (isMajor) {
                tickSize = MAJOR_TICK_SIZE;
                strokeStyle = '#4b5563';
                lineWidth = 1;
            } else if (isMinor) {
                tickSize = MINOR_TICK_SIZE;
                strokeStyle = '#6b7280';
                lineWidth = 0.75;
            }

            // Draw tick
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x, RULER_SIZE - tickSize);
            ctx.lineTo(x, RULER_SIZE);
            ctx.stroke();

            // Draw label for major ticks
            if (isMajor) {
                ctx.fillStyle = '#374151';
                ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(mm.toString(), x, 4);
            }
        }
    };

    const drawVerticalRuler = () => {
        const canvas = verticalRulerRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size with device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = RULER_SIZE * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${RULER_SIZE}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, RULER_SIZE, height);

        // Background with subtle gradient
        const gradient = ctx.createLinearGradient(0, 0, RULER_SIZE, 0);
        gradient.addColorStop(0, '#fafbfc');
        gradient.addColorStop(1, '#f3f4f6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, RULER_SIZE, height);

        // Right border with shadow effect
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(RULER_SIZE - 0.5, 0);
        ctx.lineTo(RULER_SIZE - 0.5, height);
        ctx.stroke();

        // Subtle inner shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(RULER_SIZE - 2, 0, 2, height);

        const heightMm = height / mmToPx;
        const step = determineStep(heightMm, height);

        // Draw ticks and labels
        for (let mm = 0; mm <= heightMm; mm += step.minor) {
            const y = mm * mmToPx;

            if (y > height) break;

            const isMajor = mm % step.major === 0;
            const isMinor = mm % step.medium === 0;

            let tickSize = TINY_TICK_SIZE;
            let strokeStyle = '#9ca3af';
            let lineWidth = 0.5;

            if (isMajor) {
                tickSize = MAJOR_TICK_SIZE;
                strokeStyle = '#4b5563';
                lineWidth = 1;
            } else if (isMinor) {
                tickSize = MINOR_TICK_SIZE;
                strokeStyle = '#6b7280';
                lineWidth = 0.75;
            }

            // Draw tick
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(RULER_SIZE - tickSize, y);
            ctx.lineTo(RULER_SIZE, y);
            ctx.stroke();

            // Draw label for major ticks (rotated)
            if (isMajor) {
                ctx.save();
                ctx.translate(RULER_SIZE - MAJOR_TICK_SIZE - 6, y);
                ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = '#374151';
                ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(mm.toString(), 0, 0);
                ctx.restore();
            }
        }
    };

    // Determine appropriate step sizes based on zoom level
    const determineStep = (totalMm: number, totalPx: number) => {
        const mmPerPx = totalMm / totalPx;
        const targetMajorPx = 80; // Aim for major ticks every ~80px (mais denso)
        const targetMajorMm = mmPerPx * targetMajorPx;

        // Find nice round number for major ticks
        let major = 10;
        if (targetMajorMm > 50) major = 100;
        else if (targetMajorMm > 20) major = 50;
        else if (targetMajorMm > 10) major = 20;
        else if (targetMajorMm > 5) major = 10;
        else if (targetMajorMm > 2) major = 5;
        else if (targetMajorMm > 1) major = 2;
        else major = 1;

        return {
            major,
            medium: major / 2,
            minor: major / 10,
        };
    };

    return (
        <>
            {/* Horizontal Ruler */}
            <canvas
                ref={horizontalRulerRef}
                className="absolute left-[32px] top-0 pointer-events-none"
            />

            {/* Vertical Ruler */}
            <canvas
                ref={verticalRulerRef}
                className="absolute left-0 top-[32px] pointer-events-none"
            />

            {/* Corner square - Redesigned */}
            <div
                className="absolute left-0 top-0 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-b border-slate-300 shadow-sm"
                style={{ width: RULER_SIZE, height: RULER_SIZE }}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center justify-center">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            className="text-slate-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            {/* Ruler icon */}
                            <path d="M2 2h12v12H2z" />
                            <path d="M2 6h2M2 10h2M6 2v2M10 2v2M14 6h-2M14 10h-2M6 14v-2M10 14v-2" strokeLinecap="round" />
                        </svg>
                        <span className="text-[8px] font-semibold text-slate-500 mt-0.5 tracking-wide">mm</span>
                    </div>
                </div>
            </div>
        </>
    );
}
