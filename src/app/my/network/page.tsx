'use client'

import PremiumSubHeader from '@/components/premium-sub-header'

export default function MyNetworkPage() {
    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="나의 인맥" backHref="/my" />
            <div className="pt-24 px-5 text-white">
                {/* Empty Page Content */}
            </div>
        </div>
    )
}
