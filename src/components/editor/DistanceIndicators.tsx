import { useEffect, useRef } from 'react';

interface DistanceIndicator {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    distance: number;
    orientation: 'horizontal' | 'vertical';
}

interface DistanceIndicatorsProps {
    width: number;
    height: number;
    indicators: DistanceIndicator[];
}

export function DistanceIndicators({ width, height, indicators }: DistanceIndicatorsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawIndicators();
    }, [indicators, width, height]);

    const drawIndicators = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each indicator
        indicators.forEach(indicator => {
            drawDistanceIndicator(ctx, indicator);
        });
    };

    const drawDistanceIndicator = (ctx: CanvasRenderingContext2D, indicator: DistanceIndicator) => {
        const { x1, y1, x2, y2, distance, orientation } = indicator;

        // Style
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (orientation === 'horizontal') {
            // Draw horizontal line
            const y = (y1 + y2) / 2;

            // Main line
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();

            // End caps
            drawCap(ctx, x1, y, 'vertical');
            drawCap(ctx, x2, y, 'vertical');

            // Distance label with background
            const midX = (x1 + x2) / 2;
            const label = `${distance.toFixed(1)}mm`;
            const metrics = ctx.measureText(label);
            const padding = 4;
            const bgWidth = metrics.width + padding * 2;
            const bgHeight = 16;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(midX - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

            // Border
            ctx.strokeStyle = '#3b82f6';
            ctx.strokeRect(midX - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

            // Text
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(label, midX, y);

        } else {
            // Draw vertical line
            const x = (x1 + x2) / 2;

            // Main line
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();

            // End caps
            drawCap(ctx, x, y1, 'horizontal');
            drawCap(ctx, x, y2, 'horizontal');

            // Distance label with background
            const midY = (y1 + y2) / 2;
            const label = `${distance.toFixed(1)}mm`;
            const metrics = ctx.measureText(label);
            const padding = 4;
            const bgWidth = metrics.width + padding * 2;
            const bgHeight = 16;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.save();
            ctx.translate(x, midY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

            // Border
            ctx.strokeStyle = '#3b82f6';
            ctx.strokeRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);

            // Text
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(label, 0, 0);
            ctx.restore();
        }
    };

    const drawCap = (ctx: CanvasRenderingContext2D, x: number, y: number, orientation: 'horizontal' | 'vertical') => {
        const capSize = 4;
        ctx.beginPath();
        if (orientation === 'horizontal') {
            ctx.moveTo(x - capSize, y);
            ctx.lineTo(x + capSize, y);
        } else {
            ctx.moveTo(x, y - capSize);
            ctx.lineTo(x, y + capSize);
        }
        ctx.stroke();
    };

    if (indicators.length === 0) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width, height }}
        />
    );
}
