import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'
import MannerHistoryList from '@/components/my/manner-history-list'

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
                <MannerHistoryList initialHistory={history || []} />
            </div>
        </div>
    )
}
