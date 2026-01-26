import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// This would typically be protected or run via cron
export async function GET() {
    const supabase = await createClient()

    // 1. Find participants who joined > 3 hours ago AND have payment_status 'pending'
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

    // We need to check if user is still in 'joined' status (not 'left' or 'paid')
    const { data: targets, error } = await supabase
        .from('participants')
        .select(`
            id, 
            user_id, 
            event_id, 
            joined_at, 
            payment_status,
            user:users (points, manner_score)
        `)
        .eq('payment_status', 'pending')
        .lt('joined_at', threeHoursAgo)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!targets || targets.length === 0) {
        return NextResponse.json({ message: 'No timeout participants found' })
    }

    const results = []

    for (const target of targets) {
        // A. Kick (Delete participant)
        const { error: deleteError } = await supabase
            .from('participants')
            .delete()
            .eq('id', target.id)

        if (deleteError) {
            console.error(`Failed to kick participant ${target.id}`, deleteError)
            continue
        }

        // B. Penalties
        const userId = target.user_id
        
        type UserWithStats = { points: number; manner_score: number }
        const stats = (target as unknown as { user: UserWithStats | UserWithStats[] | null }).user
        const resolvedStats = Array.isArray(stats) ? stats[0] : stats

        const currentPoints = resolvedStats?.points || 0
        const currentManner = resolvedStats?.manner_score || 100

        const newPoints = currentPoints - 20
        const newManner = currentManner - 30

        // Update User
        await supabase
            .from('users')
            .update({
                points: newPoints,
                manner_score: newManner
            })
            .eq('id', userId)

        // Log Point Transaction
        await supabase
            .from('point_transactions')
            .insert({
                user_id: userId,
                amount: -20,
                description: '조인방 미결제 자동 탈퇴 패널티',
                balance_snapshot: newPoints
            })

        // Log Manner Score History
        await supabase
            .from('manner_score_history')
            .insert({
                user_id: userId,
                amount: -30,
                description: '조인방 미결제 자동 탈퇴 감점',
                score_snapshot: newManner
            })

        // Log Notification (Optional but good)
        // We'll skip complex notification logic injection here to keep it simple, 
        // but ideally we'd send a notification telling them why they were kicked.

        results.push({ userId, status: 'kicked_and_penalized' })
    }

    return NextResponse.json({
        message: 'Processed timeouts',
        count: results.length,
        results
    })
}
