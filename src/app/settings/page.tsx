'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PremiumSubHeader from '@/components/premium-sub-header'
import { Save, User, Phone, Briefcase, GraduationCap, Trophy, Hash } from 'lucide-react'

export default function SettingsPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        nickname: '',
        real_name: '',
        phone: '',
        email: '',
        job: '',
        mbti: '',
        golf_experience: '',
        profile_img: '',
        gender: '',
        age_group: ''
    })

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile({
                    nickname: data.nickname || '',
                    real_name: data.real_name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    job: data.job || '',
                    mbti: data.mbti || '',
                    golf_experience: data.golf_experience || '',
                    profile_img: data.profile_img || '',
                    gender: data.gender || '',
                    age_group: data.age_group || ''
                })
            }
            setLoading(false)
        }

        fetchProfile()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('users')
            .update({
                nickname: profile.nickname,
                real_name: profile.real_name,
                phone: profile.phone,
                job: profile.job,
                mbti: profile.mbti,
                golf_experience: profile.golf_experience,
                gender: profile.gender,
                age_group: profile.age_group,
            })
            .eq('id', user.id)

        if (error) {
            alert('저장 중 오류가 발생했습니다: ' + error.message)
        } else {
            alert('정보가 성공적으로 저장되었습니다.')
            router.push('/my')
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="" backHref="/my" />

            <div className="pt-20 px-6 space-y-8">
                {/* Profile Image Preview (Static for now) */}
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-24 h-24 rounded-[32px] bg-[#1c1c1e] border-2 border-white/10 overflow-hidden shadow-2xl relative group">
                        {profile.profile_img ? (
                            <img src={profile.profile_img} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                        )}
                    </div>
                    <p className="text-[11px] text-white/30 mt-3 font-bold uppercase tracking-widest leading-relaxed text-center">
                        프로필 이미지는<br />카카오톡 연동 시 자동 반영됩니다
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1">Basic Identity</label>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <Hash size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="닉네임"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.nickname}
                                onChange={e => setProfile({ ...profile, nickname: e.target.value })}
                            />
                        </div>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="실명"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.real_name}
                                onChange={e => setProfile({ ...profile, real_name: e.target.value })}
                            />
                        </div>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <Phone size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="전화번호"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>

                        {/* Gender & Age Group Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Gender */}
                            <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-4">
                                <label className="block text-[10px] font-bold text-white/30 mb-3 uppercase tracking-wider">Gender</label>
                                <div className="flex gap-2">
                                    {['male', 'female'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setProfile({ ...profile, gender: g })}
                                            className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all ${profile.gender === g
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {g === 'male' ? '남성' : '여성'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Age Group */}
                            <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-4">
                                <label className="block text-[10px] font-bold text-white/30 mb-3 uppercase tracking-wider">Age Select</label>
                                <div className="relative">
                                    <select
                                        value={profile.age_group}
                                        onChange={e => setProfile({ ...profile, age_group: e.target.value })}
                                        className="w-full appearance-none bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-white text-sm font-bold outline-none focus:border-blue-500/50"
                                    >
                                        <option value="" disabled>선택해주세요</option>
                                        <option value="20s">20대</option>
                                        <option value="30s">30대</option>
                                        <option value="40s">40대</option>
                                        <option value="50s">50대</option>
                                        <option value="60s">60대 이상</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social/Job Info */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1">Professional & Social</label>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <Briefcase size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="직업 (예: IT 기획자, 전문의 등)"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.job}
                                onChange={e => setProfile({ ...profile, job: e.target.value })}
                            />
                        </div>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <GraduationCap size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="MBTI"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.mbti}
                                onChange={e => setProfile({ ...profile, mbti: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Golf Experience */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1">Golf Performance</label>

                        <div className="group relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors">
                                <Trophy size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="골프 경력 / 핸디캡 (예: 구력 5년, 핸디 85)"
                                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/10 focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                value={profile.golf_experience}
                                onChange={e => setProfile({ ...profile, golf_experience: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-12"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>저장하기</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
