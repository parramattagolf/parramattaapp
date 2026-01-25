'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import PremiumSubHeader from '@/components/premium-sub-header'
import { Trophy, ArrowRight, Award, ChevronDown } from 'lucide-react'
import { getUserBadges } from '@/actions/sponsor-actions'

export default function MySponsorsPage() {
    const [badges, setBadges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [visibleCount, setVisibleCount] = useState(5)
    
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                const data = await getUserBadges(user.id)
                setBadges(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 5)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const visibleBadges = badges.slice(0, visibleCount)

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="나의 스폰서" backHref="/my" />

            <div className="pt-24 px-5">
                {/* Intro Card */}
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 rounded-3xl p-6 mb-8 border border-yellow-500/20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-0.5">스폰서십 현황</h2>
                            <p className="text-sm text-white/50">획득한 배지와 혜택을 확인하세요</p>
                        </div>
                    </div>
                </div>

                {/* Badges Grid or List */}
                {badges.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {visibleBadges.map((badge: any) => (
                                <div key={badge.id} className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-5 flex flex-col items-center text-center group active:scale-[0.98] transition-all relative overflow-hidden">
                                    {/* Glow Effect */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-3 border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
                                        {badge.sponsor?.logo_url ? (
                                            <img src={badge.sponsor.logo_url} alt="" className="w-10 h-10 object-contain" />
                                        ) : (
                                            <Award size={32} className="text-yellow-500" />
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold text-sm mb-1">{badge.sponsor?.name}</h3>
                                    <p className="text-white/40 text-[10px] mb-3">{new Date(badge.earned_at).toLocaleDateString()}</p>
                                    
                                    <div className="bg-white/5 w-full py-2 rounded-lg">
                                        <p className="text-[11px] text-yellow-500 font-bold">{badge.product?.name || '스폰서 배지'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {visibleCount < badges.length && (
                            <button 
                                onClick={handleLoadMore}
                                className="w-full mt-6 py-4 bg-[#1c1c1e] border border-white/5 rounded-2xl text-white/60 font-bold text-sm hover:text-white hover:bg-[#2c2c2e] transition-all flex items-center justify-center gap-2"
                            >
                                <span>더보기</span>
                                <ChevronDown size={16} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="py-12 bg-[#1c1c1e] rounded-3xl border border-white/5 text-center px-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
                            <Trophy size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">아직 스폰서가 없습니다</h3>
                        <p className="text-white/40 text-sm mb-8 leading-relaxed">
                            라운딩에 참여하고 다양한 브랜드의<br />
                            스폰서십 혜택을 받아보세요!
                        </p>
                        <Link 
                            href="/sponsors" 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl w-full flex items-center justify-center gap-2 transition-colors"
                        >
                            <span>스폰서 찾아보기</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                )}

                {/* Benefits Info */}
                {badges.length > 0 && (
                    <div className="mt-8 bg-[#1c1c1e] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Award size={18} className="text-blue-500" />
                            스폰서십 혜택 안내
                        </h3>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>스폰서 배지를 5개 이상 모으면 프리미엄 멤버십 자격이 주어집니다.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>각 브랜드별 특별 할인 및 이벤트 우선 참여 기회가 제공됩니다.</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
