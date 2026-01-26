'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Purchase a product (mock - no real payment)
export async function purchaseProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get product details
    const { data: product } = await supabase
        .from('products')
        .select('*, sponsor:sponsor_id(id, name)')
        .eq('id', productId)
        .single()

    if (!product) throw new Error('Product not found')

    // Create purchase record
    const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
            user_id: user.id,
            product_id: productId,
            total_price: product.price,
            status: 'completed'
        })

    if (purchaseError) throw purchaseError

    // If product has badge_code, grant badge
    if (product.badge_code) {
        await supabase
            .from('user_badges')
            .upsert({
                user_id: user.id,
                badge_code: product.badge_code,
                sponsor_id: product.sponsor_id,
                product_id: productId
            }, { onConflict: 'user_id,badge_code' })
    }

    revalidatePath('/my')
    revalidatePath(`/members/${user.id}`)

    return {
        success: true,
        badge_earned: product.badge_code ? true : false,
        product_name: product.name
    }
}

// Get user badges
export async function getUserBadges(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('user_badges')
        .select(`
            *,
            sponsor:sponsor_id(id, name, logo_url),
            product:product_id(name)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

    return data || []
}

// Get user purchase history
export async function getUserPurchases(userId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('purchases')
        .select(`
            *,
            product:product_id(name, sponsor:sponsor_id(name))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    return data || []
}

// Admin: Input event scores
export async function inputEventScore(
    eventId: string,
    userId: string,
    grossScore: number,
    netScore?: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check admin
    const { data: adminCheck } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!adminCheck?.is_admin) throw new Error('Admin only')

    const { error } = await supabase
        .from('event_scores')
        .upsert({
            event_id: eventId,
            user_id: userId,
            gross_score: grossScore,
            net_score: netScore || grossScore
        }, { onConflict: 'event_id,user_id' })

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
}

// Get event leaderboard with sponsor filter
export async function getEventLeaderboard(eventId: string, sponsorFilter?: string) {
    const supabase = await createClient()

    const query = supabase
        .from('event_scores')
        .select(`
            *,
            user:user_id(
                id, nickname, profile_img,
                badges:user_badges(badge_code, sponsor:sponsor_id(name))
            )
        `)
        .eq('event_id', eventId)
        .order('net_score', { ascending: true })

    const { data: scores } = await query

    if (!scores) return []

    // Filter by sponsor if specified
    if (sponsorFilter) {
        interface ScoreRecord {
            user?: {
                badges?: {
                    sponsor?: {
                        name: string;
                    };
                }[];
            };
        }
        return (scores as unknown as ScoreRecord[]).filter((s) => {
            return s.user?.badges?.some((b) =>
                b.sponsor?.name?.toLowerCase().includes(sponsorFilter.toLowerCase())
            )
        })
    }

    return scores
}

// Calculate rankings and assign prizes
export async function calculateEventRankings(eventId: string) {
    const supabase = await createClient()

    // Get all scores
    const { data: scores } = await supabase
        .from('event_scores')
        .select('*')
        .eq('event_id', eventId)
        .order('net_score', { ascending: true })

    if (!scores) return []

    // Update rankings
    for (let i = 0; i < scores.length; i++) {
        await supabase
            .from('event_scores')
            .update({ ranking: i + 1 })
            .eq('id', scores[i].id)
    }

    revalidatePath('/admin')
    return scores.map((s, i) => ({ ...s, ranking: i + 1 }))
}
