'use client'

import { useEffect } from 'react'
import { registerServiceWorker, subscribeUserToPush } from '@/lib/push-notifications'

export default function PushNotificationManager() {
  useEffect(() => {
    async function setup() {
      await registerServiceWorker()
    }
    setup()
  }, [])

  // This is a headless component, but you could add UI here if needed
  return null
}
