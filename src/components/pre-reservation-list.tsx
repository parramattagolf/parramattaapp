'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface PreReservation {
    id: string;
    user: {
        id: string;
        nickname: string;
        profile_img: string | null;
    }
}

export default function PreReservationList({ reservations }: { reservations: PreReservation[] }) {
    if (!reservations || reservations.length === 0) return null

    return (
        <div className="w-full mt-4 animate-fade-in">
            <h3 className="text-blue-400 text-[10px] uppercase tracking-widest font-black mb-3 px-1 flex items-center gap-1.5">
                <Sparkles size={10} className="text-blue-500 fill-blue-500/20" />
                초대를 기다리는 사전예약자
            </h3>
            <div className="grid grid-cols-8 gap-2">
                {reservations.map((res) => (
                    <Link 
                        key={res.id} 
                        href={`/members/${res.user?.id}`}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
                    >
                        <div className="w-full aspect-square rounded-xl bg-[#2c2c2e] border border-white/5 overflow-hidden relative shadow-md group-hover:border-blue-500/30 transition-colors">
                            {res.user?.profile_img ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={res.user.profile_img}
                                        alt={res.user.nickname}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-black">
                                    {res.user?.nickname?.slice(0, 1) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] text-white/40 font-bold truncate w-full text-center tracking-tight group-hover:text-white/60 transition-colors">
                            {res.user?.nickname}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
