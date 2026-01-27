'use client'

import { useEffect } from 'react'
import { registerServiceWorker, subscribeUserToPush } from '@/lib/push-notifications'
import { createClient } from '@/utils/supabase/client'

export default function PushNotificationManager() {
  useEffect(() => {
    async function setup() {
      await registerServiceWorker()
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user && Notification.permission === 'granted') {
        await subscribeUserToPush()
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && Notification.permission === 'granted') {
          await subscribeUserToPush()
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
    setup()
  }, [])

  // This is a headless component, but you could add UI here if needed
  return null
}
