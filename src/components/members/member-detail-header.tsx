'use client'

import { useRouter } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'
import ConnectionRequestButton from '@/components/members/connection-request-button'

interface MemberDetailHeaderProps {
    nickname: string;
    targetUserId: string;
    isOwnProfile: boolean;
    distance: number;
    isPending: boolean;
}

export default function MemberDetailHeader({ 
    nickname, 
    targetUserId, 
    isOwnProfile, 
    distance, 
    isPending 
}: MemberDetailHeaderProps) {
    const router = useRouter()

    return (
        <PremiumSubHeader 
            title={nickname} 
            backHref="/members"
            onBack={() => router.back()}
            rightElement={
                !isOwnProfile && (
                    <ConnectionRequestButton 
                        targetUserId={targetUserId} 
                        isAlreadyFriend={distance === 1} 
                        isPending={isPending} 
                    />
                )
            }
        />
    )
}
