'use client'

import { createClient } from '@/utils/supabase/client'

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      className="w-full bg-[#FEE500] text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#FDD835] transition-colors"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C5.925 3 1 6.925 1 11.75C1 14.85 3.025 17.575 6.125 19.075C5.825 20.125 5.225 22.25 5 22.75C4.9 23 5.3 23.125 5.525 22.875C6.725 21.675 8.35 20.025 9.175 19.675C10.075 19.825 11.025 19.925 12 19.925C18.075 19.925 23 16 23 11.175C23 6.35 18.075 3 12 3Z" />
      </svg>
      카카오로 3초만에 시작하기
    </button>
  )
}
