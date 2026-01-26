'use client'


export default function BecomeHostBanner() {

    return (
        <div className="bg-[#1c1c1e] rounded-[24px] p-5 border border-yellow-500/20 shadow-xl relative overflow-hidden group">
            {/* Colorful Background Effects */}
            <div className="absolute -right-20 -top-20 w-48 h-48 bg-yellow-500/10 rounded-full blur-[60px] group-hover:bg-yellow-500/15 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl font-black text-white tracking-tighter">
                    조인방 호스트가 되세요! <span className="inline-block animate-bounce ml-1">👑</span>
                </h3>
            </div>
        </div>
    )
}
