'use client'

import { useEffect, useState } from 'react'
import { fetchYoutubePlaylist } from '@/actions/youtube-actions'

interface MyYoutubeEmbedProps {
    nickname: string
}

export default function MyYoutubeEmbed({ nickname }: MyYoutubeEmbedProps) {
    const [videoId, setVideoId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const playlistId = 'PLpf6bXUHPOxAL93x95ugCLwzXqQlpgRpd'
                const data = await fetchYoutubePlaylist(playlistId)

                if (data && data.items && data.items.length > 0) {
                    const items = data.items
                    
                    // Simple similarity search: Check if nickname is included in title, 
                    // or find the one with the most common characters.
                    // For now, let's look for an exact inclusion or shared words.
                    let bestMatch = null
                    let maxMatchScore = 0

                    for (const item of items) {
                        const title = item.snippet.title.toLowerCase()
                        const lowerNickname = nickname.toLowerCase()
                        
                        // Check for exact inclusion
                        if (title.includes(lowerNickname)) {
                            bestMatch = item.snippet.resourceId.videoId
                            break // High priority match found
                        }

                        // Fallback: simple character matching score
                        let score = 0
                        const nicknameChars = lowerNickname.split('')
                        nicknameChars.forEach(char => {
                            if (title.includes(char)) score++
                        })

                        if (score > maxMatchScore) {
                            maxMatchScore = score
                            bestMatch = item.snippet.resourceId.videoId
                        }
                    }

                    // If score is too low or no match found, pick random
                    if (!bestMatch || maxMatchScore < 2) {
                        const randomIndex = Math.floor(Math.random() * items.length)
                        bestMatch = items[randomIndex].snippet.resourceId.videoId
                    }

                    setVideoId(bestMatch)
                }
            } catch (error) {
                console.error('Failed to fetch YouTube playlist for MyPage:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchVideo()
    }, [nickname])

    return (
        <div className="px-4 mt-6">
            <div className="rounded-[24px] overflow-hidden border border-white/10 shadow-xl bg-[#1c1c1e]">
                <div className="aspect-video w-full">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#2c2c2e]">
                            <div className="text-white/40 text-sm animate-pulse">회원님을 위한 영상 로딩 중...</div>
                        </div>
                    ) : videoId ? (
                        <iframe 
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                            title="YouTube video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            referrerPolicy="strict-origin-when-cross-origin" 
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2c2c2e]">
                            <div className="text-white/40 text-sm">추천 영상을 불러올 수 없습니다.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
