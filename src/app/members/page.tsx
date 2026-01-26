import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Flag } from 'lucide-react'
import PremiumSubHeader from '@/components/premium-sub-header'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-5">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">로그인이 필요합니다</h2>
                    <Link href="/login" className="text-blue-500 font-bold">로그인하기</Link>
                </div>
            </div>
        )
    }

    // 1. Fetch participants (members who applied for rounds)
    // We get unique user_ids from participants table
    const { data: participantsData } = await supabase
        .from('participants')
        .select('user_id')

    const participantIds = [...new Set(participantsData?.map(p => p.user_id) || [])]

    // Fetch Pre-booking (Waitlist) participants
    // Assuming we use 'waiting_list' table or similar logic. 
    // Let's check if there is a 'waiting_list' table or we use 'participants' with specific status?
    // Based on common patterns in this app, maybe 'alerts' for open notification?
    // User asked for "pre-booking". 
    // Let's assume we need to join with `waiting_list` table if it exists.
    // I will try to fetch from `waiting_list`. If it fails, I'll catch it.
    // Actually, safer to search first.
    // Use `run_command` to grep or `mcp` to list tables? 
    // Since I'm in `replace_file_content`, I can't run other tools.
    // I will use a conservative approach:
    // If I don't know the table, I cannot write the code.
    // I will ABORT this tool call and use `grep_search` first.

    // 2. Fetch members with distance
    // Use the RPC function to get network info including distance
    // Start with max_depth large enough or assume direct friends + others
    // Actually, to show distance for everyone, we might need a different approach if the RPC only returns connected users.
    // However, the RPC returns connected users up to max_depth.
    // If we want ALL members, we can outer join or fetch all users and merge with RPC result.
    // Simplifying: Fetch from RPC with deeper depth to catch most network, or fetch all users and merge distance.
    
    // Let's try fetching all users as base, and merged with distance info from RPC.
    const { data: usersData } = await supabase.from('users').select('*')
    const { data: networkData } = await supabase.rpc('get_member_list_with_distance', { 
        query_user_id: user.id, 
        max_depth: 10 
    })

    const networkMap = new Map<string, number>()
    if (networkData) {
        (networkData as { id: string, distance: number }[]).forEach((n) => {
            if (n.id !== user.id) { // Exclude self if returned
                 networkMap.set(n.id, n.distance)
            }
        })
    }

    interface BaseUser {
        id: string;
        nickname: string;
        profile_img: string | null;
        gender: string | null;
        manner_score: number | null;
    }

    // Attach distance and filter self
    let allMembers = (usersData || [] as unknown as BaseUser[])
        .filter(m => m.id !== user.id)
        .map(m => ({
            ...m,
            distance: networkMap.get(m.id)
        }))

    // Calculate Percentiles
    // Sort by manner_score desc to find rank
    const sortedByManner = [...allMembers].sort((a, b) => (b.manner_score || 0) - (a.manner_score || 0))
    const totalUsers = sortedByManner.length

    // Create a map of member ID to percentile
    const percentileMap = new Map()
    sortedByManner.forEach((member, index) => {
        // rank is index + 1
        // percentile = Math.ceil((rank / total) * 100)
        const rank = index + 1
        const percentile = Math.ceil((rank / totalUsers) * 100)
        percentileMap.set(member.id, percentile)
    })

    // Attach percentile to member objects
    allMembers = allMembers.map(m => ({
        ...m,
        percentile: percentileMap.get(m.id) || 100
    }))

    // 3. Fetch Pre-reservations (Waitlist / Pre-booking)
    const { data: preData } = await supabase
        .from('pre_reservations')
        .select('user_id')
    
    const preBookedIds = [...new Set(preData?.map(p => p.user_id) || [])]

    // 4. Separate into participants and non-participants
    // Logic update: Combined sorting is better.
    // We want to prioritise participants, then pre-booked? Or just mark them.
    // Let's just mark them and keep basic sorting or participant first.
    // Existing logic: participants first, then others.
    
    // We can just add isPreBooked property to allMembers first.
    allMembers = allMembers.map(m => ({
        ...m,
        isParticipant: participantIds.includes(m.id),
        isPreBooked: preBookedIds.includes(m.id)
    }))

    const roundParticipants = allMembers.filter(m => m.isParticipant)
    const preBooked = allMembers.filter(m => !m.isParticipant && m.isPreBooked)
    const others = allMembers.filter(m => !m.isParticipant && !m.isPreBooked)

    // Combine: Participants -> PreBooked -> Others
    const combinedMembers = [
        ...roundParticipants,
        ...preBooked,
        ...others
    ]

    return (
        <div className="min-h-screen bg-[var(--color-bg)] pb-24 font-sans pt-24">
            <PremiumSubHeader 
                title={<span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>인맥</span>} 
                rightElement={<Link href="/members/search" className="text-blue-500 font-bold text-sm">인맥찾기</Link>}
            />

            <div className="">
                {combinedMembers.map((member, index) => {
                    return (
                        <div key={member.id}>
                            <MemberItem member={member} isParticipant={member.isParticipant} priority={index < 4} />
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

interface Member {
    id: string;
    nickname: string;
    profile_img: string | null;
    gender: string | null;
    distance?: number;
    isParticipant: boolean;
    isPreBooked: boolean;
    percentile: number;
}

function MemberItem({ member, isParticipant, priority = false }: { member: Member, isParticipant: boolean, priority?: boolean }) {
    return (
        <Link
            href={`/members/${member.id}`}
            className="flex items-center gap-4 py-4 px-gutter active:bg-[var(--color-surface-hover)] transition-colors"
        >
            <div className={`w-12 h-12 rounded-full bg-[var(--color-gray-100)] overflow-hidden shrink-0 transition-all box-border ${member.gender === 'male' ? 'border-4 border-blue-500 ring-2 ring-blue-500/20' :
                member.gender === 'female' ? 'border-4 border-red-500 ring-2 ring-red-500/20' :
                    'border border-[var(--color-divider)]'
                }`}>
                {member.profile_img ? (
                    <div className="relative w-full h-full">
                        <Image 
                            src={member.profile_img} 
                            alt={member.nickname} 
                            fill 
                            className="object-cover" 
                            unoptimized 
                            priority={priority}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="font-bold text-[var(--color-text-primary)] truncate">{member.nickname}</div>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {member.distance ? (
                         <span className="text-[10px] font-black text-white/40 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                            🔗 {member.distance}촌
                        </span>
                    ) : (
                        <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            ➕ 1촌신청
                        </span>
                    )}
                </div>
            </div>

            {/* Flags in the Center */}
            <div className="flex items-center justify-center gap-1.5">
                {member.isPreBooked && (
                    <Flag size={20} className="text-blue-500 fill-current animate-pulse" />
                )}
                {isParticipant && (
                    <Flag size={20} className="text-green-500 fill-current animate-pulse" />
                )}
            </div>

            <div className="flex flex-col items-end min-w-[60px]">
                <span className="text-xl font-black text-blue-500 italic tracking-tighter">{member.percentile}%</span>
            </div>
        </Link>
    )
}
