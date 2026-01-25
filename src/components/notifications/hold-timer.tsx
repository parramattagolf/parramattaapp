'use client'

import React, { useEffect, useState } from 'react'

interface HoldTimerProps {
    createdAt: string
}

export default function HoldTimer({ createdAt }: HoldTimerProps) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const updateTimer = () => {
            const createdTime = new Date(createdAt).getTime()
            const expireTime = createdTime + (6 * 60 * 60 * 1000) // 6 hours
            const now = new Date().getTime()
            const diff = expireTime - now

            if (diff <= 0) {
                setTimeLeft('만료됨')
                return
            }

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [createdAt])

    return (
        <span className="text-red-400 font-bold ml-1">
            (남은 시간: {timeLeft})
        </span>
    )
}
