'use client'

export default function PreReservationList({ reservations }: { reservations: any[] }) {
    if (!reservations || reservations.length === 0) return null

    return (
        <div className="w-full mt-4 animate-fade-in">
            <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3 px-1">
                사전예약 | 조인방에 초대해주세요
            </h3>
            <div className="grid grid-cols-8 gap-2">
                {reservations.map((res) => (
                    <div key={res.id} className="flex flex-col items-center gap-1 group">
                        <div className="w-full aspect-square rounded-xl bg-[#2c2c2e] border border-white/5 overflow-hidden relative shadow-md group-hover:border-blue-500/30 transition-colors">
                            {res.user?.profile_img ? (
                                <img
                                    src={res.user.profile_img}
                                    alt={res.user.nickname}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-black">
                                    {res.user?.nickname?.slice(0, 1) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] text-white/40 font-bold truncate w-full text-center tracking-tight">
                            {res.user?.nickname}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
