'use client'

interface RoundEntranceGuardProps {
    status: 'none' | 'pre_reserved' | 'joined';
    paymentStatus?: 'paid' | 'unpaid' | null;
    roomNumber?: number;
    joinedAt?: string;
    paymentDeadlineHours?: number;
}

export default function RoundEntranceGuard(props: RoundEntranceGuardProps) {
    // Currently acting as a placeholder to prevent build errors
    // Future logic: handles redirects or restricted access messages
    return null;
}
