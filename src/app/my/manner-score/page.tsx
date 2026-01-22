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
            <PremiumSubHeader title="" backHref="/my" />

            <div className="pt-20 px-5">
                <div className="mb-6 text-[15px] font-bold text-white text-center leading-relaxed whitespace-pre-line break-keep opacity-90">
                    상위10% 매너 회원에게는 <span className="text-yellow-400">연예인/셀럽초청 골프행사</span> 우선참가권을 부여합니다.
                </div>
                {/* Score Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 shadow-xl mb-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform translate-x-10 -translate-y-10 rotate-12 pointer-events-none">
                        M
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className={`text-7xl font-black tracking-tight ${userData?.manner_score < 0 ? 'text-red-200' : 'text-white'}`}>
                            {(userData?.manner_score || 0).toLocaleString()}
                        </div>
                        {history && history.length > 0 && (
                            <div className={`mt-2 flex items-center gap-1 text-lg font-bold ${history[0].amount > 0 ? 'text-red-300' : 'text-blue-300'}`}>
                                <span>{history[0].amount > 0 ? '▲' : '▼'}</span>
                                <span>{Math.abs(history[0].amount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* History List */}
                <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] overflow-hidden">
                    {!history || history.length === 0 ? (
                        <div className="p-12 text-center text-[var(--color-text-desc)] text-sm">
                            아직 점수 변동 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-divider)]">
                            {history.map((item) => (
                                <div key={item.id} className="p-5 flex justify-between items-center group hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex flex-col gap-1 flex-1 pr-4">
                                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                                            {item.description}
                                        </span>
                                        <span className="text-[11px] text-[var(--color-text-desc)]">
                                            {format(new Date(item.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`text-[15px] font-black ${item.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {item.amount > 0 ? '+' : ''}{item.amount}
                                        </div>
                                        {item.score_snapshot !== undefined && item.score_snapshot !== null && (
                                            <div className="text-[10px] text-[var(--color-text-desc)] mt-0.5">
                                                T {item.score_snapshot}
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
