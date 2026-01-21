import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function MannerScoreHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch user manner score
    const { data: userData } = await supabase
        .from('users')
        .select('manner_score')
        .eq('id', user.id)
        .single()

    // Fetch transaction history
    const { data: history, error } = await supabase
        .from('manner_score_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching manner history:', error)
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] font-sans pb-12">
            <PremiumSubHeader title="매너 점수 내역" backHref="/my" />

            <div className="pt-20 px-5">
                {/* Score Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform translate-x-10 -translate-y-10 rotate-12">
                        M
                    </div>
                    <div className="relative z-10">
                        <span className="text-emerald-100 text-sm font-medium tracking-wider uppercase">Current Score</span>
                        <div className="text-4xl font-black text-white mt-1">
                            {(userData?.manner_score || 0)} <span className="text-2xl font-bold opacity-80">점</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-black/20 text-white/80 px-2 py-1 rounded backdrop-blur-sm">
                                기본 점수 100점
                            </span>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                    점수 변동 내역
                </h2>

                <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] overflow-hidden">
                    {!history || history.length === 0 ? (
                        <div className="p-12 text-center text-[var(--color-text-desc)] text-sm">
                            아직 점수 변동 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-divider)]">
                            {history.map((item) => (
                                <div key={item.id} className="p-5 flex justify-between items-center group hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                                            {item.description}
                                        </span>
                                        <span className="text-[11px] text-[var(--color-text-desc)]">
                                            {format(new Date(item.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[15px] font-black ${item.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {item.amount > 0 ? '+' : ''}{item.amount} 점
                                        </div>
                                        {item.score_snapshot !== undefined && item.score_snapshot !== null && (
                                            <div className="text-[10px] text-[var(--color-text-desc)] mt-0.5">
                                                현재 {item.score_snapshot} 점
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
