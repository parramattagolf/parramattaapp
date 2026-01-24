'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import PremiumSubHeader from '@/components/premium-sub-header'
import { Save, User, Phone, Briefcase, GraduationCap, Trophy, Hash, MapPin, FileText, Activity, Check, AlertCircle } from 'lucide-react'

// Reusable Input Component for consistent styling
function SettingsInput({ 
    icon: Icon, 
    value, 
    onChange, 
    placeholder, 
    type = "text", 
    isTextArea = false 
}: {
    icon: any,
    value: string | number,
    onChange: (e: any) => void,
    placeholder: string,
    type?: string,
    isTextArea?: boolean
}) {
    // Check if empty (handle 0 as valid for numbers)
    const isEmpty = value === '' || value === null || value === undefined
    
    return (
        <div className="group relative">
            <div className={`absolute left-12 ${isTextArea ? 'top-6' : 'top-1/2 -translate-y-1/2'} transition-colors ${isEmpty ? 'text-blue-400' : 'text-white/20 group-focus-within:text-emerald-500'}`}>
                <Icon size={20} />
            </div>
            
            {isTextArea ? (
                <textarea
                    placeholder={placeholder}
                    className={`w-full rounded-2xl py-4 !pl-40 pr-12 font-bold placeholder:text-white/10 outline-none transition-all shadow-inner border min-h-[100px] resize-none ${
                        isEmpty 
                            ? 'bg-blue-500/5 border-blue-500/30 text-white focus:border-blue-500 focus:bg-blue-500/10 placeholder:text-blue-500/50' 
                            : 'bg-[#1c1c1e] border-white/5 text-white focus:border-emerald-500/50'
                    }`}
                    value={value}
                    onChange={onChange}
                />
            ) : (
                <input
                    type={type}
                    placeholder={placeholder}
                    className={`w-full rounded-2xl py-4 !pl-40 pr-12 font-bold placeholder:text-white/10 outline-none transition-all shadow-inner border ${
                        isEmpty 
                            ? 'bg-blue-500/5 border-blue-500/30 text-white focus:border-blue-500 focus:bg-blue-500/10 placeholder:text-blue-500/50' 
                            : 'bg-[#1c1c1e] border-white/5 text-white focus:border-emerald-500/50'
                    }`}
                    value={value}
                    onChange={onChange}
                />
            )}

            {/* Status Indicator */}
            <div className={`absolute right-4 ${isTextArea ? 'top-6' : 'top-1/2 -translate-y-1/2'} pointer-events-none flex items-center`}>
                {isEmpty ? (
                     <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                    </div>
                ) : (
                    <Check size={18} className="text-emerald-500" />
                )}
            </div>
        </div>
    )
}

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
        age_range: '',
        district: '',
        bio: '',
        handicap: '' // store as string in input
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
                    age_range: data.age_range || '',
                    district: data.district || '',
                    bio: data.bio || '',
                    handicap: data.handicap !== null ? data.handicap.toString() : ''
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

        const updates: any = {
            nickname: profile.nickname,
            real_name: profile.real_name,
            phone: profile.phone,
            job: profile.job,
            mbti: profile.mbti,
            golf_experience: profile.golf_experience,
            gender: profile.gender,
            age_range: profile.age_range,
            district: profile.district,
            bio: profile.bio,
        }

        // Only add handicap if it's a valid number
        if (profile.handicap) {
            const hcp = parseInt(profile.handicap as string)
            if (!isNaN(hcp)) {
                updates.handicap = hcp
            } else {
                updates.handicap = null
            }
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)

        if (error) {
            alert('저장 중 오류가 발생했습니다: ' + error.message)
        } else {
            alert('정보가 성공적으로 저장되었습니다.')
            router.push(`/members/${user.id}`)
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

    const isGenderEmpty = !profile.gender
    const isAgeEmpty = !profile.age_range

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans">
            <PremiumSubHeader title="" backHref="/members/me" />

            <div className="pt-20 px-6 space-y-8">
                {/* Profile Image Preview */}
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
                    {/* Basic Identity */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                            Basic Identity
                            <span className="w-full h-px bg-white/5 block"></span>
                        </label>

                        <SettingsInput 
                            icon={Hash} 
                            value={profile.nickname} 
                            onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} 
                            placeholder="닉네임"
                        />
                        <SettingsInput 
                            icon={User} 
                            value={profile.real_name} 
                            onChange={(e) => setProfile({ ...profile, real_name: e.target.value })} 
                            placeholder="실명"
                        />
                        <SettingsInput 
                            icon={Phone} 
                            value={profile.phone} 
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                            placeholder="전화번호"
                        />


                         {/* Gender & Age Range Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Gender */}
                            <div className={`border rounded-2xl p-4 transition-colors ${
                                isGenderEmpty 
                                    ? 'bg-blue-500/5 border-blue-500/30' 
                                    : 'bg-[#1c1c1e] border-white/5'
                                }`}>
                                <div className="flex justify-between items-center mb-3">
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${isGenderEmpty ? 'text-blue-400' : 'text-white/30'}`}>Gender</label>
                                    {isGenderEmpty ? (
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                        </span>
                                    ) : (
                                        <Check size={14} className="text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {['male', 'female'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setProfile({ ...profile, gender: g })}
                                            className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all ${profile.gender === g
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                                : isGenderEmpty ? 'bg-blue-500/10 text-blue-200 hover:bg-blue-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {g === 'male' ? '남성' : '여성'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Age Range */}
                            <div className={`border rounded-2xl p-4 transition-colors ${
                                isAgeEmpty 
                                    ? 'bg-blue-500/5 border-blue-500/30' 
                                    : 'bg-[#1c1c1e] border-white/5'
                                }`}>
                                <div className="flex justify-between items-center mb-3">
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${isAgeEmpty ? 'text-blue-400' : 'text-white/30'}`}>Age Select</label>
                                    {isAgeEmpty ? (
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                        </span>
                                    ) : (
                                        <Check size={14} className="text-emerald-500" />
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={profile.age_range}
                                        onChange={e => setProfile({ ...profile, age_range: e.target.value })}
                                        className={`w-full appearance-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-blue-500/50 border ${
                                            isAgeEmpty
                                                ? 'bg-blue-500/10 border-blue-500/20 text-white'
                                                : 'bg-white/5 border-white/5 text-white'
                                        }`}
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

                        <SettingsInput 
                            icon={MapPin} 
                            value={profile.district} 
                            onChange={(e) => setProfile({ ...profile, district: e.target.value })} 
                            placeholder="거주 지역 (예: 분당구 정자동)"
                        />
                        
                        <SettingsInput 
                            icon={FileText} 
                            value={profile.bio} 
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                            placeholder="자기소개 (간단한 인사를 남겨주세요)"
                            isTextArea={true}
                        />
                    </div>

                    {/* Professional & Social */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                            Professional & Social
                            <span className="w-full h-px bg-white/5 block"></span>
                        </label>

                        <div className="group relative">
                            <div className={`absolute left-12 top-1/2 -translate-y-1/2 transition-colors ${!profile.job ? 'text-blue-400' : 'text-white/20 group-focus-within:text-emerald-500'}`}>
                                <Briefcase size={20} />
                            </div>
                            <select
                                className={`w-full rounded-2xl py-4 !pl-40 pr-12 font-bold text-white outline-none transition-all shadow-inner border appearance-none ${
                                    !profile.job 
                                        ? 'bg-blue-500/5 border-blue-500/30 focus:border-blue-500 focus:bg-blue-500/10' 
                                        : 'bg-[#1c1c1e] border-white/5 focus:border-emerald-500/50'
                                }`}
                                value={profile.job}
                                onChange={(e) => setProfile({ ...profile, job: e.target.value })}
                            >
                                <option value="" disabled>직업 선택</option>
                                <option value="경영/사무">경영/사무</option>
                                <option value="IT/정보통신">IT/정보통신</option>
                                <option value="마케팅/디자인">마케팅/디자인</option>
                                <option value="영업/금융">영업/금융</option>
                                <option value="서비스/교육">서비스/교육</option>
                                <option value="전문/특수직">전문/특수직</option>
                                <option value="건설/기술">건설/기술</option>
                                <option value="자영업/프리랜서">자영업/프리랜서</option>
                                <option value="기타">기타</option>
                            </select>
                            
                            {/* Custom Arrow */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                ▼
                            </div>

                            {/* Status Indicator */}
                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center`}>
                                {!profile.job ? (
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                ) : (
                                    <Check size={18} className="text-emerald-500" />
                                )}
                            </div>
                        </div>
                        <SettingsInput 
                            icon={GraduationCap} 
                            value={profile.mbti} 
                            onChange={(e) => setProfile({ ...profile, mbti: e.target.value })} 
                            placeholder="MBTI"
                        />
                    </div>

                    {/* Golf Performance */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                            Golf Performance
                            <span className="w-full h-px bg-white/5 block"></span>
                        </label>
                        
                        <div className="group relative">
                            <div className={`absolute left-12 top-1/2 -translate-y-1/2 transition-colors ${!profile.golf_experience ? 'text-blue-400' : 'text-white/20 group-focus-within:text-emerald-500'}`}>
                                <Trophy size={20} />
                            </div>
                            <select
                                className={`w-full rounded-2xl py-4 !pl-40 pr-12 font-bold text-white outline-none transition-all shadow-inner border appearance-none ${
                                    !profile.golf_experience 
                                        ? 'bg-blue-500/5 border-blue-500/30 focus:border-blue-500 focus:bg-blue-500/10' 
                                        : 'bg-[#1c1c1e] border-white/5 focus:border-emerald-500/50'
                                }`}
                                value={profile.golf_experience}
                                onChange={(e) => setProfile({ ...profile, golf_experience: e.target.value })}
                            >
                                <option value="" disabled>골프 구력 선택</option>
                                <option value="1년 미만">1년 미만</option>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                                    <option key={num} value={`${num}년`}>{num}년</option>
                                ))}
                                <option value="30년 이상">30년 이상</option>
                            </select>
                            
                            {/* Custom Arrow */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                ▼
                            </div>

                            {/* Status Indicator */}
                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center`}>
                                {!profile.golf_experience ? (
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                ) : (
                                    <Check size={18} className="text-emerald-500" />
                                )}
                            </div>
                        </div>
                        <div className="group relative">
                            <div className={`absolute left-12 top-1/2 -translate-y-1/2 transition-colors ${!profile.handicap && profile.handicap !== '0' ? 'text-blue-400' : 'text-white/20 group-focus-within:text-emerald-500'}`}>
                                <Activity size={20} />
                            </div>
                            <select
                                className={`w-full rounded-2xl py-4 !pl-40 pr-12 font-bold text-white outline-none transition-all shadow-inner border appearance-none ${
                                    !profile.handicap && profile.handicap !== '0'
                                        ? 'bg-blue-500/5 border-blue-500/30 focus:border-blue-500 focus:bg-blue-500/10' 
                                        : 'bg-[#1c1c1e] border-white/5 focus:border-emerald-500/50'
                                }`}
                                value={profile.handicap}
                                onChange={(e) => setProfile({ ...profile, handicap: e.target.value })}
                            >
                                <option value="" disabled>핸디캡 선택</option>
                                <option value="0">0 (Scratch)</option>
                                {Array.from({ length: 27 }, (_, i) => i + 1).map((num) => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                                <option value="28">28 이상</option>
                            </select>
                            
                            {/* Custom Arrow */}
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                ▼
                            </div>

                            {/* Status Indicator */}
                            <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center`}>
                                {!profile.handicap && profile.handicap !== '0' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </div>
                                ) : (
                                    <Check size={18} className="text-emerald-500" />
                                )}
                            </div>
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
