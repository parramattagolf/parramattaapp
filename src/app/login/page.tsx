'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      alert(`로그인 오류가 발생했습니다: ${error}\n관리자에게 문의해주세요.`)
    }
  }, [error])

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      alert('Error logging in with Kakao')
      console.error(error)
    } finally {
      // setLoading(false) // Redirecting so don't stop loading to prevent double clicks
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-800 to-green-950 text-white">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold mb-2 tracking-tighter">Parramatta</h1>
        <p className="text-green-200 mb-12 text-sm tracking-widest uppercase">Golf & Social Club</p>
        
        <div className="space-y-4">
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                   <path d="M12 3C5.373 3 0 7.392 0 12.81c0 3.39 2.138 6.376 5.4 8.086l-1.373 5.09c-.068.254.19.467.42.34l5.968-3.957c.52.05 1.05.077 1.585.077 6.627 0 12-4.392 12-9.81C24 7.392 18.627 3 12 3" />
                </svg>
                Sign in with Kakao
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
