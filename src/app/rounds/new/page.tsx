'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function NewRoundPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkMembershipLevel = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('membership_level')
        .eq('id', user.id)
        .single()

      const level = userData?.membership_level || 'red'
      const allowedLevels = ['blue', 'black']

      if (!allowedLevels.includes(level)) {
        setError('블루 등급 이상만 라운드를 등록할 수 있습니다.')
        setIsChecking(false)
        return
      }

      setIsChecking(false)
    }

    checkMembershipLevel()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white/60 text-sm">권한 확인 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-xl font-bold text-white mb-4">{error}</div>
          <button
            onClick={() => router.push('/rounds')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            라운딩 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] pt-24 pb-32 px-6">
      <h1 className="text-2xl font-bold text-white mb-6">라운드 등록</h1>
      <div className="text-white/60">라운드 등록 폼이 여기에 표시됩니다.</div>
    </div>
  )
}
