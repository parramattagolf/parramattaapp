'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import PremiumSubHeader from '@/components/premium-sub-header'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Star, Users } from 'lucide-react'

export default function NetworkPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [network, setNetwork] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState(1)
    const [sortBy, setSortBy] = useState<'manner' | 'points'>('manner')

    useEffect(() => {
        const fetchNetwork = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase.rpc('get_member_list_with_distance', {
                query_user_id: user.id,
                max_depth: 5
            })

            if (error) {
                console.error('Error fetching network:', error)
            }

            if (data) {
                // Fetch detailed profile info for these members manually because the RPC might be outdated
                const memberIds = data.map((m: any) => m.id)
                
                if (memberIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('members')
                        .select('id, nickname, real_name, profile_img, job, manner_score, golf_experience, points')
                        .in('id', memberIds)
                    
                    if (profiles) {
                        // Merge profile data into network data
                        const mergedData = data.map((netMember: any) => {
                            const profile = profiles.find(p => p.id === netMember.id)
                            return profile ? { ...netMember, ...profile } : netMember
                        })
                        setNetwork(mergedData)
                    } else {
                        setNetwork(data)
                    }
                } else {
                    setNetwork(data)
                }
            }
            setLoading(false)
        }

        fetchNetwork()
    }, [supabase])

    const filteredList = network
        .filter(member => member.distance === activeTab)
        .sort((a, b) => {
            if (sortBy === 'manner') {
                return (b.manner_score || 0) - (a.manner_score || 0)
            } else {
                return (b.points || 0) - (a.points || 0)
            }
        })

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const tabs = [
        { id: 1, label: '1촌' },
        { id: 2, label: '2촌' },
        { id: 3, label: '3촌' },
        { id: 4, label: '4촌' },
        { id: 5, label: '5촌' },
    ]

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="" backHref="/my" />

            {/* Sort Tabs - Top Fixed */}
            <div className="fixed top-14 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5">
                <div className="flex">
                    <button 
                        onClick={() => setSortBy('manner')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                            sortBy === 'manner' ? 'text-white' : 'text-white/40'
                        }`}
                    >
                        매너
                        {sortBy === 'manner' && (
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                    <button 
                        onClick={() => setSortBy('points')}
                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                            sortBy === 'points' ? 'text-white' : 'text-white/40'
                        }`}
                    >
                        포인트
                        {sortBy === 'points' && (
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                        )}
                    </button>
                </div>
            </div>

            <div className="pt-32 px-5">
                {/* Stats Summary Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 mb-8 shadow-[0_20px_40px_rgba(37,99,235,0.2)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                            <Users size={20} />
                        </div>
                        <span className="text-white/80 font-bold text-sm tracking-wide">Total Connections</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-black text-white">{network.filter(n => n.distance >= 1 && n.distance <= 5).length}</h2>
                        <span className="text-white/60 font-bold">명 연결 중</span>
                    </div>
                </div>

                {/* Glass Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap border ${activeTab === tab.id
                                ? 'bg-blue-600 border-blue-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]'
                                : 'bg-[#1c1c1e] border-white/5 text-white/40 hover:text-white/60'
                                }`}
                        >
                            {tab.label} ({network.filter(n => n.distance === tab.id).length})
                        </button>
                    ))}
                </div>

                {/* Member List */}
                <div className="space-y-4">
                    {filteredList.length > 0 ? (
                        filteredList.map((member: any) => (
                            <Link
                                key={member.id}
                                href={`/members/${member.id}`}
                                className="flex items-center gap-4 p-4 bg-[#1c1c1e] border border-white/5 rounded-2xl active:scale-[0.98] transition-all"
                            >
                                <div className="w-14 h-14 rounded-full bg-white/5 overflow-hidden border border-white/10 shrink-0">
                                    {member.profile_img ? (
                                        <Image src={member.profile_img} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-white/10 to-white/5">👤</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-bold text-white truncate">{member.nickname || member.real_name || '익명'}</h3>
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md uppercase tracking-widest">{member.distance}촌</span>
                                    </div>
                                    <p className="text-xs text-white/30 truncate">{member.job || '직업 정보 없음'}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                            <Shield size={10} />
                                            <span>Manner {member.manner_score}</span>
                                        </div>
                                        {member.points > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] text-pink-500 font-bold">
                                                <span>P</span>
                                                <span>{member.points.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {member.golf_experience && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                                                <Star size={10} />
                                                <span>{member.golf_experience}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-white/20 font-black text-xs select-none">→</div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-[#1c1c1e] rounded-3xl flex items-center justify-center mx-auto mb-4 text-white/10">
                                <Users size={32} />
                            </div>
                            <p className="text-white/20 font-bold">연결된 {activeTab}촌이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
