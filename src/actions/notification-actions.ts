'use server'

import { createClient } from '@/utils/supabase/server'

// Notification template codes
export type NotificationCode = 
    | 'reservation_confirmed'
    | 'payment_pending'
    | 'payment_reminder_1h'
    | 'payment_expired'
    | 'kicked_by_host'
    | 'manner_review_request'
    | 'friend_invite'

interface NotificationParams {
    event_title?: string
    sender_name?: string
    [key: string]: string | undefined
}

// Send notification using template
export async function sendTemplateNotification(
    userId: string,
    templateCode: NotificationCode,
    params: NotificationParams = {}
) {
    const supabase = await createClient()

    // Get template
    const { data: template, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('code', templateCode)
        .single()

    if (templateError || !template) {
        console.error('Template not found:', templateCode)
        return { success: false, error: 'Template not found' }
    }

    // Replace placeholders
    let body = template.body
    Object.entries(params).forEach(([key, value]) => {
        body = body.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    })

    // Insert notification
    const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'system',
        sender_id: null
    })

    if (error) {
        console.error('Failed to send notification:', error)
        return { success: false, error: error.message }
    }

    // If webhook is configured, call external service (Kakao, etc.)
    if (process.env.N8N_WEBHOOK_URL) {
        try {
            await fetch(process.env.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'notification_sent',
                    user_id: userId,
                    template_code: templateCode,
                    title: template.title,
                    body,
                    kakao_template_id: template.kakao_template_id,
                    timestamp: new Date().toISOString()
                })
            })
        } catch (e) {
            console.error('Webhook call failed:', e)
        }
    }

    return { success: true, title: template.title, body }
}

// Send payment pending notification
export async function notifyPaymentPending(userId: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'payment_pending', { event_title: eventTitle })
}

// Send reservation confirmed notification
export async function notifyReservationConfirmed(userId: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'reservation_confirmed', { event_title: eventTitle })
}

// Send payment expired notification
export async function notifyPaymentExpired(userId: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'payment_expired', { event_title: eventTitle })
}

// Send kicked notification
export async function notifyKicked(userId: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'kicked_by_host', { event_title: eventTitle })
}

// Send manner review request (after event ends)
export async function notifyMannerReviewRequest(userId: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'manner_review_request', { event_title: eventTitle })
}

// Send friend invite notification
export async function notifyFriendInvite(userId: string, senderName: string, eventTitle: string) {
    return sendTemplateNotification(userId, 'friend_invite', { 
        sender_name: senderName, 
        event_title: eventTitle 
    })
}

// Get users with payment expiring soon (within 1 hour)
export async function getUsersWithExpiringPayment() {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('participants')
        .select(`
            user_id,
            event_id,
            joined_at,
            events (title)
        `)
        .eq('payment_status', 'pending')
        .gt('joined_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // joined 2h+ ago
        .lt('joined_at', new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()) // but less than 2h10m
    
    if (error) {
        console.error('Failed to get expiring users:', error)
        return []
    }

    return data || []
}

// API endpoint for n8n to trigger reminder notifications
export async function sendExpiringReminders() {
    const users = await getUsersWithExpiringPayment()
    
    const results = await Promise.all(
        users.map(async (u: any) => {
            return sendTemplateNotification(
                u.user_id, 
                'payment_reminder_1h', 
                { event_title: u.events?.title || '라운딩' }
            )
        })
    )
    
    return { sent: results.length, results }
}
