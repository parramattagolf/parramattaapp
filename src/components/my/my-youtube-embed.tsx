'use client'

import { useEffect, useState } from 'react'
import { fetchYoutubePlaylist } from '@/actions/youtube-actions'
import { createClient } from '@/utils/supabase/client'

interface MyYoutubeEmbedProps {
    nickname: string
}

export default function MyYoutubeEmbed({ nickname }: MyYoutubeEmbedProps) {
    const [videoId, setVideoId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [rewardReceived, setRewardReceived] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch YouTube Reward Status
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('youtube_reward_received')
                        .eq('id', user.id)
                        .single()
                    
                    if (userData) {
                        setRewardReceived(userData.youtube_reward_received)
                    }
                }

                // 2. Fetch Video
                const playlistId = 'UU0MeKM-YQZ7Kh1o1UMjUObg'
                const data = await fetchYoutubePlaylist(playlistId)

                if (data && data.items && data.items.length > 0) {
                    const items = data.items
                    
                    let bestMatch = null
                    let maxMatchScore = 0

                    for (const item of items) {
                        const title = item.snippet.title.toLowerCase()
                        const lowerNickname = nickname.toLowerCase()
                        
                        if (title.includes(lowerNickname)) {
                            bestMatch = item.snippet.resourceId.videoId
                            break
                        }

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

                    if (!bestMatch || maxMatchScore < 2) {
                        const randomIndex = Math.floor(Math.random() * items.length)
                        bestMatch = items[randomIndex].snippet.resourceId.videoId
                    }

                    setVideoId(bestMatch)
                }
            } catch (error) {
                console.error('Failed to fetch data for MyYoutubeEmbed:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [nickname, supabase])

    const handleSubscribeAndReward = async () => {
        if (rewardReceived) return;

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { error } = await supabase.rpc('reward_youtube_subscription', { target_user_id: user.id })
            if (!error) {
                setRewardReceived(true);
            }
        }
    }

    return (
        <div className="px-4 mt-6">
            {/* YouTube Channel Subscription Link */}
            <div className="mb-4">
                <a 
                    href="https://www.youtube.com/channel/UC0MeKM-YQZ7Kh1o1UMjUObg?sub_confirmation=1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleSubscribeAndReward}
                    className={`w-full flex items-center justify-between p-5 rounded-[28px] group active:scale-[0.98] transition-all duration-300 border ${
                        rewardReceived 
                            ? 'bg-white/5 border-white/10 opacity-60' 
                            : 'bg-[#FF0000]/5 border-[#FF0000]/20'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-[#FF0000]">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[15px] font-black text-white tracking-tighter leading-none">파라마타 골프 TV</span>
                            {rewardReceived ? (
                                <span className="text-[11px] text-emerald-400 font-bold mt-1.5 uppercase tracking-wider">포인트 리워드 지급 완료 ✓</span>
                            ) : (
                                <span className="text-[11px] text-[#FF0000] font-bold mt-1.5 uppercase tracking-wider animate-pulse">구독하면 100포인트 리워드</span>
                            )}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-white/10 group-hover:text-white transition-colors">
                        →
                    </div>
                </a>
            </div>

            <div className="rounded-[24px] overflow-hidden border border-white/10 bg-[#1c1c1e]">
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
