
export interface RoundingUser {
    id: string;
    nickname: string;
    profile_img: string | null;
    is_admin?: boolean;
}

export interface RoundingEvent {
    id: string;
    title: string;
    description: string | null;
    host_id: string;
    start_date: string;
    end_date?: string | null;
    location?: string | null;
    course_name?: string | null;
    max_participants: number;
    cost: number | null;
    host?: RoundingUser;
}

export interface RoundingParticipant {
    id: string;
    user_id: string;
    event_id: string;
    joined_at: string;
    payment_status: string | null;
    group_no?: number | null;
    user: RoundingUser;
}

export interface RoundingPreReservation {
    id: string;
    user_id: string;
    event_id: string;
    created_at: string;
    user: RoundingUser;
}

export type UserStatus = 'none' | 'pre_reserved' | 'joined';
