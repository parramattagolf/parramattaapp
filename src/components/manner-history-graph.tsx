'use client'

import { useMemo } from 'react'

interface HistoryItem {
    created_at: string
    score_snapshot: number
    amount: number
    description: string
}

export default function MannerHistoryGraph({ history }: { history: HistoryItem[] }) {
    // Ensure chronological order
    const data = useMemo(() => {
        return [...history].reverse()
    }, [history])

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
                변동 기록 없음
            </div>
        )
    }

    // Determine Y axis scale
    const scores = data.map(d => d.score_snapshot)
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)
    const range = maxScore - minScore || 10 // avoid division by zero
    const padding = range * 0.2
    const yMin = minScore - padding
    const yMax = maxScore + padding
    const yRange = yMax - yMin || 1

    // Graph dimensions
    const width = 100
    const height = 100 // viewbox units

    const getX = (index: number) => {
        if (data.length <= 1) return 50
        return (index / (data.length - 1)) * width
    }

    const getY = (score: number) => {
        // Invert Y because SVG 0 is top
        const normalized = (score - yMin) / yRange
        return height - (normalized * height)
    }

    // Build path
    const points = data.map((d, i) => `${getX(i)},${getY(d.score_snapshot)}`).join(' ')
    const isTrendingUp = (data[data.length - 1]?.score_snapshot ?? 0) >= (data[0]?.score_snapshot ?? 0)
    const lineColor = isTrendingUp ? '#10b981' : '#ef4444' // emerald-500 or red-500

    // Gradient fill path
    const fillPath = `
        ${points} 
        ${getX(data.length - 1)},${height} 
        ${getX(0)},${height}
    `

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="absolute top-2 right-2 text-[10px] text-gray-400 font-mono z-10">
                Recent 5
            </div>
            
            <div className="flex-1 w-full relative">
                <svg 
                    viewBox={`0 0 ${width} ${height}`} 
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    <defs>
                        <linearGradient id="gradientDetails" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    {data.length > 1 && (
                        <polygon points={fillPath} fill="url(#gradientDetails)" />
                    )}

                    {/* Line */}
                    {data.length > 1 && (
                        <polyline 
                            points={points} 
                            fill="none" 
                            stroke={lineColor} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                    )}

                    {/* Dots */}
                    {data.map((d, i) => (
                        <circle 
                            key={i}
                            cx={getX(i)}
                            cy={getY(d.score_snapshot)}
                            r="2"
                            fill="#121212"
                            stroke={lineColor}
                            strokeWidth="1.5"
                        />
                    ))}

                    {/* Labels for first and last */}
                    {data.length > 0 && (
                        <>
                            {/* First point label */}
                            <text 
                                x={getX(0)} 
                                y={getY(data[0].score_snapshot) - 5} 
                                textAnchor="start" 
                                fontSize="8" 
                                fill="#6b7280"
                                className="font-mono"
                            >
                                {data[0].score_snapshot}
                            </text>
                            
                            {/* Last point label */}
                            <text 
                                x={getX(data.length - 1)} 
                                y={getY(data[data.length - 1].score_snapshot) - 5} 
                                textAnchor="end" 
                                fontSize="10" 
                                fontWeight="bold" 
                                fill={lineColor}
                                className="font-mono"
                            >
                                {data[data.length - 1].score_snapshot}
                            </text>
                        </>
                    )}
                </svg>
            </div>
        </div>
    )
}
