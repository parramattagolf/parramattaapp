'use client'

import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import PreReservationButton from '@/components/pre-reservation-button'

import { RoundingPreReservation, UserStatus } from '@/types/rounding'

interface PreReservationListProps {
    reservations: RoundingPreReservation[];
    eventId?: string;
    isPreReserved?: boolean;
    userStatus?: UserStatus;
}

export default function PreReservationList({ reservations, eventId, isPreReserved, userStatus }: PreReservationListProps) {
    // Show component if there are reservations OR if it's the personal status area
    if ((!reservations || reservations.length === 0) && !isPreReserved && userStatus !== 'none') return null
    if (!eventId) return null

    const showHelp = () => {
        alert(
            "🚀 사전예약 안내\n\n" +
            "사전예약은 아직 참여를 확정하진 않았지만, 참가를 희망하는 의사를 미리 밝히는 기능입니다.\n\n" +
            "• 매너점수 1점 시상\n" +
            "• 기존 참여자로부터 초대를 받을 수 있어요\n" +
            "• 취소 시 시상받은 1점은 다시 회수됩니다"
        );
    }



    return (
        <div className="w-full mt-4 animate-fade-in">
            <div className="mb-4 px-1 flex items-center gap-2">
                {userStatus !== 'joined' && (
                     <PreReservationButton eventId={eventId} isReserved={!!isPreReserved} />
                )}

                <button 
                    onClick={showHelp}
                    className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                    title="사전예약이란?"
                >
                    <HelpCircle size={16} />
                </button>
            </div>
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
