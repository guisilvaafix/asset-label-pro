import { ReactNode } from 'react';
import { useLabelStore } from '@/store/labelStore';

interface CanvasWithRulersProps {
    children: ReactNode;
    width: number; // Canvas width in pixels
    height: number; // Canvas height in pixels
    mmToPx: number; // Conversion factor
}

export function CanvasWithRulers({ children, width, height, mmToPx }: CanvasWithRulersProps) {
    const { zoom } = useLabelStore();

    return (
        <div className="relative inline-block">
            {/* Center marker (optional - shows center of canvas) */}
            <div
                className="absolute pointer-events-none z-10"
                style={{
                    left: width / 2 - 10,
                    top: height / 2 - 10,
                    width: 20,
                    height: 20,
                }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" className="opacity-20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="10" y1="0" x2="10" y2="20" stroke="#3b82f6" strokeWidth="1" />
                    <line x1="0" y1="10" x2="20" y2="10" stroke="#3b82f6" strokeWidth="1" />
                </svg>
            </div>

            {/* Canvas content */}
            {children}

            {/* Dimensions display */}
            <div className="absolute left-0 bottom-[-24px] text-xs text-muted-foreground font-mono">
                {(width / mmToPx).toFixed(1)} × {(height / mmToPx).toFixed(1)} mm
            </div>
        </div>
    );
}
