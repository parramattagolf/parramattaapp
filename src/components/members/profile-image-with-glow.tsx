'use client'

import Image from 'next/image'

interface ProfileImageWithGlowProps {
    profileImg: string | null
    distInfo?: {
        emoji: string
        label: string
    } | null
}

export default function ProfileImageWithGlow({ profileImg, distInfo }: ProfileImageWithGlowProps) {
    return (
        <div className="relative">
            <div className="relative w-52 h-52 rounded-full bg-[#121212] overflow-hidden border border-white/10 shadow-xl">
                {profileImg ? (
                    <Image 
                        src={profileImg} 
                        alt="Profile" 
                        width={256} 
                        height={256} 
                        className="w-full h-full object-cover" 
                        unoptimized
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">👤</div>
                )}
            </div>
            
            {distInfo && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2c2c2e] text-white text-[13px] font-black px-5 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap z-20">
                    {distInfo.emoji} {distInfo.label}
                </div>
            )}
        </div>
    )
}
