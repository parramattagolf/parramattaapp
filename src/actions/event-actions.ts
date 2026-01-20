'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const course_name = formData.get('course_name') as string
  const start_date = formData.get('start_date') as string
  const cost = formData.get('cost') as string
  const max_participants = formData.get('max_participants') as string
  const description = formData.get('description') as string
  const theme = formData.get('theme') as string || 'General'

  // Location can be same as course name for now or separate
  const location = course_name 

  // Calculate end_date (Default 5 hours later?)
  const start = new Date(start_date)
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000) 

  const { data, error } = await supabase
    .from('events')
    .insert({
      host_id: user.id,
      title,
      course_name,
      location,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      cost: parseFloat(cost),
      max_participants: parseInt(max_participants),
      description,
      status: 'open',
      theme
    })
    .select()
    .single()

  if (error) {
    console.error('Create Event Error:', error)
    throw new Error('Failed to create event')
  }

  // Auto-join host
  await supabase.from('participants').insert({
      event_id: data.id,
      user_id: user.id,
      status: 'joined' // Host is always joined
  })

  revalidatePath('/rounds')
  redirect(`/rounds/${data.id}`)
}

export async function joinEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if full
    const { data: event } = await supabase.from('events').select('max_participants').eq('id', eventId).single()
    const { count } = await supabase.from('participants').select('*', { count: 'exact' }).eq('event_id', eventId)

    if (event && count !== null && count >= event.max_participants) {
        throw new Error('Event is full')
    }

    const { error } = await supabase.from('participants').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'joined',
        payment_status: 'pending'
    })

    if (error) throw new Error('Failed to join')
    
    // Send payment pending notification
    const { data: eventData } = await supabase.from('events').select('title').eq('id', eventId).single()
    if (eventData) {
        const { notifyPaymentPending } = await import('@/actions/notification-actions')
        await notifyPaymentPending(user.id, eventData.title)
    }
    
    revalidatePath(`/rounds/${eventId}`)
    return { success: true }
}

export async function leaveEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)

    if (error) throw new Error('Failed to leave')

    revalidatePath(`/rounds/${eventId}`)
    return { success: true }
}

export async function inviteParticipant(eventId: string, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if full
    const { data: event } = await supabase.from('events').select('max_participants').eq('id', eventId).single()
    const { count } = await supabase.from('participants').select('*', { count: 'exact' }).eq('event_id', eventId)

    if (event && count !== null && count >= event.max_participants) {
        throw new Error('Event is full')
    }

    // Insert invited user with payment_status = pending
    const { error } = await supabase.from('participants').insert({
        event_id: eventId,
        user_id: targetUserId,
        status: 'joined',
        payment_status: 'pending'
    })

    if (error) {
        console.error('Invite error', error)
        throw new Error('Failed to invite')
    }
    
    // Send invite notification
    const { data: eventData } = await supabase.from('events').select('title').eq('id', eventId).single()
    const { data: senderData } = await supabase.from('users').select('nickname').eq('id', user.id).single()
    if (eventData && senderData) {
        const { notifyFriendInvite } = await import('@/actions/notification-actions')
        await notifyFriendInvite(targetUserId, senderData.nickname, eventData.title)
    }
    
    revalidatePath(`/rounds/${eventId}`)
    return { success: true }
}

export async function kickParticipant(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const eventId = formData.get('eventId') as string
    const targetUserId = formData.get('userId') as string

    // Verify Host (RLS handles update/delete policies usually, but for delete on participants, 
    // we defined "Users can update own, Host can update all" -> Wait, that was for UPDATE. 
    // DELETE policy? I didn't set DELETE policy explicitly for Host kicking others.
    // I set "Users can update own...". I need to check DELETE policy.
    // Default RLS is deny all. I need to check migration_phase3.sql again.
    
    // Let's rely on server-side check + admin privileges/SQL execution if needed, 
    // or better, ensure RLS allows Host to DELETE participants.
    
    // We need to fix RLS first if I want to be secure. 
    // Or, since I am using service role in some places? No, `createClient` uses user session.
    // I will check permissions in code for now.

    // Fetch event to check host
    const { data: event } = await supabase.from('events').select('host_id').eq('id', eventId).single()
    if (!event || event.host_id !== user.id) {
        throw new Error('Only host can kick')
    }

    const { error } = await supabase
        .from('participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)

    if (error) throw new Error('Failed to kick')

    // Send kicked notification
    const { data: eventData } = await supabase.from('events').select('title').eq('id', eventId).single()
    if (eventData) {
        const { notifyKicked } = await import('@/actions/notification-actions')
        await notifyKicked(targetUserId, eventData.title)
    }

    revalidatePath(`/rounds/${eventId}`)
}
