'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      alert(`로그인 오류가 발생했습니다: ${error}\n관리자에게 문의해주세요.`)
    }
  }, [error])

  // Intro Animation Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true)
    }, 1600) // Total intro duration (1.5s + buffer)
    return () => clearTimeout(timer)
  }, [])

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/rounds`,
          scopes: 'talk_message',
        },
      })
      if (error) throw error
    } catch (error) {
      alert('Error logging in with Kakao')
      console.error(error)
    } finally {
      // setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#121212] overflow-hidden">

      {/* Intro Animation */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${showLogin ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <h1 className="text-[#D50032] text-6xl md:text-8xl font-black text-red tracking-tighter animate-netflix-intro">
          PARRAMATTA GOLF
        </h1>
      </div>

      {/* Login Form (Fades in after intro) */}
      <div
        className={`w-full max-w-sm px-6 transition-all duration-1000 transform ${showLogin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">파라마타 골프</h2>
          <p className="text-white/50 text-[11px] font-bold tracking-[0.4em] uppercase">신뢰와 매너, 골프 커뮤니티</p>
        </div>

        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#1a1a1a] font-black py-5 px-6 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="text-lg">연결 중...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                <path d="M12 3C5.373 3 0 7.392 0 12.81c0 3.39 2.138 6.376 5.4 8.086l-1.373 5.09c-.068.254.19.467.42.34l5.968-3.957c.52.05 1.05.077 1.585.077 6.627 0 12-4.392 12-9.81C24 7.392 18.627 3 12 3" />
              </svg>
              <span className="text-[17px] tracking-tight mt-0.5">카카오톡으로 3초만에 시작하기</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-300 text-center mt-8">
          © 2010 Henry&apos;s Parramatta
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#002D56]"></div>}>
      <LoginContent />
    </Suspense>
  )
}
