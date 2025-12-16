import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
    );
}

interface LoadingOverlayProps {
    text?: string;
}

export function LoadingOverlay({ text = 'Carregando...' }: LoadingOverlayProps) {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted',
                className
            )}
        />
    );
}

export function SheetPreviewSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b border-border">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-6 rounded" />
                </div>
            </div>

            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="flex-1 h-2" />
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-10" />
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
                <Skeleton className="w-full max-w-2xl aspect-[210/297]" />
            </div>
        </div>
    );
}

export function LabelCanvasSkeleton() {
    return (
        <div className="flex-1 flex items-center justify-center bg-muted/10 p-8">
            <div className="relative">
                <Skeleton className="w-96 h-64" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner text="Carregando editor..." />
                </div>
            </div>
        </div>
    );
}
