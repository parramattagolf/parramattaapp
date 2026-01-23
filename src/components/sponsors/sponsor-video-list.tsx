'use client'

import { useEffect, useState } from 'react'
import { fetchYoutubePlaylist } from '@/actions/youtube-actions'

export default function SponsorVideoList() {
    const [videoId, setVideoId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const playlistId = 'PLpf6bXUHPOxCPBUBXwh8PNG6zElh8BIIJ'
                const data = await fetchYoutubePlaylist(playlistId)

                if (data && data.items && data.items.length > 0) {
                    const items = data.items
                    const randomIndex = Math.floor(Math.random() * items.length)
                    const randomVideoId = items[randomIndex].snippet.resourceId.videoId
                    
                    setVideoId(randomVideoId)
                }
            } catch (error) {
                console.error('Failed to fetch YouTube playlist for SponsorPage:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchVideo()
    }, [])

    return (
        <div className="mt-8 mb-6">
            <div className="rounded-[24px] overflow-hidden border border-white/10 shadow-xl bg-[#1c1c1e]">
                <div className="aspect-video w-full">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#2c2c2e]">
                            <div className="text-white/40 text-sm animate-pulse">영상 로딩 중...</div>
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
                            <div className="text-white/40 text-sm">영상을 불러올 수 없습니다.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
