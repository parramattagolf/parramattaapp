'use client'

import { useMemo } from 'react'

interface HistoryItem {
    created_at: string
    score_snapshot: number
    amount: number
    description: string
}

export default function MannerPulseGraph({ history }: { history: HistoryItem[] }) {
    const data = useMemo(() => {
        // Ensure chronological order for the path
        return [...history].reverse()
    }, [history])

    // Determine Y axis scale
    const scores = data.length > 0 ? data.map(d => d.score_snapshot) : [100];
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 20;
    const padding = range * 0.3;
    const yMin = minScore - padding;
    const yMax = maxScore + padding;
    const yRange = yMax - yMin || 1;

    // Graph dimensions (viewBox units)
    const width = 1000;
    const height = 100;

    const getX = (index: number) => {
        if (data.length <= 1) return (index / 1) * width;
        return (index / (data.length - 1)) * width;
    };

    const getY = (score: number) => {
        const normalized = (score - yMin) / yRange;
        return height - (normalized * height);
    };

    // Build the SVG path
    let dPath = '';
    if (data.length > 1) {
        const points = data.map((d, i) => ({ x: getX(i), y: getY(d.score_snapshot) }));
        dPath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    } else {
        // Flat line for no data or single point
        dPath = `M 0 ${height/2} L ${width} ${height/2}`;
    }

    const isTrendingUp = data.length > 1 
        ? (data[data.length - 1]?.score_snapshot ?? 0) >= (data[0]?.score_snapshot ?? 0)
        : true;
    const pulseColor = isTrendingUp ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500

    return (
        <div className="w-full h-12 relative overflow-hidden bg-white/[0.02] rounded-lg border border-white/5">
            {/* Label */}
            <div className="absolute top-1 left-2 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] z-10">
                Manner Pulse
            </div>

            {/* Background grid-like lines (subtle EKG paper feel) */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <div className="w-full h-[1px] bg-white absolute top-1/2" />
                <div className="w-[1px] h-full bg-white absolute left-1/4" />
                <div className="w-[1px] h-full bg-white absolute left-2/4" />
                <div className="w-[1px] h-full bg-white absolute left-3/4" />
            </div>

            <svg 
                viewBox={`0 0 ${width} ${height}`} 
                preserveAspectRatio="none"
                className="w-full h-full block"
            >
                <defs>
                    <filter id="pulseGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* The Pulse Path (Static Base) */}
                <path
                    d={dPath}
                    fill="none"
                    stroke={pulseColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.2"
                />

                {/* The Active Pulse Path (Animated Pulse) */}
                <path
                    d={dPath}
                    fill="none"
                    stroke={pulseColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#pulseGlow)"
                    className="ekg-line"
                />

                {/* Moving Pulse Overlay (The EKG trace effect) */}
                <path
                    d={dPath}
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeOpacity="0.6"
                    strokeDasharray="100 900"
                    strokeDashoffset="1000"
                    className="ekg-trace"
                />
            </svg>

            {/* Animation CSS */}
            <style jsx>{`
                .ekg-line {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                .ekg-trace {
                    animation: ekg-move 3s linear infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.6; stroke-width: 2; }
                    50% { opacity: 1; stroke-width: 2.5; }
                }
                @keyframes ekg-move {
                    from { stroke-dashoffset: 1000; }
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    )
}
