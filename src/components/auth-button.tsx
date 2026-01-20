'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export function AuthButton({ user }: { user: any }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    location.reload()
  }

  if (user) {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
      >
        {loading ? 'Logging out...' : 'Sign Out'}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="bg-[#FAE100] text-[#371D1E] px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3C5.9 3 1 6.9 1 11.8C1 14.2 2.4 16.4 4.8 17.9L3.9 21.2C3.8 21.6 4.2 21.9 4.6 21.7L8.6 19C9.7 19.3 10.8 19.4 12 19.4C18.1 19.4 23 15.5 23 10.6C23 5.7 18.1 3 12 3Z" />
      </svg>
      {loading ? 'Connecting...' : 'Login with Kakao'}
    </button>
  )
}
