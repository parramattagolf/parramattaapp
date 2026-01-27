'use client'

import { useRouter } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'
import ConnectionRequestButton from '@/components/members/connection-request-button'

interface MemberDetailHeaderProps {
    nickname: string;
    targetUserId: string;
    isOwnProfile: boolean;
    distance: number;
    connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
    rejectionCount: number;
    viewerMembershipLevel: string | null;
    targetUserMembershipLevel: string | null;
}

export default function MemberDetailHeader({ 
    nickname, 
    targetUserId, 
    isOwnProfile, 
    distance, 
    connectionStatus,
    rejectionCount,
    viewerMembershipLevel,
    targetUserMembershipLevel
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
                        distance={distance}
                        connectionStatus={connectionStatus}
                        rejectionCount={rejectionCount}
                        viewerMembershipLevel={viewerMembershipLevel}
                        targetUserMembershipLevel={targetUserMembershipLevel}
                    />
                )
            }
        />
    )
}
