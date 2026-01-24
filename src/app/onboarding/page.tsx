'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    real_name: '',
    nickname: '',
    job: '',
    mbti: '',
    golf_experience: '',
    partner_style_preference: [] as string[],
    partner_style_avoid: [] as string[]
  })

  // Basic check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Check nickname uniqueness (Simple client side check for UX, DB constraint handles safety)
      // Ideally calls a function or simple select.

      const { error } = await supabase
        .from('users')
        .update({
          real_name: formData.real_name,
          nickname: formData.nickname,
          job: formData.job,
          mbti: formData.mbti,
          golf_experience: formData.golf_experience,
          partner_style_preference: formData.partner_style_preference,
          partner_style_avoid: formData.partner_style_avoid,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        if (error.code === '23505') alert('이미 존재하는 닉네임입니다.')
        else throw error
        return
      }

      router.push('/members') // Go to members list after success
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20 font-sans">
      <div className="px-6 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">환영합니다! 👋</h1>
        <p className="text-[var(--color-text-desc)] text-[14px] font-medium leading-relaxed">
          원활한 매칭을 위해 <br />
          프로필 정보를 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-7">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[var(--color-text-desc)] mb-1.5 ml-1">실명</label>
            <input
              required
              type="text"
              className="bg-[var(--color-gray-100)] w-full border border-[var(--color-divider)] rounded-xl p-4 text-[14px] focus:outline-none focus:border-blue-500 transition-colors text-[var(--color-text-primary)]"
              placeholder="본인의 실명을 입력해 주세요"
              value={formData.real_name}
              onChange={e => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--color-text-desc)] mb-1.5 ml-1">닉네임</label>
            <input
              required
              type="text"
              minLength={2}
              className="bg-[var(--color-gray-100)] w-full border border-[var(--color-divider)] rounded-xl p-4 text-[14px] focus:outline-none focus:border-blue-500 transition-colors text-[var(--color-text-primary)]"
              placeholder="앱 내에서 사용하실 닉네임"
              value={formData.nickname}
              onChange={e => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-desc)] mb-1.5 ml-1">직업</label>
              <div className="relative">
                <select
                  className="bg-[var(--color-gray-100)] w-full border border-[var(--color-divider)] rounded-xl p-4 text-[14px] focus:outline-none focus:border-blue-500 appearance-none transition-colors text-[var(--color-text-primary)]"
                  value={formData.job}
                  onChange={e => setFormData({ ...formData, job: e.target.value })}
                >
                  <option value="">선택</option>
                  <option value="전문직">전문직</option>
                  <option value="경영/사업">경영/사업</option>
                  <option value="직장인">직장인</option>
                  <option value="프리랜서">프리랜서</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-desc)]">▾</div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-desc)] mb-1.5 ml-1">MBTI</label>
              <input
                type="text"
                className="bg-[var(--color-gray-100)] w-full border border-[var(--color-divider)] rounded-xl p-4 text-[14px] focus:outline-none focus:border-blue-500 transition-colors text-[var(--color-text-primary)] uppercase"
                maxLength={4}
                placeholder="예: ENFP"
                value={formData.mbti}
                onChange={e => setFormData({ ...formData, mbti: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--color-text-desc)] mb-1.5 ml-1">골프 구력</label>
            <input
              type="text"
              className="bg-[var(--color-gray-100)] w-full border border-[var(--color-divider)] rounded-xl p-4 text-[14px] focus:outline-none focus:border-blue-500 transition-colors text-[var(--color-text-primary)]"
              placeholder="예: 3년, 6개월"
              value={formData.golf_experience}
              onChange={e => setFormData({ ...formData, golf_experience: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-navy)] text-white font-bold py-5 rounded-2xl disabled:opacity-30 active:scale-[0.98] transition-all shadow-lg"
          >
            {loading ? '저장 중...' : '프로필 저장하고 시작하기'}
          </button>
          <p className="text-center text-[11px] text-[var(--color-text-desc)] mt-4 opacity-50">
            입력하신 정보는 1촌 친구들에게만 공개됩니다.
          </p>
        </div>
      </form>
    </div>
  )
}
